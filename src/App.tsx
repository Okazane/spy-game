import { Component, useState, useEffect, type ReactNode } from 'react'
import { useGameStore } from './stores/gameStore'
import { HomeScreen } from './screens/HomeScreen'
import { SetupScreen } from './screens/SetupScreen'
import { RevealScreen } from './screens/RevealScreen'
import { GameScreen } from './screens/GameScreen'
import { WinScreen } from './screens/WinScreen'
import { playShutterSound } from './utils/sound'
import './index.css'

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
        <div style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: '#f4ede0',
          color: '#181410',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
        }}>
          <div className="game-card-tactile p-6 max-w-sm">
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, marginBottom: 8 }}>
              HỒ SƠ BỊ GIÁN ĐOẠN
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginBottom: 20 }}>
              Đã xảy ra sự cố kỹ thuật. Vui lòng bấm bên dưới để khôi phục ván chơi.
            </p>
            <button
              onClick={() => {
                useGameStore.getState().resetGame()
                this.setState({ hasError: false })
              }}
              className="btn-kraft-stamp px-6 py-3"
            >
              Thiết lập lại ván ↺
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  const { phase } = useGameStore()
  const [displayPhase, setDisplayPhase] = useState(phase)
  const [shuttersClosed, setShuttersClosed] = useState(false)

  // Hiệu ứng cửa phòng tối (Darkroom Shutter) khi chuyển màn
  useEffect(() => {
    if (phase !== displayPhase) {
      setShuttersClosed(true)
      playShutterSound()
      const timer1 = setTimeout(() => {
        setDisplayPhase(phase)
        const timer2 = setTimeout(() => {
          setShuttersClosed(false)
        }, 60)
        return () => clearTimeout(timer2)
      }, 180)
      return () => clearTimeout(timer1)
    }
  }, [phase, displayPhase])

  return (
    <ErrorBoundary>
      {/* Nền cho màn hình lớn Desktop */}
      <div className="desktop-backdrop" aria-hidden="true" />

      {/* Cửa phòng tối 2 cánh trượt */}
      <div className={`darkroom-shutter shutter-left ${shuttersClosed ? 'shutters-closed' : ''}`} style={{ transform: shuttersClosed ? 'translateX(0)' : undefined }} aria-hidden="true" />
      <div className={`darkroom-shutter shutter-right ${shuttersClosed ? 'shutters-closed' : ''}`} style={{ transform: shuttersClosed ? 'translateX(0)' : undefined }} aria-hidden="true" />

      {/* Khung mobile 440px */}
      <main className="app-mobile-frame">
        {displayPhase === 'home'    && <HomeScreen />}
        {displayPhase === 'setup'   && <SetupScreen />}
        {displayPhase === 'reveal'  && <RevealScreen />}
        {displayPhase === 'playing' && <GameScreen />}
        {displayPhase === 'ended'   && <WinScreen />}
      </main>
    </ErrorBoundary>
  )
}

