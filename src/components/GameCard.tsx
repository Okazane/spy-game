import { motion } from 'motion/react'
import { playFlipSound, triggerHaptic } from '../utils/sound'
import { getAvatarByIndex } from '../data/avatars'

interface Props {
  index: number
  claimed: boolean
  playerName: string
  isSelected: boolean
  isOtherLocked: boolean
  onClick: () => void
}

export function GameCard({
  index,
  claimed,
  playerName,
  isSelected,
  isOtherLocked,
  onClick,
}: Props) {
  const avatar = getAvatarByIndex(index)
  const initials = playerName ? playerName.slice(0, 2).toUpperCase() : null
  const isDisabled = claimed || isOtherLocked

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{
        opacity: isOtherLocked ? 0.35 : 1,
        scale: isSelected ? 1.05 : 1,
        y: isSelected ? -4 : 0,
      }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.3) }}
      onClick={() => {
        if (!isDisabled) {
          playFlipSound()
          triggerHaptic(25)
          onClick()
        }
      }}
      disabled={isDisabled}
      className="relative flex flex-col items-center justify-between p-2 sm:p-2.5 transition-all select-none overflow-hidden"
      style={{
        aspectRatio: '3/4',
        borderRadius: 3,
        background: claimed
          ? 'linear-gradient(180deg, #2e2318 0%, #1c150e 100%)'
          : isSelected
          ? 'linear-gradient(180deg, #573f2b 0%, #362619 100%)'
          : 'linear-gradient(180deg, #3d2d1e 0%, #241a11 100%)',
        border: isSelected
          ? '2px solid #e0ba72'
          : claimed
          ? '1.5px solid rgba(217, 168, 97, 0.45)'
          : '1.5px solid rgba(217, 168, 97, 0.4)',
        boxShadow: isSelected
          ? '4px 4px 0 #18120c, 0 0 16px rgba(224, 186, 114, 0.45)'
          : '3px 3px 0 #18120c',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
      }}
    >
      {/* Subtle diagonal micro-stripes pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: 'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 0, transparent 10px)',
        }}
      />

      {/* ── Top Bar Header of Card: Number Pill & Metallic Gold Slit ── */}
      <div className="w-full flex items-center justify-between relative z-10">
        {/* Số thứ tự lá bài trong ô kính mờ bo góc */}
        <div
          className="w-5 h-5 rounded-md bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white font-black text-[0.65rem] shadow-xs"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {index + 1}
        </div>

        {/* Thanh ánh kim vàng óng trên đầu bài */}
        <div className="w-7 h-1 rounded-full bg-gradient-to-r from-amber-200/40 via-amber-300 to-amber-200/40 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />

        <div className="w-5" /> {/* Balance spacer */}
      </div>

      {/* ── Nội dung trung tâm ── */}
      {claimed ? (
        /* Thẻ đã được nhận */
        <div className="flex flex-col items-center justify-center w-full h-full relative z-10 py-1">
          <div
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-black text-white text-sm sm:text-base shadow-lg mb-1 border border-white/20"
            style={{ backgroundColor: avatar.bg }}
          >
            {initials}
          </div>
          <span className="text-[0.58rem] font-black text-amber-300 tracking-wider uppercase mb-0.5">CỦA</span>
          <p
            className="text-[0.75rem] sm:text-[0.8rem] font-black text-white text-center break-words leading-tight px-0.5 truncate max-w-full"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {playerName}
          </p>
        </div>
      ) : (
        /* Thẻ úp chưa nhận — Biểu tượng Đồng Xu Mặt Trăng & Sói Hú (Chuẩn 100% ảnh mẫu) */
        <div className="flex-1 flex flex-col items-center justify-center relative z-10 w-full py-0.5">
          <div className="relative w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center">
            {/* Vầng hào quang vàng tỏa sáng */}
            <div
              className={`absolute inset-0 rounded-full blur-md transition-opacity duration-300 ${
                isSelected ? 'bg-amber-400/45 opacity-100' : 'bg-amber-400/25 opacity-70'
              }`}
            />

            {/* Đồng xu vàng óng ánh */}
            <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-gradient-to-b from-[#fef08a] via-[#facc15] to-[#ca8a04] p-0.5 shadow-md flex items-center justify-center border border-amber-200/70">
              <svg viewBox="0 0 100 100" className="w-7 h-7 sm:w-9 sm:h-9 text-slate-900" fill="currentColor">
                {/* Trăng lưỡi liềm mờ ảo */}
                <path d="M42,22 A22,22 0 1,0 68,52 A25,25 0 0,1 42,22" fill="rgba(254, 240, 138, 0.7)" />

                {/* Vách núi mỏm đá */}
                <polygon points="12,88 38,58 55,72 70,52 88,88" fill="#1e293b" opacity="0.9" />

                {/* Sói hú ngước đầu ngắm trăng */}
                <path
                  d="M58,52 C56,48 57,43 59,38 C60,35 63,33 65,31 C64,34 65,36 67,37 C69,38 72,36 71,40 C70,43 67,46 66,49 C68,51 70,54 72,58 C69,57 66,57 64,59 C62,60 61,63 59,65 C58,63 57,59 58,56 Z"
                  fill="#0f172a"
                />

                {/* Những ngôi sao lấp lánh xung quanh */}
                <circle cx="28" cy="35" r="2.5" fill="#ca8a04" />
                <circle cx="78" cy="30" r="2" fill="#ca8a04" />
                <circle cx="22" cy="55" r="1.8" fill="#ca8a04" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Bottom subtle accent */}
      <div className="w-full flex justify-center items-center relative z-10 pb-0.5">
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </div>

      {isSelected && (
        <div className="absolute inset-0 rounded-[20px] border border-amber-300/40 pointer-events-none" />
      )}
    </motion.button>
  )
}
