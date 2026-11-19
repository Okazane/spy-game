import { create } from 'zustand'
import { type Difficulty, getRandomKeyword } from '../data/keywords'

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
  hideRole: boolean // Bật: chỉ biết từ khoá, không biết là Dân hay Gián
}

interface GameState {
  players: Player[]
  phase: Phase
  currentRevealIndex: number   // giữ lại cho compatibility
  selectedCardIndex: number | null  // bài đang được lật
  winner: Winner
  settings: GameSettings
  eliminatedPlayerId: string | null
  previousNames: string[]      // tên nhóm ván trước
  resetCount: number   // tăng mỗi lần reset để AnimatePresence nhận ra màn mới
  speakingOrder: string[]      // thứ tự phát biểu: mảng player.id (không phải tên)

  whiteHatGuessedWord: string | null
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
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
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
// Quy tắc: Ưu tiên Dân/Gián nói đầu để Mũ Trắng không phải nói mù ở đầu vòng.
function generateSpeakingOrder(players: Player[]): string[] {
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

  return { ...s, totalPlayers: total, spyCount, whiteHatCount }
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

export const useGameStore = create<GameState>((set, get) => ({
  players: [],
  phase: 'home',
  currentRevealIndex: 0,
  selectedCardIndex: null,
  winner: null,
  whiteHatGuessedWord: null,
  eliminatedPlayerId: null,
  previousNames: [],
  resetCount: 0,
  speakingOrder: [],
  settings: {
    totalPlayers: 6,
    spyCount: 1,
    whiteHatCount: 0,
    difficulty: 'medium',
    hideRole: true,
  },

  setSettings: (s) =>
    set(state => ({ settings: mergeSettings(state.settings, s) })),

  startGame: () => {
    const safeSettings = clampSettings(get().settings)
    const { totalPlayers, spyCount, whiteHatCount, difficulty } = safeSettings
    const civilianCount = totalPlayers - spyCount - whiteHatCount
    const keyword = getRandomKeyword(difficulty)

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
      settings: safeSettings,
      players,
      phase: 'reveal',
      currentRevealIndex: 0,
      selectedCardIndex: null,
      winner: null,
      whiteHatGuessedWord: null,
      eliminatedPlayerId: null,
      speakingOrder: [],
    })
  },

  // Người chơi bấm vào một lá bài chưa được nhận (đã bấm lá nào là khoá luôn lá đó, không được đổi sang lá khác)
  selectCard: (index) => {
    const { players, selectedCardIndex } = get()
    if (players[index]?.claimed) return
    if (selectedCardIndex !== null) return // Đã chọn một lá bài rồi thì không thể đổi nữa
    set({ selectedCardIndex: index })
  },

  // Người chơi nhập tên và xác nhận nhận bài
  claimCard: (index, name) => {
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
    const { players } = get()
    const names = players.map(p => p.name)
    set({ phase: 'playing', previousNames: names })
  },

  // Giữ lại cho compatibility
  revealNext: () => {
    const { currentRevealIndex, players } = get()
    const nextIndex = currentRevealIndex + 1
    if (nextIndex >= players.length) {
      set({ phase: 'playing' })
    } else {
      set({ currentRevealIndex: nextIndex })
    }
  },

  eliminatePlayer: (id) => {
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

  endGame: () => set(state => ({
    phase: 'ended',
    winner: state.winner ?? 'civilian',
  })),

  resetGame: () =>
    set(state => ({
      phase: 'setup',
      currentRevealIndex: 0,
      selectedCardIndex: null,
      winner: null,
      whiteHatGuessedWord: null,
      eliminatedPlayerId: null,
      players: [],
      settings: state.settings,
      previousNames: state.previousNames,
      resetCount: state.resetCount + 1,
      speakingOrder: [],
    })),

  reshuffleSpeakingOrder: () => {
    const { players } = get()
    set({ speakingOrder: generateSpeakingOrder(players) })
  },
}))
