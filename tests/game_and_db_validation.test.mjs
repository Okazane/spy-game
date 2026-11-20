import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  getCanonicalKeywordKey,
  keywords,
  MAX_RECENT_KEYWORDS,
  pickNextKeyword,
  setRecentKeywords,
} from '../src/data/keywords.ts'
import {
  addCustomKeywordPair,
  BACKUP_APP_ID,
  BACKUP_SCHEMA_VERSION,
  BackupValidationError,
  clearAllDeviceData,
  computeMatchScoreUpdate,
  createBackupPayload,
  deleteCustomKeywordPair,
  getScoreboardSnapshot,
  importValidatedBackup,
  loadActiveSession,
  MAX_BACKUP_BYTES,
  MAX_MATCH_HISTORY,
  parseAndValidateBackupJson,
  recordMatchVictory,
  resetGameDbForTests,
  resetScoreboard,
  saveActiveSession,
  validateBackupPayload,
  validateCustomKeywordInput,
} from '../src/db/gameDb.ts'
import {
  checkWin,
  clampSettings,
  generateSpeakingOrder,
  isKeywordMatch,
  useGameStore,
} from '../src/stores/gameStore.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT_DIR = path.resolve(__dirname, '..')

function makePlayer(id, role, isAlive = true, name = `P_${id}`, keyword = 'Từ') {
  return { id, name, role, keyword, isAlive, claimed: true }
}

test('clampSettings enforces 3..20 players, >=1 civilian, and >=1 infiltrator', () => {
  const tooSmall = clampSettings({
    totalPlayers: 1,
    spyCount: 0,
    whiteHatCount: 0,
    difficulty: 'easy',
    hideRole: true,
  })
  assert.equal(tooSmall.totalPlayers, 3)
  assert.equal(tooSmall.spyCount, 1)
  assert.equal(tooSmall.whiteHatCount, 0)
  assert.equal(tooSmall.includeCustomKeywords, true)

  const tooLarge = clampSettings({
    totalPlayers: 99,
    spyCount: 15,
    whiteHatCount: 10,
    difficulty: 'hard',
    hideRole: false,
  })
  assert.equal(tooLarge.totalPlayers, 20)
  assert.ok(tooLarge.spyCount + tooLarge.whiteHatCount <= 19)
  assert.equal(tooLarge.totalPlayers - tooLarge.spyCount - tooLarge.whiteHatCount, 1)

  const whiteHatOnly = clampSettings({
    totalPlayers: 5,
    spyCount: 0,
    whiteHatCount: 2,
    difficulty: 'medium',
    hideRole: true,
  })
  assert.equal(whiteHatOnly.spyCount, 0)
  assert.equal(whiteHatOnly.whiteHatCount, 2)
})

test('checkWin resolves all 4 victory outcomes and chaotic custom tables accurately', () => {
  // 1. Civilian win: no alive spy and no alive white-hat
  assert.equal(
    checkWin([
      makePlayer('1', 'civilian', true),
      makePlayer('2', 'civilian', true),
      makePlayer('3', 'spy', false),
      makePlayer('4', 'white-hat', false),
    ]),
    'civilian'
  )

  // 2. Spy win on standard majority table when aliveSpy >= aliveCivilian and 0 aliveWhiteHat
  assert.equal(
    checkWin([
      makePlayer('1', 'civilian', true),
      makePlayer('2', 'civilian', false),
      makePlayer('3', 'civilian', false),
      makePlayer('4', 'spy', true),
    ]),
    'spy'
  )

  // 3. Spy + White-Hat joint win when <= 3 alive on standard table with both alive
  assert.equal(
    checkWin([
      makePlayer('1', 'civilian', true),
      makePlayer('2', 'civilian', false),
      makePlayer('3', 'civilian', false),
      makePlayer('4', 'spy', true),
      makePlayer('5', 'white-hat', true),
    ]),
    'spy+white'
  )

  // 4. White-Hat survival win when spies are gone and aliveWhiteHat >= aliveCivilian
  assert.equal(
    checkWin([
      makePlayer('1', 'civilian', true),
      makePlayer('2', 'civilian', false),
      makePlayer('3', 'civilian', false),
      makePlayer('4', 'spy', false),
      makePlayer('5', 'white-hat', true),
    ]),
    'white-hat'
  )

  // 5. Game still in progress when civilians outnumber infiltrators
  assert.equal(
    checkWin([
      makePlayer('1', 'civilian', true),
      makePlayer('2', 'civilian', true),
      makePlayer('3', 'civilian', true),
      makePlayer('4', 'spy', true),
      makePlayer('5', 'white-hat', true),
    ]),
    null
  )

  // 6. Custom chaotic table (initialCivilian <= initialSpy + initialWhiteHat): continues until 0 civilians alive
  const chaoticMid = [
    makePlayer('1', 'civilian', true),
    makePlayer('2', 'spy', true),
    makePlayer('3', 'spy', true),
  ]
  assert.equal(checkWin(chaoticMid), null)
  assert.equal(
    checkWin([
      makePlayer('1', 'civilian', false),
      makePlayer('2', 'spy', true),
      makePlayer('3', 'spy', true),
    ]),
    'spy'
  )
})

test('generateSpeakingOrder guarantees White-Hat is never at #1 or #2 when >=2 non-White-Hats exist', () => {
  const players = [
    makePlayer('c1', 'civilian', true, 'Trùng Tên'),
    makePlayer('s1', 'spy', true, 'Trùng Tên'),
    makePlayer('w1', 'white-hat', true, 'Mũ 1'),
    makePlayer('w2', 'white-hat', true, 'Mũ 2'),
    makePlayer('c2', 'civilian', true, 'Dân 2'),
  ]
  const whiteHatIds = new Set(['w1', 'w2'])

  for (let trial = 0; trial < 250; trial++) {
    const order = generateSpeakingOrder(players)
    assert.equal(order.length, players.length)
    assert.equal(new Set(order).size, players.length)
    assert.ok(!whiteHatIds.has(order[0]), `Trial ${trial}: White-Hat placed at #1`)
    assert.ok(!whiteHatIds.has(order[1]), `Trial ${trial}: White-Hat placed at #2`)
  }

  // Edge case: only 1 non-White-Hat -> placed at #1
  const singleNonWH = [
    makePlayer('w1', 'white-hat'),
    makePlayer('c1', 'civilian'),
    makePlayer('w2', 'white-hat'),
  ]
  for (let trial = 0; trial < 30; trial++) {
    const order = generateSpeakingOrder(singleNonWH)
    assert.equal(order[0], 'c1')
  }
})

test('isKeywordMatch handles Vietnamese diacritics, đ/Đ, casing, and whitespace', () => {
  assert.equal(isKeywordMatch('Bánh cuốn', 'bánh cuốn'), true)
  assert.equal(isKeywordMatch('  banh   cuon ', 'Bánh cuốn'), true)
  assert.equal(isKeywordMatch('Đàn ukulele', 'dan ukulele'), true)
  assert.equal(isKeywordMatch('Phở bò', 'Bún bò Huế'), false)
  assert.equal(isKeywordMatch('   ', 'Phở bò'), false)
})

test('canonical recentKeywords prevents repeats across 50/50 role swaps and custom cycles', () => {
  assert.equal(keywords.length, 200)
  assert.equal(getCanonicalKeywordKey('Chó', 'Mèo'), 'chó|mèo')
  assert.equal(getCanonicalKeywordKey('Mèo', 'Chó'), 'chó|mèo')
  assert.equal(getCanonicalKeywordKey('  Trà Đào ', 'trà vải'), getCanonicalKeywordKey('Trà vải', 'Trà đào'))

  // Run 25 consecutive draws from easy (65 pairs) and ensure all 25 canonical keys are unique
  let recent = []
  const seenInBatch = new Set()
  for (let i = 0; i < MAX_RECENT_KEYWORDS; i++) {
    const res = pickNextKeyword({ difficulty: 'easy', recentKeys: recent })
    assert.ok(!seenInBatch.has(res.canonicalKey), `Repeated pair at draw ${i}: ${res.canonicalKey}`)
    seenInBatch.add(res.canonicalKey)
    // Verify canonical key matches even if 50/50 role swap occurred
    assert.equal(getCanonicalKeywordKey(res.pair.civilian, res.pair.spy), res.canonicalKey)
    recent = res.nextRecentKeys
  }
  assert.equal(recent.length, MAX_RECENT_KEYWORDS)

  // Small custom deck of 3 pairs: rounds 1..3 have 0 repeats, round 4 never repeats round 3 back-to-back
  const customPairs = [
    { civilian: 'Quán ốc A', spy: 'Quán ốc B' },
    { civilian: 'Trà chanh', spy: 'Trà tắc' },
    { civilian: 'Đà Lạt', spy: 'Sa Pa' },
  ]
  let customRecent = []
  const firstCycle = []
  for (let i = 0; i < 3; i++) {
    const res = pickNextKeyword({
      difficulty: 'custom',
      customPairs,
      recentKeys: customRecent,
    })
    firstCycle.push(res.canonicalKey)
    customRecent = res.nextRecentKeys
  }
  assert.equal(new Set(firstCycle).size, 3)

  const fourthDraw = pickNextKeyword({
    difficulty: 'custom',
    customPairs,
    recentKeys: customRecent,
  })
  assert.notEqual(fourthDraw.canonicalKey, firstCycle[2])
})

test('validateCustomKeywordInput blocks empty, identical, duplicate, and oversized pairs', () => {
  assert.equal(validateCustomKeywordInput('', 'Mèo').ok, false)
  assert.equal(validateCustomKeywordInput('Trà đào', '  trà   đào ').ok, false)
  assert.equal(validateCustomKeywordInput('A'.repeat(41), 'Mèo').ok, false)

  const valid = validateCustomKeywordInput('  Bún đậu ', 'Bún chả ')
  assert.equal(valid.ok, true)
  if (valid.ok) {
    const existing = [
      {
        id: 'kw_1',
        civilian: valid.civilian,
        spy: valid.spy,
        canonicalKey: valid.canonicalKey,
        createdAt: Date.now(),
      },
    ]
    // Reversed order duplicate is also rejected via canonicalKey!
    const dupReversed = validateCustomKeywordInput('Bún chả', 'Bún đậu', existing)
    assert.equal(dupReversed.ok, false)
  }
})

test('Party scoreboard awards exact points and early abort skips victory state', () => {
  const roundPlayers = [
    makePlayer('1', 'civilian', true, 'Minh', 'Trà đào'),
    makePlayer('2', 'civilian', false, 'Lan', 'Trà đào'),
    makePlayer('3', 'spy', true, 'Hùng', 'Trà vải'),
    makePlayer('4', 'white-hat', false, 'Tuấn', ''),
  ]

  const spyWin = computeMatchScoreUpdate([], {
    roundId: 'rnd_1',
    winner: 'spy',
    players: roundPlayers,
    whiteHatGuessedWord: null,
    endedAt: 1700000000000,
  })
  const hung = spyWin.updatedScores.find(s => s.name === 'Hùng')
  const minh = spyWin.updatedScores.find(s => s.name === 'Minh')
  assert.equal(hung?.points, 3)
  assert.equal(hung?.spyWins, 1)
  assert.equal(minh?.points, 0)
  assert.equal(minh?.gamesPlayed, 1)

  const whWin = computeMatchScoreUpdate(spyWin.updatedScores, {
    roundId: 'rnd_2',
    winner: 'white-hat',
    players: roundPlayers,
    whiteHatGuessedWord: 'Trà đào',
    endedAt: 1700000005000,
  })
  const tuan = whWin.updatedScores.find(s => s.name === 'Tuấn')
  assert.equal(tuan?.points, 4)
  assert.equal(tuan?.whiteHatWins, 1)

  // Store early abort vs natural win check
  setRecentKeywords([])
  useGameStore.getState().resetToFactoryState()
  useGameStore.getState().startGame()
  useGameStore.getState().endGame() // winner was null -> early manual abort!
  assert.equal(useGameStore.getState().wasAborted, true)
})

test('parseAndValidateBackupJson enforces strict schema and rejects prototype pollution & oversized payloads', () => {
  const validPayload = {
    app: BACKUP_APP_ID,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: '2026-11-21T00:00:00.000Z',
    customKeywords: [
      {
        id: 'kw_test_1',
        civilian: 'Cà phê muối',
        spy: 'Cà phê trứng',
        createdAt: 1700000000000,
      },
    ],
    scores: [
      {
        id: 'minh',
        name: 'Minh',
        points: 7,
        wins: 3,
        gamesPlayed: 5,
        civilianWins: 2,
        spyWins: 0,
        whiteHatWins: 1,
        updatedAt: 1700000000000,
      },
    ],
    history: [
      {
        id: 'rnd_abc',
        endedAt: 1700000000000,
        winner: 'white-hat',
        civilianKeyword: 'Cà phê muối',
        spyKeyword: 'Cà phê trứng',
        totalPlayers: 5,
        whiteHatGuessedWord: 'Cà phê muối',
        awardedPlayers: [{ name: 'Minh', role: 'white-hat', pointsDelta: 4 }],
      },
    ],
    preferences: {
      settings: {
        totalPlayers: 7,
        spyCount: 2,
        whiteHatCount: 1,
        difficulty: 'custom',
        hideRole: true,
        includeCustomKeywords: true,
      },
      previousNames: ['Minh', 'Lan'],
      recentKeywords: ['cà phê muối|cà phê trứng'],
    },
  }

  const parsed = parseAndValidateBackupJson(JSON.stringify(validPayload))
  assert.equal(parsed.customKeywords.length, 1)
  assert.equal(parsed.customKeywords[0].canonicalKey, 'cà phê muối|cà phê trứng')
  assert.equal(parsed.scores[0].points, 7)
  assert.equal(parsed.history[0].winner, 'white-hat')

  // 1. Malformed JSON
  assert.throws(() => parseAndValidateBackupJson('{broken json'), BackupValidationError)

  // 2. Prototype pollution via __proto__, constructor, prototype
  assert.throws(
    () =>
      parseAndValidateBackupJson(
        '{"app":"spy-game","schemaVersion":1,"exportedAt":"2026-01-01","__proto__":{"polluted":true},"customKeywords":[],"scores":[],"history":[]}'
      ),
    BackupValidationError
  )
  assert.throws(
    () =>
      parseAndValidateBackupJson(
        '{"app":"spy-game","schemaVersion":1,"exportedAt":"2026-01-01","customKeywords":[],"scores":[{"constructor":{"bad":1}}],"history":[]}'
      ),
    BackupValidationError
  )
  const rawPollutedObj = JSON.parse(
    '{"app":"spy-game","schemaVersion":1,"exportedAt":"2026-01-01","customKeywords":[],"scores":[],"history":[],"__proto__":{"x":1}}'
  )
  assert.throws(() => validateBackupPayload(rawPollutedObj), BackupValidationError)

  // 3. Unknown root property
  assert.throws(
    () =>
      parseAndValidateBackupJson(
        JSON.stringify({ ...validPayload, unexpectedField: 'inject' })
      ),
    BackupValidationError
  )

  // 4. Invalid enum value
  assert.throws(
    () =>
      parseAndValidateBackupJson(
        JSON.stringify({
          ...validPayload,
          history: [{ ...validPayload.history[0], winner: 'alien' }],
        })
      ),
    BackupValidationError
  )

  // 5. Identical custom keyword pair in backup
  assert.throws(
    () =>
      parseAndValidateBackupJson(
        JSON.stringify({
          ...validPayload,
          customKeywords: [
            { id: 'kw_bad', civilian: 'Trà đào', spy: 'trà đào', createdAt: 1700000000000 },
          ],
        })
      ),
    BackupValidationError
  )

  // 6. Oversized history array (> 50)
  const hugeHistory = Array.from({ length: MAX_MATCH_HISTORY + 1 }, (_, i) => ({
    ...validPayload.history[0],
    id: `rnd_${i}`,
  }))
  assert.throws(
    () => parseAndValidateBackupJson(JSON.stringify({ ...validPayload, history: hugeHistory })),
    BackupValidationError
  )

  // 7. Oversized byte payload (> 2 MB)
  const over2Mb = 'x'.repeat(MAX_BACKUP_BYTES + 64)
  assert.throws(() => parseAndValidateBackupJson(over2Mb), BackupValidationError)
})

test('Offline PWA hygiene: zero external Google Fonts in index.html & valid 192/512 PNG icons on disk', () => {
  const indexHtml = fs.readFileSync(path.join(ROOT_DIR, 'index.html'), 'utf8')
  assert.ok(!indexHtml.includes('fonts.googleapis.com'), 'index.html still references fonts.googleapis.com')
  assert.ok(!indexHtml.includes('fonts.gstatic.com'), 'index.html still references fonts.gstatic.com')
  assert.ok(indexHtml.includes('/icons/icon-192.png'), 'index.html missing apple-touch-icon link')

  for (const dim of [192, 512]) {
    const iconPath = path.join(ROOT_DIR, 'public', 'icons', `icon-${dim}.png`)
    assert.ok(fs.existsSync(iconPath), `Missing ${iconPath}`)
    const buf = fs.readFileSync(iconPath)
    // PNG signature: 89 50 4E 47 0D 0A 1A 0A, followed by IHDR width & height at bytes 16..23
    assert.equal(buf[0], 0x89)
    assert.equal(buf[1], 0x50)
    assert.equal(buf[2], 0x4e)
    assert.equal(buf[3], 0x47)
    assert.equal(buf.readUInt32BE(16), dim)
    assert.equal(buf.readUInt32BE(20), dim)
  }
})

test('Blocked IndexedDB (SecurityError / Private Mode) fallback & JSON Export/Import round-trip', async () => {
  const hadIndexedDB = Object.prototype.hasOwnProperty.call(globalThis, 'indexedDB')
  const prevIndexedDB = hadIndexedDB ? globalThis.indexedDB : undefined

  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    get() {
      const err = new Error('The operation is insecure.')
      err.name = 'SecurityError'
      throw err
    },
  })

  try {
    resetGameDbForTests()

    // 1. Add custom keyword pair with blocked IndexedDB -> succeeds in fallback store
    const added = await addCustomKeywordPair('Bánh mì chảo', 'Bò né')
    assert.equal(added.ok, true)
    if (added.ok) {
      assert.equal(added.all.length, 1)
    }

    // 2. Record match victory with control chars (\t) in White-Hat guess & player name -> sanitized & idempotent
    const players = [
      makePlayer('p1', 'civilian', true, 'Minh\tAnh', 'Bánh mì chảo'),
      makePlayer('p2', 'civilian', false, 'Lan', 'Bánh mì chảo'),
      makePlayer('p3', 'spy', false, 'Hùng', 'Bò né'),
      makePlayer('p4', 'white-hat', false, 'Tuấn', ''),
    ]
    const saved1 = await recordMatchVictory({
      roundId: 'rnd_fallback_1',
      winner: 'white-hat',
      players,
      whiteHatGuessedWord: 'Bánh\tmì chảo',
    })
    const saved2 = await recordMatchVictory({
      roundId: 'rnd_fallback_1',
      winner: 'white-hat',
      players,
      whiteHatGuessedWord: 'Bánh\tmì chảo',
    })
    assert.ok(saved1)
    assert.equal(saved1?.whiteHatGuessedWord, 'Bánh mì chảo')
    assert.equal(saved2?.id, 'rnd_fallback_1')

    const snap = await getScoreboardSnapshot()
    assert.equal(snap.history.length, 1)
    assert.equal(snap.scores.find(s => s.name === 'Tuấn')?.points, 4)

    // 3. Session save/load fallback
    await saveActiveSession({
      roundId: 'rnd_sess_1',
      phase: 'playing',
      players,
      settings: {
        totalPlayers: 4,
        spyCount: 1,
        whiteHatCount: 1,
        difficulty: 'custom',
        hideRole: true,
        includeCustomKeywords: true,
      },
      speakingOrder: ['p1', 'p3', 'p2', 'p4'],
      selectedCardIndex: null,
      winner: null,
      wasAborted: false,
      whiteHatGuessedWord: null,
      eliminatedPlayerId: null,
      previousNames: ['Minh\tAnh', 'Lan'],
      recentKeywords: ['bánh mì chảo|bò né'],
    })
    const loadedSession = await loadActiveSession()
    assert.equal(loadedSession?.roundId, 'rnd_sess_1')

    // 4. Export -> Strict Validate -> Wipe -> Import round-trip
    const backup = await createBackupPayload({
      settings: {
        totalPlayers: 4,
        spyCount: 1,
        whiteHatCount: 1,
        difficulty: 'custom',
        hideRole: true,
        includeCustomKeywords: true,
      },
      previousNames: ['Minh\tAnh', 'Lan'],
      recentKeywords: ['bánh mì chảo|bò né'],
    })
    const validated = parseAndValidateBackupJson(JSON.stringify(backup))
    assert.equal(validated.customKeywords.length, 1)
    assert.equal(validated.history.length, 1)
    assert.equal(validated.preferences?.previousNames[0], 'Minh Anh')

    await clearAllDeviceData()
    assert.equal((await getScoreboardSnapshot()).scores.length, 0)

    await importValidatedBackup(validated)
    const restoredSnap = await getScoreboardSnapshot()
    assert.equal(restoredSnap.scores.find(s => s.name === 'Tuấn')?.points, 4)

    if (added.ok) {
      const remaining = await deleteCustomKeywordPair(added.record.id)
      assert.equal(remaining.length, 0)
    }
    await resetScoreboard()
    assert.equal((await getScoreboardSnapshot()).history.length, 0)
  } finally {
    resetGameDbForTests()
    if (hadIndexedDB) {
      Object.defineProperty(globalThis, 'indexedDB', {
        configurable: true,
        writable: true,
        value: prevIndexedDB,
      })
    } else {
      delete globalThis.indexedDB
    }
  }
})
