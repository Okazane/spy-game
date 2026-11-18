import { Component, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import { AnimatePresence, MotionConfig, motion, type Transition } from 'motion/react'
import { SpeakerHigh, SpeakerSlash } from '@phosphor-icons/react'
import { useGameStore } from './stores/gameStore'
import { HomeScreen } from './screens/HomeScreen'
import { SetupScreen } from './screens/SetupScreen'
import { RevealScreen } from './screens/RevealScreen'
import { GameScreen } from './screens/GameScreen'
import { WinScreen } from './screens/WinScreen'
import {
  getSoundMuted,
  playClickSound,
  playShutterSound,
  subscribeSoundMuted,
  toggleSoundMuted,
  triggerHaptic,
  unlockAudio,
} from './utils/sound'
import './index.css'
import './App.css'

/* ============================================================
   Stage transition — cards sliding gently across the table
   (~220ms in, ~140ms out; ends at identity so `transform: none`
   is restored and `position: fixed` modals stay viewport-anchored)
   ============================================================ */
const EASE_SNAP: [number, number, number, number] = [0.22, 1, 0.36, 1]

const STAGE_ENTER: Transition = { duration: 0.22, ease: EASE_SNAP }
const STAGE_EXIT: Transition = { duration: 0.14, ease: [0.4, 0, 1, 1] }

const stageVariants = {
  initial: { opacity: 0, y: 12, scale: 0.985 },
  enter: { opacity: 1, y: 0, scale: 1, transition: STAGE_ENTER },
  exit: { opacity: 0, y: -8, scale: 0.985, transition: STAGE_EXIT },
}

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('App render error caught by boundary:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-mobile-frame items-center justify-center p-6 text-center">
          <div className="party-card w-full max-w-sm p-7 space-y-5">
            <div className="flex justify-center">
              <div className="app-oops-cards" aria-hidden="true">
                <span className="app-oops-card-a">🃏</span>
                <span className="app-oops-card-b">😅</span>
              </div>
            </div>

            <div className="space-y-2">
              <span
                className="party-pill"
                style={{
                  backgroundColor: 'rgba(255, 184, 0, 0.22)',
                  border: '1.5px solid rgba(35, 28, 53, 0.18)',
                }}
              >
                Rơi mất một lá bài
              </span>
              <h1 className="text-2xl font-black leading-tight" style={{ fontFamily: 'var(--font-display)' }}>
                Ối, ván bài bị vấp nhẹ rồi!
              </h1>
              <p className="text-[0.95rem] leading-relaxed" style={{ color: 'var(--ink-secondary)' }}>
                Có chút trục trặc nhỏ trên bàn chơi. Đừng lo, cả hội chỉ cần xào bài và chia lại là vui tiếp ngay thôi!
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                useGameStore.getState().resetGame()
                this.setState({ hasError: false })
              }}
              className="btn-party-primary w-full py-3.5 px-6 text-base"
            >
              Chia lại từ đầu
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

/* ============================================================
   Global sound toggle — a small bookmark tab clipped to the right
   edge of the phone frame (lives in the 16px side gutter, clear of
   every screen header and sticky bottom CTA); on wide desktops it
   moves outside the frame as a labelled pill.
   ============================================================ */
function SoundToggle() {
  const muted = useSyncExternalStore(subscribeSoundMuted, getSoundMuted, () => false)

  const label = muted ? 'Bật âm thanh' : 'Tắt âm thanh'

  return (
    <button
      type="button"
      className={`app-sound-toggle ${muted ? 'is-muted' : ''}`}
      aria-label={label}
      aria-pressed={muted}
      title={label}
      onClick={() => {
        const nowMuted = toggleSoundMuted()
        triggerHaptic(12)
        if (!nowMuted) {
          unlockAudio()
          playClickSound(1.15)
        }
      }}
    >
      <motion.span
        key={muted ? 'off' : 'on'}
        className="app-sound-toggle-icon"
        initial={{ scale: 0.6, rotate: -18, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 520, damping: 22 }}
        aria-hidden="true"
      >
        {muted ? <SpeakerSlash size={20} weight="duotone" /> : <SpeakerHigh size={20} weight="duotone" />}
      </motion.span>
      <span className="app-sound-toggle-label">{muted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật'}</span>
    </button>
  )
}

function renderScreen(phase: string) {
  switch (phase) {
    case 'home':
      return <HomeScreen />
    case 'setup':
      return <SetupScreen />
    case 'reveal':
      return <RevealScreen />
    case 'playing':
      return <GameScreen />
    case 'ended':
      return <WinScreen />
    default:
      return null
  }
}

export default function App() {
  const phase = useGameStore(s => s.phase)
  const resetCount = useGameStore(s => s.resetCount)
  const stageKey = `${phase}-${resetCount}`

  // Tiếng "vuốt khăn nhung" khi chuyển màn (bỏ qua lần mount đầu tiên)
  const prevStageKey = useRef(stageKey)
  useEffect(() => {
    if (prevStageKey.current === stageKey) return
    prevStageKey.current = stageKey
    playShutterSound()
  }, [stageKey])

  // Mở khoá Web Audio ở cú chạm đầu tiên (iOS / Safari)
  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock, { once: true, capture: true })
    return () => window.removeEventListener('pointerdown', unlock, { capture: true })
  }, [])

  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        {/* Mặt bàn quán cà phê ấm áp cho màn hình Desktop */}
        <div className="desktop-backdrop" aria-hidden="true" />

        {/* Khung điện thoại 440px — mặt bàn giấy kem.
            Màn cũ rời bàn xong → cuộn về đầu rồi màn mới mới trượt vào. */}
        <main className="app-mobile-frame">
          <AnimatePresence
            mode="wait"
            initial={false}
            onExitComplete={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
          >
            <motion.div
              key={stageKey}
              className="app-stage"
              variants={stageVariants}
              initial="initial"
              animate="enter"
              exit="exit"
            >
              {renderScreen(phase)}
            </motion.div>
          </AnimatePresence>
        </main>

        <SoundToggle />
      </MotionConfig>
    </ErrorBoundary>
  )
}
