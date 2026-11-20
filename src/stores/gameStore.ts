import { create } from 'zustand'
import {
  type Difficulty,
  getRandomKeyword,
  getRecentKeywords,
  setRecentKeywords,
} from '../data/keywords.ts'
import {
  type CustomKeywordRecord,
  listCustomKeywords,
  loadActiveSession,
  recordMatchVictory,
  requestPersistentStorage,
  saveActiveSession,
  subscribeDataHub,
} from '../db/gameDb.ts'

export type Role = 'civilian' | 'spy' | 'white-hat'
export type Phase = 'home' | 'setup' | 'reveal' | 'playing' | 'ended'
export type Winner = 'civilian' | 'spy' | 'white-hat' | 'spy+white' | null

export interface Player {
  id: string
  name: string       // '' = chưa được nhận bài
  role: Role
  keyword: string
  isAlive: boolean
  claimed: boolean   // đã có người chọn bài này chưa
}

export interface GameSettings {
  totalPlayers: number   // từ 3 đến 20 người
  spyCount: number       // 0 .. totalPlayers - 1
  whiteHatCount: number  // 0 .. totalPlayers - 1
  difficulty: Difficulty
  hideRole: boolean      // Bật: chỉ biết từ khoá, không biết là Dân hay Gián
  includeCustomKeywords?: boolean // Bật: gộp thêm từ khoá tự tạo vào bộ bài chuẩn
}

export const DEFAULT_SETTINGS: GameSettings = {
  totalPlayers: 6,
  spyCount: 1,
  whiteHatCount: 0,
  difficulty: 'medium',
  hideRole: true,
  includeCustomKeywords: true,
}

interface GameState {
  roundId: string
  players: Player[]
  phase: Phase
  currentRevealIndex: number   // giữ lại cho compatibility
  selectedCardIndex: number | null  // bài đang được lật
  winner: Winner
  wasAborted: boolean          // true nếu bấm "Kết thúc" sớm trước khi có phe thắng
  settings: GameSettings
  eliminatedPlayerId: string | null
  previousNames: string[]      // tên nhóm ván trước
  customKeywords: CustomKeywordRecord[]
  isHydrated: boolean
  resetCount: number           // tăng mỗi lần reset để AnimatePresence nhận ra màn mới
  speakingOrder: string[]      // thứ tự phát biểu: mảng player.id (không phải tên)
  whiteHatGuessedWord: string | null

  goToPhase: (phase: 'home' | 'setup') => void
  setSettings: (s: Partial<GameSettings>) => void
  startGame: () => void
  selectCard: (index: number) => void
  claimCard: (index: number, name: string) => void
  proceedToGame: () => void
  revealNext: () => void
  eliminatePlayer: (id: string) => void
  whiteHatGuess: (guessWord: string) => boolean
  endGame: () => void
  resetGame: () => void
  reshuffleSpeakingOrder: () => void
  refreshCustomKeywords: () => Promise<void>
  applyBackupPreferences: (prefs?: {
    settings: GameSettings
    previousNames: string[]
    recentKeywords: string[]
  }) => void
  resetToFactoryState: () => void
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

function generateRoundId() {
  return `rnd_${Date.now().toString(36)}_${generateId()}`
}

function cleanText(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function stripAccents(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Tạo thứ tự phát biểu theo ID người chơi.
// Quy tắc: Ưu tiên Dân/Gián nói đầu để Mũ Trắng không phải nói mù ở đầu vòng (#1 hoặc #2).
export function generateSpeakingOrder(players: Player[]): string[] {
  const whiteHatIds = players.filter(p => p.role === 'white-hat').map(p => p.id)
  const nonWhiteHatIds = players.filter(p => p.role !== 'white-hat').map(p => p.id)

  if (nonWhiteHatIds.length < 2) {
    if (nonWhiteHatIds.length === 1) {
      return [nonWhiteHatIds[0], ...shuffle(whiteHatIds)]
    }
    return shuffle(players.map(p => p.id))
  }

  // Xáo trộn từng nhóm riêng, sau đó đặt 2 vị trí đầu = non-white-hat
  const shuffledNonWH = shuffle(nonWhiteHatIds)
  const shuffledWH = shuffle(whiteHatIds)
  const front = shuffledNonWH.slice(0, 2)
  const rest = shuffle([...shuffledNonWH.slice(2), ...shuffledWH])
  return [...front, ...rest]
}

export function isKeywordMatch(guess: string, target: string): boolean {
  const g = cleanText(guess)
  const t = cleanText(target)
  if (!g || !t) return false
  if (g === t) return true
  if (stripAccents(g) === stripAccents(t)) return true
  return false
}

export function checkWin(players: Player[]): Winner {
  const alive = players.filter(p => p.isAlive)
  const aliveCivilian = alive.filter(p => p.role === 'civilian').length
  const aliveSpy = alive.filter(p => p.role === 'spy').length
  const aliveWhiteHat = alive.filter(p => p.role === 'white-hat').length

  // Dân Thường thắng: không còn Gián Điệp và Mũ Trắng
  if (aliveSpy === 0 && aliveWhiteHat === 0) return 'civilian'

  // Không còn Dân Thường sống sót: phe ẩn còn sống thắng
  if (aliveCivilian === 0) {
    if (aliveSpy > 0 && aliveWhiteHat > 0) return 'spy+white'
    if (aliveSpy > 0) return 'spy'
    if (aliveWhiteHat > 0) return 'white-hat'
  }

  const initialCivilian = players.filter(p => p.role === 'civilian').length
  const initialSpy = players.filter(p => p.role === 'spy').length
  const initialWhiteHat = players.filter(p => p.role === 'white-hat').length

  // Nếu bàn chơi truyền thống (Dân thường chiếm đa số ban đầu), áp dụng luật ngang quân số
  if (initialCivilian > initialSpy + initialWhiteHat) {
    if (alive.length <= 3 && aliveSpy > 0 && aliveWhiteHat > 0) return 'spy+white'
    if (aliveWhiteHat === 0 && aliveSpy > 0 && aliveSpy >= aliveCivilian) return 'spy'
    if (aliveSpy === 0 && aliveWhiteHat > 0 && aliveWhiteHat >= aliveCivilian) return 'white-hat'
  }

  // Nếu bàn chơi tuỳ chỉnh/hỗn chiến (initialCivilian <= initialSpy + initialWhiteHat),
  // phe ẩn chỉ thắng khi loại hết Dân thường (aliveCivilian === 0 ở trên) hoặc Mũ trắng đoán trúng từ.
  return null
}

export function calcCivilian(s: GameSettings): number {
  const clamped = clampSettings(s)
  return Math.max(1, clamped.totalPlayers - clamped.spyCount - clamped.whiteHatCount)
}

export function clampSettings(s: GameSettings): GameSettings {
  const total = Math.max(3, Math.min(20, Math.round(s.totalPlayers || 6)))
  const maxInfiltrators = total - 1

  let spyCount = Math.max(0, Math.min(maxInfiltrators, Math.round(s.spyCount ?? 1)))
  let whiteHatCount = Math.max(0, Math.min(maxInfiltrators, Math.round(s.whiteHatCount ?? 0)))

  // Đảm bảo ít nhất 1 Dân thường (spyCount + whiteHatCount <= total - 1)
  if (spyCount + whiteHatCount > maxInfiltrators) {
    const overflow = spyCount + whiteHatCount - maxInfiltrators
    const reduceWhite = Math.min(whiteHatCount, overflow)
    whiteHatCount -= reduceWhite
    spyCount = Math.max(0, spyCount - (overflow - reduceWhite))
  }

  // Đảm bảo ít nhất 1 kẻ ẩn danh (spyCount + whiteHatCount >= 1)
  if (spyCount + whiteHatCount < 1) {
    spyCount = 1
  }

  return {
    ...s,
    totalPlayers: total,
    spyCount,
    whiteHatCount,
    includeCustomKeywords: s.includeCustomKeywords ?? true,
  }
}

function mergeSettings(prev: GameSettings, partial: Partial<GameSettings>): GameSettings {
  const base = clampSettings(prev)
  const total =
    partial.totalPlayers !== undefined
      ? Math.max(3, Math.min(20, Math.round(partial.totalPlayers || 6)))
      : base.totalPlayers
  const maxInfiltrators = total - 1

  const spyProvided = partial.spyCount !== undefined
  const whiteProvided = partial.whiteHatCount !== undefined

  if (spyProvided && !whiteProvided) {
    const spyCount = Math.max(0, Math.min(maxInfiltrators, Math.round(partial.spyCount!)))
    let whiteHatCount = base.whiteHatCount
    if (spyCount + whiteHatCount > maxInfiltrators) {
      whiteHatCount = Math.max(0, maxInfiltrators - spyCount)
    }
    if (spyCount === 0 && whiteHatCount === 0) {
      whiteHatCount = 1
    }
    return clampSettings({ ...base, ...partial, totalPlayers: total, spyCount, whiteHatCount })
  }

  if (whiteProvided && !spyProvided) {
    const whiteHatCount = Math.max(0, Math.min(maxInfiltrators, Math.round(partial.whiteHatCount!)))
    let spyCount = base.spyCount
    if (spyCount + whiteHatCount > maxInfiltrators) {
      spyCount = Math.max(0, maxInfiltrators - whiteHatCount)
    }
    if (spyCount === 0 && whiteHatCount === 0) {
      spyCount = 1
    }
    return clampSettings({ ...base, ...partial, totalPlayers: total, spyCount, whiteHatCount })
  }

  return clampSettings({ ...base, ...partial, totalPlayers: total })
}

let userMutatedBeforeHydration = false

export const useGameStore = create<GameState>((set, get) => ({
  roundId: '',
  players: [],
  phase: 'home',
  currentRevealIndex: 0,
  selectedCardIndex: null,
  winner: null,
  wasAborted: false,
  whiteHatGuessedWord: null,
  eliminatedPlayerId: null,
  previousNames: [],
  customKeywords: [],
  isHydrated: false,
  resetCount: 0,
  speakingOrder: [],
  settings: { ...DEFAULT_SETTINGS },

  goToPhase: (phase) => {
    userMutatedBeforeHydration = true
    set({ phase })
  },

  setSettings: (s) => {
    userMutatedBeforeHydration = true
    set(state => ({ settings: mergeSettings(state.settings, s) }))
  },

  startGame: () => {
    userMutatedBeforeHydration = true
    const state = get()
    const safeSettings = clampSettings(state.settings)
    const { totalPlayers, spyCount, whiteHatCount, difficulty, includeCustomKeywords } = safeSettings
    const civilianCount = totalPlayers - spyCount - whiteHatCount

    const effectiveDifficulty: Difficulty =
      difficulty === 'custom' && state.customKeywords.length === 0 ? 'medium' : difficulty

    const keyword = getRandomKeyword(effectiveDifficulty, {
      includeCustomKeywords: includeCustomKeywords ?? true,
      customPairs: state.customKeywords,
    })

    const roles: Role[] = [
      ...Array(spyCount).fill('spy' as Role),
      ...Array(whiteHatCount).fill('white-hat' as Role),
      ...Array(civilianCount).fill('civilian' as Role),
    ]
    const shuffledRoles = shuffle(roles)

    // Tạo bài: tên rỗng, chờ người chơi chọn và điền tên
    const players: Player[] = Array.from({ length: totalPlayers }, (_, i) => ({
      id: generateId(),
      name: '',
      role: shuffledRoles[i],
      keyword:
        shuffledRoles[i] === 'civilian'
          ? keyword.civilian
          : shuffledRoles[i] === 'spy'
          ? keyword.spy
          : '',
      isAlive: true,
      claimed: false,
    }))

    set({
      roundId: generateRoundId(),
      settings: { ...safeSettings, difficulty: effectiveDifficulty },
      players,
      phase: 'reveal',
      currentRevealIndex: 0,
      selectedCardIndex: null,
      winner: null,
      wasAborted: false,
      whiteHatGuessedWord: null,
      eliminatedPlayerId: null,
      speakingOrder: [],
    })
  },

  // Người chơi bấm vào một lá bài chưa được nhận (đã bấm lá nào là khoá luôn lá đó, không được đổi sang lá khác)
  selectCard: (index) => {
    userMutatedBeforeHydration = true
    const { players, selectedCardIndex } = get()
    if (players[index]?.claimed) return
    if (selectedCardIndex !== null) return // Đã chọn một lá bài rồi thì không thể đổi nữa
    set({ selectedCardIndex: index })
  },

  // Người chơi nhập tên và xác nhận nhận bài
  claimCard: (index, name) => {
    userMutatedBeforeHydration = true
    set(state => {
      const players = state.players.map((p, i) =>
        i === index
          ? { ...p, name: name.trim() || `Người ${index + 1}`, claimed: true }
          : p
      )
      const allClaimed = players.length > 0 && players.every(p => p.claimed)
      // Lưu theo ID (không phải tên) để tránh xung đột nếu 2 người cùng tên
      const speakingOrder = allClaimed
        ? generateSpeakingOrder(players)
        : state.speakingOrder

      return { players, selectedCardIndex: null, speakingOrder }
    })
  },

  // Chuyển sang ván chơi sau khi tất cả đã nhận bài
  proceedToGame: () => {
    userMutatedBeforeHydration = true
    const { players } = get()
    const names = players.map(p => p.name)
    set({ phase: 'playing', previousNames: names })
  },

  // Giữ lại cho compatibility
  revealNext: () => {
    userMutatedBeforeHydration = true
    const { currentRevealIndex, players } = get()
    const nextIndex = currentRevealIndex + 1
    if (nextIndex >= players.length) {
      set({ phase: 'playing' })
    } else {
      set({ currentRevealIndex: nextIndex })
    }
  },

  eliminatePlayer: (id) => {
    userMutatedBeforeHydration = true
    set(state => {
      const updatedPlayers = state.players.map(p =>
        p.id === id ? { ...p, isAlive: false } : p
      )
      const winner = checkWin(updatedPlayers)
      return {
        players: updatedPlayers,
        eliminatedPlayerId: id,
        winner,
      }
    })
  },

  whiteHatGuess: (guessWord: string) => {
    userMutatedBeforeHydration = true
    const { players } = get()
    const civilianWord = players.find(p => p.role === 'civilian')?.keyword || ''
    const match = isKeywordMatch(guessWord, civilianWord)
    if (match) {
      set({
        winner: 'white-hat',
        whiteHatGuessedWord: guessWord.trim(),
      })
      return true
    }
    return false
  },

  endGame: () => {
    userMutatedBeforeHydration = true
    const state = get()
    const hadNaturalWinner = state.winner !== null
    const resolvedWinner: Exclude<Winner, null> = state.winner ?? 'civilian'
    const wasAborted = !hadNaturalWinner

    set({
      phase: 'ended',
      winner: resolvedWinner,
      wasAborted,
    })

    if (hadNaturalWinner && state.roundId && state.players.length >= 3) {
      void recordMatchVictory({
        roundId: state.roundId,
        winner: resolvedWinner,
        players: state.players,
        whiteHatGuessedWord: state.whiteHatGuessedWord,
      })
    }
  },

  resetGame: () => {
    userMutatedBeforeHydration = true
    set(state => ({
      roundId: '',
      phase: 'setup',
      currentRevealIndex: 0,
      selectedCardIndex: null,
      winner: null,
      wasAborted: false,
      whiteHatGuessedWord: null,
      eliminatedPlayerId: null,
      players: [],
      settings: state.settings,
      previousNames: state.previousNames,
      resetCount: state.resetCount + 1,
      speakingOrder: [],
    }))
  },

  reshuffleSpeakingOrder: () => {
    userMutatedBeforeHydration = true
    const { players } = get()
    set({ speakingOrder: generateSpeakingOrder(players) })
  },

  refreshCustomKeywords: async () => {
    const customKeywords = await listCustomKeywords()
    set(state => {
      const nextDifficulty =
        state.settings.difficulty === 'custom' && customKeywords.length === 0
          ? 'medium'
          : state.settings.difficulty
      return {
        customKeywords,
        settings:
          nextDifficulty !== state.settings.difficulty
            ? { ...state.settings, difficulty: nextDifficulty }
            : state.settings,
      }
    })
  },

  applyBackupPreferences: (prefs) => {
    if (!prefs) return
    setRecentKeywords(prefs.recentKeywords)
    set(state => {
      const clamped = clampSettings(prefs.settings)
      const nextDifficulty =
        clamped.difficulty === 'custom' && state.customKeywords.length === 0
          ? 'medium'
          : clamped.difficulty
      return {
        settings: { ...clamped, difficulty: nextDifficulty },
        previousNames: prefs.previousNames.slice(0, 20),
      }
    })
  },

  resetToFactoryState: () => {
    setRecentKeywords([])
    set(state => ({
      roundId: '',
      players: [],
      phase: 'home',
      currentRevealIndex: 0,
      selectedCardIndex: null,
      winner: null,
      wasAborted: false,
      whiteHatGuessedWord: null,
      eliminatedPlayerId: null,
      previousNames: [],
      customKeywords: [],
      settings: { ...DEFAULT_SETTINGS },
      speakingOrder: [],
      resetCount: state.resetCount + 1,
    }))
  },
}))

function buildSessionPayload(state: GameState) {
  return {
    roundId: state.roundId,
    phase: state.phase,
    players: state.players,
    settings: state.settings,
    speakingOrder: state.speakingOrder,
    selectedCardIndex: state.selectedCardIndex,
    winner: state.winner,
    wasAborted: state.wasAborted,
    whiteHatGuessedWord: state.whiteHatGuessedWord,
    eliminatedPlayerId: state.eliminatedPlayerId,
    previousNames: state.previousNames,
    recentKeywords: getRecentKeywords(),
  }
}

let persistenceInitialized = false

/**
 * Khởi tạo đồng bộ 2 chiều giữa Zustand và IndexedDB (Dexie):
 * - Khôi phục ván đang chơi dở nếu người dùng lỡ reload/đóng trình duyệt.
 * - Tự động lưu mọi thay đổi trạng thái ván chơi xuống thiết bị.
 */
export async function initializeOfflinePersistence(): Promise<void> {
  if (persistenceInitialized) return
  persistenceInitialized = true

  void requestPersistentStorage()

  const [savedSession, customKeywords] = await Promise.all([
    loadActiveSession(),
    listCustomKeywords(),
  ])

  if (savedSession && !userMutatedBeforeHydration) {
    if (Array.isArray(savedSession.recentKeywords)) {
      setRecentKeywords(savedSession.recentKeywords)
    }

    const restoredSettings = clampSettings(savedSession.settings ?? DEFAULT_SETTINGS)
    if (restoredSettings.difficulty === 'custom' && customKeywords.length === 0) {
      restoredSettings.difficulty = 'medium'
    }

    const activeRoundPhases = new Set<Phase>(['reveal', 'playing', 'ended'])
    const hasValidPlayers =
      Array.isArray(savedSession.players) && savedSession.players.length >= 3

    const restoredPhase: Phase =
      activeRoundPhases.has(savedSession.phase) && !hasValidPlayers
        ? 'home'
        : savedSession.phase

    const validSelectedCard =
      typeof savedSession.selectedCardIndex === 'number' &&
      hasValidPlayers &&
      savedSession.selectedCardIndex >= 0 &&
      savedSession.selectedCardIndex < savedSession.players.length &&
      !savedSession.players[savedSession.selectedCardIndex]?.claimed
        ? savedSession.selectedCardIndex
        : null

    useGameStore.setState({
      roundId: hasValidPlayers ? savedSession.roundId || generateRoundId() : '',
      phase: restoredPhase,
      players: hasValidPlayers ? savedSession.players : [],
      settings: restoredSettings,
      speakingOrder: Array.isArray(savedSession.speakingOrder) ? savedSession.speakingOrder : [],
      selectedCardIndex: restoredPhase === 'reveal' ? validSelectedCard : null,
      winner: restoredPhase === 'home' || restoredPhase === 'setup' ? null : savedSession.winner,
      wasAborted: Boolean(savedSession.wasAborted),
      whiteHatGuessedWord: savedSession.whiteHatGuessedWord ?? null,
      eliminatedPlayerId: savedSession.eliminatedPlayerId ?? null,
      previousNames: Array.isArray(savedSession.previousNames)
        ? savedSession.previousNames.slice(0, 20)
        : [],
      customKeywords,
      isHydrated: true,
    })

    // Nếu reload đúng lúc ván vừa thắng tự nhiên, đảm bảo điểm đã được ghi nhận (idempotent)
    if (
      restoredPhase === 'ended' &&
      hasValidPlayers &&
      !savedSession.wasAborted &&
      savedSession.winner !== null &&
      savedSession.roundId
    ) {
      void recordMatchVictory({
        roundId: savedSession.roundId,
        winner: savedSession.winner,
        players: savedSession.players,
        whiteHatGuessedWord: savedSession.whiteHatGuessedWord ?? null,
      })
    }
  } else {
    useGameStore.setState({
      customKeywords,
      isHydrated: true,
    })
    if (userMutatedBeforeHydration) {
      void saveActiveSession(buildSessionPayload(useGameStore.getState()))
    }
  }

  let lastSerialized = JSON.stringify(buildSessionPayload(useGameStore.getState()))
  useGameStore.subscribe(state => {
    if (!state.isHydrated) return
    const payload = buildSessionPayload(state)
    const nextSerialized = JSON.stringify(payload)
    if (nextSerialized === lastSerialized) return
    lastSerialized = nextSerialized
    void saveActiveSession(payload)
  })

  subscribeDataHub(() => {
    void useGameStore.getState().refreshCustomKeywords()
  })
}
