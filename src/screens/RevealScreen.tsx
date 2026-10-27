import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ShieldCheck, Bug, Ghost, ArrowRight, DiceFive, ChatCenteredText, Fingerprint } from '@phosphor-icons/react'
import { useGameStore, type Role } from '../stores/gameStore'
import { playClickSound, playFlipSound, playVictorySound, triggerHaptic } from '../utils/sound'
import { getAvatarByIndex, SPY_CODENAMES } from '../data/avatars'
import { GameCard } from '../components/GameCard'

const ROLE_CONFIG: Record<Role, { label: string; color: string; bg: string; desc: string; emoji: string; Icon: React.ElementType }> = {
  civilian: {
    label: 'Dân Thường',
    color: '#2563eb',
    bg: '#eff6ff',
    desc: 'Mô tả từ khoá của bạn — khéo léo để không nói thẳng.',
    emoji: '🛡️',
    Icon: ShieldCheck,
  },
  spy: {
    label: 'Gián Điệp',
    color: '#dc2626',
    bg: '#fef2f2',
    desc: 'Từ khoá của bạn khác mọi người. Hãy giả vờ như bạn là Dân Thường!',
    emoji: '🕶️',
    Icon: Bug,
  },
  'white-hat': {
    label: 'Mũ Trắng',
    color: '#7c3aed',
    bg: '#f5f3ff',
    desc: 'Bạn không có từ khoá. Hãy chăm chú nghe và phán đoán theo đám đông!',
    emoji: '👻',
    Icon: Ghost,
  },
}

function getColumns(total: number): number {
  if (total <= 4) return 2
  if (total <= 9) return 3
  return 4
}

export function RevealScreen() {
  const {
    players,
    selectedCardIndex,
    previousNames,
    speakingOrder,
    settings,
    selectCard,
    claimCard,
    proceedToGame,
    reshuffleSpeakingOrder,
  } = useGameStore()

  const [inputName, setInputName] = useState('')
  const [isHolding, setIsHolding] = useState(false)
  const [isShufflingOrder, setIsShufflingOrder] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const allClaimed = players.length > 0 && players.every(p => p.claimed)
  const cols = getColumns(players.length)

  // Khi chọn lá bài → reset holding và focus input
  useEffect(() => {
    if (selectedCardIndex !== null) {
      setInputName('')
      setIsHolding(false)
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [selectedCardIndex])

  useEffect(() => {
    if (allClaimed) {
      playVictorySound()
      triggerHaptic(40)
    }
  }, [allClaimed])

  const selectedPlayer = selectedCardIndex !== null ? players[selectedCardIndex] ?? null : null
  const config = selectedPlayer ? ROLE_CONFIG[selectedPlayer.role] : null

  // Chế độ Ẩn vai trò: Cả Dân lẫn Gián chỉ thấy từ khoá
  const isBlindRole = Boolean(settings.hideRole && (selectedPlayer?.role === 'civilian' || selectedPlayer?.role === 'spy'))
  const displayEmoji = isBlindRole ? '🤫' : (config?.emoji ?? '🔍')
  const displayLabel = isBlindRole ? 'TỪ KHOÁ CỦA BẠN' : (config?.label ?? '')
  const displayColor = isBlindRole ? '#2563eb' : (config?.color ?? '#2563eb')
  const displayBg = isBlindRole ? '#eff6ff' : (config?.bg ?? '#ffffff')

  // Gợi ý tên — dùng useMemo để tránh tính lại mỗi render
  const isSameGroup = previousNames.length > 0 && previousNames.length === players.length
  const suggestedNames = useMemo(() => {
    const usedNames = players.filter(p => p.claimed).map(p => p.name)
    return isSameGroup
      ? previousNames.filter(n => !usedNames.includes(n))
      : SPY_CODENAMES.filter(n => !usedNames.includes(n)).slice(0, 5)
  }, [players, previousNames, isSameGroup])

  const handleConfirm = () => {
    if (selectedCardIndex === null) return
    playClickSound()
    triggerHaptic(25)
    claimCard(selectedCardIndex, inputName.trim() || `Người ${selectedCardIndex + 1}`)
    setInputName('')
    setIsHolding(false)
  }

  const handleStartHold = (e: React.SyntheticEvent) => {
    e.preventDefault()
    setIsHolding(true)
    playFlipSound()
    triggerHaptic(30)
  }

  const handleEndHold = (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault()
    setIsHolding(false)
  }

  const handleReorderSpeaking = () => {
    setIsShufflingOrder(true)
    playFlipSound()
    triggerHaptic(30)
    setTimeout(() => {
      reshuffleSpeakingOrder()
      setIsShufflingOrder(false)
      playClickSound()
    }, 400)
  }

  return (
    <>
      <div className="w-full min-h-dvh flex flex-col justify-between p-4 pb-5 max-w-[440px] mx-auto relative select-none box-border overflow-x-hidden">

        {/* ── BÀN THẺ BÀI SỐC NỔI BẬT (Căn giữa trung tâm hoàn hảo) ── */}
        <div className="flex-1 flex flex-col justify-center my-auto py-2 w-full min-w-0">
          <div
            className="w-full"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gap: 8,
              justifyContent: 'center',
              alignContent: 'center',
            }}
          >
            {players.map((player, i) => (
              <GameCard
                key={player.id}
                index={i}
                claimed={player.claimed}
                playerName={player.name}
                isSelected={selectedCardIndex === i}
                isOtherLocked={selectedCardIndex !== null && selectedCardIndex !== i}
                onClick={() => selectCard(i)}
              />
            ))}
          </div>
        </div>

        {/* ── MODAL XEM BÀI & NHẬP TÊN CHÍNH GIỮA MÀN HÌNH ── */}
        <AnimatePresence>
          {!allClaimed && selectedCardIndex !== null && config && selectedPlayer && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm"
              />
              <motion.div
                key="name-modal"
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="game-card-tactile p-5 space-y-3.5 max-w-xs w-full relative z-10 shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <Fingerprint size={16} weight="fill" style={{ color: '#d97706' }} />
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.92rem', color: 'var(--ink-primary)', fontWeight: 900, letterSpacing: '-0.01em' }}>
                      Nhận bài của bạn
                    </span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', color: 'var(--ink-faint)', fontWeight: 800 }}>
                    #{selectedCardIndex + 1}
                  </span>
                </div>

                {/* Quét vân tay sinh trắc học */}
                <div
                  onPointerDown={(e) => {
                    try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId) } catch {}
                    handleStartHold(e)
                  }}
                  onPointerUp={handleEndHold}
                  onPointerCancel={handleEndHold}
                  onContextMenu={(e) => e.preventDefault()}
                  className="relative rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer select-none transition-all shadow-inner overflow-hidden"
                  style={{
                    minHeight: 140,
                    touchAction: 'none',
                    WebkitTouchCallout: 'none',
                    userSelect: 'none',
                    backgroundColor: isHolding ? displayBg : '#0f172a',
                    border: isHolding ? `2px solid ${displayColor}` : '2px solid #1e293b',
                    boxShadow: isHolding ? `0 0 24px ${displayColor}40` : 'inset 0 2px 8px rgba(0,0,0,0.4)',
                  }}
                >
                  {isHolding ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center text-center z-10"
                    >
                      <span className="text-3xl mb-1">{displayEmoji}</span>
                      <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: displayColor }}>
                        {displayLabel}
                      </p>
                      <p
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: '1.75rem',
                          fontWeight: 900,
                          color: 'var(--ink-primary)',
                          letterSpacing: '-0.03em',
                          marginTop: 2,
                        }}
                      >
                        {selectedPlayer.keyword || '— Không có từ khoá —'}
                      </p>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2 z-10">
                      <div className="w-16 h-16 rounded-full flex items-center justify-center bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.35)] animate-pulse">
                        <Fingerprint size={42} weight="regular" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Gợi ý tên */}
                {suggestedNames.length > 0 && (
                  <div>
                    <p style={{ fontSize: '0.62rem', color: 'var(--ink-faint)', marginBottom: 5, fontFamily: 'var(--font-display)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 800 }}>
                      Gợi ý mật danh:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedNames.map(name => (
                        <button
                          key={name}
                          onClick={() => {
                            playClickSound()
                            setInputName(name)
                            setTimeout(() => inputRef.current?.focus(), 40)
                          }}
                          className="px-2.5 py-1 rounded-sm text-xs font-bold transition-all cursor-pointer"
                          style={{
                            fontFamily: 'var(--font-display)',
                            backgroundColor: inputName === name ? '#d97706' : '#ffffff',
                            color: inputName === name ? '#ffffff' : 'var(--ink-secondary)',
                            border: inputName === name ? '1px solid #b45309' : '1px solid #e2e8f0',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Nhập tên và Xác nhận */}
                <div className="flex gap-2 pt-1">
                  <input
                    ref={inputRef}
                    value={inputName}
                    onChange={e => setInputName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    placeholder="Nhập mật danh..."
                    maxLength={20}
                    className="flex-1 px-3.5 py-2.5 rounded-[2px] bg-[#fdfcf8] font-bold text-[var(--ink-primary)] text-sm outline-none border-[1.5px] border-[#281e15] focus:border-[#c8a165] transition-colors"
                    style={{ fontFamily: 'var(--font-body)' }}
                  />
                  <button
                    onClick={handleConfirm}
                    className="btn-kraft-stamp px-5 py-2.5 text-xs font-black cursor-pointer shadow-[3px_3px_0_#18120c]"
                  >
                    XÁC NHẬN
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── BOTTOM PANEL: SPEAKING ORDER WHEN ALL CLAIMED ── */}
        <div className="w-full min-w-0">
          <AnimatePresence mode="wait">
            {allClaimed && (
              /* ── Bảng thứ tự phát biểu khi tất cả đã lật bài xong ── */
              <motion.div
                key="speaking-order"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2.5"
              >
                <div className="game-card-tactile p-3.5 shadow-[4px_4px_0_#18120c]">
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#281e15]/30">
                    <div className="flex items-center gap-1.5">
                      <ChatCenteredText size={16} weight="fill" className="text-[#8c6530]" />
                      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '0.98rem', color: 'var(--ink-primary)' }}>
                        THỨ TỰ PHÁT BIỂU
                      </h3>
                    </div>

                    <button
                      onClick={handleReorderSpeaking}
                      disabled={isShufflingOrder}
                      aria-label="Bốc lại thứ tự"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-[2px] text-xs font-bold bg-[#fdfcf8] text-[#181410] cursor-pointer border-[1.5px] border-[#281e15] shadow-[2px_2px_0_#18120c] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      style={{ fontFamily: 'var(--font-body)' }}
                    >
                      <DiceFive size={14} weight="bold" />
                      <span>BỐC LẠI</span>
                    </button>
                  </div>

                  <div className="max-h-40 overflow-y-auto space-y-1.5 pt-2">
                    {speakingOrder.map((playerId, i) => {
                      const player = players.find(p => p.id === playerId)
                      if (!player) return null
                      const playerIdx = players.findIndex(p => p.id === playerId)
                      const avatar = getAvatarByIndex(playerIdx)
                      return (
                        <div
                          key={playerId}
                          className="flex items-center gap-2.5 p-1.5 px-2.5 rounded-[2px] border border-[#281e15]/25"
                          style={{ backgroundColor: i === 0 ? '#fdf8e8' : '#fcfaf3' }}
                        >
                          <span
                            className="w-6 h-6 rounded-[2px] flex items-center justify-center font-black text-xs border border-[#281e15]"
                            style={{
                              backgroundColor: i === 0 ? '#c8a165' : '#e9e1d2',
                              color: '#181410',
                              fontFamily: 'var(--font-body)',
                            }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-base">{avatar.emoji}</span>
                          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '0.88rem', color: '#181410' }}>
                            {player.name}
                          </p>
                          {i === 0 && (
                            <span
                              className="ml-auto text-[0.65rem] font-black px-2 py-0.5 rounded-[2px] bg-[#c8a165] text-[#181410] border border-[#8c6530]"
                              style={{ fontFamily: 'var(--font-stamp)' }}
                            >
                              NÓI TRƯỚC
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Nút Bắt đầu thảo luận */}
                <button
                  onClick={() => {
                    playClickSound()
                    triggerHaptic(30)
                    proceedToGame()
                  }}
                  className="btn-kraft-stamp w-full py-4 text-base font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-[4px_4px_0_#18120c]"
                >
                  BẮT ĐẦU THẢO LUẬN
                  <ArrowRight size={18} weight="bold" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}
