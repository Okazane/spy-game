import Dexie, { type EntityTable } from 'dexie'
import {
  getCanonicalKeywordKey,
  MAX_RECENT_KEYWORDS,
  normalizeKeywordText,
  type Difficulty,
} from '../data/keywords.ts'
import type { GameSettings, Phase, Player, Role, Winner } from '../stores/gameStore.ts'

export const BACKUP_APP_ID = 'spy-game' as const
export const BACKUP_SCHEMA_VERSION = 1 as const
export const MAX_BACKUP_BYTES = 2 * 1024 * 1024 // 2 MB
export const MAX_CUSTOM_KEYWORDS = 500
export const MAX_SCORE_ENTRIES = 300
export const MAX_MATCH_HISTORY = 50
export const MAX_KEYWORD_LENGTH = 40
export const MAX_PLAYER_NAME_LENGTH = 24

const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype'])
const VALID_ROLES = new Set<Role>(['civilian', 'spy', 'white-hat'])
const VALID_WINNERS = new Set<Exclude<Winner, null>>(['civilian', 'spy', 'white-hat', 'spy+white'])
const VALID_PHASES = new Set<Phase>(['home', 'setup', 'reveal', 'playing', 'ended'])
const VALID_DIFFICULTIES = new Set<Difficulty>(['easy', 'medium', 'hard', 'custom'])
// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_RE = /[\u0000-\u001F\u007F]/

export interface PersistedSession {
  id: 'active'
  roundId: string
  phase: Phase
  players: Player[]
  settings: GameSettings
  speakingOrder: string[]
  selectedCardIndex: number | null
  winner: Winner
  wasAborted: boolean
  whiteHatGuessedWord: string | null
  eliminatedPlayerId: string | null
  previousNames: string[]
  recentKeywords: string[]
  updatedAt: number
}

export interface CustomKeywordRecord {
  id: string
  civilian: string
  spy: string
  canonicalKey: string
  createdAt: number
}

export interface ScoreRecord {
  id: string
  name: string
  points: number
  wins: number
  gamesPlayed: number
  civilianWins: number
  spyWins: number
  whiteHatWins: number
  updatedAt: number
}

export interface AwardedPlayerSummary {
  name: string
  role: Role
  pointsDelta: number
}

export interface MatchHistoryRecord {
  id: string
  endedAt: number
  winner: Exclude<Winner, null>
  civilianKeyword: string
  spyKeyword: string
  totalPlayers: number
  whiteHatGuessedWord: string | null
  awardedPlayers: AwardedPlayerSummary[]
}

export interface SpyGameBackupV1 {
  app: typeof BACKUP_APP_ID
  schemaVersion: typeof BACKUP_SCHEMA_VERSION
  exportedAt: string
  customKeywords: CustomKeywordRecord[]
  scores: ScoreRecord[]
  history: MatchHistoryRecord[]
  preferences?: {
    settings: GameSettings
    previousNames: string[]
    recentKeywords: string[]
  }
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupValidationError'
  }
}

export class SpyGameDB extends Dexie {
  session!: EntityTable<PersistedSession, 'id'>
  customKeywords!: EntityTable<CustomKeywordRecord, 'id'>
  scores!: EntityTable<ScoreRecord, 'id'>
  history!: EntityTable<MatchHistoryRecord, 'id'>

  constructor() {
    super('SpyGameDB')
    this.version(1).stores({
      session: 'id, updatedAt',
      customKeywords: 'id, canonicalKey, createdAt',
      scores: 'id, points, wins, updatedAt',
      history: 'id, endedAt',
    })
  }
}

let dbInstance: SpyGameDB | null = null

export function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined'
}

export function getDb(): SpyGameDB | null {
  if (!hasIndexedDB()) return null
  if (!dbInstance) {
    dbInstance = new SpyGameDB()
  }
  return dbInstance
}

/**
 * Yêu cầu trình duyệt giữ bền vững IndexedDB (không tự động dọn khi thiếu dung lượng).
 * An toàn tuyệt đối trên iOS Safari / Private Mode / Node.js.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.persist) {
      return await navigator.storage.persist()
    }
  } catch {
    // Bỏ qua nếu trình duyệt chặn quyền storage.persist
  }
  return false
}

/* ============================================================
   Lightweight Pub/Sub để UI đồng bộ tức thì khi DB thay đổi
   ============================================================ */
type DataHubListener = () => void
const listeners = new Set<DataHubListener>()

export function subscribeDataHub(listener: DataHubListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notifyDataHub(): void {
  for (const listener of listeners) {
    try {
      listener()
    } catch {
      // Không để lỗi subscriber làm gián đoạn luồng lưu DB
    }
  }
}

/* ============================================================
   Scoring & Match History Pure Helpers
   ============================================================ */
export function getPointsForRole(role: Role, winner: Exclude<Winner, null>): number {
  switch (winner) {
    case 'civilian':
      return role === 'civilian' ? 1 : 0
    case 'spy':
      return role === 'spy' ? 3 : 0
    case 'white-hat':
      return role === 'white-hat' ? 4 : 0
    case 'spy+white':
      return role === 'spy' || role === 'white-hat' ? 2 : 0
  }
}

export interface RecordMatchInput {
  roundId: string
  winner: Exclude<Winner, null>
  players: Player[]
  whiteHatGuessedWord: string | null
  endedAt?: number
}

export function computeMatchScoreUpdate(
  existingScores: readonly ScoreRecord[],
  input: RecordMatchInput
): {
  updatedScores: ScoreRecord[]
  historyEntry: MatchHistoryRecord
} {
  const now = input.endedAt ?? Date.now()
  const scoreMap = new Map<string, ScoreRecord>()
  for (const s of existingScores) {
    scoreMap.set(s.id, { ...s })
  }

  const awardedPlayers: AwardedPlayerSummary[] = []

  for (let i = 0; i < input.players.length; i++) {
    const p = input.players[i]
    const displayName = (p.name.trim().replace(/\s+/g, ' ') || `Người ${i + 1}`).slice(
      0,
      MAX_PLAYER_NAME_LENGTH
    )
    const key = normalizeKeywordText(displayName)
    const delta = getPointsForRole(p.role, input.winner)
    const isWinner = delta > 0

    if (isWinner) {
      awardedPlayers.push({
        name: displayName,
        role: p.role,
        pointsDelta: delta,
      })
    }

    const prev = scoreMap.get(key)
    const nextRecord: ScoreRecord = prev
      ? {
          ...prev,
          name: displayName,
          points: prev.points + delta,
          wins: prev.wins + (isWinner ? 1 : 0),
          gamesPlayed: prev.gamesPlayed + 1,
          civilianWins: prev.civilianWins + (isWinner && p.role === 'civilian' ? 1 : 0),
          spyWins: prev.spyWins + (isWinner && p.role === 'spy' ? 1 : 0),
          whiteHatWins: prev.whiteHatWins + (isWinner && p.role === 'white-hat' ? 1 : 0),
          updatedAt: now,
        }
      : {
          id: key,
          name: displayName,
          points: delta,
          wins: isWinner ? 1 : 0,
          gamesPlayed: 1,
          civilianWins: isWinner && p.role === 'civilian' ? 1 : 0,
          spyWins: isWinner && p.role === 'spy' ? 1 : 0,
          whiteHatWins: isWinner && p.role === 'white-hat' ? 1 : 0,
          updatedAt: now,
        }

    scoreMap.set(key, nextRecord)
  }

  const civilianKeyword = input.players.find(p => p.role === 'civilian')?.keyword || '—'
  const spyKeyword = input.players.find(p => p.role === 'spy')?.keyword || '—'

  const historyEntry: MatchHistoryRecord = {
    id: input.roundId,
    endedAt: now,
    winner: input.winner,
    civilianKeyword,
    spyKeyword,
    totalPlayers: input.players.length,
    whiteHatGuessedWord: input.whiteHatGuessedWord ? input.whiteHatGuessedWord.trim() : null,
    awardedPlayers,
  }

  return {
    updatedScores: Array.from(scoreMap.values()),
    historyEntry,
  }
}

export function sortScores(scores: readonly ScoreRecord[]): ScoreRecord[] {
  return [...scores].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.wins !== a.wins) return b.wins - a.wins
    if (a.gamesPlayed !== b.gamesPlayed) return a.gamesPlayed - b.gamesPlayed
    return a.name.localeCompare(b.name, 'vi')
  })
}

/* ============================================================
   Custom Keyword Validation
   ============================================================ */
export function validateCustomKeywordInput(
  rawCivilian: string,
  rawSpy: string,
  existingRecords: readonly CustomKeywordRecord[] = []
): { ok: true; civilian: string; spy: string; canonicalKey: string } | { ok: false; error: string } {
  const civilian = rawCivilian.trim().replace(/\s+/g, ' ')
  const spy = rawSpy.trim().replace(/\s+/g, ' ')

  if (!civilian || !spy) {
    return { ok: false, error: 'Vui lòng nhập đầy đủ cả Từ Dân thường và Từ Gián điệp.' }
  }
  if (civilian.length > MAX_KEYWORD_LENGTH || spy.length > MAX_KEYWORD_LENGTH) {
    return { ok: false, error: `Mỗi từ tối đa ${MAX_KEYWORD_LENGTH} ký tự để hiển thị đẹp trên lá bài.` }
  }
  if (CONTROL_CHAR_RE.test(civilian) || CONTROL_CHAR_RE.test(spy)) {
    return { ok: false, error: 'Từ khoá chứa ký tự điều khiển không hợp lệ.' }
  }
  if (normalizeKeywordText(civilian) === normalizeKeywordText(spy)) {
    return { ok: false, error: 'Hai từ Dân thường và Gián điệp không được trùng nhau.' }
  }
  if (existingRecords.length >= MAX_CUSTOM_KEYWORDS) {
    return { ok: false, error: `Kho từ tự tạo tối đa ${MAX_CUSTOM_KEYWORDS} cặp từ.` }
  }

  const canonicalKey = getCanonicalKeywordKey(civilian, spy)
  if (existingRecords.some(r => r.canonicalKey === canonicalKey)) {
    return { ok: false, error: 'Cặp từ này đã có sẵn trong kho từ tự tạo của bạn.' }
  }

  return { ok: true, civilian, spy, canonicalKey }
}

/* ============================================================
   Database CRUD Operations (Dexie IndexedDB)
   ============================================================ */
let sessionSaveChain: Promise<void> = Promise.resolve()

export function saveActiveSession(session: Omit<PersistedSession, 'id' | 'updatedAt'>): Promise<void> {
  const db = getDb()
  if (!db) return Promise.resolve()

  const payload: PersistedSession = {
    ...session,
    id: 'active',
    updatedAt: Date.now(),
  }

  sessionSaveChain = sessionSaveChain
    .catch(() => undefined)
    .then(async () => {
      await db.session.put(payload)
    })
    .catch(err => {
      console.warn('Unable to persist session in IndexedDB:', err)
    })

  return sessionSaveChain
}

export async function loadActiveSession(): Promise<PersistedSession | null> {
  const db = getDb()
  if (!db) return null
  try {
    const record = await db.session.get('active')
    if (!record || !VALID_PHASES.has(record.phase)) return null
    return record
  } catch (err) {
    console.warn('Unable to load session from IndexedDB:', err)
    return null
  }
}

export async function listCustomKeywords(): Promise<CustomKeywordRecord[]> {
  const db = getDb()
  if (!db) return []
  try {
    const rows = await db.customKeywords.orderBy('createdAt').reverse().toArray()
    return rows
  } catch (err) {
    console.warn('Unable to list custom keywords:', err)
    return []
  }
}

export async function addCustomKeywordPair(
  rawCivilian: string,
  rawSpy: string
): Promise<{ ok: true; record: CustomKeywordRecord; all: CustomKeywordRecord[] } | { ok: false; error: string }> {
  const db = getDb()
  if (!db) {
    return { ok: false, error: 'Trình duyệt hiện tại không hỗ trợ lưu trữ IndexedDB.' }
  }

  const existing = await listCustomKeywords()
  const checked = validateCustomKeywordInput(rawCivilian, rawSpy, existing)
  if (!checked.ok) return checked

  const record: CustomKeywordRecord = {
    id: `kw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    civilian: checked.civilian,
    spy: checked.spy,
    canonicalKey: checked.canonicalKey,
    createdAt: Date.now(),
  }

  await db.customKeywords.put(record)
  const all = await listCustomKeywords()
  notifyDataHub()
  return { ok: true, record, all }
}

export async function deleteCustomKeywordPair(id: string): Promise<CustomKeywordRecord[]> {
  const db = getDb()
  if (!db) return []
  await db.customKeywords.delete(id)
  const all = await listCustomKeywords()
  notifyDataHub()
  return all
}

const inFlightRounds = new Set<string>()

/**
 * Ghi nhận điểm thưởng & lịch sử ván đấu (Idempotent 100% theo `roundId`).
 */
export async function recordMatchVictory(input: RecordMatchInput): Promise<MatchHistoryRecord | null> {
  if (!input.roundId || input.players.length < 3) return null
  const db = getDb()
  if (!db) return null
  if (inFlightRounds.has(input.roundId)) return null

  inFlightRounds.add(input.roundId)
  try {
    const saved = await db.transaction('rw', db.scores, db.history, async () => {
      const already = await db.history.get(input.roundId)
      if (already) return already

      const existingScores = await db.scores.toArray()
      const { updatedScores, historyEntry } = computeMatchScoreUpdate(existingScores, input)

      await db.scores.bulkPut(updatedScores)
      await db.history.put(historyEntry)

      const allHistory = await db.history.orderBy('endedAt').reverse().toArray()
      if (allHistory.length > MAX_MATCH_HISTORY) {
        const overflowIds = allHistory.slice(MAX_MATCH_HISTORY).map(h => h.id)
        await db.history.bulkDelete(overflowIds)
      }

      return historyEntry
    })

    notifyDataHub()
    return saved
  } catch (err) {
    console.warn('Unable to record match victory:', err)
    return null
  } finally {
    inFlightRounds.delete(input.roundId)
  }
}

export async function getScoreboardSnapshot(): Promise<{
  scores: ScoreRecord[]
  history: MatchHistoryRecord[]
}> {
  const db = getDb()
  if (!db) return { scores: [], history: [] }
  try {
    const [rawScores, history] = await Promise.all([
      db.scores.toArray(),
      db.history.orderBy('endedAt').reverse().limit(MAX_MATCH_HISTORY).toArray(),
    ])
    return {
      scores: sortScores(rawScores),
      history,
    }
  } catch (err) {
    console.warn('Unable to read scoreboard snapshot:', err)
    return { scores: [], history: [] }
  }
}

export async function resetScoreboard(): Promise<void> {
  const db = getDb()
  if (!db) return
  await db.transaction('rw', db.scores, db.history, async () => {
    await db.scores.clear()
    await db.history.clear()
  })
  notifyDataHub()
}

export async function clearAllDeviceData(): Promise<void> {
  const db = getDb()
  if (db) {
    await db.transaction('rw', db.session, db.customKeywords, db.scores, db.history, async () => {
      await db.session.clear()
      await db.customKeywords.clear()
      await db.scores.clear()
      await db.history.clear()
    })
  }
  notifyDataHub()
}

/* ============================================================
   Strict .JSON Backup Validation & Export/Import
   ============================================================ */
function isPlainObject(val: unknown): val is Record<string, unknown> {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) return false
  const proto = Object.getPrototypeOf(val)
  return proto === Object.prototype || proto === null
}

function assertNoPrototypePollution(node: unknown, depth = 0): void {
  if (depth > 12) {
    throw new BackupValidationError('Cấu trúc file sao lưu lồng quá sâu không hợp lệ.')
  }
  if (Array.isArray(node)) {
    for (const item of node) {
      assertNoPrototypePollution(item, depth + 1)
    }
    return
  }
  if (typeof node === 'object' && node !== null) {
    if (!isPlainObject(node)) {
      throw new BackupValidationError('Đối tượng dữ liệu không hợp lệ.')
    }
    const ownNames = Object.getOwnPropertyNames(node)
    for (const key of ownNames) {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new BackupValidationError(`Từ chối khoá bảo mật bị cấm: "${key}".`)
      }
      assertNoPrototypePollution(node[key], depth + 1)
    }
  }
}

function assertAllowedKeys(
  obj: Record<string, unknown>,
  allowed: readonly string[],
  context: string
): void {
  const allowedSet = new Set(allowed)
  for (const key of Object.getOwnPropertyNames(obj)) {
    if (FORBIDDEN_KEYS.has(key)) {
      throw new BackupValidationError(`Từ chối khoá bảo mật bị cấm: "${key}".`)
    }
    if (!allowedSet.has(key)) {
      throw new BackupValidationError(`Trường không hợp lệ "${key}" trong ${context}.`)
    }
  }
}

function readBoundedString(
  val: unknown,
  field: string,
  minLen: number,
  maxLen: number,
  trim = true
): string {
  if (typeof val !== 'string') {
    throw new BackupValidationError(`Trường "${field}" phải là chuỗi ký tự.`)
  }
  if (CONTROL_CHAR_RE.test(val)) {
    throw new BackupValidationError(`Trường "${field}" chứa ký tự điều khiển không hợp lệ.`)
  }
  const normalized = trim ? val.trim().replace(/\s+/g, ' ') : val
  if (normalized.length < minLen || normalized.length > maxLen) {
    throw new BackupValidationError(
      `Độ dài trường "${field}" phải từ ${minLen} đến ${maxLen} ký tự.`
    )
  }
  return normalized
}

function readBoundedInt(val: unknown, field: string, min: number, max: number): number {
  if (typeof val !== 'number' || !Number.isInteger(val) || val < min || val > max) {
    throw new BackupValidationError(
      `Trường "${field}" phải là số nguyên trong khoảng ${min}..${max}.`
    )
  }
  return val
}

function readTimestamp(val: unknown, field: string): number {
  if (typeof val !== 'number' || !Number.isFinite(val) || val < 0 || val > 9_999_999_999_999) {
    throw new BackupValidationError(`Mốc thời gian "${field}" không hợp lệ.`)
  }
  return Math.round(val)
}

function sanitizeBackupSettings(raw: unknown): GameSettings {
  if (!isPlainObject(raw)) {
    throw new BackupValidationError('Trường "preferences.settings" không hợp lệ.')
  }
  assertAllowedKeys(
    raw,
    ['totalPlayers', 'spyCount', 'whiteHatCount', 'difficulty', 'hideRole', 'includeCustomKeywords'],
    'preferences.settings'
  )

  const totalPlayers = readBoundedInt(raw.totalPlayers, 'settings.totalPlayers', 3, 20)
  let spyCount = readBoundedInt(raw.spyCount, 'settings.spyCount', 0, 19)
  let whiteHatCount = readBoundedInt(raw.whiteHatCount, 'settings.whiteHatCount', 0, 19)

  if (typeof raw.difficulty !== 'string' || !VALID_DIFFICULTIES.has(raw.difficulty as Difficulty)) {
    throw new BackupValidationError('Độ khó trong "settings.difficulty" không hợp lệ.')
  }
  if (typeof raw.hideRole !== 'boolean') {
    throw new BackupValidationError('Trường "settings.hideRole" phải là boolean.')
  }
  if (
    raw.includeCustomKeywords !== undefined &&
    typeof raw.includeCustomKeywords !== 'boolean'
  ) {
    throw new BackupValidationError('Trường "settings.includeCustomKeywords" phải là boolean.')
  }

  const maxInfiltrators = totalPlayers - 1
  if (spyCount + whiteHatCount > maxInfiltrators) {
    const overflow = spyCount + whiteHatCount - maxInfiltrators
    const reduceWhite = Math.min(whiteHatCount, overflow)
    whiteHatCount -= reduceWhite
    spyCount = Math.max(0, spyCount - (overflow - reduceWhite))
  }
  if (spyCount + whiteHatCount < 1) {
    spyCount = 1
  }

  return {
    totalPlayers,
    spyCount,
    whiteHatCount,
    difficulty: raw.difficulty as Difficulty,
    hideRole: raw.hideRole,
    includeCustomKeywords: raw.includeCustomKeywords ?? true,
  }
}

export function validateBackupPayload(input: unknown): SpyGameBackupV1 {
  assertNoPrototypePollution(input)

  if (!isPlainObject(input)) {
    throw new BackupValidationError('File sao lưu phải là đối tượng JSON hợp lệ.')
  }

  assertAllowedKeys(
    input,
    ['app', 'schemaVersion', 'exportedAt', 'customKeywords', 'scores', 'history', 'preferences'],
    'root'
  )

  if (input.app !== BACKUP_APP_ID) {
    throw new BackupValidationError('File JSON này không phải bản sao lưu của "Ai Là Gián Điệp?".')
  }
  if (input.schemaVersion !== BACKUP_SCHEMA_VERSION) {
    throw new BackupValidationError(`Phiên bản sao lưu không được hỗ trợ (${String(input.schemaVersion)}).`)
  }

  const exportedAt = readBoundedString(input.exportedAt, 'exportedAt', 4, 64)

  // 1. Validate customKeywords
  if (!Array.isArray(input.customKeywords)) {
    throw new BackupValidationError('Trường "customKeywords" phải là mảng.')
  }
  if (input.customKeywords.length > MAX_CUSTOM_KEYWORDS) {
    throw new BackupValidationError(`Số lượng từ tự tạo vượt quá giới hạn (${MAX_CUSTOM_KEYWORDS}).`)
  }

  const customKeywords: CustomKeywordRecord[] = []
  const seenKeywordKeys = new Set<string>()
  const seenKeywordIds = new Set<string>()

  for (let i = 0; i < input.customKeywords.length; i++) {
    const item = input.customKeywords[i]
    if (!isPlainObject(item)) {
      throw new BackupValidationError(`Mục customKeywords[${i}] không hợp lệ.`)
    }
    assertAllowedKeys(
      item,
      ['id', 'civilian', 'spy', 'canonicalKey', 'createdAt'],
      `customKeywords[${i}]`
    )
    const id = readBoundedString(item.id, `customKeywords[${i}].id`, 1, 64)
    const civilian = readBoundedString(
      item.civilian,
      `customKeywords[${i}].civilian`,
      1,
      MAX_KEYWORD_LENGTH
    )
    const spy = readBoundedString(item.spy, `customKeywords[${i}].spy`, 1, MAX_KEYWORD_LENGTH)
    const createdAt = readTimestamp(item.createdAt, `customKeywords[${i}].createdAt`)

    if (normalizeKeywordText(civilian) === normalizeKeywordText(spy)) {
      throw new BackupValidationError(
        `Cặp từ thứ ${i + 1} ("${civilian}") bị trùng lặp giữa Dân thường và Gián điệp.`
      )
    }

    const canonicalKey = getCanonicalKeywordKey(civilian, spy)
    if (seenKeywordKeys.has(canonicalKey) || seenKeywordIds.has(id)) continue
    seenKeywordKeys.add(canonicalKey)
    seenKeywordIds.add(id)

    customKeywords.push({
      id,
      civilian,
      spy,
      canonicalKey,
      createdAt,
    })
  }

  // 2. Validate scores
  if (!Array.isArray(input.scores)) {
    throw new BackupValidationError('Trường "scores" phải là mảng.')
  }
  if (input.scores.length > MAX_SCORE_ENTRIES) {
    throw new BackupValidationError(`Bảng điểm vượt quá giới hạn cho phép (${MAX_SCORE_ENTRIES} người).`)
  }

  const scoresMap = new Map<string, ScoreRecord>()
  for (let i = 0; i < input.scores.length; i++) {
    const item = input.scores[i]
    if (!isPlainObject(item)) {
      throw new BackupValidationError(`Mục scores[${i}] không hợp lệ.`)
    }
    assertAllowedKeys(
      item,
      [
        'id',
        'name',
        'points',
        'wins',
        'gamesPlayed',
        'civilianWins',
        'spyWins',
        'whiteHatWins',
        'updatedAt',
      ],
      `scores[${i}]`
    )
    const name = readBoundedString(item.name, `scores[${i}].name`, 1, MAX_PLAYER_NAME_LENGTH)
    const id = normalizeKeywordText(name)
    const points = readBoundedInt(item.points, `scores[${i}].points`, 0, 100_000)
    const wins = readBoundedInt(item.wins, `scores[${i}].wins`, 0, 100_000)
    const gamesPlayed = readBoundedInt(item.gamesPlayed, `scores[${i}].gamesPlayed`, 0, 100_000)
    const civilianWins = readBoundedInt(item.civilianWins, `scores[${i}].civilianWins`, 0, 100_000)
    const spyWins = readBoundedInt(item.spyWins, `scores[${i}].spyWins`, 0, 100_000)
    const whiteHatWins = readBoundedInt(item.whiteHatWins, `scores[${i}].whiteHatWins`, 0, 100_000)
    const updatedAt = readTimestamp(item.updatedAt, `scores[${i}].updatedAt`)

    if (wins > gamesPlayed) {
      throw new BackupValidationError(`Số trận thắng vượt số trận đã chơi ở "${name}".`)
    }

    scoresMap.set(id, {
      id,
      name,
      points,
      wins,
      gamesPlayed,
      civilianWins,
      spyWins,
      whiteHatWins,
      updatedAt,
    })
  }

  // 3. Validate history
  if (!Array.isArray(input.history)) {
    throw new BackupValidationError('Trường "history" phải là mảng.')
  }
  if (input.history.length > MAX_MATCH_HISTORY) {
    throw new BackupValidationError(`Lịch sử ván đấu vượt quá giới hạn (${MAX_MATCH_HISTORY} ván).`)
  }

  const history: MatchHistoryRecord[] = []
  const seenHistoryIds = new Set<string>()

  for (let i = 0; i < input.history.length; i++) {
    const item = input.history[i]
    if (!isPlainObject(item)) {
      throw new BackupValidationError(`Mục history[${i}] không hợp lệ.`)
    }
    assertAllowedKeys(
      item,
      [
        'id',
        'endedAt',
        'winner',
        'civilianKeyword',
        'spyKeyword',
        'totalPlayers',
        'whiteHatGuessedWord',
        'awardedPlayers',
      ],
      `history[${i}]`
    )
    const id = readBoundedString(item.id, `history[${i}].id`, 1, 64)
    if (seenHistoryIds.has(id)) continue
    seenHistoryIds.add(id)

    const endedAt = readTimestamp(item.endedAt, `history[${i}].endedAt`)
    if (
      typeof item.winner !== 'string' ||
      !VALID_WINNERS.has(item.winner as Exclude<Winner, null>)
    ) {
      throw new BackupValidationError(`Phe thắng không hợp lệ tại history[${i}].`)
    }
    const civilianKeyword = readBoundedString(
      item.civilianKeyword,
      `history[${i}].civilianKeyword`,
      1,
      60
    )
    const spyKeyword = readBoundedString(item.spyKeyword, `history[${i}].spyKeyword`, 0, 60)
    const totalPlayers = readBoundedInt(item.totalPlayers, `history[${i}].totalPlayers`, 3, 20)

    let whiteHatGuessedWord: string | null = null
    if (item.whiteHatGuessedWord !== null && item.whiteHatGuessedWord !== undefined) {
      whiteHatGuessedWord = readBoundedString(
        item.whiteHatGuessedWord,
        `history[${i}].whiteHatGuessedWord`,
        1,
        60
      )
    }

    if (!Array.isArray(item.awardedPlayers) || item.awardedPlayers.length > 20) {
      throw new BackupValidationError(`Danh sách awardedPlayers tại history[${i}] không hợp lệ.`)
    }

    const awardedPlayers: AwardedPlayerSummary[] = item.awardedPlayers.map((ap, j) => {
      if (!isPlainObject(ap)) {
        throw new BackupValidationError(`Mục awardedPlayers[${j}] không hợp lệ.`)
      }
      assertAllowedKeys(ap, ['name', 'role', 'pointsDelta'], `history[${i}].awardedPlayers[${j}]`)
      const name = readBoundedString(ap.name, `awardedPlayers[${j}].name`, 1, MAX_PLAYER_NAME_LENGTH)
      if (typeof ap.role !== 'string' || !VALID_ROLES.has(ap.role as Role)) {
        throw new BackupValidationError(`Vai trò tại awardedPlayers[${j}] không hợp lệ.`)
      }
      const pointsDelta = readBoundedInt(ap.pointsDelta, `awardedPlayers[${j}].pointsDelta`, 1, 10)
      return { name, role: ap.role as Role, pointsDelta }
    })

    history.push({
      id,
      endedAt,
      winner: item.winner as Exclude<Winner, null>,
      civilianKeyword,
      spyKeyword,
      totalPlayers,
      whiteHatGuessedWord,
      awardedPlayers,
    })
  }

  // 4. Optional preferences
  let preferences: SpyGameBackupV1['preferences']
  if (input.preferences !== undefined) {
    if (!isPlainObject(input.preferences)) {
      throw new BackupValidationError('Trường "preferences" phải là đối tượng.')
    }
    assertAllowedKeys(
      input.preferences,
      ['settings', 'previousNames', 'recentKeywords'],
      'preferences'
    )
    const settings = sanitizeBackupSettings(input.preferences.settings)

    if (
      !Array.isArray(input.preferences.previousNames) ||
      input.preferences.previousNames.length > 20
    ) {
      throw new BackupValidationError('Danh sách "preferences.previousNames" không hợp lệ.')
    }
    const previousNames = input.preferences.previousNames.map((n, idx) =>
      readBoundedString(n, `previousNames[${idx}]`, 0, MAX_PLAYER_NAME_LENGTH)
    )

    if (
      !Array.isArray(input.preferences.recentKeywords) ||
      input.preferences.recentKeywords.length > 50
    ) {
      throw new BackupValidationError('Danh sách "preferences.recentKeywords" không hợp lệ.')
    }
    const recentKeywords = input.preferences.recentKeywords
      .map((k, idx) => readBoundedString(k, `recentKeywords[${idx}]`, 1, 100))
      .filter(k => k.includes('|'))
      .slice(-MAX_RECENT_KEYWORDS)

    preferences = { settings, previousNames, recentKeywords }
  }

  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt,
    customKeywords,
    scores: Array.from(scoresMap.values()),
    history: history.sort((a, b) => b.endedAt - a.endedAt).slice(0, MAX_MATCH_HISTORY),
    ...(preferences ? { preferences } : {}),
  }
}

export function parseAndValidateBackupJson(rawJson: string): SpyGameBackupV1 {
  if (typeof rawJson !== 'string' || rawJson.trim().length === 0) {
    throw new BackupValidationError('File sao lưu trống hoặc không đọc được.')
  }
  const byteLen = new TextEncoder().encode(rawJson).byteLength
  if (byteLen > MAX_BACKUP_BYTES) {
    throw new BackupValidationError('File sao lưu vượt quá dung lượng tối đa cho phép (2 MB).')
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(rawJson, (key, value) => {
      if (FORBIDDEN_KEYS.has(key)) {
        throw new BackupValidationError(`Từ chối khoá bảo mật bị cấm: "${key}".`)
      }
      return value
    })
  } catch (err) {
    if (err instanceof BackupValidationError) throw err
    throw new BackupValidationError('Cú pháp JSON không hợp lệ hoặc file bị hỏng.')
  }

  return validateBackupPayload(parsed)
}

export async function createBackupPayload(preferences?: {
  settings: GameSettings
  previousNames: string[]
  recentKeywords: string[]
}): Promise<SpyGameBackupV1> {
  const [customKeywords, { scores, history }] = await Promise.all([
    listCustomKeywords(),
    getScoreboardSnapshot(),
  ])

  return {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    customKeywords: customKeywords.slice(0, MAX_CUSTOM_KEYWORDS),
    scores: scores.slice(0, MAX_SCORE_ENTRIES),
    history: history.slice(0, MAX_MATCH_HISTORY),
    ...(preferences
      ? {
          preferences: {
            settings: preferences.settings,
            previousNames: preferences.previousNames.slice(0, 20),
            recentKeywords: preferences.recentKeywords.slice(-MAX_RECENT_KEYWORDS),
          },
        }
      : {}),
  }
}

export async function importValidatedBackup(backup: SpyGameBackupV1): Promise<void> {
  const db = getDb()
  if (!db) {
    throw new BackupValidationError('Trình duyệt hiện tại không hỗ trợ lưu trữ IndexedDB.')
  }

  await db.transaction('rw', db.customKeywords, db.scores, db.history, async () => {
    await db.customKeywords.clear()
    await db.scores.clear()
    await db.history.clear()

    if (backup.customKeywords.length > 0) {
      await db.customKeywords.bulkPut(backup.customKeywords)
    }
    if (backup.scores.length > 0) {
      await db.scores.bulkPut(backup.scores)
    }
    if (backup.history.length > 0) {
      await db.history.bulkPut(backup.history)
    }
  })

  notifyDataHub()
}
