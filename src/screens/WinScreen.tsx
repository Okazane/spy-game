import { useEffect, useMemo } from 'react'
import { motion } from 'motion/react'
import { ArrowCounterClockwise, House } from '@phosphor-icons/react'
import { useGameStore, type Role, type Winner } from '../stores/gameStore'
import {
  playClickSound,
  playFlipSound,
  playStampSound,
  playVictorySound,
  triggerHaptic,
} from '../utils/sound'
import { getAvatarByIndex } from '../data/avatars'
import {
  AvatarPortrait,
  RoleEmblem,
  firePartyConfetti,
} from '../components/PartyVisuals'

const INK = '#231C35'

type ResolvedWinner = Exclude<Winner, null>

interface OutcomeTheme {
  tag: string
  headline: string
  subtitle: string
  accentColor: string
  bg: string
  role: Role
}

const OUTCOME_THEMES: Record<ResolvedWinner, OutcomeTheme> = {
  civilian: {
    tag: 'Phe Dân Thường thắng',
    headline: 'Cả hội quá tỉnh đòn!',
    subtitle: 'Đã tìm ra toàn bộ kẻ trà trộn trên bàn.',
    accentColor: '#0F766E',
    bg: '#CCFBF1',
    role: 'civilian',
  },
  spy: {
    tag: 'Phe Gián Điệp thắng',
    headline: 'Gián Điệp diễn quá mượt!',
    subtitle: 'Trà trộn thành công đến tận phút cuối.',
    accentColor: '#BE123C',
    bg: '#FFE4E6',
    role: 'spy',
  },
  'white-hat': {
    tag: 'Phe Mũ Trắng thắng',
    headline: 'Mũ Trắng lật kèo ngoạn mục!',
    subtitle: 'Không có từ khoá vẫn đọc vị được cả bàn.',
    accentColor: '#6D28D9',
    bg: '#F3E8FF',
    role: 'white-hat',
  },
  'spy+white': {
    tag: 'Gián Điệp & Mũ Trắng cùng thắng',
    headline: 'Màn bắt tay bất ngờ!',
    subtitle: 'Phe Dân Thường đã không còn giữ được đa số.',
    accentColor: '#B45309',
    bg: '#FEF3C7',
    role: 'spy',
  },
}

const ROLE_BADGE_STYLE: Record<Role, { label: string; color: string; bg: string }> = {
  civilian: { label: 'Dân', color: '#0F766E', bg: '#CCFBF1' },
  spy: { label: 'Gián', color: '#BE123C', bg: '#FFE4E6' },
  'white-hat': { label: 'Mũ trắng', color: '#6D28D9', bg: '#F3E8FF' },
}

export function WinScreen() {
  const winner = useGameStore(s => s.winner)
  const players = useGameStore(s => s.players)
  const resetGame = useGameStore(s => s.resetGame)
  const whiteHatGuessedWord = useGameStore(s => s.whiteHatGuessedWord)

  const outcome: ResolvedWinner = winner ?? 'civilian'
  const theme = OUTCOME_THEMES[outcome]
  const hasClutchWord = Boolean(whiteHatGuessedWord)

  const { civilianKeyword, spyKeyword } = useMemo(
    () => ({
      civilianKeyword: players.find(p => p.role === 'civilian')?.keyword || '—',
      spyKeyword: players.find(p => p.role === 'spy')?.keyword || '—',
    }),
    [players]
  )

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    playVictorySound(outcome)
    firePartyConfetti(outcome)
    triggerHaptic([30, 40, 50])

    if (hasClutchWord) {
      timers.push(setTimeout(() => playStampSound(), 180))
    }
    timers.push(setTimeout(() => playFlipSound(), 240))

    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [outcome, hasClutchWord])

  const handlePlayAgain = () => {
    playClickSound(1.06)
    triggerHaptic(30)
    resetGame()
  }

  const handleGoHome = () => {
    playClickSound(0.94)
    triggerHaptic(20)
    resetGame()
    useGameStore.setState({ phase: 'home' })
  }

  return (
    <div className="w-full h-full flex flex-col justify-between px-4 py-3.5 gap-2.5 select-none overflow-hidden">
      {/* 1. Clean Winner Card (Zero Sparkle / AI icon clutter) */}
      <motion.section
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="rounded-2xl px-4 py-3.5 text-center shrink-0 space-y-1.5"
        style={{
          backgroundColor: theme.bg,
          border: `2px solid ${INK}`,
          boxShadow: `0 3px 0 ${INK}`,
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <RoleEmblem role={theme.role} size={32} />
          <span
            className="px-3 py-0.5 rounded-full text-[0.74rem] font-extrabold"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: '#FFFFFF',
              color: theme.accentColor,
              border: `1.5px solid ${INK}`,
            }}
          >
            {theme.tag}
          </span>
        </div>

        <h1
          className="text-[1.35rem] font-black leading-tight"
          style={{ fontFamily: 'var(--font-display)', color: INK }}
        >
          {theme.headline}
        </h1>
        <p className="text-xs font-medium" style={{ color: '#5B5270' }}>
          {whiteHatGuessedWord
            ? `Mũ Trắng đoán trúng từ "${whiteHatGuessedWord}" của phe Dân Thường!`
            : theme.subtitle}
        </p>
      </motion.section>

      {/* 2. Side-by-Side Keyword Reveal */}
      <section className="grid grid-cols-2 gap-2.5 shrink-0">
        <motion.div
          initial={{ rotateY: -70, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260, delay: 0.12 }}
          className="rounded-2xl px-3 py-2.5 text-center"
          style={{
            backgroundColor: '#FFFFFF',
            border: `2px solid ${INK}`,
            boxShadow: `0 2px 0 ${INK}`,
          }}
        >
          <span
            className="block text-[0.68rem] font-extrabold"
            style={{ fontFamily: 'var(--font-display)', color: '#0F766E' }}
          >
            Từ Dân Thường
          </span>
          <span
            className="block text-[1.02rem] font-black leading-snug mt-0.5 truncate"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            {civilianKeyword}
          </span>
        </motion.div>

        <motion.div
          initial={{ rotateY: 70, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260, delay: 0.2 }}
          className="rounded-2xl px-3 py-2.5 text-center"
          style={{
            backgroundColor: '#FFFFFF',
            border: `2px solid ${INK}`,
            boxShadow: `0 2px 0 ${INK}`,
          }}
        >
          <span
            className="block text-[0.68rem] font-extrabold"
            style={{ fontFamily: 'var(--font-display)', color: '#BE123C' }}
          >
            Từ Gián Điệp
          </span>
          <span
            className="block text-[1.02rem] font-black leading-snug mt-0.5 truncate"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            {spyKeyword}
          </span>
        </motion.div>
      </section>

      {/* 3. Compact Player Roster (Fits in Remaining Viewport Height) */}
      <section
        className="flex-1 min-h-0 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          border: `2px solid ${INK}`,
          boxShadow: `0 3px 0 ${INK}`,
        }}
      >
        <div className="flex items-center justify-between shrink-0">
          <span
            className="text-[0.78rem] font-extrabold"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            Danh sách vai trò ({players.length})
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-2 gap-1.5 content-start pr-0.5">
          {players.map((p, idx) => {
            const badge = ROLE_BADGE_STYLE[p.role]
            return (
              <div
                key={p.id}
                className="flex items-center gap-2 px-2 py-1.5 rounded-xl min-w-0"
                style={{
                  backgroundColor: '#FAF4E8',
                  border: '1.5px solid rgba(35, 28, 53, 0.14)',
                }}
              >
                <AvatarPortrait avatar={getAvatarByIndex(idx)} size={30} />
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[0.76rem] font-extrabold truncate leading-tight"
                    style={{ fontFamily: 'var(--font-display)', color: INK }}
                  >
                    {p.name}
                  </p>
                  <span
                    className="inline-block text-[0.64rem] font-bold px-1.5 py-px rounded-md mt-0.5"
                    style={{
                      backgroundColor: badge.bg,
                      color: badge.color,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Bottom Actions */}
      <div className="flex gap-2.5 shrink-0">
        <button
          type="button"
          onClick={handleGoHome}
          aria-label="Về trang chủ"
          className="btn-party-secondary w-12 flex items-center justify-center shrink-0 cursor-pointer"
        >
          <House size={20} weight="bold" />
        </button>

        <button
          type="button"
          onClick={handlePlayAgain}
          className="btn-party-primary flex-1 py-3.5 px-5 text-[0.96rem] inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowCounterClockwise size={19} weight="bold" />
          <span>Chơi ván nữa</span>
        </button>
      </div>
    </div>
  )
}
