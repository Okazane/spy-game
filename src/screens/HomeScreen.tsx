import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { useGameStore } from '../stores/gameStore'
import { RulesModal } from '../components/RulesModal'
import { AVATARS, getAvatarByIndex } from '../data/avatars'
import { AvatarPortrait, SolarIcon } from '../components/PartyVisuals'
import { playClickSound, playFlipSound, triggerHaptic } from '../utils/sound'

const INK = '#231C35'

const avatarById = (id: string) => AVATARS.find(a => a.id === id) ?? getAvatarByIndex(0)

const HAND = [
  {
    key: 'civilian',
    role: 'Dân Thường',
    suit: '◆',
    avatar: avatarById('girl1'),
    bg: '#dcfce7',
    ribbon: '#0D9488',
    rotate: -10,
    x: 14,
    y: 10,
    z: 1,
    line: 'Trà đào',
    blurb: 'Nhận từ chung với cả nhóm — tả khéo để nhận ra nhau!',
  },
  {
    key: 'spy',
    role: 'Gián Điệp',
    suit: '♠',
    avatar: avatarById('fox'),
    bg: '#ffe4e6',
    ribbon: '#E11D48',
    rotate: 0,
    x: 0,
    y: -8,
    z: 3,
    line: 'Trà vải?',
    blurb: 'Từ na ná nhưng khác một chút — hãy diễn thật tự nhiên!',
  },
  {
    key: 'whitehat',
    role: 'Mũ Trắng',
    suit: '?',
    avatar: avatarById('wizard'),
    bg: '#f3e8ff',
    ribbon: '#7C3AED',
    rotate: 10,
    x: -14,
    y: 10,
    z: 2,
    line: '???',
    blurb: 'Tay trắng không có từ nào — nghe hóng, rồi đoán từ để lật kèo!',
  },
] as const

const STORY_CHIPS = [
  { n: 1, text: 'Rút bài kín', bg: '#FEF3C7', tilt: -2 },
  { n: 2, text: 'Tả khéo 1 câu', bg: '#CCFBF1', tilt: 1.5 },
  { n: 3, text: 'Bắt bài kẻ gian', bg: '#FFE4E6', tilt: -1.5 },
] as const

export function HomeScreen() {
  const [showRules, setShowRules] = useState(false)
  const [front, setFront] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()

  const handleCardTap = (i: number) => {
    playFlipSound()
    triggerHaptic(12)
    setFront(i)
  }

  const handleStart = () => {
    playClickSound()
    triggerHaptic(25)
    useGameStore.setState({ phase: 'setup' })
  }

  const handleOpenRules = () => {
    playClickSound()
    triggerHaptic(15)
    setShowRules(true)
  }

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between py-4 px-4 sm:px-5 relative select-none overflow-hidden">
        {/* Top pill */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="flex justify-center pt-0.5 shrink-0"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[0.78rem] font-bold"
            style={{
              backgroundColor: '#FEF3C7',
              border: `2px solid ${INK}`,
              color: INK,
              boxShadow: `0 2px 0 ${INK}`,
              fontFamily: 'var(--font-sans)',
            }}
          >
            Chơi chung 1 máy • 3–15 bạn
          </span>
        </motion.header>

        {/* Hero */}
        <div className="flex-1 min-h-0 flex flex-col items-center justify-evenly gap-2 py-2">
          {/* Fanned hand of cards */}
          <div
            className="relative flex items-end justify-center"
            style={{ height: 196, width: '100%' }}
            aria-label="Ba lá bài: Dân Thường, Gián Điệp, Mũ Trắng"
          >
            {HAND.map((card, i) => {
              const isFront = front === i
              const dimmed = front !== null && !isFront
              return (
              <motion.div
                key={card.key}
                role="button"
                tabIndex={0}
                aria-pressed={isFront}
                aria-label={card.role}
                onClick={() => handleCardTap(i)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleCardTap(i)
                  }
                }}
                initial={{ opacity: 0, y: 40, rotate: 0, scale: 0.9 }}
                animate={{
                  opacity: 1,
                  y: isFront ? card.y - 26 : card.y,
                  rotate: isFront ? 0 : card.rotate,
                  scale: isFront ? 1.1 : dimmed ? 0.96 : 1,
                }}
                transition={{ type: 'spring', stiffness: 380, damping: 14, delay: front === null ? 0.08 * i : 0 }}
                whileHover={isFront ? undefined : { y: card.y - 12 }}
                whileTap={{ scale: 0.94 }}
                className="absolute cursor-pointer outline-none"
                style={{
                  width: 112,
                  height: 158,
                  left: `calc(50% - 56px + ${(i - 1) * 84}px)`,
                  bottom: 8,
                  zIndex: isFront ? 10 : card.z,
                  transformOrigin: '50% 100%',
                }}
              >
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : isFront
                        ? { y: 0, rotate: [0, -5, 5, -3, 0] }
                        : { y: [0, -4, 0] }
                  }
                  transition={
                    isFront
                      ? { duration: 0.5 }
                      : { duration: 3 + i * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }
                  }
                  className="w-full h-full rounded-2xl flex flex-col overflow-hidden"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `2px solid ${INK}`,
                    boxShadow: isFront ? `0 10px 0 ${INK}` : `0 4px 0 ${INK}`,
                  }}
                >
                  <div
                    className="flex-1 m-1.5 rounded-xl flex flex-col items-center justify-center relative"
                    style={{ backgroundColor: card.bg, border: `1.5px solid ${INK}` }}
                  >
                    <span
                      className="absolute top-1.5 left-2 text-[0.75rem] font-black leading-none"
                      style={{ fontFamily: 'var(--font-display)', color: card.ribbon }}
                    >
                      {card.suit}
                    </span>
                    <span className="leading-none" style={{ marginTop: 6 }}>
                      <AvatarPortrait avatar={card.avatar} size={62} />
                    </span>
                    <span
                      className="mt-1.5 text-[0.7rem] font-extrabold"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      {card.line}
                    </span>
                  </div>
                  <div
                    className="mx-1.5 mb-1.5 rounded-lg py-1 text-center text-[0.74rem] font-extrabold text-white"
                    style={{
                      backgroundColor: card.ribbon,
                      fontFamily: 'var(--font-display)',
                      border: `1.5px solid ${INK}`,
                    }}
                  >
                    {card.role}
                  </div>
                </motion.div>
              </motion.div>
              )
            })}
          </div>

          <div className="-mt-3 min-h-[2.6rem] flex items-center justify-center text-center px-4" aria-live="polite">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={front === null ? 'hint' : HAND[front].key}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.16 }}
                className="max-w-[300px] text-[0.8rem] font-semibold leading-snug"
                style={{
                  fontFamily: 'var(--font-sans)',
                  color: front === null ? '#8C82A0' : HAND[front].ribbon,
                }}
              >
                {front === null ? 'Chạm vào từng lá bài để xem vai nhé!' : HAND[front].blurb}
              </motion.p>
            </AnimatePresence>
          </div>

          {/* Title + hook */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="text-center flex flex-col items-center"
          >
            <h1
              className="font-extrabold leading-[1.05] tracking-tight"
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.3rem, 11vw, 3.1rem)',
                color: INK,
              }}
            >
              Ai Là{' '}
              <motion.span
                initial={{ scale: 2.4, rotate: -14, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 520, damping: 15, delay: 0.35 }}
                className="inline-block px-2 rounded-xl"
                style={{
                  color: '#FFFFFF',
                  backgroundColor: '#FF5A36',
                  border: `2.5px solid ${INK}`,
                  boxShadow: `0 3px 0 ${INK}`,
                }}
              >
                Gián Điệp?
              </motion.span>
            </h1>
            <p
              className="mt-3 max-w-[320px] text-[0.92rem] leading-relaxed font-medium"
              style={{ fontFamily: 'var(--font-sans)', color: '#5B5270' }}
            >
              1 chiếc điện thoại, cả hội cười nghiêng ngả — ai đang nói thật, ai đang diễn sâu?
            </p>
          </motion.div>

          {/* Story chips */}
          <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-2">
            {STORY_CHIPS.map((chip, i) => (
              <div key={chip.n} className="flex items-center gap-1.5">
                <motion.span
                  initial={{ opacity: 0, y: 14, scale: 0.8, rotate: 0 }}
                  animate={{ opacity: 1, y: 0, scale: 1, rotate: chip.tilt }}
                  transition={{ type: 'spring', stiffness: 420, damping: 16, delay: 0.5 + i * 0.09 }}
                  className="inline-flex items-center gap-1.5 rounded-full pl-1 pr-3 py-1 text-[0.78rem] font-bold"
                  style={{
                    backgroundColor: chip.bg,
                    border: `2px solid ${INK}`,
                    color: INK,
                    fontFamily: 'var(--font-sans)',
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full inline-flex items-center justify-center text-[0.7rem] font-extrabold text-white"
                    style={{ backgroundColor: INK, fontFamily: 'var(--font-display)' }}
                  >
                    {chip.n}
                  </span>
                  {chip.text}
                </motion.span>
                {i < STORY_CHIPS.length - 1 && (
                  <ArrowRight aria-hidden="true" size={14} weight="bold" style={{ color: '#8C82A0' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="w-full space-y-3 pt-1 pb-[max(6px,env(safe-area-inset-bottom))]">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.7 }}
          >
          <button
            type="button"
            onClick={handleStart}
            className="btn-party-primary w-full py-4 px-5 text-lg font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <SolarIcon name="play" size={22} />
            Chơi ngay!
          </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20, delay: 0.8 }}
          >
          <button
            type="button"
            onClick={handleOpenRules}
            className="btn-party-secondary w-full py-3.5 px-4 text-[0.95rem] font-bold flex items-center justify-center gap-2 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <SolarIcon name="book" size={19} /> Cách chơi (30 giây)
          </button>
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </>
  )
}
