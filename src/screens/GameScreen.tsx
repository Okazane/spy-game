import { memo, useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowCounterClockwise,
  Detective,
  Ghost,
  Pause,
  Play,
  SmileyWink,
  Timer,
  XCircle,
} from '@phosphor-icons/react'
import { useGameStore, type Player, type Role } from '../stores/gameStore'
import {
  playClickSound,
  playTimeUpSound,
  playTimerTickSound,
  triggerHaptic,
} from '../utils/sound'
import { getAvatarByIndex } from '../data/avatars'
import { EliminateDialog, RoleRevealDialog } from '../components/EliminateDialog'
import { AvatarPortrait } from '../components/PartyVisuals'

const INK = '#231C35'
const DEFAULT_TIMER_SECONDS = 90

const ROLE_STAMP: Record<Role, { label: string; shortLabel: string; color: string; bg: string; border: string }> = {
  civilian: {
    label: 'Dân thường',
    shortLabel: 'Dân',
    color: '#0F766E',
    bg: '#CCFBF1',
    border: '#0D9488',
  },
  spy: {
    label: 'Gián điệp',
    shortLabel: 'Gián',
    color: '#BE123C',
    bg: '#FFE4E6',
    border: '#E11D48',
  },
  'white-hat': {
    label: 'Mũ trắng',
    shortLabel: 'Mũ trắng',
    color: '#6D28D9',
    bg: '#F3E8FF',
    border: '#7C3AED',
  },
}

function getGridColumns(total: number): number {
  if (total <= 4) return 2
  if (total <= 9) return 3
  if (total <= 16) return 4
  return 5
}

interface PlayerCardProps {
  player: Player
  index: number
  totalPlayers: number
  speakingOrderIndex?: number
  onEliminate: (player: Player) => void
}

const PlayerCard = memo(function PlayerCard({
  player,
  index,
  totalPlayers,
  speakingOrderIndex,
  onEliminate,
}: PlayerCardProps) {
  const avatar = getAvatarByIndex(index)
  const stamp = ROLE_STAMP[player.role]
  const ultraDense = totalPlayers >= 17
  const dense = totalPlayers >= 10
  const compact = totalPlayers >= 7
  const avatarSize =
    totalPlayers <= 4
      ? 78
      : totalPlayers <= 6
      ? 66
      : totalPlayers <= 9
      ? 52
      : totalPlayers <= 12
      ? 42
      : ultraDense
      ? 30
      : 36

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
      className={`relative w-full h-full rounded-2xl flex flex-col items-stretch justify-between text-center overflow-hidden transition-opacity ${
        player.isAlive ? 'cursor-pointer' : 'cursor-default opacity-75'
      }`}
      style={{
        backgroundColor: player.isAlive ? '#FFFFFF' : '#F4EFE4',
        border: `2px solid ${INK}`,
        boxShadow: player.isAlive ? `0 3px 0 ${INK}` : 'none',
      }}
    >
      {/* Pastel Header Band with Avatar + Corner Turn Badge */}
      <div
        className={`relative w-full flex-1 min-h-0 flex items-center justify-center ${
          ultraDense ? 'py-1' : dense ? 'py-1.5' : compact ? 'py-2' : 'pt-3 pb-2'
        }`}
        style={{
          backgroundColor: player.isAlive ? avatar.bg : '#EAE2D3',
          borderBottom: '1.5px solid rgba(35, 28, 53, 0.14)',
        }}
      >
        {speakingOrderIndex !== undefined && (
          <span
            className={`absolute leading-none font-black rounded-md ${
              ultraDense
                ? 'top-0.5 left-0.5 px-1 py-0.5 text-[0.55rem]'
                : dense
                ? 'top-1 left-1 px-1 py-0.5 text-[0.6rem]'
                : 'top-1.5 left-1.5 px-1.5 py-0.5 text-[0.66rem]'
            }`}
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: speakingOrderIndex === 1 && player.isAlive ? '#FEF3C7' : '#FFFFFF',
              color: INK,
              border: `1.5px solid ${INK}`,
            }}
          >
            #{speakingOrderIndex}
          </span>
        )}

        {!player.isAlive && (
          <span className="absolute top-1 right-1" aria-hidden="true">
            <XCircle size={ultraDense ? 12 : dense ? 13 : 16} weight="fill" color="#8C82A0" />
          </span>
        )}

        <AvatarPortrait
          avatar={avatar}
          size={avatarSize}
          dimmed={!player.isAlive}
        />
      </div>

      {/* Bottom Body: Clean Player Name (+ Revealed Role Stamp ONLY when eliminated) */}
      <div
        className={`w-full shrink-0 flex flex-col items-center justify-center ${
          ultraDense
            ? 'px-1 py-1 gap-0.5'
            : dense
            ? 'px-1.5 py-1.5 gap-0.5'
            : 'px-2 py-2 gap-1'
        }`}
      >
        <p
          className={`w-full truncate font-black leading-tight ${
            ultraDense
              ? 'text-[0.66rem]'
              : dense
              ? 'text-[0.74rem]'
              : compact
              ? 'text-[0.8rem]'
              : 'text-[0.9rem]'
          }`}
          style={{
            fontFamily: 'var(--font-display)',
            color: player.isAlive ? INK : '#8C82A0',
            textDecoration: player.isAlive ? 'none' : 'line-through',
          }}
        >
          {player.name}
        </p>

        {!player.isAlive && (
          <span
            className={`w-full rounded-md inline-block font-extrabold leading-tight ${
              ultraDense
                ? 'py-px text-[0.54rem]'
                : dense
                ? 'py-0.5 text-[0.58rem]'
                : 'py-0.5 text-[0.66rem]'
            }`}
            style={{
              fontFamily: 'var(--font-display)',
              backgroundColor: stamp.bg,
              color: stamp.color,
              border: `1px solid ${stamp.border}`,
            }}
          >
            {ultraDense ? stamp.shortLabel : stamp.label}
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
  const endGame = useGameStore(s => s.endGame)

  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null)
  const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(DEFAULT_TIMER_SECONDS)
  const [timerRunning, setTimerRunning] = useState(false)

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

  useEffect(() => {
    if (!timerRunning) return
    const id = window.setInterval(() => {
      setTimerSeconds(prev => {
        if (prev <= 1) {
          setTimerRunning(false)
          playTimeUpSound()
          triggerHaptic([40, 60, 40])
          return 0
        }
        const next = prev - 1
        if (next <= 5) {
          playTimerTickSound(true)
        }
        return next
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [timerRunning])

  const playerMap = useMemo(() => {
    const map = new Map<string, Player>()
    players.forEach(p => map.set(p.id, p))
    return map
  }, [players])

  const { aliveCount, aliveCivilian, aliveSpy, aliveWhiteHat, hasSpy, hasWhiteHat } = useMemo(() => {
    let alive = 0
    let civilian = 0
    let spy = 0
    let whiteHat = 0
    let anySpy = false
    let anyWhiteHat = false
    for (const p of players) {
      if (p.role === 'spy') anySpy = true
      if (p.role === 'white-hat') anyWhiteHat = true
      if (!p.isAlive) continue
      alive += 1
      if (p.role === 'civilian') civilian += 1
      else if (p.role === 'spy') spy += 1
      else whiteHat += 1
    }
    return {
      aliveCount: alive,
      aliveCivilian: civilian,
      aliveSpy: spy,
      aliveWhiteHat: whiteHat,
      hasSpy: anySpy,
      hasWhiteHat: anyWhiteHat,
    }
  }, [players])

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

  const handleToggleTimer = () => {
    if (timerSeconds === 0) {
      playClickSound(1.06)
      setTimerSeconds(DEFAULT_TIMER_SECONDS)
      setTimerRunning(true)
      return
    }
    playClickSound(timerRunning ? 0.94 : 1.06)
    triggerHaptic(14)
    setTimerRunning(prev => !prev)
  }

  const handleResetTimer = () => {
    playClickSound(0.9)
    triggerHaptic(12)
    setTimerRunning(false)
    setTimerSeconds(DEFAULT_TIMER_SECONDS)
  }

  const cols = getGridColumns(players.length)
  const dense = players.length >= 10
  const isTimerUrgent = timerSeconds <= 15

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between px-4 py-3 gap-2 select-none overflow-hidden">
        {/* 1. Top Bar: Alive Count + 90s Timer Chip + End Game */}
        <header className="flex items-center justify-between gap-1.5 shrink-0">
          <span
            className="party-pill px-2.5 py-1 text-[0.74rem] font-extrabold shrink-0"
            style={{
              backgroundColor: '#CCFBF1',
              color: INK,
              border: `2px solid ${INK}`,
            }}
          >
            Còn {aliveCount}/{players.length}
          </span>

          {/* Compact 90s Timer Chip */}
          <div
            className="inline-flex items-center rounded-full overflow-hidden shrink-0"
            style={{
              backgroundColor: isTimerUrgent ? '#FFE4E6' : timerRunning ? '#FEF3C7' : '#FFFFFF',
              border: `2px solid ${INK}`,
              boxShadow: `0 2px 0 ${INK}`,
            }}
          >
            <button
              type="button"
              onClick={handleToggleTimer}
              aria-label={timerRunning ? 'Tạm dừng đồng hồ' : 'Bắt đầu đồng hồ'}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[0.74rem] font-black cursor-pointer"
              style={{
                fontFamily: 'var(--font-display)',
                color: isTimerUrgent ? '#BE123C' : INK,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              <Timer size={14} weight="bold" />
              <span>{timerSeconds}s</span>
              {timerRunning ? <Pause size={12} weight="fill" /> : <Play size={12} weight="fill" />}
            </button>

            {(timerRunning || timerSeconds !== DEFAULT_TIMER_SECONDS) && (
              <button
                type="button"
                onClick={handleResetTimer}
                aria-label="Đặt lại 90 giây"
                className="pr-2 pl-1.5 py-1 inline-flex items-center justify-center cursor-pointer"
                style={{
                  borderLeft: '1.5px solid rgba(35, 28, 53, 0.2)',
                  color: INK,
                }}
              >
                <ArrowCounterClockwise size={12} weight="bold" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              playClickSound()
              triggerHaptic(16)
              setShowEndConfirm(true)
            }}
            className="btn-party-secondary px-2.5 py-1 text-[0.74rem] inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            <span>Kết thúc</span>
          </button>
        </header>

        {/* 2. Compact Còn ẩn Pill Row (Zero identity leak; hides 0-spy / 0-white-hat factions) */}
        <section
          aria-label="Số vai trò còn ẩn"
          className="rounded-xl px-2.5 py-1.5 flex items-center justify-between gap-2 shrink-0"
          style={{
            backgroundColor: '#FFFDF7',
            border: '1.5px solid rgba(35, 28, 53, 0.18)',
          }}
        >
          <span
            className="text-[0.7rem] font-extrabold shrink-0"
            style={{ fontFamily: 'var(--font-display)', color: '#5B5270' }}
          >
            Còn ẩn
          </span>

          <div className="flex items-center justify-end gap-1.5 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] font-extrabold"
              style={{
                fontFamily: 'var(--font-display)',
                backgroundColor: '#CCFBF1',
                color: '#0F766E',
                border: '1.5px solid rgba(13, 148, 136, 0.35)',
              }}
            >
              <SmileyWink size={12} weight="duotone" />
              <span>{aliveCivilian} Dân</span>
            </span>

            {hasSpy && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] font-extrabold"
                style={{
                  fontFamily: 'var(--font-display)',
                  backgroundColor: '#FFE4E6',
                  color: '#BE123C',
                  border: '1.5px solid rgba(225, 29, 72, 0.35)',
                }}
              >
                <Detective size={12} weight="duotone" />
                <span>{aliveSpy} Gián điệp</span>
              </span>
            )}

            {hasWhiteHat && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.68rem] font-extrabold"
                style={{
                  fontFamily: 'var(--font-display)',
                  backgroundColor: '#F3E8FF',
                  color: '#6D28D9',
                  border: '1.5px solid rgba(124, 58, 237, 0.35)',
                }}
              >
                <Ghost size={12} weight="duotone" />
                <span>{aliveWhiteHat} Mũ trắng</span>
              </span>
            )}
          </div>
        </section>

        {/* 3. Clean Thứ tự nói Card */}
        <section
          className={`rounded-2xl px-3 shrink-0 ${dense ? 'py-2' : 'py-2.5'}`}
          style={{
            backgroundColor: '#FFFFFF',
            border: `2px solid ${INK}`,
            boxShadow: `0 2px 0 ${INK}`,
          }}
        >
          <p
            className={`font-extrabold ${dense ? 'text-[0.68rem] mb-1' : 'text-[0.72rem] mb-1.5'}`}
            style={{ fontFamily: 'var(--font-display)', color: '#5B5270' }}
          >
            Thứ tự nói
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-[82px] overflow-y-auto pr-0.5">
            {effectiveOrder.map((playerId, idx) => {
              const p = playerMap.get(playerId)
              const name = p?.name || `Người ${idx + 1}`
              const isAlive = p?.isAlive ?? true
              return (
                <span
                  key={playerId}
                  className={`inline-flex items-center gap-1 rounded-full font-bold ${
                    dense ? 'px-2 py-0.5 text-[0.68rem]' : 'px-2.5 py-0.5 text-[0.74rem]'
                  }`}
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
                  <span className="max-w-[92px] truncate">{name}</span>
                </span>
              )
            })}
          </div>
        </section>

        {/* 4. Clean Player Cards Grid (3..20 players) */}
        <section className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div
            className={`flex-1 min-h-0 overflow-y-auto pr-0.5 grid ${
              players.length >= 17 ? 'gap-1.5' : dense ? 'gap-1.5' : 'gap-2'
            }`}
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: players.length <= 12 ? 'minmax(0, 1fr)' : 'minmax(82px, 1fr)',
            }}
          >
            {players.map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={i}
                totalPlayers={players.length}
                speakingOrderIndex={getSpeakingOrderIndex(player.id)}
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
              <h3
                className="text-lg font-black"
                style={{ fontFamily: 'var(--font-display)', color: INK }}
              >
                Kết thúc ván hiện tại?
              </h3>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    setShowEndConfirm(false)
                  }}
                  className="btn-party-secondary flex-1 py-2.5 text-sm cursor-pointer"
                >
                  Huỷ
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
                  Kết thúc
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
