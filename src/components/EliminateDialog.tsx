import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import {
  playEliminateSound,
  playVictorySound,
  playClickSound,
  playStampSound,
  playFlipSound,
  playPeekHoldSound,
  triggerHaptic,
} from '../utils/sound'
import { useGameStore, type Player, type Role } from '../stores/gameStore'
import { getAvatarByIndex } from '../data/avatars'
import {
  AvatarPortrait,
  RoleEmblem,
  firePartyConfetti,
} from './PartyVisuals'

const INK = '#231C35'

interface Props {
  player: Player
  speakingOrderIndex?: number
  onConfirm: () => void
  onCancel: () => void
}

export function EliminateDialog({ player, speakingOrderIndex, onConfirm, onCancel }: Props) {
  const players = useGameStore(s => s.players)
  const idx = players.findIndex(p => p.id === player.id)
  const avatar = getAvatarByIndex(idx >= 0 ? idx : 0)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playClickSound()
        onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(35, 28, 53, 0.68)' }}
        onClick={() => {
          playClickSound()
          onCancel()
        }}
      />

      <motion.div
        className="party-card relative w-full max-w-sm p-5 space-y-4 z-10 text-center"
        style={{ backgroundColor: '#FFFDF7' }}
        initial={{ scale: 0.9, opacity: 0, y: 14 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 23, stiffness: 330 }}
      >
        <div className="flex flex-col items-center gap-2">
          <AvatarPortrait avatar={avatar} size={76} />
          {speakingOrderIndex !== undefined && (
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-extrabold"
              style={{
                fontFamily: 'var(--font-display)',
                backgroundColor: '#F2E9D8',
                color: INK,
                border: `1.5px solid ${INK}`,
              }}
            >
              Lượt nói #{speakingOrderIndex}
            </span>
          )}
        </div>

        <div className="space-y-1.5">
          <h3
            className="text-xl font-black leading-snug"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            Cả bàn chốt loại{' '}
            <span style={{ color: '#E11D48' }}>{player.name}</span>?
          </h3>
          <p className="text-xs leading-relaxed" style={{ color: '#5B5270' }}>
            Lá bài vai trò của người này sẽ được lật mở ngay sau khi chốt phiếu.
          </p>
        </div>

        <div className="flex gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => {
              playClickSound()
              onCancel()
            }}
            className="btn-party-secondary flex-1 py-3 text-sm cursor-pointer"
          >
            Huỷ
          </button>

          <button
            type="button"
            onClick={() => {
              playClickSound(0.88)
              triggerHaptic(35)
              onConfirm()
            }}
            className="btn-party-danger flex-1 py-3 text-sm cursor-pointer"
          >
            Chốt loại
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

interface RevealProps {
  player: Player
  playerIndex: number
  isGameOver: boolean
  aliveCount: number
  onContinue: () => void
}

const ROLE_REVEAL_THEME: Record<
  Role,
  {
    headline: string
    factionLabel: string
    desc: string
    color: string
    stampBg: string
    border: string
  }
> = {
  civilian: {
    headline: 'Là Dân thường!',
    factionLabel: 'Phe Dân Thường',
    desc: 'Cả hội vừa loại nhầm một người bên phe Dân thường rồi.',
    color: '#0F766E',
    stampBg: '#E6FAF6',
    border: '#0D9488',
  },
  spy: {
    headline: 'Bắt trúng Gián điệp!',
    factionLabel: 'Phe Gián Điệp',
    desc: 'Chuẩn xác! Kẻ trà trộn đã bị lộ diện.',
    color: '#BE123C',
    stampBg: '#FFE8EC',
    border: '#E11D48',
  },
  'white-hat': {
    headline: 'Trúng ngay Mũ Trắng!',
    factionLabel: 'Phe Mũ Trắng',
    desc: 'Người chơi không có từ khoá vừa lộ diện.',
    color: '#6D28D9',
    stampBg: '#F3E8FF',
    border: '#7C3AED',
  },
}

export function RoleRevealDialog({
  player,
  playerIndex,
  isGameOver,
  aliveCount,
  onContinue,
}: RevealProps) {
  const role = ROLE_REVEAL_THEME[player.role]
  const avatar = getAvatarByIndex(playerIndex >= 0 ? playerIndex : 0)
  const isWhiteHat = player.role === 'white-hat'
  const whiteHatGuess = useGameStore(s => s.whiteHatGuess)

  const [guessInput, setGuessInput] = useState('')
  const [guessResult, setGuessResult] = useState<'idle' | 'correct' | 'wrong' | 'skipped'>('idle')
  const autoNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasNavigatedRef = useRef(false)
  const onContinueRef = useRef(onContinue)

  useEffect(() => {
    onContinueRef.current = onContinue
  }, [onContinue])

  const triggerContinue = () => {
    if (hasNavigatedRef.current) return
    hasNavigatedRef.current = true
    if (autoNavTimerRef.current) {
      clearTimeout(autoNavTimerRef.current)
      autoNavTimerRef.current = null
    }
    onContinueRef.current()
  }

  useEffect(() => {
    return () => {
      if (autoNavTimerRef.current) {
        clearTimeout(autoNavTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    playFlipSound()

    timers.push(
      setTimeout(() => {
        playStampSound()
        triggerHaptic([35, 30])
      }, 180)
    )

    timers.push(
      setTimeout(() => {
        if (player.role === 'spy') {
          playVictorySound('civilian')
        } else if (player.role === 'civilian') {
          playEliminateSound()
        } else {
          playPeekHoldSound()
        }
      }, 260)
    )

    return () => {
      for (const t of timers) clearTimeout(t)
    }
  }, [player.role])

  const handleGuessSubmit = () => {
    if (!guessInput.trim()) return
    playClickSound()
    const success = whiteHatGuess(guessInput)
    if (success) {
      playVictorySound('white-hat')
      triggerHaptic([35, 45, 55])
      firePartyConfetti('white-hat')
      setGuessResult('correct')
      autoNavTimerRef.current = setTimeout(() => {
        triggerContinue()
      }, 1350)
    } else {
      playEliminateSound()
      triggerHaptic([40, 30])
      setGuessResult('wrong')
    }
  }

  const handleSkipGuess = () => {
    playClickSound(0.92)
    triggerHaptic(15)
    setGuessResult('skipped')
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 select-none"
      style={{ perspective: 1100 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(35, 28, 53, 0.74)' }}
      />

      <motion.div
        className="party-card relative w-full max-w-sm p-5 space-y-4 z-10 text-center"
        style={{ backgroundColor: '#FFFDF7', transformStyle: 'preserve-3d' }}
        initial={{ rotateY: -86, scale: 0.88, opacity: 0, y: 14 }}
        animate={{ rotateY: 0, scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 10 }}
        transition={{ type: 'spring', damping: 21, stiffness: 270 }}
      >
        <div className="flex flex-col items-center gap-1.5">
          <AvatarPortrait avatar={avatar} size={74} />
          <h3
            className="text-xl font-black mt-1"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            {player.name}
          </h3>
          <span
            className="px-3 py-0.5 rounded-full text-xs font-extrabold"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: role.stampBg,
              color: role.color,
              border: `1.5px solid ${role.border}`,
            }}
          >
            {role.factionLabel}
          </span>
        </div>

        {/* Verdict Stamp */}
        <motion.div
          initial={{ scale: 1.25, rotate: -5, opacity: 0 }}
          animate={{ scale: 1, rotate: -1, opacity: 1 }}
          transition={{ type: 'spring', damping: 16, stiffness: 360, delay: 0.16 }}
          className="rounded-2xl p-3.5 space-y-1 text-center"
          style={{
            backgroundColor: role.stampBg,
            border: `2px solid ${role.border}`,
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <RoleEmblem role={player.role} size={34} />
            <p
              className="text-lg font-black leading-snug"
              style={{ fontFamily: 'var(--font-display)', color: role.color }}
            >
              {role.headline}
            </p>
          </div>
          <p className="text-xs font-medium leading-relaxed" style={{ color: INK }}>
            {role.desc}
          </p>
        </motion.div>

        {/* White-Hat Comeback Input */}
        {isWhiteHat && guessResult === 'idle' && (
          <div
            className="rounded-2xl p-3.5 text-center space-y-2.5"
            style={{
              backgroundColor: '#FAF5FF',
              border: `2px solid ${INK}`,
            }}
          >
            <div className="space-y-0.5">
              <p
                className="text-sm font-black"
                style={{ fontFamily: 'var(--font-display)', color: '#6D28D9' }}
              >
                Cơ hội lật kèo của Mũ Trắng
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#5B5270' }}>
                Đoán đúng từ khoá của Dân Thường sẽ thắng ngay lập tức!
              </p>
            </div>

            <input
              type="text"
              value={guessInput}
              onChange={e => setGuessInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleGuessSubmit()
              }}
              placeholder="Nhập từ của Dân Thường..."
              autoFocus
              autoComplete="off"
              className="w-full px-3.5 py-2.5 rounded-xl text-center text-sm font-bold outline-none select-text"
              style={{
                fontFamily: 'var(--font-sans)',
                backgroundColor: '#FFFFFF',
                color: INK,
                border: `2px solid ${INK}`,
                userSelect: 'text',
                WebkitUserSelect: 'text',
              }}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSkipGuess}
                className="btn-party-secondary flex-1 py-2.5 px-2 text-xs cursor-pointer"
              >
                Bỏ qua
              </button>

              <button
                type="button"
                onClick={handleGuessSubmit}
                disabled={!guessInput.trim()}
                className="btn-party-primary flex-1 py-2.5 px-2 text-xs cursor-pointer"
                style={{ backgroundColor: '#7C3AED' }}
              >
                Chốt đáp án
              </button>
            </div>
          </div>
        )}

        {/* White-Hat Correct Guess */}
        {isWhiteHat && guessResult === 'correct' && (
          <div
            className="rounded-2xl p-3.5 text-center space-y-2"
            style={{
              backgroundColor: '#FEF3C7',
              border: `2px solid ${INK}`,
            }}
          >
            <p
              className="text-sm font-black"
              style={{ fontFamily: 'var(--font-display)', color: '#6D28D9' }}
            >
              Đoán chuẩn xác — Lật kèo thành công!
            </p>
            <p className="text-xs font-semibold" style={{ color: INK }}>
              Từ của Dân Thường chính là <strong style={{ color: '#B45309' }}>"{guessInput.trim()}"</strong>.
            </p>
            <button
              type="button"
              onClick={triggerContinue}
              className="btn-party-primary w-full py-2.5 text-sm inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Xem bảng tổng kết</span>
              <ArrowRight size={16} weight="bold" />
            </button>
          </div>
        )}

        {/* White-Hat Wrong Guess */}
        {isWhiteHat && guessResult === 'wrong' && (
          <div
            className="rounded-2xl p-3 text-center space-y-1"
            style={{
              backgroundColor: '#FFE8EC',
              border: '1.5px solid #E11D48',
            }}
          >
            <p
              className="text-sm font-extrabold"
              style={{ fontFamily: 'var(--font-display)', color: '#E11D48' }}
            >
              Chưa đúng từ khoá rồi!
            </p>
            <p className="text-xs" style={{ color: '#5B5270' }}>
              Đáp án <strong>"{guessInput.trim()}"</strong> không khớp.
            </p>
          </div>
        )}

        {/* Footer Continue */}
        {(!isWhiteHat || guessResult === 'wrong' || guessResult === 'skipped') && (
          <div className="pt-0.5 space-y-2.5">
            <p className="text-xs font-semibold" style={{ color: '#5B5270' }}>
              {isGameOver
                ? 'Ván chơi đã phân định thắng thua!'
                : `Còn ${aliveCount} người chơi — tiếp tục thảo luận nhé.`}
            </p>

            <button
              type="button"
              onClick={() => {
                playClickSound()
                triggerHaptic(20)
                triggerContinue()
              }}
              className="btn-party-primary w-full py-3 text-sm inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isGameOver ? 'Xem kết quả chung cuộc' : 'Tiếp tục ván chơi'}</span>
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
