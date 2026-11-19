import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { ArrowRight, BookOpenText, Cards } from '@phosphor-icons/react'
import { useGameStore } from '../stores/gameStore'
import { RulesModal } from '../components/RulesModal'
import { AVATARS, getAvatarByIndex } from '../data/avatars'
import { keywords } from '../data/keywords'
import { AvatarPortrait, RoleEmblem, type PartyRole } from '../components/PartyVisuals'
import { playClickSound, playFlipSound, triggerHaptic } from '../utils/sound'

const INK = '#231C35'

const avatarById = (id: string) => AVATARS.find(a => a.id === id) ?? getAvatarByIndex(0)

interface HandCard {
  key: PartyRole
  role: string
  suit: string
  avatar: ReturnType<typeof avatarById>
  bg: string
  ribbon: string
  rotate: number
  y: number
  z: number
}

const HAND: readonly HandCard[] = [
  {
    key: 'civilian',
    role: 'Dân Thường',
    suit: '◆',
    avatar: avatarById('girl1'),
    bg: '#DCFCE7',
    ribbon: '#0D9488',
    rotate: -11,
    y: 10,
    z: 1,
  },
  {
    key: 'spy',
    role: 'Gián Điệp',
    suit: '♠',
    avatar: avatarById('fox'),
    bg: '#FFE4E6',
    ribbon: '#E11D48',
    rotate: 0,
    y: -8,
    z: 3,
  },
  {
    key: 'white-hat',
    role: 'Mũ Trắng',
    suit: '?',
    avatar: avatarById('wizard'),
    bg: '#F3E8FF',
    ribbon: '#7C3AED',
    rotate: 11,
    y: 10,
    z: 2,
  },
]

export function HomeScreen() {
  const [showRules, setShowRules] = useState(false)
  const [front, setFront] = useState<number | null>(null)
  const reduceMotion = useReducedMotion()

  const handleCardTap = (i: number) => {
    playFlipSound()
    triggerHaptic(12)
    setFront(prev => (prev === i ? null : i))
  }

  const handleGoSetup = () => {
    playClickSound()
    triggerHaptic(22)
    useGameStore.setState({ phase: 'setup' })
  }

  const handleOpenRules = () => {
    playClickSound()
    triggerHaptic(15)
    setShowRules(true)
  }

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between gap-3.5 px-4 sm:px-5 pt-4 pb-[max(14px,env(safe-area-inset-bottom))] relative select-none overflow-hidden">
        {/* 1. Crisp Hero Header */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.24 }}
          className="shrink-0 flex flex-col items-center text-center"
        >
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[0.76rem] font-extrabold"
            style={{
              backgroundColor: '#FEF3C7',
              border: `2px solid ${INK}`,
              color: INK,
              boxShadow: `0 2px 0 ${INK}`,
              fontFamily: 'var(--font-sans)',
            }}
          >
            <Cards size={15} weight="duotone" color="#FF5A36" aria-hidden="true" />
            3–20 người · {keywords.length} cặp từ
          </span>

          <h1
            className="mt-3 font-extrabold leading-[1.08] tracking-tight"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(2rem, 8.8vw, 2.55rem)',
              color: INK,
            }}
          >
            Ai Là{' '}
            <motion.span
              initial={{ scale: 1.85, rotate: -10, opacity: 0 }}
              animate={{ scale: 1, rotate: -2, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 520, damping: 16, delay: 0.16 }}
              className="inline-block px-2.5 py-0.5 rounded-xl"
              style={{
                color: '#FFFFFF',
                backgroundColor: '#FF5A36',
                border: `2.5px solid ${INK}`,
                boxShadow: `0 3.5px 0 ${INK}`,
              }}
            >
              Gián Điệp?
            </motion.span>
          </h1>
        </motion.header>

        {/* 2. Prominent Fanned 3-Card Artwork on Tabletop Felt Stage */}
        <section
          aria-label="Bộ bài 3 vai trò"
          className="flex-1 min-h-0 rounded-3xl p-4 flex items-center justify-center relative overflow-hidden"
          style={{
            backgroundColor: '#F2E9D8',
            border: `2.5px solid ${INK}`,
            boxShadow: `0 5px 0 ${INK}`,
            backgroundImage: 'radial-gradient(rgba(35, 28, 53, 0.09) 1.2px, transparent 1.2px)',
            backgroundSize: '15px 15px',
          }}
        >
          {/* Decorative tabletop inner border */}
          <div
            aria-hidden="true"
            className="absolute inset-2.5 rounded-2xl pointer-events-none"
            style={{ border: '1.5px dashed rgba(35, 28, 53, 0.16)' }}
          />

          <div
            className="relative flex items-center justify-center w-full"
            style={{ height: 276 }}
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
                  initial={{ opacity: 0, y: 28, rotate: 0, scale: 0.92 }}
                  animate={{
                    opacity: 1,
                    y: isFront ? card.y - 16 : card.y,
                    rotate: isFront ? 0 : card.rotate,
                    scale: isFront ? 1.08 : dimmed ? 0.94 : 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 380,
                    damping: 16,
                    delay: front === null ? 0.06 * i : 0,
                  }}
                  whileHover={isFront ? undefined : { y: card.y - 8 }}
                  whileTap={{ scale: 0.95 }}
                  className="absolute cursor-pointer outline-none"
                  style={{
                    width: 144,
                    height: 224,
                    left: `calc(50% - 72px + ${(i - 1) * 84}px)`,
                    bottom: 12,
                    zIndex: isFront ? 10 : card.z,
                    transformOrigin: '50% 100%',
                  }}
                >
                  <motion.div
                    animate={
                      reduceMotion
                        ? undefined
                        : isFront
                          ? { y: 0, rotate: [0, -3, 3, -2, 0] }
                          : { y: [0, -4, 0] }
                    }
                    transition={
                      isFront
                        ? { duration: 0.38 }
                        : {
                            duration: 3 + i * 0.6,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.4,
                          }
                    }
                    className="w-full h-full rounded-2xl flex flex-col overflow-hidden"
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `2.5px solid ${INK}`,
                      boxShadow: isFront ? `0 9px 0 ${INK}` : `0 4.5px 0 ${INK}`,
                    }}
                  >
                    <div
                      className="flex-1 m-1.5 rounded-xl flex flex-col items-center justify-center relative"
                      style={{ backgroundColor: card.bg, border: `1.5px solid ${INK}` }}
                    >
                      <span
                        className="absolute top-1.5 left-2 text-[0.82rem] font-black leading-none"
                        style={{ fontFamily: 'var(--font-display)', color: card.ribbon }}
                      >
                        {card.suit}
                      </span>
                      <span className="absolute top-1.5 right-1.5">
                        <RoleEmblem role={card.key} size={20} />
                      </span>

                      <span className="leading-none mt-1">
                        <AvatarPortrait avatar={card.avatar} size={90} />
                      </span>

                      <span
                        className="absolute bottom-1.5 right-2 text-[0.82rem] font-black leading-none rotate-180"
                        style={{ fontFamily: 'var(--font-display)', color: card.ribbon }}
                        aria-hidden="true"
                      >
                        {card.suit}
                      </span>
                    </div>

                    <div
                      className="mx-1.5 mb-1.5 rounded-lg py-1 text-center text-[0.76rem] font-extrabold text-white"
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
        </section>

        {/* 3. Clean Bottom CTAs */}
        <footer className="shrink-0 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleGoSetup}
            className="btn-party-primary w-full py-3.5 px-5 text-[1.06rem] font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Tạo bàn chơi
            <ArrowRight size={20} weight="bold" aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={handleOpenRules}
            className="btn-party-secondary w-full py-2.5 px-4 text-[0.9rem] font-extrabold flex items-center justify-center gap-2 cursor-pointer"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <BookOpenText size={18} weight="bold" aria-hidden="true" />
            Luật chơi
          </button>
        </footer>
      </div>

      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </>
  )
}
