import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowCounterClockwise,
  Ghost,
  SlidersHorizontal,
  Trophy,
} from '@phosphor-icons/react'
import { useGameStore, type Role, type Winner } from '../stores/gameStore'
import { getPointsForRole } from '../db/gameDb'
import { DataHubModal } from '../components/DataHubModal'
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
  headline: string
  bg: string
  role: Role
}

const OUTCOME_THEMES: Record<ResolvedWinner, OutcomeTheme> = {
  civilian: {
    headline: 'Dân Thường Thắng!',
    bg: '#CCFBF1',
    role: 'civilian',
  },
  spy: {
    headline: 'Gián Điệp Thắng!',
    bg: '#FFE4E6',
    role: 'spy',
  },
  'white-hat': {
    headline: 'Mũ Trắng Thắng!',
    bg: '#F3E8FF',
    role: 'white-hat',
  },
  'spy+white': {
    headline: 'Gián Điệp & Mũ Trắng Thắng!',
    bg: '#FEF3C7',
    role: 'spy',
  },
}

const ROLE_BADGE_STYLE: Record<
  Role,
  { label: string; color: string; bg: string }
> = {
  civilian: { label: 'Dân thường', color: '#0F766E', bg: '#CCFBF1' },
  spy: { label: 'Gián điệp', color: '#BE123C', bg: '#FFE4E6' },
  'white-hat': { label: 'Mũ trắng', color: '#6D28D9', bg: '#F3E8FF' },
}

export function WinScreen() {
  const winner = useGameStore(s => s.winner)
  const wasAborted = useGameStore(s => s.wasAborted)
  const players = useGameStore(s => s.players)
  const resetGame = useGameStore(s => s.resetGame)
  const startGame = useGameStore(s => s.startGame)
  const whiteHatGuessedWord = useGameStore(s => s.whiteHatGuessedWord)
  const [showDataHub, setShowDataHub] = useState(false)

  const outcome: ResolvedWinner = winner ?? 'civilian'
  const theme = OUTCOME_THEMES[outcome]
  const hasClutchWord = Boolean(whiteHatGuessedWord)

  const { civilianKeyword, spyKeyword, hasSpy } = useMemo(() => {
    return {
      civilianKeyword: players.find(p => p.role === 'civilian')?.keyword || '—',
      spyKeyword: players.find(p => p.role === 'spy')?.keyword || '—',
      hasSpy: players.some(p => p.role === 'spy'),
    }
  }, [players])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    if (!wasAborted) {
      playVictorySound(outcome)
      firePartyConfetti(outcome)
      triggerHaptic([30, 40, 50])

      if (hasClutchWord) {
        timers.push(setTimeout(() => playStampSound(), 180))
      }
    }
    timers.push(setTimeout(() => playFlipSound(), 240))

    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [outcome, hasClutchWord, wasAborted])

  const handlePlayAgain = () => {
    playClickSound(1.06)
    triggerHaptic(30)
    resetGame()
    startGame()
  }

  const handleChangeSettings = () => {
    playClickSound(0.94)
    triggerHaptic(20)
    resetGame()
  }

  const singleColumnRoster = players.length <= 5
  const denseRoster = players.length >= 9

  return (
    <div className="w-full h-full flex flex-col justify-between px-4 py-3.5 gap-2.5 select-none overflow-hidden">
      {/* 1. Crisp Winner Headline Card */}
      <motion.section
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 22, stiffness: 300 }}
        className="rounded-2xl px-4 py-3.5 text-center shrink-0 flex flex-col items-center gap-2"
        style={{
          backgroundColor: wasAborted ? '#F2E9D8' : theme.bg,
          border: `2px solid ${INK}`,
          boxShadow: `0 3px 0 ${INK}`,
        }}
      >
        <div className="flex items-center justify-center gap-2.5">
          {!wasAborted && <RoleEmblem role={theme.role} size={36} />}
          <h1
            className="text-[1.35rem] font-black leading-tight"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            {wasAborted ? 'Ván Đấu Kết Thúc Sớm' : theme.headline}
          </h1>
        </div>

        {wasAborted && (
          <span
            className="inline-flex items-center px-3 py-0.5 rounded-full text-[0.72rem] font-extrabold"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: '#FFFFFF',
              color: '#5B5270',
              border: `1.5px solid ${INK}`,
            }}
          >
            Huỷ giữa ván · Không tính điểm
          </span>
        )}

        {whiteHatGuessedWord && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: '#FFFFFF',
              color: '#6D28D9',
              border: `1.5px solid ${INK}`,
            }}
          >
            <Ghost size={14} weight="duotone" />
            <span>Đoán trúng: "{whiteHatGuessedWord}"</span>
          </span>
        )}
      </motion.section>

      {/* 2. Keyword Reveal Row (Centered single card if 0 Spies, otherwise Civilian & Spy) */}
      {hasSpy ? (
        <section className="relative grid grid-cols-2 gap-3 shrink-0">
          <motion.div
            initial={{ rotateY: -70, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260, delay: 0.12 }}
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: '#FFFFFF',
              border: `2px solid ${INK}`,
              boxShadow: `0 3px 0 ${INK}`,
            }}
          >
            <div
              className="px-2.5 py-1.5 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#CCFBF1',
                borderBottom: '1.5px solid rgba(35, 28, 53, 0.14)',
              }}
            >
              <RoleEmblem role="civilian" size={20} />
              <span
                className="text-[0.7rem] font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: '#0F766E' }}
              >
                Từ Dân Thường
              </span>
            </div>
            <div className="px-3 py-2.5 flex-1 flex items-center justify-center min-h-[48px]">
              <span
                className="block text-lg font-black leading-tight text-center break-words"
                style={{ fontFamily: 'var(--font-display)', color: INK }}
              >
                {civilianKeyword}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ rotateY: 70, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260, delay: 0.2 }}
            className="rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: '#FFFFFF',
              border: `2px solid ${INK}`,
              boxShadow: `0 3px 0 ${INK}`,
            }}
          >
            <div
              className="px-2.5 py-1.5 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#FFE4E6',
                borderBottom: '1.5px solid rgba(35, 28, 53, 0.14)',
              }}
            >
              <RoleEmblem role="spy" size={20} />
              <span
                className="text-[0.7rem] font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: '#BE123C' }}
              >
                Từ Gián Điệp
              </span>
            </div>
            <div className="px-3 py-2.5 flex-1 flex items-center justify-center min-h-[48px]">
              <span
                className="block text-lg font-black leading-tight text-center break-words"
                style={{ fontFamily: 'var(--font-display)', color: INK }}
              >
                {spyKeyword}
              </span>
            </div>
          </motion.div>
        </section>
      ) : (
        <section className="flex justify-center shrink-0">
          <motion.div
            initial={{ rotateY: -70, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260, delay: 0.12 }}
            className="w-full max-w-[240px] rounded-2xl overflow-hidden flex flex-col"
            style={{
              backgroundColor: '#FFFFFF',
              border: `2px solid ${INK}`,
              boxShadow: `0 3px 0 ${INK}`,
            }}
          >
            <div
              className="px-3 py-1.5 flex items-center justify-center gap-1.5"
              style={{
                backgroundColor: '#CCFBF1',
                borderBottom: '1.5px solid rgba(35, 28, 53, 0.14)',
              }}
            >
              <RoleEmblem role="civilian" size={20} />
              <span
                className="text-[0.72rem] font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: '#0F766E' }}
              >
                Từ Dân Thường
              </span>
            </div>
            <div className="px-3 py-2.5 flex items-center justify-center min-h-[48px]">
              <span
                className="block text-xl font-black leading-tight text-center break-words"
                style={{ fontFamily: 'var(--font-display)', color: INK }}
              >
                {civilianKeyword}
              </span>
            </div>
          </motion.div>
        </section>
      )}

      {/* 3. Player Role Roster (Supports 3..20 players cleanly) */}
      <section
        className="flex-1 min-h-0 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden"
        style={{
          backgroundColor: '#FFFFFF',
          border: `2px solid ${INK}`,
          boxShadow: `0 3px 0 ${INK}`,
        }}
      >
        <div className="flex items-center justify-between gap-2 shrink-0">
          <span
            className="text-[0.82rem] font-extrabold"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            Danh sách vai trò ({players.length})
          </span>

          <button
            type="button"
            onClick={() => {
              playClickSound()
              triggerHaptic(14)
              setShowDataHub(true)
            }}
            className="px-2.5 py-1 rounded-full text-[0.72rem] font-extrabold inline-flex items-center gap-1 cursor-pointer"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: '#FEF3C7',
              color: INK,
              border: `1.5px solid ${INK}`,
            }}
          >
            <Trophy size={13} weight="duotone" color="#D97706" />
            <span>Bảng điểm</span>
          </button>
        </div>

        <div
          className={`flex-1 min-h-0 overflow-y-auto grid content-start pr-0.5 ${
            singleColumnRoster
              ? 'grid-cols-1 gap-2'
              : denseRoster
              ? 'grid-cols-2 gap-1.5'
              : 'grid-cols-2 gap-2'
          }`}
        >
          {players.map((p, idx) => {
            const badge = ROLE_BADGE_STYLE[p.role]
            const avatar = getAvatarByIndex(idx)
            const avatarSize = singleColumnRoster ? 46 : denseRoster ? 32 : 40
            const earnedPoints = wasAborted ? 0 : getPointsForRole(p.role, outcome)

            return (
              <div
                key={p.id}
                className={`flex items-center gap-2 rounded-xl min-w-0 ${
                  denseRoster ? 'px-2 py-1.5' : 'px-2.5 py-2'
                }`}
                style={{
                  backgroundColor: p.isAlive ? '#FAF4E8' : '#F4EFE4',
                  border: '1.5px solid rgba(35, 28, 53, 0.14)',
                  opacity: p.isAlive ? 1 : 0.85,
                }}
              >
                <AvatarPortrait avatar={avatar} size={avatarSize} dimmed={!p.isAlive} />

                <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                  <p
                    className={`font-extrabold truncate leading-tight ${
                      denseRoster ? 'text-[0.74rem]' : 'text-[0.82rem]'
                    }`}
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: p.isAlive ? INK : '#5B5270',
                      textDecoration: p.isAlive ? 'none' : 'line-through',
                    }}
                  >
                    {p.name}
                  </p>

                  <div className="flex items-center gap-1 shrink-0">
                    {earnedPoints > 0 && (
                      <span
                        className="px-1.5 py-0.5 rounded-md text-[0.6rem] font-black"
                        style={{
                          fontFamily: 'var(--font-display)',
                          backgroundColor: '#FEF3C7',
                          color: '#92400E',
                          border: '1px solid rgba(217, 119, 6, 0.45)',
                        }}
                      >
                        +{earnedPoints}đ
                      </span>
                    )}
                    <span
                      className={`shrink-0 font-extrabold rounded-md ${
                        denseRoster ? 'text-[0.6rem] px-1.5 py-0.5' : 'text-[0.66rem] px-2 py-0.5'
                      }`}
                      style={{
                        fontFamily: 'var(--font-display)',
                        backgroundColor: badge.bg,
                        color: badge.color,
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. Bottom Actions: Đổi cài đặt + Chơi lại */}
      <div className="flex gap-2.5 shrink-0">
        <button
          type="button"
          onClick={handleChangeSettings}
          className="btn-party-secondary px-4 py-3.5 text-[0.88rem] inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
        >
          <SlidersHorizontal size={18} weight="bold" />
          <span>Đổi cài đặt</span>
        </button>

        <button
          type="button"
          onClick={handlePlayAgain}
          className="btn-party-primary flex-1 py-3.5 px-5 text-[0.96rem] inline-flex items-center justify-center gap-2 cursor-pointer"
        >
          <ArrowCounterClockwise size={19} weight="bold" />
          <span>Chơi lại</span>
        </button>
      </div>

      <AnimatePresence>
        {showDataHub && (
          <DataHubModal initialTab="scores" onClose={() => setShowDataHub(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}
