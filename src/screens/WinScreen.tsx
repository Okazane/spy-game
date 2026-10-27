import { useState, useEffect, useMemo } from 'react'
import { ArrowCounterClockwise, Users, FileText, ShieldCheck, EyeClosed, Ghost } from '@phosphor-icons/react'
import { useGameStore } from '../stores/gameStore'
import { playClickSound, playStampSound, playFlashSound, playMarkerSound, playVictorySound, triggerHaptic } from '../utils/sound'
import { getAvatarByIndex } from '../data/avatars'
import { Tilted } from '../components/Tilted'

export function WinScreen() {
  const { winner, players, resetGame, whiteHatGuessedWord } = useGameStore()
  const isCivilianWin = !winner || winner === 'civilian'
  const isSpyWin = winner === 'spy' || winner === 'spy+white'
  const isWhiteHatWin = winner === 'white-hat'

  // Hiệu ứng
  const [flashActive, setFlashActive] = useState(false)
  const [stampActive, setStampActive] = useState(false)
  const [screenShaking, setScreenShaking] = useState(false)

  // Danh tính các phe (useMemo tránh duyệt lại mảng mỗi render)
  const { civilianKeyword, spyKeyword, whiteHats } = useMemo(() => ({
    civilianKeyword: players.find(p => p.role === 'civilian')?.keyword || 'Chưa rõ',
    spyKeyword: players.find(p => p.role === 'spy')?.keyword || 'Chưa rõ',
    whiteHats: players.filter(p => p.role === 'white-hat'),
  }), [players])

  useEffect(() => {
    if (isCivilianWin) {
      setFlashActive(true)
      playFlashSound()
      const tFlash = setTimeout(() => setFlashActive(false), 100)

      const tStamp = setTimeout(() => {
        setStampActive(true)
        setScreenShaking(true)
        playStampSound()
        triggerHaptic(50)
        const tShake = setTimeout(() => setScreenShaking(false), 240)
        return () => clearTimeout(tShake)
      }, 350)

      return () => {
        clearTimeout(tFlash)
        clearTimeout(tStamp)
      }
    } else if (isSpyWin) {
      const tStamp = setTimeout(() => {
        setStampActive(true)
        playStampSound()
        triggerHaptic(40)
      }, 250)
      return () => clearTimeout(tStamp)
    } else if (isWhiteHatWin) {
      playVictorySound()
      playMarkerSound()
      const tStamp = setTimeout(() => {
        setStampActive(true)
        playStampSound()
        triggerHaptic(40)
      }, 250)
      return () => clearTimeout(tStamp)
    }
  }, [isCivilianWin, isSpyWin, isWhiteHatWin])

  const handlePlayAgain = () => {
    playClickSound()
    triggerHaptic(30)
    resetGame()
  }

  // Nền có lớp phủ tối Scrim điện ảnh giúp chữ luôn nét 100%
  const bgImage = isCivilianWin
    ? 'linear-gradient(180deg, rgba(10, 8, 6, 0.52) 0%, rgba(10, 8, 6, 0.35) 40%, rgba(10, 8, 6, 0.72) 100%), url(/assets/civilian-win.webp)'
    : isSpyWin
    ? 'linear-gradient(180deg, rgba(10, 7, 6, 0.58) 0%, rgba(10, 7, 6, 0.40) 40%, rgba(10, 7, 6, 0.76) 100%), url(/assets/spy-win.webp)'
    : 'linear-gradient(180deg, rgba(10, 8, 6, 0.55) 0%, rgba(10, 8, 6, 0.36) 40%, rgba(10, 8, 6, 0.74) 100%), url(/assets/whitehat-win.webp)'

  return (
    <div
      className={`w-full min-h-dvh flex flex-col justify-between p-4 pb-6 max-w-[440px] mx-auto relative select-none box-border overflow-y-auto ${screenShaking ? 'screen-shake' : ''}`}
      style={{
        backgroundImage: bgImage,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Chớp Flash máy ảnh */}
      <div className={`camera-flash ${flashActive ? 'active' : ''}`} aria-hidden="true" />

      {/* ── PHẦN ĐẦU: BADGE & TIÊU ĐỀ THẮNG SẮC NÉT ── */}
      <div className="w-full flex flex-col items-center text-center pt-2 z-10 space-y-2">
        {/* Con dấu danh hiệu */}
        <Tilted deg={-2}>
          {isCivilianWin && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1d4ed8] text-white text-[0.72rem] font-black uppercase tracking-widest border border-[#93c5fd] shadow-[2px_2px_0_#000]"
              style={{ fontFamily: 'var(--font-stamp)' }}
            >
              <ShieldCheck size={14} weight="bold" />
              TÒA ÁN ĐIỆP VIÊN • PHÁ ÁN THÀNH CÔNG
            </span>
          )}
          {isSpyWin && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#b91c1c] text-white text-[0.72rem] font-black uppercase tracking-widest border border-[#fca5a5] shadow-[2px_2px_0_#000]"
              style={{ fontFamily: 'var(--font-stamp)' }}
            >
              <EyeClosed size={14} weight="bold" />
              BÁO ĐỘNG ĐỎ • TÌNH BÁO THẤT THỦ
            </span>
          )}
          {isWhiteHatWin && (
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#6d28d9] text-white text-[0.72rem] font-black uppercase tracking-widest border border-[#d8b4fe] shadow-[2px_2px_0_#000]"
              style={{ fontFamily: 'var(--font-stamp)' }}
            >
              <Ghost size={14} weight="bold" />
              BẬC THẦY DIỄN XUẤT • LẬT KÈO THÀNH CÔNG
            </span>
          )}
        </Tilted>

        {/* Tiêu đề chính chữ to, sắc bén, tương phản tuyệt đối */}
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 8.5vw, 2.7rem)',
            fontWeight: 900,
            lineHeight: 1.12,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            textShadow: '0 3px 0 #000000, 0 6px 14px rgba(0, 0, 0, 0.95)',
          }}
        >
          {isCivilianWin && (
            <>
              DÂN THƯỜNG <br />
              <span className="text-[#60a5fa]">CHIẾN THẮNG!</span>
            </>
          )}
          {isSpyWin && (
            <>
              GIÁN ĐIỆP <br />
              <span className="text-[#f87171]">ĐÃ TẨU THOÁT!</span>
            </>
          )}
          {isWhiteHatWin && (
            <>
              MŨ TRẮNG <br />
              <span className="text-[#c084fc]">CHIẾN THẮNG!</span>
            </>
          )}
        </h1>

        {/* Dòng tóm tắt vụ án */}
        <p
          className="text-xs font-semibold px-2 text-[#f3ece2]"
          style={{
            fontFamily: 'var(--font-body)',
            textShadow: '0 1px 4px rgba(0, 0, 0, 0.9)',
          }}
        >
          {isCivilianWin && 'Toàn bộ gián điệp trà trộn đã bị phơi bày danh tính ra ánh sáng.'}
          {isSpyWin && 'Mật lệnh đã bị đánh cắp. Gián điệp biến mất hoàn hảo không dấu vết.'}
          {isWhiteHatWin && (
            whiteHatGuessedWord
              ? `Bị biểu quyết loại, Mũ Trắng đã lật kèo xuất sắc khi đoán đúng từ khoá "${civilianKeyword}"!`
              : 'Không hề có mật lệnh, Mũ Trắng đã ẩn mình và giành chiến thắng ngoạn mục!'
          )}
        </p>
      </div>

      {/* ── PHẦN TRUNG TÂM: HỒ SƠ CHỨNG CỨ & SỰ THẬT BẬT MÍ ── */}
      <div className="w-full my-3 z-10 space-y-3">
        {/* Thẻ chứng cứ hồ sơ (Tactile Dossier Card) */}
        <div className="relative bg-[#fcfaf3] border-[1.5px] border-[#18120c] p-4 rounded-[3px] shadow-[5px_5px_0_#18120c]">
          {/* Tiêu đề thẻ hồ sơ & Con dấu cao su kết luận */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#281e15]/20 mb-3 gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <FileText size={15} weight="fill" className="text-[#8c6530] shrink-0" />
              <h2
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: '#181410',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
                className="truncate"
              >
                BÁO CÁO TỔNG KẾT VỤ ÁN
              </h2>
            </div>

            {/* Con dấu cao su BẮT GIỮ / TẨU THOÁT / LẬT KÈO dập gọn gàng trong hàng tiêu đề */}
            <div
              style={{
                fontFamily: 'var(--font-stamp)',
                fontSize: 'clamp(0.82rem, 2.3vw, 0.98rem)',
                fontWeight: 900,
                color: '#b91c1c',
                letterSpacing: '0.08em',
                padding: '2px 8px',
                border: '2px double #b91c1c',
                backgroundColor: '#fef2f2',
                boxShadow: '1.5px 1.5px 0 #18120c',
                transform: stampActive ? 'rotate(-3deg) scale(1)' : 'rotate(-16deg) scale(1.8)',
                opacity: stampActive ? 1 : 0,
                transition: 'transform 0.16s cubic-bezier(0.2, 0, 0, 1), opacity 0.08s ease',
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {isCivilianWin ? 'ĐÃ BẮT GIỮ' : isSpyWin ? 'TẨU THOÁT' : 'LẬT KÈO'}
            </div>
          </div>

          {/* ── BẢNG SO SÁNH TỪ KHOÁ (KEYWORD COMPARISON) ── */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Cột Dân Thường */}
            <div className="p-2.5 rounded-[2px] bg-[#eff6ff] border-[1.5px] border-[#1d4ed8] text-center shadow-[2px_2px_0_#18120c]">
              <span
                className="text-[0.62rem] font-black text-[#1d4ed8] uppercase tracking-wider block mb-0.5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                🛡️ Phe Dân
              </span>
              <span
                className="text-base font-black text-[#1e3a8a] block truncate"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
              >
                {civilianKeyword}
              </span>
            </div>

            {/* Cột Gián Điệp */}
            <div className="p-2.5 rounded-[2px] bg-[#fef2f2] border-[1.5px] border-[#b91c1c] text-center shadow-[2px_2px_0_#18120c]">
              <span
                className="text-[0.62rem] font-black text-[#b91c1c] uppercase tracking-wider block mb-0.5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                🕶️ Gián Điệp
              </span>
              <span
                className="text-base font-black text-[#7f1d1d] block truncate"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '-0.01em' }}
              >
                {spyKeyword}
              </span>
            </div>
          </div>

          {/* Nếu có Mũ Trắng */}
          {whiteHats.length > 0 && (
            <div className="p-2 rounded-[2px] bg-[#f5f3ff] border-[1.5px] border-[#6d28d9] text-center mb-3 shadow-[2px_2px_0_#18120c]">
              <span
                className="text-[0.62rem] font-black text-[#6d28d9] uppercase tracking-wider inline-block mr-1.5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                👻 Mũ Trắng ({whiteHats.map(w => w.name).join(', ')}):
              </span>
              <span
                className="text-xs font-extrabold text-[#4c1d95]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {isWhiteHatWin
                  ? `Đoán đúng từ khoá "${whiteHatGuessedWord || civilianKeyword}" để lật kèo thắng!`
                  : 'Hoàn toàn không có từ khoá!'}
              </span>
            </div>
          )}

          {/* ── DANH TÍNH TOÀN BỘ MỌI NGƯỜI (HIỂN THỊ TRỰC TIẾP) ── */}
          <div className="pt-2.5 border-t border-[#281e15]/20">
            <div className="flex items-center justify-between mb-2">
              <p
                className="text-[0.68rem] font-extrabold text-[#5c4732] uppercase tracking-wider flex items-center gap-1.5"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                <Users size={14} weight="bold" />
                DANH TÍNH TẤT CẢ NGƯỜI CHƠI:
              </p>
              <span
                className="text-[0.62rem] font-bold text-[#8c745a]"
                style={{ fontFamily: 'var(--font-body)' }}
              >
                ({players.length} người)
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-0.5">
              {players.map((p, i) => {
                const avatar = getAvatarByIndex(i)
                const isSpy = p.role === 'spy'
                const isWhite = p.role === 'white-hat'
                const isWhiteHatChampion = isWhiteHatWin && isWhite

                const badge = isSpy
                  ? { bg: '#fef2f2', color: '#b91c1c', border: '#f87171', label: 'GIÁN ĐIỆP' }
                  : isWhite
                  ? { bg: '#f5f3ff', color: '#6d28d9', border: '#c084fc', label: 'MŨ TRẮNG' }
                  : { bg: '#eff6ff', color: '#1d4ed8', border: '#93c5fd', label: 'DÂN THƯỜNG' }

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-1.5 px-2.5 rounded-[2px] border transition-all"
                    style={{
                      backgroundColor: isSpy ? '#fff5f5' : isWhite ? '#faf5ff' : '#f8fafc',
                      borderColor: isSpy ? '#fca5a5' : isWhite ? '#e9d5ff' : '#cbd5e1',
                      boxShadow: '1px 1px 0 rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <div
                        className="w-7 h-7 rounded-[2px] flex items-center justify-center text-sm border border-[#18120c] flex-shrink-0"
                        style={{ backgroundColor: avatar.bg }}
                      >
                        {avatar.emoji}
                      </div>
                      <div className="min-w-0 truncate">
                        <p
                          className="font-extrabold text-xs text-[#181410] truncate"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        >
                          {p.name}
                        </p>
                        <p
                          className="text-[0.64rem] text-[#675543] font-semibold truncate"
                          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                        >
                          {p.keyword
                            ? `Từ: "${p.keyword}"`
                            : isWhiteHatChampion
                            ? `Đoán trúng: "${whiteHatGuessedWord || civilianKeyword}"`
                            : 'Không có từ khoá'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {!p.isAlive && !isWhiteHatChampion && (
                        <span className="text-[0.58rem] font-bold px-1 py-0.5 rounded-[2px] bg-[#fee2e2] text-[#991b1b] border border-[#fca5a5]">
                          ĐÃ BỊ LOẠI
                        </span>
                      )}
                      {isWhiteHatChampion && (
                        <span className="text-[0.58rem] font-bold px-1.5 py-0.5 rounded-[2px] bg-[#fefce8] text-[#854d0e] border border-[#fde047]">
                          THẮNG CUỘC
                        </span>
                      )}
                      <span
                        className="text-[0.62rem] font-black px-2 py-0.5 rounded-[2px] border"
                        style={{
                          backgroundColor: badge.bg,
                          color: badge.color,
                          borderColor: badge.border,
                          fontFamily: 'var(--font-stamp)',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── PHẦN CUỐI: NÚT CHƠI VÁN MỚI ── */}
      <div className="w-full pt-1 z-20">
        <button
          onClick={handlePlayAgain}
          className="btn-kraft-stamp w-full py-4 text-base font-black flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0_#18120c]"
          style={{ letterSpacing: '0.04em' }}
        >
          <ArrowCounterClockwise size={20} weight="bold" />
          CHƠI VÁN MỚI ↺
        </button>
      </div>
    </div>
  )
}
