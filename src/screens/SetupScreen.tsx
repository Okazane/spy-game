import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ArrowRight, Minus, Plus, Question, Trophy } from '@phosphor-icons/react'
import { useGameStore, calcCivilian, clampSettings } from '../stores/gameStore'
import type { Difficulty } from '../data/keywords'
import { getAvatarByIndex } from '../data/avatars'
import { AvatarPortrait } from '../components/PartyVisuals'
import {
  playClickSound,
  playFlipSound,
  playPopSound,
  triggerHaptic,
} from '../utils/sound'
import { RulesModal } from '../components/RulesModal'
import { DataHubModal, type DataHubTab } from '../components/DataHubModal'

const INK = '#231C35'

const DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: Difficulty
  label: string
  bg: string
}> = [
  { value: 'easy', label: 'Dễ', bg: '#DCFCE7' },
  { value: 'medium', label: 'Vừa', bg: '#FEF3C7' },
  { value: 'hard', label: 'Khó', bg: '#FFE4E6' },
]

const ROLE_MODES: ReadonlyArray<{
  hide: boolean
  label: string
  bg: string
}> = [
  { hide: false, label: 'Lộ vai', bg: '#E0F2FE' },
  { hide: true, label: 'Mù vai', bg: '#EDE9FE' },
]

const SEAT_ROLE_STYLE = {
  civilian: { dot: '#0D9488', bg: '#CCFBF1', text: '#0F766E', short: 'Dân' },
  spy: { dot: '#E11D48', bg: '#FFE4E6', text: '#BE123C', short: 'Gián' },
  'white-hat': { dot: '#7C3AED', bg: '#EDE9FE', text: '#6D28D9', short: 'Mũ' },
} as const

function Stepper({
  value,
  onDec,
  onInc,
  decDisabled,
  incDisabled,
  decLabel,
  incLabel,
}: {
  value: number
  onDec: () => void
  onInc: () => void
  decDisabled: boolean
  incDisabled: boolean
  decLabel: string
  incLabel: string
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={onDec}
        disabled={decDisabled}
        aria-label={decLabel}
        className="btn-party-secondary w-9 h-9 flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
      >
        <Minus size={16} weight="bold" />
      </button>
      <span
        className="w-10 text-center text-[1.18rem] font-black tabular-nums"
        style={{ fontFamily: 'var(--font-display)', color: INK }}
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onInc}
        disabled={incDisabled}
        aria-label={incLabel}
        className="btn-party-secondary w-9 h-9 flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
      >
        <Plus size={16} weight="bold" />
      </button>
    </div>
  )
}

export function SetupScreen() {
  const rawSettings = useGameStore(s => s.settings)
  const previousNames = useGameStore(s => s.previousNames)
  const customKeywords = useGameStore(s => s.customKeywords)
  const setSettings = useGameStore(s => s.setSettings)
  const startGame = useGameStore(s => s.startGame)
  const goToPhase = useGameStore(s => s.goToPhase)

  const settings = clampSettings(rawSettings)
  const { totalPlayers, spyCount, whiteHatCount, difficulty, hideRole } = settings
  const includeCustomKeywords = settings.includeCustomKeywords ?? true
  const customCount = customKeywords.length
  const civilianCount = calcCivilian(settings)
  const maxInfiltrators = totalPlayers - 1

  const [showRules, setShowRules] = useState(false)
  const [dataHubTab, setDataHubTab] = useState<DataHubTab | null>(null)
  const [isEditingTotal, setIsEditingTotal] = useState(false)
  const [draftTotal, setDraftTotal] = useState(String(totalPlayers))

  const difficultyOptions: ReadonlyArray<{ value: Difficulty; label: string; bg: string }> =
    customCount > 0
      ? [...DIFFICULTY_OPTIONS, { value: 'custom', label: 'Tự tạo', bg: '#F3E8FF' }]
      : DIFFICULTY_OPTIONS

  const seatRoles: Array<'civilian' | 'spy' | 'white-hat'> = [
    ...Array<'civilian'>(civilianCount).fill('civilian'),
    ...Array<'spy'>(spyCount).fill('spy'),
    ...Array<'white-hat'>(whiteHatCount).fill('white-hat'),
  ]

  const handleBackHome = () => {
    playClickSound()
    triggerHaptic(15)
    goToPhase('home')
  }

  const setPlayerCount = (val: number) => {
    const next = Math.max(3, Math.min(20, Math.round(val)))
    setDraftTotal(String(next))
    if (next === totalPlayers) return
    playPopSound(next - 6)
    triggerHaptic(12)
    setSettings({ totalPlayers: next })
  }

  const commitTotalInput = () => {
    setIsEditingTotal(false)
    const parsed = parseInt(draftTotal, 10)
    if (Number.isNaN(parsed)) {
      setDraftTotal(String(totalPlayers))
      return
    }
    setPlayerCount(parsed)
  }

  const incSpy = () => {
    if (spyCount < maxInfiltrators) {
      playPopSound(spyCount + 1)
      triggerHaptic(14)
      setSettings({ spyCount: spyCount + 1 })
    }
  }

  const decSpy = () => {
    if (spyCount > 0) {
      playPopSound(spyCount - 1)
      triggerHaptic(14)
      setSettings({ spyCount: spyCount - 1 })
    }
  }

  const incWhite = () => {
    if (whiteHatCount < maxInfiltrators) {
      playPopSound(whiteHatCount + 2)
      triggerHaptic(14)
      setSettings({ whiteHatCount: whiteHatCount + 1 })
    }
  }

  const decWhite = () => {
    if (whiteHatCount > 0) {
      playPopSound(whiteHatCount)
      triggerHaptic(14)
      setSettings({ whiteHatCount: whiteHatCount - 1 })
    }
  }

  const avatarChipSize =
    totalPlayers <= 4
      ? 64
      : totalPlayers <= 8
      ? 54
      : totalPlayers <= 12
      ? 44
      : totalPlayers <= 15
      ? 38
      : 34

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] gap-2.5 select-none overflow-hidden">
        {/* 1. Header */}
        <header className="flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleBackHome}
            aria-label="Quay lại màn hình chính"
            className="btn-party-secondary w-9 h-9 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft size={19} weight="bold" />
          </button>

          <h1
            className="text-[1.28rem] font-black leading-none"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            Tạo Bàn Chơi
          </h1>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                playClickSound()
                triggerHaptic(12)
                setDataHubTab('keywords')
              }}
              aria-label="Mở kho từ tự tạo và bảng điểm"
              className="btn-party-secondary w-9 h-9 flex items-center justify-center cursor-pointer"
            >
              <Trophy size={18} weight="duotone" color="#D97706" />
            </button>

            <button
              type="button"
              onClick={() => {
                playClickSound()
                triggerHaptic(12)
                setShowRules(true)
              }}
              aria-label="Xem luật chơi"
              className="btn-party-secondary w-9 h-9 flex items-center justify-center cursor-pointer"
            >
              <Question size={19} weight="bold" />
            </button>
          </div>
        </header>

        {/* 2. Balanced Customization Stack */}
        <div className="flex-1 min-h-0 flex flex-col justify-between gap-2.5 py-0.5 overflow-hidden">
          {/* Players & Roles Card */}
          <section
            aria-label="Số người và vai trò"
            className="min-h-0 rounded-2xl p-3 flex flex-col gap-2.5 overflow-hidden"
            style={{
              backgroundColor: '#FFFFFF',
              border: `2px solid ${INK}`,
              boxShadow: `0 3.5px 0 ${INK}`,
            }}
          >
            {/* Row 1: Total Players with Stepper + Direct Number Input */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[0.95rem] font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: INK }}
              >
                Người chơi
              </span>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPlayerCount(totalPlayers - 1)}
                  disabled={totalPlayers <= 3}
                  aria-label="Giảm số người chơi"
                  className="btn-party-secondary w-9 h-9 flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Minus size={16} weight="bold" />
                </button>

                <input
                  type="number"
                  inputMode="numeric"
                  min={3}
                  max={20}
                  aria-label="Nhập số người chơi (3 đến 20)"
                  value={isEditingTotal ? draftTotal : String(totalPlayers)}
                  onFocus={e => {
                    setIsEditingTotal(true)
                    setDraftTotal(String(totalPlayers))
                    e.currentTarget.select()
                  }}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '')
                    setDraftTotal(raw)
                    const parsed = parseInt(raw, 10)
                    if (!Number.isNaN(parsed) && parsed >= 3 && parsed <= 20) {
                      if (parsed !== totalPlayers) {
                        playPopSound(parsed - 6)
                        setSettings({ totalPlayers: parsed })
                      }
                    }
                  }}
                  onBlur={commitTotalInput}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.currentTarget.blur()
                    }
                  }}
                  className="w-12 h-9 rounded-xl text-center text-[1.12rem] font-black tabular-nums select-text outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{
                    fontFamily: 'var(--font-display)',
                    color: INK,
                    backgroundColor: '#FAF4E8',
                    border: `2px solid ${INK}`,
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                  }}
                />

                <button
                  type="button"
                  onClick={() => setPlayerCount(totalPlayers + 1)}
                  disabled={totalPlayers >= 20}
                  aria-label="Tăng số người chơi"
                  className="btn-party-secondary w-9 h-9 flex items-center justify-center cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                >
                  <Plus size={16} weight="bold" />
                </button>
              </div>
            </div>

            <div className="h-px" style={{ backgroundColor: '#EDE5D5' }} />

            {/* Row 2: Spy Count */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[0.95rem] font-extrabold inline-flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)', color: '#BE123C' }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: '#E11D48' }}
                />
                Gián điệp
              </span>

              <Stepper
                value={spyCount}
                onDec={decSpy}
                onInc={incSpy}
                decDisabled={spyCount <= 0}
                incDisabled={spyCount >= maxInfiltrators}
                decLabel="Giảm số gián điệp"
                incLabel="Tăng số gián điệp"
              />
            </div>

            <div className="h-px" style={{ backgroundColor: '#EDE5D5' }} />

            {/* Row 3: White Hat Count */}
            <div className="flex items-center justify-between gap-2">
              <span
                className="text-[0.95rem] font-extrabold inline-flex items-center gap-2"
                style={{ fontFamily: 'var(--font-display)', color: '#6D28D9' }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: '#7C3AED' }}
                />
                Mũ trắng
              </span>

              <Stepper
                value={whiteHatCount}
                onDec={decWhite}
                onInc={incWhite}
                decDisabled={whiteHatCount <= 0}
                incDisabled={whiteHatCount >= maxInfiltrators}
                decLabel="Giảm số mũ trắng"
                incLabel="Tăng số mũ trắng"
              />
            </div>

            {/* Snug, Centered Anime Avatar Roster */}
            <div
              className="min-h-0 rounded-xl px-2.5 py-2.5 flex flex-col gap-2 overflow-hidden"
              style={{
                backgroundColor: '#FAF4E8',
                border: `1.5px solid ${INK}`,
                backgroundImage: 'radial-gradient(rgba(35, 28, 53, 0.08) 1px, transparent 1px)',
                backgroundSize: '14px 14px',
              }}
            >
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[0.76rem] font-extrabold shrink-0">
                <span className="inline-flex items-center gap-1.5" style={{ color: '#0F766E' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#0D9488' }} />
                  Dân: {civilianCount}
                </span>
                <span aria-hidden="true" style={{ color: '#8C82A0' }}>
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: '#BE123C' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#E11D48' }} />
                  Gián: {spyCount}
                </span>
                <span aria-hidden="true" style={{ color: '#8C82A0' }}>
                  ·
                </span>
                <span className="inline-flex items-center gap-1.5" style={{ color: '#6D28D9' }}>
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
                  Mũ trắng: {whiteHatCount}
                </span>
              </div>

              <div className="min-h-0 max-h-[252px] overflow-y-auto flex flex-wrap items-center justify-center gap-2 py-0.5">
                {seatRoles.map((role, idx) => {
                  const roleStyle = SEAT_ROLE_STYLE[role]
                  const avatar = getAvatarByIndex(idx)
                  const seatLabel = previousNames[idx]?.trim() || `#${idx + 1}`
                  return (
                    <motion.div
                      key={`seat-${idx}`}
                      initial={{ scale: 0.86, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                      className="rounded-xl px-2 pt-1.5 pb-1 flex flex-col items-center gap-1 shrink-0"
                      style={{
                        backgroundColor: '#FFFFFF',
                        border: `1.5px solid ${roleStyle.dot}`,
                        boxShadow: '0 2px 0 rgba(35, 28, 53, 0.14)',
                        minWidth: totalPlayers <= 8 ? 72 : totalPlayers <= 12 ? 62 : 54,
                      }}
                    >
                      <AvatarPortrait
                        avatar={avatar}
                        size={avatarChipSize}
                        shape="circle"
                      />
                      <div className="flex items-center justify-center gap-1 leading-none">
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[0.56rem] font-black leading-none"
                          style={{
                            fontFamily: 'var(--font-display)',
                            backgroundColor: roleStyle.bg,
                            color: roleStyle.text,
                            border: `1px solid ${roleStyle.dot}`,
                          }}
                        >
                          {roleStyle.short}
                        </span>
                        {totalPlayers <= 12 && (
                          <span
                            className="max-w-[44px] truncate text-[0.6rem] font-extrabold leading-none"
                            style={{ fontFamily: 'var(--font-display)', color: '#5B5270' }}
                          >
                            {seatLabel}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </section>

          {/* Clean Segmented Difficulty Card */}
          <section
            className="rounded-2xl p-3 space-y-2 shrink-0"
            style={{
              backgroundColor: '#FFFFFF',
              border: `2px solid ${INK}`,
              boxShadow: `0 3px 0 ${INK}`,
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className="px-0.5 text-[0.82rem] font-extrabold leading-none"
                style={{ fontFamily: 'var(--font-display)', color: INK }}
              >
                Độ khó
              </span>

              {customCount > 0 && difficulty !== 'custom' ? (
                <button
                  type="button"
                  onClick={() => {
                    playFlipSound()
                    triggerHaptic(10)
                    setSettings({ includeCustomKeywords: !includeCustomKeywords })
                  }}
                  className="px-2 py-0.5 rounded-full text-[0.68rem] font-extrabold cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    backgroundColor: includeCustomKeywords ? '#CCFBF1' : '#F2E9D8',
                    color: includeCustomKeywords ? '#0F766E' : '#5B5270',
                    border: `1.5px solid ${INK}`,
                  }}
                >
                  {includeCustomKeywords ? `Gộp +${customCount} từ riêng` : 'Không gộp từ riêng'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    playClickSound()
                    triggerHaptic(12)
                    setDataHubTab('keywords')
                  }}
                  className="px-2 py-0.5 rounded-full text-[0.68rem] font-extrabold cursor-pointer"
                  style={{
                    fontFamily: 'var(--font-display)',
                    backgroundColor: '#FAF4E8',
                    color: '#6D28D9',
                    border: `1.5px solid ${INK}`,
                  }}
                >
                  {customCount > 0 ? `${customCount} cặp từ riêng` : '+ Từ tự tạo'}
                </button>
              )}
            </div>

            <div
              className={`grid gap-2 ${customCount > 0 ? 'grid-cols-4' : 'grid-cols-3'}`}
              role="radiogroup"
              aria-label="Độ khó"
            >
              {difficultyOptions.map(opt => {
                const selected = difficulty === opt.value
                return (
                  <motion.button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => {
                      if (difficulty === opt.value) return
                      playFlipSound()
                      triggerHaptic(14)
                      setSettings({ difficulty: opt.value })
                    }}
                    className="rounded-xl py-2.5 px-1.5 text-center cursor-pointer"
                    style={{
                      backgroundColor: selected ? opt.bg : '#FAF4E8',
                      border: `2px solid ${INK}`,
                      boxShadow: selected ? `0 2.5px 0 ${INK}` : 'none',
                      transform: selected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <span
                      className={`font-black leading-none ${
                        customCount > 0 ? 'text-[0.82rem]' : 'text-[0.9rem]'
                      }`}
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      {opt.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>

          {/* Clean 2-Option Role Visibility Card */}
          <section
            className="rounded-2xl p-3 space-y-2 shrink-0"
            style={{
              backgroundColor: '#FFFFFF',
              border: `2px solid ${INK}`,
              boxShadow: `0 3px 0 ${INK}`,
            }}
          >
            <span
              className="block px-0.5 text-[0.82rem] font-extrabold leading-none"
              style={{ fontFamily: 'var(--font-display)', color: INK }}
            >
              Chế độ vai
            </span>

            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Chế độ vai">
              {ROLE_MODES.map(m => {
                const selected = hideRole === m.hide
                return (
                  <motion.button
                    key={m.label}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      if (hideRole === m.hide) return
                      playFlipSound()
                      triggerHaptic(14)
                      setSettings({ hideRole: m.hide })
                    }}
                    className="rounded-xl py-2.5 px-3 text-center cursor-pointer"
                    style={{
                      backgroundColor: selected ? m.bg : '#FAF4E8',
                      border: `2px solid ${INK}`,
                      boxShadow: selected ? `0 2.5px 0 ${INK}` : 'none',
                      transform: selected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <span
                      className="text-[0.9rem] font-black leading-none"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      {m.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>
        </div>

        {/* 3. Bottom Action CTA */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {
              playClickSound()
              triggerHaptic(30)
              startGame()
            }}
            className="btn-party-primary w-full py-3.5 px-5 text-[1.02rem] font-extrabold cursor-pointer inline-flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>Chia bài ({totalPlayers} người)</span>
            <ArrowRight size={20} weight="bold" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
        {dataHubTab && (
          <DataHubModal initialTab={dataHubTab} onClose={() => setDataHubTab(null)} />
        )}
      </AnimatePresence>
    </>
  )
}
