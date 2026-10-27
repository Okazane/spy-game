import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Flag } from '@phosphor-icons/react'
import { useGameStore, type Player, type Role } from '../stores/gameStore'
import { playClickSound, triggerHaptic } from '../utils/sound'
import { getAvatarByIndex } from '../data/avatars'
import { EliminateDialog, RoleRevealDialog } from '../components/EliminateDialog'

const ROLE_BADGE: Record<Role, { label: string; color: string; bg: string; border: string; emoji: string }> = {
  civilian: { label: 'Dân Thường', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', emoji: '🛡️' },
  spy: { label: 'Gián Điệp', color: '#b91c1c', bg: '#fef2f2', border: '#fecaca', emoji: '🕶️' },
  'white-hat': { label: 'Mũ Trắng', color: '#6d28d9', bg: '#f5f3ff', border: '#ddd6fe', emoji: '👻' },
}


function PlayerCard({
  player,
  index,
  speakingOrderIndex,
  onEliminate,
}: {
  player: Player
  index: number
  speakingOrderIndex?: number
  onEliminate: (p: Player) => void
}) {
  const avatar = getAvatarByIndex(index)

  return (
    <div
      onClick={() => {
        if (player.isAlive) {
          playClickSound()
          triggerHaptic(20)
          onEliminate(player)
        }
      }}
      className="w-full flex items-center justify-between gap-3 p-3 px-3.5 rounded-[3px] text-left transition-all cursor-pointer game-card-tactile shadow-[3px_3px_0_#18120c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
      style={{
        opacity: player.isAlive ? 1 : 0.55,
      }}
    >
      {/* Left info: Avatar & Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1 pr-1">
        <div
          className="w-10 h-10 rounded-[2px] flex items-center justify-center text-xl shadow-[1px_1px_0_#18120c] border border-[#18120c] flex-shrink-0"
          style={{ backgroundColor: player.isAlive ? avatar.bg : '#d5cbbe' }}
        >
          {player.isAlive ? avatar.emoji : '💀'}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '0.98rem',
                fontWeight: 800,
                color: player.isAlive ? 'var(--ink-primary)' : 'var(--ink-muted)',
                textDecoration: player.isAlive ? 'none' : 'line-through',
              }}
              className="truncate"
            >
              {player.name}
            </p>

            {speakingOrderIndex !== undefined && (
              <span
                className="text-[0.68rem] px-2 py-0.5 rounded-[2px] font-black flex-shrink-0 border border-[#18120c]"
                style={{
                  backgroundColor: speakingOrderIndex === 1 ? '#c8a165' : '#fcfaf3',
                  color: '#181410',
                  fontFamily: 'var(--font-body)',
                }}
              >
                #{speakingOrderIndex}
              </span>
            )}
          </div>

          {!player.isAlive && (
            <div className="flex items-center gap-1 mt-1">
              <span
                className="text-[0.66rem] font-black px-2 py-0.5 rounded-[2px] border inline-flex items-center gap-1 shadow-[1px_1px_0_#18120c]"
                style={{
                  backgroundColor: ROLE_BADGE[player.role].bg,
                  color: ROLE_BADGE[player.role].color,
                  borderColor: ROLE_BADGE[player.role].color,
                  fontFamily: 'var(--font-stamp)',
                }}
              >
                <span>{ROLE_BADGE[player.role].emoji}</span>
                <span>{ROLE_BADGE[player.role].label}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Nút nghi ngờ hoặc nhãn Đã loại */}
      {player.isAlive ? (
        <span
          className="btn-stamp-red text-xs px-3 py-1.5 font-black flex-shrink-0 whitespace-nowrap shadow-[2px_2px_0_#3b0505]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          NGHI NGỜ ✕
        </span>
      ) : (
        <span
          className="text-xs px-2.5 py-1 rounded-[2px] font-bold text-[#8c7b6b] bg-[#e6ded2] border border-[#281e15]/40 flex-shrink-0 whitespace-nowrap"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          ĐÃ LOẠI
        </span>
      )}
    </div>
  )
}

function SuspenseSplash() {
  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#0b0907]"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 1.05 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="text-center px-6"
      >
        <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '2.3rem', color: '#b91c1c', marginBottom: 12, letterSpacing: '-0.02em' }}>
          HÃY CẨN THẬN...
        </h1>
        <p className="text-[#d8cdbd] text-base font-medium" style={{ fontFamily: 'var(--font-body)' }}>
          Kẻ trà trộn đang ở ngay bên cạnh bạn
        </p>
      </motion.div>
    </motion.div>
  )
}

export function GameScreen() {
  const { players, eliminatePlayer, speakingOrder, winner, endGame } = useGameStore()
  const [pendingPlayer, setPendingPlayer] = useState<Player | null>(null)
  const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null)
  const [showSplash, setShowSplash] = useState(true)
  const [showEndConfirm, setShowEndConfirm] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1800)
    return () => clearTimeout(t)
  }, [])

  const aliveCount = useMemo(() => players.filter(p => p.isAlive).length, [players])

  const handleEliminate = (player: Player) => setPendingPlayer(player)
  const handleConfirm = () => {
    if (pendingPlayer) {
      eliminatePlayer(pendingPlayer.id)
      setRevealedPlayer(pendingPlayer)
      setPendingPlayer(null)
    }
  }

  // speakingOrder lưu theo player.id — tìm index theo ID
  const getSpeakingOrderIndex = useCallback((playerId: string) => {
    const idx = speakingOrder.indexOf(playerId)
    return idx >= 0 ? idx + 1 : undefined
  }, [speakingOrder])

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && <SuspenseSplash key="splash" />}
      </AnimatePresence>

      <div className="w-full min-h-dvh flex flex-col p-4 pb-6 max-w-[440px] mx-auto relative select-none box-border overflow-x-hidden gap-3">

        {/* ── Header: Số người còn sống + Nút kết thúc ── */}
        <div className="flex items-center justify-between pt-1 pb-1 border-b border-[#281e15]/20">
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, fontSize: '1.2rem', color: 'var(--ink-primary)' }}>
              ĐANG ĐIỀU TRA
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 700 }}>
              {aliveCount}/{players.length} điệp viên còn sống
            </p>
          </div>

          <button
            onClick={() => {
              playClickSound()
              triggerHaptic(20)
              setShowEndConfirm(true)
            }}
            aria-label="Kết thúc ván"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[2px] font-bold text-xs text-[#b91c1c] bg-[#fdfcf8] border-[1.5px] border-[#b91c1c] cursor-pointer shadow-[2px_2px_0_#b91c1c] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            <Flag size={14} weight="fill" />
            DỪNG VÁN
          </button>
        </div>

        <div className="flex-1">
          {/* Speaking order bar */}
          {speakingOrder.length > 0 && (
            <div className="mb-3">
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {speakingOrder.map((playerId, idx) => {
                  const name = players.find(p => p.id === playerId)?.name ?? playerId
                  return (
                    <div
                      key={playerId}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-[2px] flex-shrink-0 border border-[#281e15] shadow-[1px_1px_0_#18120c]"
                      style={{
                        backgroundColor: idx === 0 ? '#fdf8e8' : '#fcfaf3',
                        borderColor: idx === 0 ? '#8c6530' : '#281e15',
                      }}
                    >
                      <span className="text-xs font-black" style={{ color: idx === 0 ? '#8c6530' : '#675543', fontFamily: 'var(--font-body)' }}>
                        #{idx + 1}
                      </span>
                      <span className="text-xs font-bold text-[var(--ink-primary)]" style={{ fontFamily: 'var(--font-body)' }}>
                        {name}
                      </span>
                      {idx === 0 && <span className="text-xs">👑</span>}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Player Cards List */}
          <div className="space-y-2.5 pb-6">
            {players.map((player, i) => (
              <PlayerCard
                key={player.id}
                player={player}
                index={i}
                speakingOrderIndex={getSpeakingOrderIndex(player.id)}
                onEliminate={handleEliminate}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Confirm loại người */}
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

      {/* Role Reveal Dialog */}
      <AnimatePresence>
        {revealedPlayer && (
          <RoleRevealDialog
            player={revealedPlayer}
            playerIndex={players.findIndex(p => p.id === revealedPlayer.id)}
            isGameOver={winner !== null}
            aliveCount={players.filter(p => p.isAlive).length}
            onContinue={() => {
              if (winner !== null) {
                endGame()
              } else {
                setRevealedPlayer(null)
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* Dialog xác nhận kết thúc ván */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-sm" onClick={() => setShowEndConfirm(false)} />
            <motion.div
              className="relative w-full max-w-sm bg-[#fcfaf3] rounded-[3px] p-6 shadow-[6px_6px_0_#18120c] border-[1.5px] border-[#18120c] z-10 space-y-4 text-center"
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <div className="space-y-1">
                <div className="w-12 h-12 rounded-[2px] mx-auto flex items-center justify-center bg-[#b91c1c] text-white text-2xl mb-2 shadow-[2px_2px_0_#18120c] border border-[#18120c]">
                  🏳️
                </div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 900, color: 'var(--ink-primary)' }}>
                  DỪNG VÁN ĐẤU?
                </h3>
                <p className="text-xs text-[var(--ink-muted)] font-medium" style={{ fontFamily: 'var(--font-body)' }}>
                  Ván đấu sẽ lập tức khép lại và mở niêm phong toàn bộ danh tính.
                </p>
              </div>
              <div className="flex gap-2.5 pt-2">
                <button
                  onClick={() => setShowEndConfirm(false)}
                  className="flex-1 py-3 rounded-[2px] font-bold text-xs text-[#181410] bg-[#f4ede0] border-[1.5px] border-[#18120c] cursor-pointer shadow-[2px_2px_0_#18120c] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  TIẾP TỤC ĐIỀU TRA
                </button>
                <button
                  onClick={() => {
                    triggerHaptic(40)
                    setShowEndConfirm(false)
                    endGame()
                  }}
                  className="btn-stamp-red flex-1 py-3 text-xs font-black"
                >
                  KẾT THÚC NGAY
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
