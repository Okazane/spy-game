import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, ArrowRight, Minus, Plus, Question } from '@phosphor-icons/react'
import { useGameStore, calcCivilian, clampSettings } from '../stores/gameStore'
import type { Difficulty } from '../data/keywords'
import {
  playClickSound,
  playFlipSound,
  playPopSound,
  playShuffleSound,
  triggerHaptic,
} from '../utils/sound'
import { RulesModal } from '../components/RulesModal'

const INK = '#231C35'

const PRESETS = [
  { label: '4 bạn', total: 4, spy: 1, white: 0, bg: '#E0F2FE' },
  { label: '6 bạn', total: 6, spy: 1, white: 1, bg: '#FEF3C7' },
  { label: '8 bạn', total: 8, spy: 2, white: 1, bg: '#FFE4E6' },
  { label: '10 bạn', total: 10, spy: 2, white: 1, bg: '#EDE9FE' },
] as const

const DIFFICULTY_OPTIONS: ReadonlyArray<{
  value: Difficulty
  title: string
  sub: string
  bg: string
  accent: string
}> = [
  { value: 'easy', title: 'Khởi động', sub: 'Từ khác rõ', bg: '#DCFCE7', accent: '#0F766E' },
  { value: 'medium', title: 'Vừa sức', sub: 'Dễ nói hớ', bg: '#FEF3C7', accent: '#B45309' },
  { value: 'hard', title: 'Xoắn não', sub: 'Sát nghĩa', bg: '#FFE4E6', accent: '#BE123C' },
]

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
        className="w-7 text-center text-xl font-black tabular-nums"
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
  const setSettings = useGameStore(s => s.setSettings)
  const startGame = useGameStore(s => s.startGame)

  const settings = clampSettings(rawSettings)
  const { totalPlayers, spyCount, whiteHatCount, difficulty, hideRole } = settings
  const civilianCount = calcCivilian(settings)

  const [showRules, setShowRules] = useState(false)

  const maxSpy = Math.max(1, Math.floor((totalPlayers - whiteHatCount - 1) / 2))
  const maxWhite = Math.max(0, totalPlayers - 2 * spyCount - 1)

  const handleBackHome = () => {
    playClickSound()
    triggerHaptic(15)
    useGameStore.setState({ phase: 'home' })
  }

  const setPlayerCount = (val: number) => {
    const next = Math.max(3, Math.min(15, val))
    if (next === totalPlayers) return
    playPopSound(next - 6)
    triggerHaptic(12)
    setSettings({ totalPlayers: next })
  }

  const applyPreset = (p: (typeof PRESETS)[number]) => {
    playShuffleSound()
    triggerHaptic(15)
    setSettings({ totalPlayers: p.total, spyCount: p.spy, whiteHatCount: p.white })
  }

  const incSpy = () => {
    if (spyCount < maxSpy) {
      playPopSound(spyCount + 1)
      triggerHaptic(15)
      setSettings({ spyCount: spyCount + 1 })
    }
  }

  const decSpy = () => {
    if (spyCount > 1) {
      playPopSound(spyCount - 1)
      triggerHaptic(15)
      setSettings({ spyCount: spyCount - 1 })
    }
  }

  const incWhite = () => {
    if (whiteHatCount < maxWhite) {
      playPopSound(whiteHatCount + 2)
      triggerHaptic(15)
      setSettings({ whiteHatCount: whiteHatCount + 1 })
    }
  }

  const decWhite = () => {
    if (whiteHatCount > 0) {
      playPopSound(whiteHatCount)
      triggerHaptic(15)
      setSettings({ whiteHatCount: whiteHatCount - 1 })
    }
  }

  return (
    <>
      <div className="w-full h-full flex flex-col justify-between px-4 py-3.5 select-none overflow-hidden">
        {/* 1. Compact Header */}
        <header className="flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={handleBackHome}
            aria-label="Quay lại màn hình chính"
            className="btn-party-secondary w-10 h-10 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft size={20} weight="bold" />
          </button>

          <h1
            className="text-[1.35rem] font-black leading-none"
            style={{ fontFamily: 'var(--font-display)', color: INK }}
          >
            Sắp Bàn Chơi
          </h1>

          <button
            type="button"
            onClick={() => {
              playClickSound()
              triggerHaptic(12)
              setShowRules(true)
            }}
            aria-label="Xem luật chơi"
            className="btn-party-secondary w-10 h-10 flex items-center justify-center cursor-pointer"
          >
            <Question size={20} weight="bold" />
          </button>
        </header>

        {/* 2. All Settings Fitted Cleanly in Single Viewport */}
        <div className="flex-1 min-h-0 flex flex-col justify-evenly gap-2.5 py-2">
          {/* Quick Presets Row */}
          <section className="space-y-1.5">
            <div className="flex items-center justify-between px-0.5">
              <span
                className="text-[0.78rem] font-extrabold"
                style={{ fontFamily: 'var(--font-display)', color: '#5B5270' }}
              >
                Chọn nhanh số người
              </span>
              <span
                className="text-[0.74rem] font-bold"
                style={{ fontFamily: 'var(--font-sans)', color: INK }}
              >
                {civilianCount} Dân · {spyCount} Gián
                {whiteHatCount > 0 ? ` · ${whiteHatCount} Mũ trắng` : ''}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map(p => {
                const active =
                  totalPlayers === p.total && spyCount === p.spy && whiteHatCount === p.white
                return (
                  <motion.button
                    key={p.label}
                    type="button"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => applyPreset(p)}
                    aria-pressed={active}
                    className="rounded-xl py-2 px-1.5 text-center cursor-pointer transition-colors"
                    style={{
                      backgroundColor: active ? p.bg : '#FFFFFF',
                      border: `2px solid ${INK}`,
                      boxShadow: active ? `0 3px 0 ${INK}` : `0 2px 0 rgba(35, 28, 53, 0.2)`,
                      transform: active ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <span
                      className="block text-[0.86rem] font-black leading-tight"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      {p.label}
                    </span>
                    <span
                      className="block text-[0.65rem] font-semibold mt-0.5"
                      style={{ fontFamily: 'var(--font-sans)', color: '#5B5270' }}
                    >
                      {p.spy}G{p.white > 0 ? ` · ${p.white}MT` : ''}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>

          {/* 3 Steppers Card */}
          <section
            className="rounded-2xl px-3.5 py-3 space-y-2.5"
            style={{
              backgroundColor: '#FFFFFF',
              border: `2px solid ${INK}`,
              boxShadow: `0 3px 0 ${INK}`,
            }}
          >
            {/* Total Players */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-[0.9rem] font-extrabold leading-tight"
                  style={{ fontFamily: 'var(--font-display)', color: INK }}
                >
                  Tổng người chơi
                </p>
                <p className="text-[0.7rem]" style={{ color: '#8C82A0' }}>
                  Từ 3 đến 15 người (Dân thường: {civilianCount})
                </p>
              </div>
              <Stepper
                value={totalPlayers}
                onDec={() => setPlayerCount(totalPlayers - 1)}
                onInc={() => setPlayerCount(totalPlayers + 1)}
                decDisabled={totalPlayers <= 3}
                incDisabled={totalPlayers >= 15}
                decLabel="Giảm tổng số người chơi"
                incLabel="Tăng tổng số người chơi"
              />
            </div>

            <div className="h-px" style={{ backgroundColor: '#EDE5D5' }} />

            {/* Spy Count */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-[0.9rem] font-extrabold leading-tight flex items-center gap-1.5"
                  style={{ fontFamily: 'var(--font-display)', color: '#BE123C' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#E11D48' }} />
                  Gián điệp
                </p>
                <p className="text-[0.7rem]" style={{ color: '#8C82A0' }}>
                  Nhận từ khoá lệch · tối đa {maxSpy}
                </p>
              </div>
              <Stepper
                value={spyCount}
                onDec={decSpy}
                onInc={incSpy}
                decDisabled={spyCount <= 1}
                incDisabled={spyCount >= maxSpy}
                decLabel="Giảm số gián điệp"
                incLabel="Tăng số gián điệp"
              />
            </div>

            <div className="h-px" style={{ backgroundColor: '#EDE5D5' }} />

            {/* White Hat Count */}
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p
                  className="text-[0.9rem] font-extrabold leading-tight flex items-center gap-1.5"
                  style={{ fontFamily: 'var(--font-display)', color: '#6D28D9' }}
                >
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: '#7C3AED' }} />
                  Mũ trắng
                </p>
                <p className="text-[0.7rem]" style={{ color: '#8C82A0' }}>
                  Không có từ, đoán từ lật kèo · tối đa {maxWhite}
                </p>
              </div>
              <Stepper
                value={whiteHatCount}
                onDec={decWhite}
                onInc={incWhite}
                decDisabled={whiteHatCount <= 0}
                incDisabled={whiteHatCount >= maxWhite}
                decLabel="Giảm số mũ trắng"
                incLabel="Tăng số mũ trắng"
              />
            </div>
          </section>

          {/* Compact Difficulty Selector */}
          <section className="space-y-1.5">
            <span
              className="block px-0.5 text-[0.78rem] font-extrabold"
              style={{ fontFamily: 'var(--font-display)', color: '#5B5270' }}
            >
              Độ khó bộ từ
            </span>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Độ khó bộ từ">
              {DIFFICULTY_OPTIONS.map(opt => {
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
                    className="rounded-xl py-2.5 px-2 text-center cursor-pointer"
                    style={{
                      backgroundColor: selected ? opt.bg : '#FFFFFF',
                      border: `2px solid ${INK}`,
                      boxShadow: selected ? `0 3px 0 ${INK}` : `0 2px 0 rgba(35, 28, 53, 0.18)`,
                      transform: selected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <span
                      className="block text-[0.86rem] font-black leading-tight"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      {opt.title}
                    </span>
                    <span
                      className="block text-[0.68rem] font-semibold mt-0.5"
                      style={{ color: selected ? opt.accent : '#8C82A0' }}
                    >
                      {opt.sub}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>

          {/* Compact Role Visibility Mode */}
          <section className="space-y-1.5">
            <span
              className="block px-0.5 text-[0.78rem] font-extrabold"
              style={{ fontFamily: 'var(--font-display)', color: '#5B5270' }}
            >
              Chế độ hiển thị vai
            </span>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Chế độ hiển thị vai">
              {[
                {
                  hide: false,
                  title: 'Lộ vai',
                  sub: 'Biết rõ mình là Dân hay Gián',
                  bg: '#E0F2FE',
                },
                {
                  hide: true,
                  title: 'Mù vai',
                  sub: 'Chỉ hiện từ khoá, ẩn phe',
                  bg: '#EDE9FE',
                },
              ].map(m => {
                const selected = hideRole === m.hide
                return (
                  <motion.button
                    key={m.title}
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
                    className="rounded-xl py-2.5 px-3 text-left cursor-pointer"
                    style={{
                      backgroundColor: selected ? m.bg : '#FFFFFF',
                      border: `2px solid ${INK}`,
                      boxShadow: selected ? `0 3px 0 ${INK}` : `0 2px 0 rgba(35, 28, 53, 0.18)`,
                      transform: selected ? 'translateY(-1px)' : 'none',
                    }}
                  >
                    <span
                      className="block text-[0.88rem] font-black leading-tight"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      {m.title}
                    </span>
                    <span
                      className="block text-[0.68rem] font-medium leading-snug mt-0.5"
                      style={{ color: '#5B5270' }}
                    >
                      {m.sub}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </section>
        </div>

        {/* 3. Bottom Action CTA */}
        <div className="pt-1 shrink-0">
          <button
            type="button"
            onClick={() => {
              playClickSound()
              triggerHaptic(30)
              startGame()
            }}
            className="btn-party-primary w-full py-3.5 px-5 text-[1rem] font-extrabold cursor-pointer inline-flex items-center justify-center gap-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            <span>Chia bài cho {totalPlayers} người</span>
            <ArrowRight size={20} weight="bold" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showRules && <RulesModal onClose={() => setShowRules(false)} />}
      </AnimatePresence>
    </>
  )
}
