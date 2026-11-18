import { memo, useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowCounterClockwise } from '@phosphor-icons/react'
import { useGameStore, type Player, type Role } from '../stores/gameStore'
import { playClickSound, triggerHaptic } from '../utils/sound'
import { getAvatarByIndex } from '../data/avatars'
import { EliminateDialog, RoleRevealDialog } from '../components/EliminateDialog'
import { AvatarPortrait } from '../components/PartyVisuals'

const INK = '#231C35'

const ROLE_STAMP: Record<Role, { label: string; color: string; bg: string; border: string }> = {
  civilian: {
    label: 'Dân thường',
    color: '#0F766E',
    bg: '#CCFBF1',
    border: '#0D9488',
  },
  spy: {
    label: 'Gián điệp',
    color: '#BE123C',
    bg: '#FFE4E6',
    border: '#E11D48',
  },
  'white-hat': {
    label: 'Mũ trắng',
    color: '#6D28D9',
    bg: '#F3E8FF',
    border: '#7C3AED',
  },
}

interface PlayerCardProps {
  player: Player
  index: number
  speakingOrderIndex?: number
  compact: boolean
  onEliminate: (player: Player) => void
}

const PlayerCard = memo(function PlayerCard({
  player,
  index,
  speakingOrderIndex,
  compact,
  onEliminate,
}: PlayerCardProps) {
  const avatar = getAvatarByIndex(index)
  const stamp = ROLE_STAMP[player.role]

  return (
    <motion.button
      type="button"
      disabled={!player.isAlive}
      whileTap={player.isAlive ? { scale: 0.97, y: 2 } : undefined}
      onClick={() => {
        if (!player.isAlive) return
        playClickSound()
        triggerHaptic(22)
        onEliminate(player)
      }}
      className={`relative w-full h-full rounded-2xl flex flex-col items-center justify-between text-center overflow-hidden transition-opacity ${
        player.isAlive ? 'cursor-pointer' : 'cursor-default opacity-65'
      }`}
      style={{
        padding: compact ? '6px 6px' : '10px 8px',
        backgroundColor: player.isAlive ? '#FFFFFF' : '#F4EFE4',
        border: `2px solid ${INK}`,
        boxShadow: player.isAlive ? `0 3px 0 ${INK}` : 'none',
      }}
    >
      {/* Top Row: Speaking Order Number */}
      <div className="w-full flex items-center justify-between">
        {speakingOrderIndex !== undefined ? (
          <span
            className="px-1.5 py-0.5 rounded-md text-[0.66rem] font-black leading-none"
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: speakingOrderIndex === 1 ? '#FEF3C7' : '#F2E9D8',
              color: INK,
              border: `1.5px solid ${INK}`,
            }}
          >
            #{speakingOrderIndex}
          </span>
        ) : (
          <span />
        )}
      </div>

      {/* Center: Avatar + Name */}
      <div className="flex flex-col items-center min-w-0 w-full my-auto py-0.5">
        <AvatarPortrait
          avatar={avatar}
          size={compact ? 36 : 48}
          dimmed={!player.isAlive}
        />
        <p
          className={`w-full truncate font-black leading-tight mt-1 px-0.5 ${
            compact ? 'text-[0.76rem]' : 'text-[0.88rem]'
          }`}
          style={{
            fontFamily: 'var(--font-display)',
            color: player.isAlive ? INK : '#8C82A0',
            textDecoration: player.isAlive ? 'none' : 'line-through',
          }}
        >
          {player.name}
        </p>
      </div>

      {/* Bottom: Vote Tag or Eliminated Role Stamp (Zero keyword leak!) */}
      <div className="w-full">
        {player.isAlive ? (
          <span
            className={`w-full rounded-lg inline-block font-extrabold ${
              compact ? 'py-0.5 text-[0.64rem]' : 'py-1 text-[0.72rem]'
            }`}
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: '#FFE4E6',
              color: '#BE123C',
              border: `1.5px solid ${INK}`,
            }}
          >
            Bỏ phiếu
          </span>
        ) : (
          <span
            className={`w-full rounded-lg inline-block font-extrabold ${
              compact ? 'py-0.5 text-[0.64rem]' : 'py-1 text-[0.7rem]'
            }`}
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: stamp.bg,
              color: stamp.color,
              border: `1.5px solid ${stamp.border}`,
            }}
          >
            {stamp.label}
          </span>
        )}
      </div>
    </motion.button>
  )
})

export function GameScreen() {
  const players = useGameStore(s => s.players)
  const eliminatePlayer = useGameStore(s => s.eliminatePlayer)
  const speakingOrder = useGameStore(s => s.speakingOrder)
  const winner = useGameStore(s => s.winner)
  const endGame = useGameStore(s => s.endGame)

  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null)
  const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  const effectiveOrder = useMemo(
    () => (speakingOrder.length > 0 ? speakingOrder : players.map(p => p.id)),
    [speakingOrder, players]
  )

  useEffect(() => {
    if (!showEndConfirm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEndConfirm(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showEndConfirm])

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>()
    players.forEach(p => map.set(p.id, p))
    return map
  }, [players])

  const aliveCount = useMemo(() => players.filter(p => p.isAlive).length, [players])

  const handleEliminate = useCallback((player: Player) => {
    setPendingPlayer(player)
  }, [])

  const handleConfirm = useCallback(() => {
    if (pendingPlayer) {
      eliminatePlayer(pendingPlayer.id)
      setRevealedPlayer(pendingPlayer)
      setPendingPlayer(null)
    }
  }, [pendingPlayer, eliminatePlayer])

  const getSpeakingOrderIndex = useCallback(
    (playerId: string) => {
      const idx = effectiveOrder.indexOf(playerId)
      return idx >= 0 ? idx + 1 : undefined
    },
    [effectiveOrder]
  )

  const cols = players.length <= 4 ? 2 : players.length <= 9 ? 3 : 4
  const compact = players.length >= 7

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between px-4 py-3.5 gap-2.5 select-none overflow-hidden">
        {/* 1. Compact Header */}
        <header className="flex items-center justify-between gap-2 shrink-0">
          <span
            className="party-pill text-[0.78rem] font-extrabold"
            style={{
              backgroundColor: '#CCFBF1',
              color: INK,
              border: `2px solid ${INK}`,
            }}
          >
            Còn {aliveCount}/{players.length} người
          </span>

          <button
            type="button"
            onClick={() => {
              playClickSound()
              triggerHaptic(16)
              setShowEndConfirm(true)
            }}
            className="btn-party-secondary px-3 py-1.5 text-[0.76rem] inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <ArrowCounterClockwise size={15} weight="bold" />
            <span>Kết thúc ván</span>
          </button>
        </header>

        {/* 2. Simple Speaking Order + Names ONLY */}
        <section
          className="rounded-2xl px-3 py-2.5 shrink-0"
          style={{
            backgroundColor: '#FFFFFF',
            border: `2px solid ${INK}`,
            boxShadow: `0 2px 0 ${INK}`,
          }}
        >
          <p
            className="text-[0.72rem] font-extrabold mb-1.5"
            style={{ fontFamily: 'var(--font-display)', color: '#5B5270' }}
          >
            Thứ tự nói
          </p>
          <div className="flex flex-wrap gap-1.5">
            {effectiveOrder.map((playerId, idx) => {
              const p = playerMap.get(playerId)
              const name = p?.name || `Người ${idx + 1}`
              const isAlive = p?.isAlive ?? true
              return (
                <span
                  key={playerId}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.75rem] font-bold"
                  style={{
                    fontFamily: 'var(--font-sans)',
                    backgroundColor: idx === 0 && isAlive ? '#FEF3C7' : '#F2E9D8',
                    color: isAlive ? INK : '#8C82A0',
                    border: `1.5px solid ${isAlive ? INK : 'rgba(35, 28, 53, 0.2)'}`,
                    textDecoration: isAlive ? 'none' : 'line-through',
                    opacity: isAlive ? 1 : 0.55,
                  }}
                >
                  <strong style={{ fontFamily: 'var(--font-display)' }}>{idx + 1}.</strong>
                  <span className="max-w-[96px] truncate">{name}</span>
                </span>
              )
            })}
          </div>
        </section>

        {/* 3. Auto-Fitting Player Cards Grid (Fits 100% Inside Screen Without Scrolling) */}
        <section className="flex-1 min-h-0 flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-0.5 shrink-0">
            <span
              className="text-[0.78rem] font-extrabold"
              style={{ fontFamily: 'var(--font-display)', color: INK }}
            >
              Chạm vào người chơi để bỏ phiếu loại
            </span>
          </div>

          <div
            className="flex-1 min-h-0 grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: 'minmax(0, 1fr)',
            }}
          >
            {players.map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={i}
                speakingOrderIndex={getSpeakingOrderIndex(player.id)}
                compact={compact}
                onEliminate={handleEliminate}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Vote Confirmation Modal */}
      <AnimatePresence>
        {pendingPlayer && (
          <EliminateDialog
            player={pendingPlayer}
            speakingOrderIndex={getSpeakingOrderIndex(pendingPlayer.id)}
            onConfirm={handleConfirm}
            onCancel={() => setPendingPlayer(null)}
          />
        )}
      </AnimatePresence>

      {/* Role Reveal & White-Hat Comeback Modal */}
      <AnimatePresence>
        {revealedPlayer && (
          <RoleRevealDialog
            player={revealedPlayer}
            playerIndex={players.findIndex(p => p.id === revealedPlayer.id)}
            isGameOver={winner !== null}
            aliveCount={aliveCount}
            onContinue={() => {
              if (useGameStore.getState().winner !== null) {
                endGame()
              } else {
                setRevealedPlayer(null)
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Early End Confirm Modal */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0"
              style={{ backgroundColor: 'rgba(35, 28, 53, 0.65)' }}
              onClick={() => setShowEndConfirm(false)}
            />

            <motion.div
              className="party-card relative w-full max-w-xs p-5 space-y-4 z-10 text-center"
              style={{ backgroundColor: '#FFFDF7' }}
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              transition={{ type: 'spring', damping: 24, stiffness: 340 }}
            >
              <div className="space-y-1.5">
                <h3 className="text-lg font-black" style={{ color: INK }}>
                  Kết thúc ván này sớm?
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: '#5B5270' }}>
                  Cả bàn sẽ lật toàn bộ vai trò và xem từ khoá của hai phe ngay bây giờ.
                </p>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setShowEndConfirm(false)
                  }}
                  className="btn-party-secondary flex-1 py-2.5 text-sm cursor-pointer"
                >
                  Chơi tiếp
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    triggerHaptic(30)
                    setShowEndConfirm(false)
                    endGame()
                  }}
                  className="btn-party-danger flex-1 py-2.5 text-sm cursor-pointer"
                >
                  Lật bài luôn
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
