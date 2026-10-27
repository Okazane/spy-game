import { useState, useEffect } from 'react'
import { Play, BookOpen } from '@phosphor-icons/react'
import { useGameStore } from '../stores/gameStore'
import { RulesModal } from '../components/RulesModal'
import { playClickSound, triggerHaptic } from '../utils/sound'
import { Tilted } from '../components/Tilted'

export function HomeScreen() {
  const [showRules, setShowRules] = useState(false)
  const [typedTitle, setTypedTitle] = useState('')

  // Typewriter effect cho tiêu đề
  useEffect(() => {
    const fullText = 'AI LÀ GIÁN ĐIỆP?'
    let idx = 0
    setTypedTitle('')
    const timer = setInterval(() => {
      if (idx < fullText.length) {
        setTypedTitle(fullText.slice(0, idx + 1))
        idx++
      } else {
        clearInterval(timer)
      }
    }, 75)
    return () => clearInterval(timer)
  }, [])

  const handleStart = () => {
    playClickSound()
    triggerHaptic(25)
    useGameStore.setState({ phase: 'setup' })
  }

  const handleOpenRules = () => {
    playClickSound()
    setShowRules(true)
  }

  return (
    <>
      <div
        className="min-h-dvh flex flex-col justify-between px-5 py-8 max-w-[440px] mx-auto relative select-none box-border overflow-hidden"
        style={{
          backgroundImage: 'linear-gradient(rgba(14, 11, 8, 0.08), rgba(14, 11, 8, 0.18)), url(/assets/lobby.webp)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center z-10 space-y-6 my-auto">
          {/* TOP SECRET Stamp & Tiêu đề máy đánh chữ */}
          <div className="relative">
            <Tilted deg={-6} className="inline-block mb-1">
              <span
                className="px-3 py-1 border-2 border-rose-700 text-rose-700 font-black text-xs tracking-widest uppercase bg-[#fcfaf3]/95 shadow-md"
                style={{ fontFamily: 'var(--font-stamp)' }}
              >
                TOP SECRET 🔍
              </span>
            </Tilted>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.3rem, 11vw, 3.4rem)',
                fontWeight: 900,
                color: '#fcfaf3',
                letterSpacing: '-0.02em',
                textShadow: '0 2px 4px rgba(0,0,0,0.8), 0 4px 14px rgba(0,0,0,0.7)',
                minHeight: '1.25em',
              }}
            >
              {typedTitle}
              <span className="typewriter-cursor" style={{ backgroundColor: '#fcfaf3' }}>_</span>
            </h1>
          </div>

          {/* Thẻ Index Card với băng dính Masking Tape */}
          <Tilted deg={-1.5} className="w-full max-w-[340px]">
            <div
              className="index-card relative bg-[#fbf8ef] border-[1.5px] border-[#362719] px-5 pb-5 text-center shadow-[4px_4px_0_#18120c]"
              style={{ paddingTop: '32px' }}
            >
              <div className="masking-tape" />
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  color: '#6d553e',
                  textTransform: 'uppercase',
                  marginBottom: 8,
                }}
              >
                MỤC TIÊU VÁN CHƠI
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: '#1a140e',
                  lineHeight: 1.5,
                }}
              >
                Mỗi người nhận 1 từ khoá bí mật. Hãy hỏi đáp khéo léo và bỏ phiếu tìm ra kẻ trà trộn!
              </p>
            </div>
          </Tilted>

          {/* Action buttons phong cách nhãn Manila Tag */}
          <div className="w-full max-w-xs space-y-3 pt-2">
            <button
              onClick={handleStart}
              className="btn-kraft-stamp w-full py-4 text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0_#18120c]"
            >
              <Play size={18} weight="fill" />
              VÀO BÀN CHƠI NGAY
            </button>

            <button
              onClick={handleOpenRules}
              className="w-full py-3 rounded-[3px] font-bold text-xs text-[#1a140e] bg-[#fbf8ef] border-[1.5px] border-[#362719] shadow-[3px_3px_0_#18120c] flex items-center justify-center gap-2 cursor-pointer transition-transform active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <BookOpen size={16} weight="bold" />
              XEM LUẬT CHƠI MẬT
            </button>
          </div>
        </div>

        {/* Chân trang đóng dấu bảo mật */}
        <div className="text-center pt-2">
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: '#c5b8a5', letterSpacing: '0.08em' }}>
            BẢN LƯU HỒ SƠ NỘI BỘ • TỰ ĐỘNG BẢO MẬT
          </p>
        </div>
      </div>

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </>
  )
}
