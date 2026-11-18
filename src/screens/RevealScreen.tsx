import { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ArrowRight, Shuffle, X } from '@phosphor-icons/react'
import { useGameStore, type Player } from '../stores/gameStore'
import {
  playClickSound,
  playPeekHoldSound,
  playPeekReleaseSound,
  playShuffleSound,
  playStampSound,
  playVictorySound,
  triggerHaptic,
} from '../utils/sound'
import { AVATARS, getAvatarByIndex, SPY_CODENAMES } from '../data/avatars'
import { GameCard } from '../components/GameCard'
import {
  AvatarPortrait,
  SecretCardFront,
  TarotCardBack,
} from '../components/PartyVisuals'

const INK = '#231C35'

function getColumns(total: number): number {
  if (total <= 4) return 2
  if (total <= 9) return 3
  return 4
}

interface ThumbPeekModalProps {
  cardIndex: number
  player: Player
  hideRole: boolean
  usedNames: string[]
  previousNames: string[]
  onConfirm: (index: number, playerName: string) => void
}

const ThumbPeekModal = memo(function ThumbPeekModal({
  cardIndex,
  player,
  hideRole,
  usedNames,
  previousNames,
  onConfirm,
}: ThumbPeekModalProps) {
  const [inputName, setInputName] = useState('')
  const [isHolding, setIsHolding] = useState(false)
  const [hasPeeked, setHasPeeked] = useState(false)
  const isHoldingRef = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const avatar = getAvatarByIndex(cardIndex)

  const unclaimedPreviousNames = useMemo(
    () => previousNames.filter(n => n.trim().length > 0 && !usedNames.includes(n)),
    [previousNames, usedNames]
  )

  const randomNamePool = useMemo(() => {
    const avatarNames = AVATARS.map(a => a.name)
    const combined = Array.from(new Set([...SPY_CODENAMES, ...avatarNames]))
    return combined.filter(n => !usedNames.includes(n))
  }, [usedNames])

  const releaseHold = useCallback(() => {
    if (!isHoldingRef.current) return
    isHoldingRef.current = false
    setIsHolding(false)
    playPeekReleaseSound()
  }, [])

  useEffect(() => {
    if (!isHolding) return
    window.addEventListener('pointerup', releaseHold)
    window.addEventListener('pointercancel', releaseHold)
    window.addEventListener('blur', releaseHold)
    return () => {
      window.removeEventListener('pointerup', releaseHold)
      window.removeEventListener('pointercancel', releaseHold)
      window.removeEventListener('blur', releaseHold)
    }
  }, [isHolding, releaseHold])

  const handleStartHold = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (!isHoldingRef.current) {
      isHoldingRef.current = true
      setIsHolding(true)
      setHasPeeked(true)
      playPeekHoldSound()
      triggerHaptic(18)
    }
  }

  const handleEndHold = (e?: React.PointerEvent<HTMLButtonElement>) => {
    if (e) e.preventDefault()
    releaseHold()
  }

  const handlePickRandomName = () => {
    playClickSound()
    triggerHaptic(15)
    const pool = randomNamePool.filter(n => n !== inputName)
    const source = pool.length > 0 ? pool : SPY_CODENAMES
    const randomName = source[Math.floor(Math.random() * source.length)]
    if (randomName) {
      setInputName(randomName)
    }
  }

  const handleSubmit = () => {
    if (!hasPeeked) return
    playStampSound()
    triggerHaptic([20, 30])
    onConfirm(cardIndex, inputName.trim() || `Người ${cardIndex + 1}`)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 py-3 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16 }}
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(28, 23, 42, 0.95)' }}
      />

      <motion.div
        key={`peek-modal-${cardIndex}`}
        initial={{ opacity: 0, scale: 0.92, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', damping: 24, stiffness: 340 }}
        className="relative z-10 w-full max-w-[356px] max-h-full flex flex-col gap-2"
      >
        <div
          className="party-card p-3.5 flex flex-col gap-2.5"
          style={{ backgroundColor: '#FAF4E8' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <AvatarPortrait avatar={avatar} size={36} shape="circle" />
              <div className="min-w-0">
                <p
                  className="text-[0.88rem] font-black leading-tight truncate"
                  style={{ fontFamily: 'var(--font-display)', color: INK }}
                >
                  Lá bài số {cardIndex + 1}
                </p>
                <p className="text-[0.68rem] font-medium truncate" style={{ color: '#5B5270' }}>
                  Che nhẹ màn hình trước khi xem
                </p>
              </div>
            </div>

            <span
              className="px-2.5 py-0.5 rounded-full shrink-0 text-[0.7rem] font-extrabold"
              style={{
                fontFamily: 'var(--font-display)',
                backgroundColor: hasPeeked ? '#CCFBF1' : '#FFFFFF',
                color: hasPeeked ? '#0F766E' : '#5B5270',
                border: `1.5px solid ${INK}`,
              }}
            >
              {hasPeeked ? 'Đã xem' : 'Đang úp'}
            </span>
          </div>

          {/* Large Centered Direct-Hold 3D Playing Card */}
          <div className="flex justify-center py-0.5">
            <button
              type="button"
              onPointerDown={handleStartHold}
              onPointerUp={handleEndHold}
              onPointerLeave={handleEndHold}
              onPointerCancel={handleEndHold}
              onContextMenu={e => e.preventDefault()}
              aria-label={
                isHolding
                  ? 'Đang xem từ bí mật, thả tay để úp lại'
                  : 'Nhấn giữ trực tiếp lên lá bài để xem từ bí mật'
              }
              className="relative block cursor-pointer select-none focus:outline-none"
              style={{
                width: 'min(216px, 56vw, 34dvh)',
                aspectRatio: '5 / 7',
                perspective: 1100,
                touchAction: 'none',
                WebkitTouchCallout: 'none',
                userSelect: 'none',
              }}
            >
              <motion.div
                animate={{
                  rotateY: isHolding ? 180 : 0,
                  scale: isHolding ? 1.03 : 1,
                  y: isHolding ? -4 : 0,
                }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="relative w-full h-full"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    transform: 'translateZ(1px)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    borderRadius: 16,
                    border: `2.5px solid ${INK}`,
                    boxShadow: isHolding
                      ? `0 9px 0 ${INK}, 0 20px 32px rgba(10, 6, 20, 0.5)`
                      : `0 5px 0 ${INK}, 0 10px 20px rgba(35, 28, 53, 0.2)`,
                  }}
                >
                  <TarotCardBack
                    index={cardIndex}
                    isSelected
                    ratio="5/7"
                    hintLabel={hasPeeked ? 'Giữ bài để xem lại' : 'Nhấn giữ bài để xem'}
                  />
                </div>

                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{
                    transform: 'rotateY(180deg) translateZ(1px)',
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    borderRadius: 16,
                    border: `2.5px solid ${INK}`,
                    boxShadow: `0 9px 0 ${INK}, 0 20px 32px rgba(10, 6, 20, 0.5)`,
                  }}
                >
                  <SecretCardFront
                    keyword={player.keyword}
                    role={player.role}
                    hideRole={hideRole}
                    cardIndex={cardIndex}
                  />
                </div>
              </motion.div>
            </button>
          </div>

          {/* Name Input + Quick Chips */}
          <div
            className="pt-2 space-y-2 shrink-0"
            style={{ borderTop: '1.5px dashed rgba(35, 28, 53, 0.16)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[0.75rem] font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: INK }}
              >
                {unclaimedPreviousNames.length > 0 ? 'Chọn nhanh tên cũ:' : 'Ký tên lên lá bài:'}
              </span>

              <button
                type="button"
                onClick={handlePickRandomName}
                className="px-2.5 py-0.5 rounded-full text-[0.7rem] font-extrabold cursor-pointer active:scale-95 transition-transform"
                style={{
                  fontFamily: 'var(--font-display)',
                  backgroundColor: '#FFFFFF',
                  color: INK,
                  border: `1.5px solid ${INK}`,
                }}
              >
                Tên ngẫu nhiên
              </button>
            </div>

            {unclaimedPreviousNames.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                {unclaimedPreviousNames.slice(0, 8).map(name => {
                  const isActive = inputName === name
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => {
                        playClickSound()
                        triggerHaptic(10)
                        setInputName(name)
                      }}
                      className="px-2.5 py-0.5 rounded-full text-[0.72rem] font-bold shrink-0 cursor-pointer"
                      style={{
                        backgroundColor: isActive ? '#FFB800' : '#FFFFFF',
                        color: INK,
                        border: `1.5px solid ${INK}`,
                      }}
                    >
                      {name}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputName}
                onChange={e => setInputName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && hasPeeked) {
                    handleSubmit()
                  }
                }}
                placeholder="Nhập tên của bạn..."
                maxLength={20}
                autoComplete="off"
                className="w-full pl-3.5 pr-9 py-2 rounded-xl text-[0.88rem] font-semibold outline-none select-text"
                style={{
                  fontFamily: 'var(--font-sans)',
                  userSelect: 'text',
                  WebkitUserSelect: 'text',
                  backgroundColor: '#FFFFFF',
                  color: INK,
                  border: `2px solid ${INK}`,
                }}
              />
              {inputName.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound(0.92)
                    setInputName('')
                    inputRef.current?.focus()
                  }}
                  aria-label="Xoá tên"
                  className="absolute right-2.5 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: '#F2E9D8', color: INK }}
                >
                  <X size={13} weight="bold" />
                </button>
              )}
            </div>

            <button
              type="button"
              disabled={!hasPeeked}
              onClick={handleSubmit}
              className="btn-party-primary w-full py-3 px-4 text-[0.9rem] inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Đã nhớ từ • Đưa máy bạn kế</span>
              <ArrowRight size={18} weight="bold" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
})

export function RevealScreen() {
  const players = useGameStore(s => s.players)
  const selectedCardIndex = useGameStore(s => s.selectedCardIndex)
  const previousNames = useGameStore(s => s.previousNames)
  const speakingOrder = useGameStore(s => s.speakingOrder)
  const hideRole = useGameStore(s => s.settings.hideRole)
  const selectCard = useGameStore(s => s.selectCard)
  const claimCard = useGameStore(s => s.claimCard)
  const proceedToGame = useGameStore(s => s.proceedToGame)
  const reshuffleSpeakingOrder = useGameStore(s => s.reshuffleSpeakingOrder)
  const resetGame = useGameStore(s => s.resetGame)

  const [isShufflingOrder, setIsShufflingOrder] = useState(false)
  const [isShufflingDeck, setIsShufflingDeck] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const prevAllClaimedRef = useRef(false)
  const lastDealtSigRef = useRef<string | null>(null)
  const shuffleDeckTimerRef = useRef<number | null>(null)
  const shuffleOrderTimerRef = useRef<number | null>(null)

  const playersSignature = useMemo(() => players.map(p => p.id).join(','), [players])
  const [shuffledSlots, setShuffledSlots] = useState<{ sig: string; slots: number[] } | null>(null)
  const cardSlots = useMemo(
    () =>
      shuffledSlots && shuffledSlots.sig === playersSignature
        ? shuffledSlots.slots
        : Array.from({ length: players.length }, (_, i) => i),
    [shuffledSlots, playersSignature, players.length]
  )

  const totalPlayers = players.length
  const claimedCount = useMemo(() => players.filter(p => p.claimed).length, [players])
  const unclaimedCount = totalPlayers - claimedCount
  const allClaimed = totalPlayers > 0 && claimedCount === totalPlayers
  const progressRatio = totalPlayers > 0 ? claimedCount / totalPlayers : 0
  const cols = getColumns(totalPlayers)
  const rows = Math.max(1, Math.ceil(totalPlayers / cols))

  useEffect(() => {
    return () => {
      if (shuffleDeckTimerRef.current !== null) {
        window.clearTimeout(shuffleDeckTimerRef.current)
      }
      if (shuffleOrderTimerRef.current !== null) {
        window.clearTimeout(shuffleOrderTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!allClaimed && totalPlayers > 0 && lastDealtSigRef.current !== playersSignature) {
      lastDealtSigRef.current = playersSignature
      playShuffleSound()
    }
  }, [allClaimed, totalPlayers, playersSignature])

  useEffect(() => {
    if (allClaimed && !prevAllClaimedRef.current) {
      playVictorySound()
      triggerHaptic(40)
    }
    prevAllClaimedRef.current = allClaimed
  }, [allClaimed])

  const usedNames = useMemo(
    () => players.filter(p => p.claimed).map(p => p.name),
    [players]
  )

  const cardClickHandlers = useMemo(
    () => Array.from({ length: totalPlayers }, (_, i) => () => selectCard(i)),
    [totalPlayers, selectCard]
  )

  const handleConfirmClaim = useCallback(
    (index: number, playerName: string) => {
      claimCard(index, playerName)
    },
    [claimCard]
  )

  const handleBackClick = () => {
    playClickSound()
    triggerHaptic(15)
    if (claimedCount > 0 || selectedCardIndex !== null) {
      setShowResetConfirm(true)
    } else {
      resetGame()
    }
  }

  const handleShuffleDeckOnTable = () => {
    if (unclaimedCount < 2 || selectedCardIndex !== null || isShufflingDeck) return
    setIsShufflingDeck(true)
    playShuffleSound()
    triggerHaptic([15, 25, 15])

    const unclaimedPositions: number[] = []
    const unclaimedValues: number[] = []
    cardSlots.forEach((playerIdx, slotPos) => {
      if (!players[playerIdx]?.claimed) {
        unclaimedPositions.push(slotPos)
        unclaimedValues.push(playerIdx)
      }
    })
    if (unclaimedValues.length >= 2) {
      const shuffled = [...unclaimedValues]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      if (shuffled.every((val, idx) => val === unclaimedValues[idx])) {
        const first = shuffled.shift()
        if (first !== undefined) shuffled.push(first)
      }

      const next = [...cardSlots]
      unclaimedPositions.forEach((slotPos, idx) => {
        next[slotPos] = shuffled[idx]
      })
      setShuffledSlots({ sig: playersSignature, slots: next })
    }

    if (shuffleDeckTimerRef.current !== null) {
      window.clearTimeout(shuffleDeckTimerRef.current)
    }
    shuffleDeckTimerRef.current = window.setTimeout(() => {
      shuffleDeckTimerRef.current = null
      setIsShufflingDeck(false)
    }, 360)
  }

  const handleReorderSpeaking = () => {
    if (isShufflingOrder) return
    setIsShufflingOrder(true)
    playShuffleSound()
    triggerHaptic([15, 25, 15])
    if (shuffleOrderTimerRef.current !== null) {
      window.clearTimeout(shuffleOrderTimerRef.current)
    }
    shuffleOrderTimerRef.current = window.setTimeout(() => {
      shuffleOrderTimerRef.current = null
      reshuffleSpeakingOrder()
      setIsShufflingOrder(false)
    }, 260)
  }

  const selectedPlayer =
    selectedCardIndex !== null ? (players[selectedCardIndex] ?? null) : null

  return (
    <div className="w-full h-full flex flex-col justify-between px-4 py-3.5 gap-2.5 relative select-none overflow-hidden">
      {/* 1. Compact Header */}
      <header className="w-full space-y-2 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleBackClick}
            className="btn-party-secondary px-3 py-1.5 text-[0.76rem] inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft size={15} weight="bold" />
            <span>Chia lại</span>
          </button>

          <div className="flex items-center gap-1.5">
            {!allClaimed && unclaimedCount >= 2 && (
              <button
                type="button"
                onClick={handleShuffleDeckOnTable}
                disabled={selectedCardIndex !== null || isShufflingDeck}
                className="btn-party-secondary px-2.5 py-1.5 text-[0.74rem] inline-flex items-center gap-1.5 disabled:opacity-45 cursor-pointer"
                style={{ backgroundColor: '#FEF3C7' }}
              >
                <Shuffle size={15} weight="bold" />
                <span>Xào bài</span>
              </button>
            )}

            <span
              className="party-pill text-[0.74rem]"
              style={{
                backgroundColor: allClaimed ? '#CCFBF1' : '#FFFFFF',
                color: allClaimed ? '#0F766E' : INK,
                border: `2px solid ${INK}`,
              }}
            >
              {claimedCount}/{totalPlayers}
            </span>
          </div>
        </div>

        {/* Slim Progress Strip */}
        <div className="space-y-1">
          <p
            className="text-[0.78rem] font-bold text-center"
            style={{ fontFamily: 'var(--font-sans)', color: '#5B5270' }}
          >
            {allClaimed
              ? 'Tất cả đã nhận bài! Kiểm tra thứ tự nói bên dưới.'
              : 'Mỗi người chạm vào 1 lá bài úp bất kỳ để nhận từ riêng'}
          </p>
          <div
            className="w-full h-2 rounded-full overflow-hidden"
            style={{
              backgroundColor: '#F2E9D8',
              border: `1.5px solid ${INK}`,
            }}
          >
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progressRatio }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full h-full"
              style={{
                transformOrigin: 'left',
                background: allClaimed ? '#0D9488' : '#FF5A36',
              }}
            />
          </div>
        </div>
      </header>

      {/* 2. Body Fitted Strictly Inside Remaining Height */}
      <AnimatePresence mode="wait">
        {!allClaimed ? (
          <motion.div
            key="table-card-deck"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="flex-1 min-h-0 flex flex-col justify-center w-full"
          >
            <div
              className="w-full h-full max-h-full py-1"
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
                gap: cols >= 4 ? 8 : 10,
                alignItems: 'center',
              }}
            >
              {cardSlots.map((playerIndex, slotIdx) => {
                const player = players[playerIndex]
                if (!player) return null
                const dealDelay = Math.min(slotIdx * 0.035, 0.32)
                const shuffleWiggle =
                  isShufflingDeck && !player.claimed
                    ? slotIdx % 2 === 0
                      ? -5
                      : 5
                    : 0

                return (
                  <motion.div
                    key={player.id}
                    layout
                    initial={{ opacity: 0, y: -20, scale: 0.86 }}
                    animate={{
                      opacity: 1,
                      y: isShufflingDeck && !player.claimed ? -5 : 0,
                      scale: isShufflingDeck && !player.claimed ? 1.03 : 1,
                      rotate: shuffleWiggle,
                    }}
                    transition={{
                      layout: { type: 'spring', stiffness: 320, damping: 24 },
                      opacity: { duration: 0.18, delay: dealDelay },
                      y: { type: 'spring', stiffness: 320, damping: 22 },
                      scale: { type: 'spring', stiffness: 320, damping: 22 },
                      rotate: { type: 'spring', stiffness: 360, damping: 18 },
                    }}
                    className="min-w-0 min-h-0 w-full h-full flex items-center justify-center"
                  >
                    <GameCard
                      index={playerIndex}
                      claimed={player.claimed}
                      playerName={player.name}
                      isSelected={selectedCardIndex === playerIndex}
                      isOtherLocked={
                        selectedCardIndex !== null && selectedCardIndex !== playerIndex
                      }
                      onClick={cardClickHandlers[playerIndex]}
                    />
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="speaking-order-board"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 w-full"
          >
            <div className="party-card p-3.5 flex flex-col flex-1 min-h-0 gap-2.5 overflow-hidden">
              <div
                className="flex items-center justify-between gap-2 pb-2 shrink-0"
                style={{ borderBottom: '1.5px dashed rgba(35, 28, 53, 0.16)' }}
              >
                <div className="min-w-0">
                  <h2
                    className="text-[0.98rem] font-black leading-tight"
                    style={{ fontFamily: 'var(--font-display)', color: INK }}
                  >
                    Thứ Tự Vòng Nói
                  </h2>
                  <p className="text-[0.7rem] font-medium" style={{ color: '#5B5270' }}>
                    Mỗi người mô tả 1 câu theo đúng thứ tự
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReorderSpeaking}
                  disabled={isShufflingOrder}
                  className="btn-party-secondary px-2.5 py-1.5 text-[0.72rem] inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer"
                >
                  <Shuffle size={14} weight="bold" />
                  <span>Đổi thứ tự</span>
                </button>
              </div>

              <motion.div
                animate={{ opacity: isShufflingOrder ? 0.5 : 1 }}
                transition={{ duration: 0.15 }}
                className={`flex-1 min-h-0 overflow-y-auto grid gap-1.5 content-start ${
                  speakingOrder.length >= 7 ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {speakingOrder.map((playerId, i) => {
                  const playerIdx = players.findIndex(p => p.id === playerId)
                  if (playerIdx === -1) return null
                  const player = players[playerIdx]
                  const avatar = getAvatarByIndex(playerIdx)
                  const isFirst = i === 0

                  return (
                    <motion.div
                      key={playerId}
                      layout
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl min-w-0"
                      style={{
                        backgroundColor: isFirst ? '#FEF3C7' : '#F2E9D8',
                        border: isFirst ? `2px solid ${INK}` : '1.5px solid rgba(35, 28, 53, 0.14)',
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-full text-[0.72rem] font-black shrink-0 inline-flex items-center justify-center"
                        style={{
                          fontFamily: 'var(--font-display)',
                          backgroundColor: isFirst ? '#FFB800' : '#FFFFFF',
                          color: INK,
                          border: `1.5px solid ${INK}`,
                        }}
                      >
                        {i + 1}
                      </span>

                      <AvatarPortrait avatar={avatar} size={30} shape="circle" />

                      <p
                        className="text-[0.84rem] font-extrabold truncate flex-1 min-w-0"
                        style={{ fontFamily: 'var(--font-display)', color: INK }}
                      >
                        {player.name}
                      </p>

                      {isFirst && (
                        <span
                          className="text-[0.65rem] font-extrabold px-1.5 py-0.5 rounded-md shrink-0"
                          style={{ backgroundColor: '#FFFFFF', color: '#B45309' }}
                        >
                          Nói đầu
                        </span>
                      )}
                    </motion.div>
                  )
                })}
              </motion.div>
            </div>

            <button
              type="button"
              onClick={() => {
                playClickSound()
                triggerHaptic(30)
                proceedToGame()
              }}
              className="btn-party-primary w-full py-3.5 px-5 text-[0.98rem] inline-flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              <span>Bắt đầu vòng mô tả</span>
              <ArrowRight size={19} weight="bold" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Thumb-Peek Modal */}
      <AnimatePresence>
        {!allClaimed && selectedCardIndex !== null && selectedPlayer && (
          <ThumbPeekModal
            key={selectedCardIndex}
            cardIndex={selectedCardIndex}
            player={selectedPlayer}
            hideRole={hideRole}
            usedNames={usedNames}
            previousNames={previousNames}
            onConfirm={handleConfirmClaim}
          />
        )}
      </AnimatePresence>

      {/* Re-deal Confirmation Dialog */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowResetConfirm(false)}
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(28, 23, 42, 0.78)' }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              transition={{ type: 'spring', damping: 24, stiffness: 360 }}
              className="party-card relative z-10 w-full max-w-[310px] p-5 space-y-4 text-center"
              style={{ backgroundColor: '#FAF4E8' }}
            >
              <div className="space-y-1">
                <h3
                  className="text-[1.05rem] font-black"
                  style={{ fontFamily: 'var(--font-display)', color: INK }}
                >
                  Chia lại ván mới?
                </h3>
                <p className="text-xs font-medium leading-relaxed" style={{ color: '#5B5270' }}>
                  Đã có {claimedCount} người rút bài. Quay lại sẽ xào lại bộ bài mới.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setShowResetConfirm(false)
                  }}
                  className="btn-party-secondary py-2.5 px-3 text-xs cursor-pointer"
                >
                  Ở lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    triggerHaptic(25)
                    setShowResetConfirm(false)
                    resetGame()
                  }}
                  className="btn-party-danger py-2.5 px-3 text-xs cursor-pointer"
                >
                  Chia lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
