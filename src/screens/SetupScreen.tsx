import { useState } from 'react'
import { motion } from 'motion/react'
import { Tag, Check, CaretRight } from '@phosphor-icons/react'
import { useGameStore, calcCivilian } from '../stores/gameStore'
import { playClickSound, triggerHaptic } from '../utils/sound'
import { getAvatarByIndex } from '../data/avatars'
import { RulesModal } from '../components/RulesModal'

const DIFFICULTY_MAP = {
  easy: 'Dễ',
  medium: 'Trung bình',
  hard: 'Khó',
} as const

export function SetupScreen() {
  const { settings, setSettings, startGame } = useGameStore()
  const { totalPlayers, spyCount, whiteHatCount, difficulty } = settings
  const civilianCount = calcCivilian(settings)

  const [showRules, setShowRules] = useState(false)
  const [showWordPackModal, setShowWordPackModal] = useState(false)

  const maxSpy = Math.max(1, Math.floor((totalPlayers - whiteHatCount - 1) / 2))
  const maxWhite = Math.max(0, totalPlayers - 2 * spyCount - 1)

  const incSpy = () => {
    if (spyCount < maxSpy) {
      playClickSound()
      triggerHaptic(15)
      setSettings({ spyCount: spyCount + 1 })
    }
  }
  const decSpy = () => {
    if (spyCount > 1) {
      playClickSound()
      triggerHaptic(15)
      setSettings({ spyCount: spyCount - 1 })
    }
  }

  const incWhite = () => {
    if (whiteHatCount < maxWhite) {
      playClickSound()
      triggerHaptic(15)
      setSettings({ whiteHatCount: whiteHatCount + 1 })
    }
  }
  const decWhite = () => {
    if (whiteHatCount > 0) {
      playClickSound()
      triggerHaptic(15)
      setSettings({ whiteHatCount: whiteHatCount - 1 })
    }
  }

  const handleSlider = (val: number) => {
    playClickSound()
    triggerHaptic(10)
    setSettings({ totalPlayers: val })
  }

  const handleStart = () => {
    playClickSound()
    triggerHaptic(30)
    startGame()
  }

  // Ratio: 0..1
  const sliderRatio = (totalPlayers - 3) / (15 - 3)
  const currentAvatar = getAvatarByIndex(totalPlayers)

  return (
    <>
      <div className="w-full flex-1 min-h-dvh flex flex-col justify-between p-3 sm:p-4 pb-4 max-w-[440px] mx-auto select-none box-border overflow-x-hidden">
        {/* ── Khu Vực Trung Tâm ── */}
        <div className="w-full flex-1 flex flex-col justify-center gap-2 sm:gap-2.5 my-auto py-1">
          {/* Tiêu đề Số lượng */}
          <div className="text-center pt-1 pb-0.5">
            <span
              className="text-[0.64rem] font-bold uppercase tracking-wider text-[var(--ink-muted)]"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              HỒ SƠ THIẾT LẬP VÁN ĐẤU
            </span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(1.5rem, 5.5vw, 1.85rem)',
                fontWeight: 900,
                color: 'var(--ink-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
                marginTop: 1,
              }}
            >
              Số lượng: {totalPlayers} người
            </h2>
          </div>

          {/* Slider chuẩn thước đo cơ học */}
          <div className="w-full relative py-3.5 px-3 my-0.5 flex items-center">
            {/* Thanh slider */}
            <div className="h-2.5 w-full rounded-[2px] overflow-hidden flex bg-[#1e150c] border border-[#4a3622]">
              <div
                className="h-full bg-[#c8a165] transition-all duration-75"
                style={{ width: `${sliderRatio * 100}%` }}
              />
              <div className="h-full bg-[#1e150c] flex-1" />
            </div>

            {/* Input range tương tác */}
            <input
              type="range"
              min={3}
              max={15}
              step={1}
              value={totalPlayers}
              aria-label="Số lượng người chơi"
              onChange={e => handleSlider(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
            />

            {/* Avatar đầu kéo thước đo */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none z-10 transition-all duration-75"
              style={{ left: `calc(16px + (100% - 32px) * ${sliderRatio})` }}
            >
              <motion.div
                key={currentAvatar.id}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-base shadow-[2px_2px_0_#18120c] border-2 border-[#18120c]"
                style={{ backgroundColor: currentAvatar.bg }}
              >
                <span>{currentAvatar.emoji}</span>
              </motion.div>
            </div>
          </div>

          {/* ── BẢNG PHÂN BỔ VAI TRÒ (THIẾT KẾ THỦ CÔNG TACTILE) ── */}
          <div className="w-full game-card-tactile p-2.5 flex flex-col gap-2">
            {/* Hàng 1: Dân Thường */}
            <div className="flex items-center justify-between p-2 px-2.5 bg-[#fefdfa] border-[1.5px] border-[#382b1d]/25 rounded-[2px]">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-7 h-7 rounded-[2px] bg-[#1d4ed8] text-white flex items-center justify-center text-sm shadow-xs flex-shrink-0 border border-[#1e3a8a]">
                  🛡️
                </div>
                <div className="min-w-0 truncate">
                  <p className="font-extrabold text-[var(--ink-primary)] text-xs leading-tight truncate" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                    Dân Thường
                  </p>
                  <p className="text-[0.62rem] text-[var(--ink-muted)] font-semibold truncate mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                    Biết từ chung của phe dân
                  </p>
                </div>
              </div>
              <div
                className="h-7 px-3 rounded-[2px] bg-[#eff6ff] border-[1.5px] border-[#2563eb] shadow-[2px_2px_0_#18120c] flex-shrink-0 whitespace-nowrap flex items-center justify-center gap-1.5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <span className="font-black text-sm text-[#1d4ed8] leading-none">
                  {civilianCount}
                </span>
                <span className="font-bold text-xs text-[#1e40af] leading-none">
                  người
                </span>
              </div>
            </div>

            {/* Hàng 2: Gián Điệp */}
            <div className="flex items-center justify-between p-2 px-2.5 bg-[#fefdfa] border-[1.5px] border-[#382b1d]/25 rounded-[2px]">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-7 h-7 rounded-[2px] bg-[#b91c1c] text-white flex items-center justify-center text-sm shadow-xs flex-shrink-0 border border-[#7f1d1d]">
                  🕶️
                </div>
                <div className="min-w-0 truncate">
                  <p className="font-extrabold text-[var(--ink-primary)] text-xs leading-tight truncate" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                    Gián Điệp
                  </p>
                  <p className="text-[0.62rem] text-[var(--ink-muted)] font-semibold truncate mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                    Kẻ trà trộn biết từ khác
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={decSpy}
                  disabled={spyCount <= 1}
                  aria-label="Giảm số gián điệp"
                  className="game-stepper-btn w-6 h-6 font-black text-xs flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-5 text-center font-black text-[var(--ink-primary)] text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                  {spyCount}
                </span>
                <button
                  onClick={incSpy}
                  disabled={spyCount >= maxSpy}
                  aria-label="Tăng số gián điệp"
                  className="game-stepper-btn w-6 h-6 font-black text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>

            {/* Hàng 3: Mũ Trắng */}
            <div className="flex items-center justify-between p-2 px-2.5 bg-[#fefdfa] border-[1.5px] border-[#382b1d]/25 rounded-[2px]">
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div className="w-7 h-7 rounded-[2px] bg-[#6d28d9] text-white flex items-center justify-center text-sm shadow-xs border border-[#4c1d95] flex-shrink-0">
                  👻
                </div>
                <div className="min-w-0 truncate">
                  <p className="font-extrabold text-[var(--ink-primary)] text-xs leading-tight truncate" style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}>
                    Mũ Trắng
                  </p>
                  <p className="text-[0.62rem] text-[var(--ink-muted)] font-semibold truncate mt-0.5" style={{ fontFamily: 'var(--font-body)' }}>
                    Không mang từ khoá nào
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={decWhite}
                  disabled={whiteHatCount <= 0}
                  aria-label="Giảm số mũ trắng"
                  className="game-stepper-btn w-6 h-6 font-black text-xs flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-5 text-center font-black text-[var(--ink-primary)] text-sm" style={{ fontFamily: 'var(--font-body)' }}>
                  {whiteHatCount}
                </span>
                <button
                  onClick={incWhite}
                  disabled={whiteHatCount >= maxWhite}
                  aria-label="Tăng số mũ trắng"
                  className="game-stepper-btn w-6 h-6 font-black text-xs flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* ── BẢNG CÀI ĐẶT BỔ SUNG (HỘP LIỀN MẠCH TACTILE CARD) ── */}
          <div className="w-full game-card-tactile overflow-hidden divide-y divide-[#382b1d]/30">
            {/* Gói từ khoá */}
            <button
              onClick={() => {
                playClickSound()
                setShowWordPackModal(true)
              }}
              className="w-full p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-black/5 active:bg-black/10 text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-[2px] bg-[#c8a165]/30 text-[#8c6530] flex items-center justify-center font-black flex-shrink-0 border border-[#8c6530]/40">
                  <Tag size={13} weight="fill" />
                </div>
                <div className="min-w-0 truncate">
                  <p style={{ fontSize: '0.6rem', color: 'var(--ink-muted)', fontWeight: 700, fontFamily: 'var(--font-body)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Gói từ khoá
                  </p>
                  <p style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--ink-primary)', fontFamily: 'var(--font-body)' }} className="truncate">
                    {DIFFICULTY_MAP[difficulty]}
                  </p>
                </div>
              </div>
              <CaretRight size={14} weight="bold" className="text-[#675543] flex-shrink-0 ml-2" />
            </button>

            {/* Chế độ Ẩn vai trò */}
            <button
              onClick={() => {
                playClickSound()
                triggerHaptic(15)
                setSettings({ hideRole: !settings.hideRole })
              }}
              className="w-full p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors hover:bg-black/5 active:bg-black/10 text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-lg flex-shrink-0">{settings.hideRole ? '🤫' : '👀'}</span>
                <div className="min-w-0 truncate">
                  <p style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--ink-primary)', fontFamily: 'var(--font-body)' }} className="truncate">
                    {settings.hideRole ? 'Ẩn vai trò (Chỉ biết từ khoá)' : 'Hiện rõ vai trò (Dân / Gián)'}
                  </p>
                  <p style={{ fontSize: '0.62rem', color: 'var(--ink-muted)', fontWeight: 600, fontFamily: 'var(--font-body)' }} className="truncate mt-0.5">
                    {settings.hideRole ? 'Không biết mình là Dân hay Gián' : 'Biết trước mình là Dân hay Gián'}
                  </p>
                </div>
              </div>
              <div
                className="w-8 h-4.5 rounded-full p-0.5 transition-colors flex-shrink-0 ml-2 border border-[#281e15]"
                style={{ backgroundColor: settings.hideRole ? '#c8a165' : '#d4c9b8' }}
              >
                <div
                  className="w-3.5 h-3.5 rounded-full bg-[#18120c] shadow-xs transition-transform"
                  style={{ transform: settings.hideRole ? 'translateX(13px)' : 'translateX(0)' }}
                />
              </div>
            </button>
          </div>
        </div>

        {/* ── Bottom Section: Nút Bắt Đầu ── */}
        <div className="w-full pt-2 pb-0.5">
          <button
            onClick={handleStart}
            className="btn-kraft-stamp w-full py-3.5 sm:py-4 text-base font-extrabold flex items-center justify-center cursor-pointer shadow-[4px_4px_0_#18120c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            style={{ touchAction: 'manipulation' }}
          >
            BẮT ĐẦU VÁN ➔
          </button>
        </div>
      </div>

      {/* Modal chọn gói từ */}
      {showWordPackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div
            className="absolute inset-0 bg-black/75 backdrop-blur-xs"
            onClick={() => setShowWordPackModal(false)}
          />
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            className="relative bg-[#fcfaf3] border-[1.5px] border-[#18120c] p-5 max-w-xs w-full flex flex-col gap-3.5 z-10 shadow-[5px_5px_0_#18120c] rounded-[3px]"
          >
            <div className="flex items-center justify-between pb-2.5 border-b border-[#281e15]/20">
              <div className="flex items-center gap-2">
                <Tag size={18} weight="fill" className="text-[#8c6530]" />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 900, color: 'var(--ink-primary)' }}>
                  Chọn gói từ khoá
                </h3>
              </div>
              <button
                onClick={() => setShowWordPackModal(false)}
                className="w-6 h-6 flex items-center justify-center font-black text-xs border border-[#18120c] bg-[#e6ded2] hover:bg-[#d8cebe] cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {(['easy', 'medium', 'hard'] as const).map(d => {
                const isSelected = difficulty === d
                return (
                  <button
                    key={d}
                    onClick={() => {
                      playClickSound()
                      triggerHaptic(15)
                      setSettings({ difficulty: d })
                      setShowWordPackModal(false)
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-[2px] border-[1.5px] transition-all cursor-pointer text-left active:translate-x-[1px] active:translate-y-[1px]"
                    style={{
                      backgroundColor: isSelected ? '#efe5d2' : '#fcfaf3',
                      borderColor: isSelected ? '#18120c' : '#c9bda8',
                      boxShadow: isSelected ? '3px 3px 0 #18120c' : '1px 1px 0 rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        color: isSelected ? '#18120c' : '#5a4935',
                      }}
                    >
                      {DIFFICULTY_MAP[d]}
                    </span>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-[#18120c] text-[#fcfaf3] flex items-center justify-center text-xs font-black shadow-xs">
                        <Check size={13} weight="bold" />
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* Rules Modal */}
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </>
  )
}
