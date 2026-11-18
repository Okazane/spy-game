import { memo } from 'react'
import { motion } from 'motion/react'
import { playFlipSound, triggerHaptic } from '../utils/sound'
import { getAvatarByIndex } from '../data/avatars'
import {
  AvatarPortrait,
  TAROT_COLORWAYS,
  TarotCardBack,
} from './PartyVisuals'

export interface Props {
  index: number
  claimed: boolean
  playerName: string
  isSelected: boolean
  isOtherLocked: boolean
  onClick: () => void
}

export const GameCard = memo(function GameCard({
  index,
  claimed,
  playerName,
  isSelected,
  isOtherLocked,
  onClick,
}: Props) {
  const avatar = getAvatarByIndex(index)
  const isDisabled = claimed || isOtherLocked
  const naturalTilt = ((index % 3) - 1) * 1.2
  const cardTilt = isSelected ? 0 : claimed ? naturalTilt * 0.4 : naturalTilt
  const colorway = TAROT_COLORWAYS[((index % 8) + 8) % 8]

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: -22, scale: 0.86, rotate: 0 }}
      animate={{
        opacity: isOtherLocked ? 0.42 : 1,
        scale: isSelected ? 1.04 : 1,
        y: isSelected ? -4 : 0,
        rotate: cardTilt,
      }}
      whileHover={!isDisabled ? { y: -3, scale: 1.02, rotate: 0 } : undefined}
      whileTap={!isDisabled ? { scale: 0.96, y: 2 } : undefined}
      transition={{
        type: 'spring',
        stiffness: 360,
        damping: 24,
      }}
      onClick={() => {
        if (!isDisabled) {
          playFlipSound()
          triggerHaptic(20)
          onClick()
        }
      }}
      disabled={isDisabled}
      aria-label={
        claimed
          ? `Lá bài số ${index + 1} đã thuộc về ${playerName}`
          : `Lá bài úp số ${index + 1}, chạm để rút`
      }
      className="relative flex flex-col items-center justify-between select-none overflow-hidden min-w-0 min-h-0 w-full h-full mx-auto"
      style={{
        maxWidth: 132,
        borderRadius: 16,
        padding: 0,
        backgroundColor: claimed ? '#FFFFFF' : '#FFFBF2',
        border: isSelected
          ? '2.5px solid #FFB800'
          : '2px solid var(--border-ink, #231C35)',
        boxShadow: isSelected
          ? '0 6px 0 var(--border-ink, #231C35)'
          : claimed
          ? '0 3px 0 var(--border-ink, #231C35)'
          : `0 3px 0 ${colorway.dark}`,
        cursor: isDisabled ? 'default' : 'pointer',
      }}
    >
      {claimed ? (
        <div className="w-full h-full flex flex-col overflow-hidden">
          <div
            className="w-full flex-1 min-h-0 flex items-center justify-center px-1 py-1"
            style={{
              backgroundColor: avatar.bg,
              borderBottom: '1.5px solid var(--border-ink, #231C35)',
            }}
          >
            <AvatarPortrait avatar={avatar} size={42} shape="circle" />
          </div>

          <div className="w-full py-1.5 px-1.5 flex flex-col items-center gap-0.5 min-w-0 bg-white shrink-0">
            <p
              className="text-[0.74rem] font-black text-center truncate w-full leading-tight"
              style={{
                fontFamily: 'var(--font-display)',
                color: 'var(--ink-primary, #231C35)',
              }}
            >
              {playerName}
            </p>
            <span
              className="px-1.5 py-px rounded-full text-[0.58rem] font-extrabold leading-tight"
              style={{
                fontFamily: 'var(--font-display)',
                backgroundColor: '#CCFBF1',
                color: '#0F766E',
              }}
            >
              Đã nhận
            </span>
          </div>
        </div>
      ) : (
        <TarotCardBack index={index} isSelected={isSelected} ratio="3/4" />
      )}
    </motion.button>
  )
})
