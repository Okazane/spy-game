import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { X } from '@phosphor-icons/react'
import { playClickSound, playFlipSound, triggerHaptic } from '../utils/sound'
import { getAvatarByIndex, AVATARS } from '../data/avatars'
import { AvatarPortrait } from './PartyVisuals'

interface RulesModalProps {
  onClose: () => void
}

type RulesTab = 'roles' | 'steps'

const INK = '#231C35'

const avatarById = (id: string) => AVATARS.find(a => a.id === id) ?? getAvatarByIndex(0)

const ROLES = [
  {
    id: 'civilian',
    avatar: avatarById('girl1'),
    name: 'Dân Thường',
    color: '#0D9488',
    bg: '#dcfce7',
    word: 'Trà đào',
    desc: 'Tả khéo từ của mình để đồng đội nhận ra nhau, nhưng đừng nói lộ quá kẻo Gián Điệp đoán được.',
    win: 'Thắng khi loại hết Gián Điệp và Mũ Trắng.',
  },
  {
    id: 'spy',
    avatar: avatarById('fox'),
    name: 'Gián Điệp',
    color: '#E11D48',
    bg: '#ffe4e6',
    word: 'Trà vải',
    desc: 'Nhận từ gần giống phe Dân. Lắng nghe mọi người mô tả để trà trộn cho thật tự nhiên.',
    win: 'Thắng khi trụ đến lúc số Gián ≥ số Dân.',
  },
  {
    id: 'whitehat',
    avatar: avatarById('wizard'),
    name: 'Mũ Trắng',
    color: '#7C3AED',
    bg: '#f3e8ff',
    word: 'Không có từ',
    desc: 'Tay trắng hoàn toàn! Lắng nghe để nói hùa theo. Nếu bị loại, được đoán 1 lần từ của Dân để lật kèo.',
    win: 'Đoán đúng từ của Dân khi bị loại là thắng ngay!',
  },
] as const

const STEPS = [
  {
    n: 1,
    title: 'Rút bài bí mật',
    bg: '#FEF3C7',
    text: 'Chuyền điện thoại cho từng người. Chọn 1 lá bài úp, nhấn giữ trên mặt bài để xem từ, ký tên rồi đưa bạn kế tiếp.',
  },
  {
    n: 2,
    title: 'Mô tả 1 câu theo lượt',
    bg: '#CCFBF1',
    text: 'Lần lượt từng người nói đúng 1 câu gợi ý về từ của mình (tuyệt đối không nói thẳng từ khoá).',
  },
  {
    n: 3,
    title: 'Thảo luận & soi sơ hở',
    bg: '#FFE4E6',
    text: 'Cả nhóm cùng hỏi vặn, phân tích xem ai vừa mô tả lệch tông hoặc ngập ngừng đáng nghi.',
  },
  {
    n: 4,
    title: 'Bỏ phiếu loại',
    bg: '#F3E8FF',
    text: 'Thống nhất chọn 1 người đáng nghi nhất trên màn hình để lật vai trò thật. Chơi tiếp tới khi có phe thắng!',
  },
] as const

export function RulesModal({ onClose }: RulesModalProps) {
  const [tab, setTab] = useState<RulesTab>('roles')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        playClickSound()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleClose = () => {
    playClickSound()
    triggerHaptic(15)
    onClose()
  }

  const switchTab = (next: RulesTab) => {
    if (next === tab) return
    playFlipSound()
    triggerHaptic(10)
    setTab(next)
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(35, 28, 53, 0.55)' }}
        onClick={handleClose}
      />

      <motion.div
        className="relative z-10 w-full max-w-[420px] flex flex-col overflow-hidden rounded-t-[24px] sm:rounded-[24px]"
        style={{
          maxHeight: '88dvh',
          backgroundColor: '#FAF4E8',
          border: `2px solid ${INK}`,
          boxShadow: `0 6px 0 ${INK}`,
        }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 330 }}
      >
        {/* Header */}
        <div className="px-4 pt-3.5 pb-2.5 shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h2
              id="rules-modal-title"
              className="text-[1.3rem] font-black leading-tight"
              style={{ fontFamily: 'var(--font-display)', color: INK }}
            >
              Luật chơi nhanh
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng hướng dẫn"
              className="btn-party-secondary w-9 h-9 shrink-0 flex items-center justify-center cursor-pointer"
            >
              <X size={17} weight="bold" />
            </button>
          </div>

          <div
            className="mt-2.5 grid grid-cols-2 gap-1 p-1 rounded-xl"
            style={{ backgroundColor: '#F2E9D8', border: `2px solid ${INK}` }}
            role="tablist"
          >
            {(
              [
                { id: 'roles', label: '3 Vai Trò' },
                { id: 'steps', label: '4 Bước Chơi' },
              ] as const
            ).map(t => {
              const active = tab === t.id
              return (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => switchTab(t.id)}
                  className="py-1.5 rounded-lg text-[0.84rem] font-extrabold cursor-pointer transition-all"
                  style={{
                    fontFamily: 'var(--font-display)',
                    backgroundColor: active ? '#FFFFFF' : 'transparent',
                    color: active ? INK : '#5B5270',
                    border: active ? `1.5px solid ${INK}` : '1.5px solid transparent',
                  }}
                >
                  {t.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3 space-y-2.5">
          {tab === 'roles' ? (
            <div className="space-y-2.5">
              {ROLES.map(r => (
                <div
                  key={r.id}
                  className="rounded-2xl p-3 flex gap-3"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `2px solid ${INK}`,
                    boxShadow: `0 2px 0 ${INK}`,
                  }}
                >
                  <div
                    className="w-[64px] shrink-0 rounded-xl flex flex-col items-center justify-center py-2 gap-1"
                    style={{ backgroundColor: r.bg, border: `1.5px solid ${INK}` }}
                  >
                    <AvatarPortrait avatar={r.avatar} size={42} />
                    <span
                      className="px-1.5 py-0.5 rounded text-[0.58rem] font-extrabold text-white"
                      style={{ backgroundColor: r.color, fontFamily: 'var(--font-display)' }}
                    >
                      {r.name}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className="text-[0.95rem] font-black leading-tight"
                        style={{ fontFamily: 'var(--font-display)', color: r.color }}
                      >
                        {r.name}
                      </h3>
                      <span
                        className="rounded-md px-2 py-0.5 text-[0.68rem] font-bold"
                        style={{ backgroundColor: r.bg, color: INK }}
                      >
                        VD: "{r.word}"
                      </span>
                    </div>
                    <p className="text-[0.75rem] leading-relaxed" style={{ color: '#5B5270' }}>
                      {r.desc}
                    </p>
                    <p className="text-[0.72rem] font-bold leading-snug" style={{ color: INK }}>
                      {r.win}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {STEPS.map(s => (
                <div
                  key={s.n}
                  className="rounded-2xl p-3 flex items-start gap-3"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `2px solid ${INK}`,
                    boxShadow: `0 2px 0 ${INK}`,
                  }}
                >
                  <span
                    className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-sm font-black"
                    style={{
                      backgroundColor: s.bg,
                      border: `2px solid ${INK}`,
                      fontFamily: 'var(--font-display)',
                      color: INK,
                    }}
                  >
                    {s.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[0.92rem] font-extrabold leading-tight"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      {s.title}
                    </h3>
                    <p className="mt-0.5 text-[0.76rem] leading-relaxed" style={{ color: '#5B5270' }}>
                      {s.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-3 shrink-0"
          style={{ backgroundColor: '#FAF4E8', borderTop: `2px solid ${INK}` }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="btn-party-primary w-full py-3 text-[0.95rem] font-extrabold cursor-pointer"
          >
            Đã hiểu, vào chơi thôi!
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
