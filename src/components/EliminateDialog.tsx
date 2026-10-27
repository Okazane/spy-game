import { useState, useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { Skull, Eye, ArrowRight, Trophy, Target, XCircle, CheckCircle } from '@phosphor-icons/react'
import { playEliminateSound, playVictorySound, playClickSound, playStampSound, triggerHaptic } from '../utils/sound'
import { useGameStore, type Player, type Role } from '../stores/gameStore'
import { getAvatarByIndex } from '../data/avatars'
import { Tilted } from './Tilted'

interface Props {
  player: Player
  speakingOrderIndex?: number
  onConfirm: () => void
  onCancel: () => void
}

export function EliminateDialog({ player, speakingOrderIndex, onConfirm, onCancel }: Props) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/75 backdrop-blur-xs" onClick={onCancel} />

      <motion.div
        className="relative w-full max-w-sm bg-[#fcfaf3] rounded-[3px] p-6 shadow-[6px_6px_0_#18120c] border-[1.5px] border-[#18120c] z-10 space-y-4"
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="text-center space-y-1">
          <Tilted deg={-4} className="inline-block mx-auto mb-2">
            <div className="w-12 h-12 rounded-[2px] mx-auto flex items-center justify-center bg-[#b91c1c] text-white text-2xl shadow-[2px_2px_0_#18120c] border border-[#18120c]">
              <Skull size={28} weight="fill" />
            </div>
          </Tilted>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink-primary)' }}>
            BIỂU QUYẾT LOẠI BỎ
          </h3>
          <p className="text-xs text-[var(--ink-muted)] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
            Nếu đại đa số đồng thuận người này là Gián Điệp, hãy đóng dấu trục xuất.
          </p>
        </div>

        <div className="p-3.5 rounded-[2px] bg-[#f4ede0] border-[1.5px] border-[#18120c] flex items-center justify-between shadow-[2px_2px_0_#18120c]">
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.15rem', color: 'var(--ink-primary)' }}>
            {player.name}
          </span>
          {speakingOrderIndex !== undefined && (
            <span
              className="text-xs font-bold px-2.5 py-1 rounded-[2px] bg-[#fdfcf8] border border-[#18120c] text-[#181410] shadow-[1px_1px_0_#18120c]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Lượt nói: #{speakingOrderIndex}
            </span>
          )}
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-3.5 rounded-[2px] font-bold text-xs text-[#181410] bg-[#f4ede0] hover:bg-[#ebd9c2] border-[1.5px] border-[#18120c] cursor-pointer shadow-[2px_2px_0_#18120c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            GIỮ LẠI
          </button>
          <button
            onClick={() => {
              playStampSound()
              playEliminateSound()
              triggerHaptic(50)
              onConfirm()
            }}
            className="btn-stamp-red flex-1 py-3.5 text-xs font-black"
          >
            LOẠI NGAY ✕
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

const ROLE_INFO: Record<Role, { label: string; color: string; bg: string; border: string; emoji: string; desc: string }> = {
  civilian: {
    label: 'DÂN THƯỜNG',
    color: '#1d4ed8',
    bg: '#eff6ff',
    border: '#1d4ed8',
    emoji: '🛡️',
    desc: 'Một Dân Thường vô tội đã bị loại khỏi ván đấu!',
  },
  spy: {
    label: 'GIÁN ĐIỆP',
    color: '#b91c1c',
    bg: '#fef2f2',
    border: '#b91c1c',
    emoji: '🕶️',
    desc: 'Chính xác! Một Gián Điệp đã bị lật tẩy thành công!',
  },
  'white-hat': {
    label: 'MŨ TRẮNG',
    color: '#6d28d9',
    bg: '#f5f3ff',
    border: '#6d28d9',
    emoji: '👻',
    desc: 'Kẻ bí ẩn không mang từ khoá đã bị vạch trần!',
  },
}

export function RoleRevealDialog({ player, playerIndex, isGameOver, aliveCount, onContinue }: RevealProps) {
  const role = ROLE_INFO[player.role]
  const avatar = getAvatarByIndex(playerIndex)
  const isWhiteHat = player.role === 'white-hat'
  const { whiteHatGuess } = useGameStore()

  const [guessInput, setGuessInput] = useState('')
  const [guessResult, setGuessResult] = useState<'idle' | 'correct' | 'wrong' | 'skipped'>('idle')
  const autoNavTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasNavigatedRef = useRef(false)

  const triggerContinue = () => {
    if (hasNavigatedRef.current) return
    hasNavigatedRef.current = true
    if (autoNavTimerRef.current) {
      clearTimeout(autoNavTimerRef.current)
      autoNavTimerRef.current = null
    }
    onContinue()
  }

  useEffect(() => {
    return () => {
      if (autoNavTimerRef.current) {
        clearTimeout(autoNavTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    playStampSound()
    if (player.role === 'spy' || isGameOver) {
      playVictorySound()
      triggerHaptic(50)
    }
  }, [player.role, isGameOver])

  const handleGuessSubmit = () => {
    if (!guessInput.trim()) return
    playClickSound()
    triggerHaptic(30)
    const success = whiteHatGuess(guessInput)
    if (success) {
      playVictorySound()
      triggerHaptic(60)
      setGuessResult('correct')
      // Tự động chuyển qua trang chiến thắng sau 1.2s
      autoNavTimerRef.current = setTimeout(() => {
        triggerContinue()
      }, 1200)
    } else {
      playStampSound()
      triggerHaptic(40)
      setGuessResult('wrong')
    }
  }

  const handleSkipGuess = () => {
    playClickSound()
    triggerHaptic(15)
    setGuessResult('skipped')
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" />

      <motion.div
        className="relative w-full max-w-sm bg-[#fcfaf3] rounded-[3px] p-6 shadow-[6px_6px_0_#18120c] border-[1.5px] border-[#18120c] z-10 space-y-3.5 text-center"
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      >
        {/* Header Tag */}
        <Tilted deg={-3} className="inline-block mx-auto">
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#18120c] text-[#fcfaf3] text-[0.72rem] font-black uppercase tracking-wider border border-[#4a3622] shadow-[2px_2px_0_#c8a165]"
            style={{ fontFamily: 'var(--font-stamp)' }}
          >
            <Eye size={13} weight="bold" className="text-[#c8a165]" />
            <span>BẬT MÍ CHỨC NĂNG</span>
          </div>
        </Tilted>

        {/* Player Info */}
        <div className="flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-[3px] flex items-center justify-center text-2xl shadow-[2px_2px_0_#18120c] border-[1.5px] border-[#18120c] mb-1.5"
            style={{ backgroundColor: avatar.bg }}
          >
            {avatar.emoji}
          </div>
          <h3
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 900, color: 'var(--ink-primary)' }}
          >
            {player.name}
          </h3>
          <p className="text-xs text-[var(--ink-muted)] font-semibold mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
            Đã bị biểu quyết loại
          </p>
        </div>

        {/* Role Reveal Card */}
        <div
          className="p-3.5 rounded-[2px] border-[2px] flex flex-col items-center text-center shadow-[3px_3px_0_#18120c]"
          style={{ backgroundColor: role.bg, borderColor: role.border }}
        >
          <span className="text-3xl mb-0.5">{role.emoji}</span>
          <span
            className="text-lg font-black tracking-wider"
            style={{ color: role.color, fontFamily: 'var(--font-stamp)' }}
          >
            {role.label}
          </span>
          <p className="text-[0.75rem] font-bold mt-1 leading-snug" style={{ color: role.color, fontFamily: 'var(--font-body)' }}>
            {role.desc}
          </p>
        </div>

        {/* ── NẾU LÀ MŨ TRẮNG: CƠ HỘI ĐOÁN TỪ LẬT KÈO ── */}
        {isWhiteHat && guessResult === 'idle' && (
          <div className="p-3.5 bg-[#f5f0ff] rounded-[3px] border-[1.5px] border-[#6d28d9] text-center shadow-[3px_3px_0_#18120c] space-y-2.5">
            <div className="flex items-center justify-center gap-1.5 text-[#6d28d9]">
              <Target size={18} weight="bold" />
              <span className="text-xs font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-stamp)' }}>
                CƠ HỘI ĐOÁN TỪ LẬT KÈO!
              </span>
            </div>
            <p className="text-[0.72rem] text-[#4c1d95] font-semibold leading-relaxed">
              Mũ Trắng có <strong>1 cơ hội duy nhất</strong> đoán từ khoá của phe Dân. Đoán đúng sẽ <strong>thắng ngay lập tức!</strong>
            </p>
            <div className="relative">
              <input
                type="text"
                value={guessInput}
                onChange={e => setGuessInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleGuessSubmit()
                }}
                placeholder="Nhập từ khoá phe Dân..."
                className="w-full px-3 py-2 text-center text-sm font-black bg-[#ffffff] border-[1.5px] border-[#6d28d9] rounded-[2px] text-[#181410] outline-none shadow-inner"
                style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                autoFocus
              />
            </div>
            <div className="flex gap-2 pt-0.5">
              <button
                onClick={handleSkipGuess}
                className="flex-1 py-2 rounded-[2px] text-xs font-bold text-[#675543] bg-[#f4ede0] border border-[#18120c] hover:bg-[#ede5d5] cursor-pointer shadow-[1px_1px_0_#18120c] active:translate-x-[1px] active:translate-y-[1px]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                BỎ QUA LƯỢT
              </button>
              <button
                onClick={handleGuessSubmit}
                disabled={!guessInput.trim()}
                className="flex-1 py-2 rounded-[2px] text-xs font-black text-white bg-[#6d28d9] hover:bg-[#5b21b6] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-[2px_2px_0_#18120c] active:translate-x-[1px] active:translate-y-[1px]"
                style={{ fontFamily: 'var(--font-stamp)' }}
              >
                XÁC NHẬN ĐOÁN 🎯
              </button>
            </div>
          </div>
        )}

        {/* ── KẾT QUẢ ĐOÁN ĐÚNG (MŨ TRẮNG THẮNG NGAY) ── */}
        {isWhiteHat && guessResult === 'correct' && (
          <div className="p-3.5 bg-[#f5f3ff] rounded-[3px] border-[2px] border-[#6d28d9] text-center shadow-[4px_4px_0_#18120c] space-y-2 animate-bounce">
            <div className="flex items-center justify-center gap-1.5 text-[#6d28d9]">
              <CheckCircle size={22} weight="fill" />
              <span className="text-sm font-black uppercase tracking-wider" style={{ fontFamily: 'var(--font-stamp)' }}>
                CHÍNH XÁC! LẬT KÈO NGOẠN MỤC!
              </span>
            </div>
            <p className="text-xs font-extrabold text-[#4c1d95]">
              Mũ Trắng đã đoán đúng từ khoá của Phe Dân: "<strong>{guessInput.trim()}</strong>"!
            </p>
            <p className="text-[0.68rem] text-[#6d28d9] font-black animate-pulse">
              👑 Đang tự động chuyển đến màn vinh danh...
            </p>
            <button
              onClick={triggerContinue}
              className="btn-kraft-stamp w-full py-3 text-xs font-black flex items-center justify-center gap-2 cursor-pointer shadow-[3px_3px_0_#18120c] mt-1"
            >
              <Trophy size={16} weight="bold" />
              CHUYỂN NGAY ➔
            </button>
          </div>
        )}

        {/* ── KẾT QUẢ ĐOÁN SAI ── */}
        {isWhiteHat && guessResult === 'wrong' && (
          <div className="p-3 bg-[#fef2f2] rounded-[3px] border-[1.5px] border-[#b91c1c] text-center shadow-[2px_2px_0_#18120c] space-y-1">
            <div className="flex items-center justify-center gap-1 text-[#b91c1c]">
              <XCircle size={16} weight="bold" />
              <span className="text-xs font-black uppercase" style={{ fontFamily: 'var(--font-stamp)' }}>
                ĐOÁN CHƯA CHÍNH XÁC!
              </span>
            </div>
            <p className="text-xs text-[#7f1d1d] font-semibold">
              Mũ Trắng đoán "{guessInput.trim()}" không đúng. Mũ Trắng chính thức bị loại!
            </p>
          </div>
        )}

        {/* ── FOOTER: CHỈ HIỆN KHI KHÔNG PHẢI MŨ TRẮNG ĐANG ĐOÁN, HOẶC ĐÃ ĐOÁN SAI / BỎ QUA ── */}
        {(!isWhiteHat || guessResult === 'wrong' || guessResult === 'skipped') && (
          <div className="pt-2 space-y-3">
            {isGameOver ? (
              <p
                className="text-xs font-black text-[#8c6530] bg-[#fdf8e8] py-2 px-3 rounded-[2px] border border-[#c8a165] shadow-[2px_2px_0_#18120c]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                🏆 VÁN ĐẤU ĐÃ NGÃ NGŨ!
              </p>
            ) : (
              <p className="text-xs font-bold text-[var(--ink-muted)]" style={{ fontFamily: 'var(--font-body)' }}>
                Còn lại <span className="font-black text-[#181410]">{aliveCount} người</span> tiếp tục ván đấu
              </p>
            )}

            <button
              onClick={() => {
                playClickSound()
                triggerHaptic(20)
                triggerContinue()
              }}
              className="btn-kraft-stamp w-full py-3.5 text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0_#18120c]"
            >
              {isGameOver ? (
                <>
                  <Trophy size={18} weight="bold" />
                  <span>XEM KẾT QUẢ VÁN ĐẤU ➔</span>
                </>
              ) : (
                <>
                  <span>TIẾP TỤC VÁN CHƠI</span>
                  <ArrowRight size={18} weight="bold" />
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}
