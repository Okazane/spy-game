import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'motion/react'
import {
  ArrowsClockwise,
  CheckCircle,
  ClockCounterClockwise,
  DownloadSimple,
  Plus,
  ShieldCheck,
  Trash,
  Trophy,
  UploadSimple,
  WarningCircle,
  X,
} from '@phosphor-icons/react'
import {
  addCustomKeywordPair,
  BackupValidationError,
  clearAllDeviceData,
  createBackupPayload,
  deleteCustomKeywordPair,
  getScoreboardSnapshot,
  importValidatedBackup,
  MAX_BACKUP_BYTES,
  MAX_KEYWORD_LENGTH,
  parseAndValidateBackupJson,
  resetScoreboard,
  subscribeDataHub,
  type MatchHistoryRecord,
  type ScoreRecord,
} from '../db/gameDb.ts'
import { getRecentKeywords } from '../data/keywords.ts'
import { useGameStore, type Winner } from '../stores/gameStore.ts'
import {
  playClickSound,
  playFlipSound,
  playPopSound,
  playStampSound,
  triggerHaptic,
} from '../utils/sound.ts'

export type DataHubTab = 'scores' | 'keywords' | 'backup'

interface DataHubModalProps {
  initialTab?: DataHubTab
  onClose: () => void
}

const INK = '#231C35'

const WINNER_BADGE: Record<
  Exclude<Winner, null>,
  { label: string; bg: string; color: string; border: string }
> = {
  civilian: {
    label: 'Dân Thường',
    bg: '#CCFBF1',
    color: '#0F766E',
    border: '#0D9488',
  },
  spy: {
    label: 'Gián Điệp',
    bg: '#FFE4E6',
    color: '#BE123C',
    border: '#E11D48',
  },
  'white-hat': {
    label: 'Mũ Trắng',
    bg: '#F3E8FF',
    color: '#6D28D9',
    border: '#7C3AED',
  },
  'spy+white': {
    label: 'Gián & Mũ',
    bg: '#FEF3C7',
    color: '#92400E',
    border: '#D97706',
  },
}

function formatShortTime(ts: number): string {
  try {
    const d = new Date(ts)
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    const mo = String(d.getMonth() + 1).padStart(2, '0')
    return `${hh}:${mm} · ${dd}/${mo}`
  } catch {
    return ''
  }
}

export function DataHubModal({ initialTab = 'scores', onClose }: DataHubModalProps) {
  const [tab, setTab] = useState<DataHubTab>(initialTab)
  const [scores, setScores] = useState<ScoreRecord[]>([])
  const [history, setHistory] = useState<MatchHistoryRecord[]>([])
  const [confirmResetScores, setConfirmResetScores] = useState(false)
  const [confirmWipeAll, setConfirmWipeAll] = useState(false)

  // Custom Keyword Form state
  const customKeywords = useGameStore(s => s.customKeywords)
  const settings = useGameStore(s => s.settings)
  const previousNames = useGameStore(s => s.previousNames)
  const applyBackupPreferences = useGameStore(s => s.applyBackupPreferences)
  const resetToFactoryState = useGameStore(s => s.resetToFactoryState)

  const [civilianDraft, setCivilianDraft] = useState('')
  const [spyDraft, setSpyDraft] = useState('')
  const [kwFeedback, setKwFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  // Backup Tab feedback
  const [backupFeedback, setBackupFeedback] = useState<{
    type: 'ok' | 'err'
    text: string
  } | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const refreshScoreboard = useCallback(async () => {
    const snap = await getScoreboardSnapshot()
    setScores(snap.scores)
    setHistory(snap.history)
  }, [])

  useEffect(() => {
    let active = true
    const sync = () => {
      void getScoreboardSnapshot().then(snap => {
        if (!active) return
        setScores(snap.scores)
        setHistory(snap.history)
      })
    }
    sync()
    const unsub = subscribeDataHub(sync)
    return () => {
      active = false
      unsub()
    }
  }, [])

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

  const switchTab = (next: DataHubTab) => {
    if (next === tab) return
    playFlipSound()
    triggerHaptic(10)
    setConfirmResetScores(false)
    setConfirmWipeAll(false)
    setKwFeedback(null)
    setBackupFeedback(null)
    setTab(next)
  }

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    setKwFeedback(null)
    const res = await addCustomKeywordPair(civilianDraft, spyDraft)
    if (!res.ok) {
      playClickSound(0.85)
      triggerHaptic([25, 25])
      setKwFeedback({ type: 'err', text: res.error })
      return
    }
    playStampSound()
    triggerHaptic(20)
    setCivilianDraft('')
    setSpyDraft('')
    setKwFeedback({
      type: 'ok',
      text: `Đã lưu cặp "${res.record.civilian} / ${res.record.spy}" vào máy!`,
    })
  }

  const handleDeleteKeyword = async (id: string) => {
    playPopSound(-1)
    triggerHaptic(14)
    setKwFeedback(null)
    await deleteCustomKeywordPair(id)
  }

  const handleResetScores = async () => {
    playStampSound()
    triggerHaptic(25)
    await resetScoreboard()
    setConfirmResetScores(false)
  }

  const handleExportJson = async () => {
    if (isBusy) return
    setIsBusy(true)
    setBackupFeedback(null)
    playClickSound(1.06)
    triggerHaptic(18)

    try {
      const payload = await createBackupPayload({
        settings,
        previousNames,
        recentKeywords: getRecentKeywords(),
      })
      const jsonText = JSON.stringify(payload, null, 2)
      const blob = new Blob([jsonText], { type: 'application/json;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      try {
        const dateTag = new Date().toISOString().slice(0, 10)
        const anchor = document.createElement('a')
        anchor.href = url
        anchor.download = `ai-la-gian-diep-backup-${dateTag}.json`
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
      } finally {
        window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      }

      setBackupFeedback({
        type: 'ok',
        text: `Đã xuất bản sao lưu (${payload.customKeywords.length} cặp từ, ${payload.scores.length} người chơi, ${payload.history.length} ván).`,
      })
    } catch {
      setBackupFeedback({
        type: 'err',
        text: 'Không thể tạo file sao lưu trên thiết bị này.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setBackupFeedback(null)
    if (file.size > MAX_BACKUP_BYTES) {
      playClickSound(0.85)
      triggerHaptic([30, 30])
      setBackupFeedback({
        type: 'err',
        text: 'File vượt quá dung lượng tối đa 2 MB.',
      })
      return
    }

    setIsBusy(true)
    try {
      const rawText = await file.text()
      const validated = parseAndValidateBackupJson(rawText)
      await importValidatedBackup(validated)
      await useGameStore.getState().refreshCustomKeywords()
      applyBackupPreferences(validated.preferences)
      await refreshScoreboard()

      playStampSound()
      triggerHaptic([20, 35])
      setBackupFeedback({
        type: 'ok',
        text: `Khôi phục thành công: ${validated.customKeywords.length} cặp từ, ${validated.scores.length} người chơi, ${validated.history.length} ván đấu!`,
      })
    } catch (err) {
      playClickSound(0.82)
      triggerHaptic([30, 30])
      const message =
        err instanceof BackupValidationError
          ? err.message
          : 'File sao lưu không hợp lệ hoặc bị hỏng.'
      setBackupFeedback({ type: 'err', text: message })
    } finally {
      setIsBusy(false)
    }
  }

  const handleWipeDeviceData = async () => {
    if (isBusy) return
    setIsBusy(true)
    try {
      playStampSound()
      triggerHaptic([30, 40])
      await clearAllDeviceData()
      resetToFactoryState()
      await refreshScoreboard()
      setConfirmWipeAll(false)
      setBackupFeedback({
        type: 'ok',
        text: 'Đã xoá toàn bộ dữ liệu cục bộ trên máy này.',
      })
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-labelledby="data-hub-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 select-none"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(35, 28, 53, 0.58)' }}
        onClick={handleClose}
      />

      <motion.div
        className="relative z-10 w-full max-w-[424px] flex flex-col overflow-hidden rounded-t-[24px] sm:rounded-[24px]"
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
        {/* Header + 3 Tabs */}
        <div className="px-4 pt-3.5 pb-2.5 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-8 h-8 rounded-xl inline-flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: '#FEF3C7',
                  border: `2px solid ${INK}`,
                  boxShadow: `0 2px 0 ${INK}`,
                }}
              >
                <Trophy size={18} weight="duotone" color="#D97706" />
              </span>
              <h2
                id="data-hub-modal-title"
                className="text-[1.18rem] font-black leading-tight truncate"
                style={{ fontFamily: 'var(--font-display)', color: INK }}
              >
                Kho Bàn Tròn Offline
              </h2>
            </div>

            <button
              type="button"
              onClick={handleClose}
              aria-label="Đóng kho dữ liệu"
              className="btn-party-secondary w-9 h-9 shrink-0 flex items-center justify-center cursor-pointer"
            >
              <X size={17} weight="bold" />
            </button>
          </div>

          <div
            className="mt-2.5 grid grid-cols-3 gap-1 p-1 rounded-xl"
            style={{ backgroundColor: '#F2E9D8', border: `2px solid ${INK}` }}
            role="tablist"
          >
            {(
              [
                { id: 'scores', label: 'Bảng Điểm' },
                { id: 'keywords', label: `Từ Tự Tạo (${customKeywords.length})` },
                { id: 'backup', label: 'Sao Lưu' },
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
                  className="py-1.5 px-1 rounded-lg text-[0.76rem] font-extrabold cursor-pointer transition-all truncate"
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

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-3.5 space-y-2.5">
          {tab === 'scores' && (
            <>
              {/* Point Rules Strip */}
              <div
                className="rounded-xl px-3 py-2 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[0.7rem] font-extrabold text-center"
                style={{
                  backgroundColor: '#FFFDF7',
                  border: '1.5px solid rgba(35, 28, 53, 0.18)',
                  fontFamily: 'var(--font-display)',
                  color: '#5B5270',
                }}
              >
                <span style={{ color: '#0F766E' }}>Dân +1đ</span>
                <span>·</span>
                <span style={{ color: '#BE123C' }}>Gián +3đ</span>
                <span>·</span>
                <span style={{ color: '#6D28D9' }}>Mũ Trắng +4đ</span>
                <span>·</span>
                <span style={{ color: '#92400E' }}>Gián & Mũ +2đ</span>
              </div>

              {/* Leaderboard */}
              <section
                className="rounded-2xl p-3 space-y-2"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `2px solid ${INK}`,
                  boxShadow: `0 2.5px 0 ${INK}`,
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className="text-[0.88rem] font-black"
                    style={{ fontFamily: 'var(--font-display)', color: INK }}
                  >
                    Bảng xếp hạng ({scores.length})
                  </h3>

                  {(scores.length > 0 || history.length > 0) && !confirmResetScores && (
                    <button
                      type="button"
                      onClick={() => {
                        playClickSound()
                        setConfirmResetScores(true)
                      }}
                      className="text-[0.72rem] font-extrabold px-2 py-0.5 rounded-lg cursor-pointer"
                      style={{
                        fontFamily: 'var(--font-display)',
                        backgroundColor: '#FFE4E6',
                        color: '#BE123C',
                        border: '1px solid #E11D48',
                      }}
                    >
                      Đặt lại bảng điểm
                    </button>
                  )}
                </div>

                {confirmResetScores && (
                  <div
                    className="rounded-xl p-2.5 space-y-2"
                    style={{
                      backgroundColor: '#FFF1F2',
                      border: `1.5px solid #E11D48`,
                    }}
                  >
                    <p
                      className="text-[0.76rem] font-extrabold text-center"
                      style={{ fontFamily: 'var(--font-display)', color: '#BE123C' }}
                    >
                      Đặt lại toàn bộ điểm & lịch sử các ván đấu?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          setConfirmResetScores(false)
                        }}
                        className="btn-party-secondary py-1.5 text-xs cursor-pointer"
                      >
                        Huỷ
                      </button>
                      <button
                        type="button"
                        onClick={handleResetScores}
                        className="btn-party-danger py-1.5 text-xs cursor-pointer"
                      >
                        Đặt lại
                      </button>
                    </div>
                  </div>
                )}

                {scores.length === 0 ? (
                  <div
                    className="rounded-xl px-3 py-5 text-center space-y-1"
                    style={{
                      backgroundColor: '#FAF4E8',
                      border: '1.5px dashed rgba(35, 28, 53, 0.2)',
                    }}
                  >
                    <p
                      className="text-[0.84rem] font-extrabold"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      Chưa có ván đấu nào được ghi điểm
                    </p>
                    <p className="text-[0.74rem]" style={{ color: '#5B5270' }}>
                      Điểm số sẽ tự động cộng sau mỗi ván thắng trên máy này!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {scores.map((s, idx) => {
                      const rankBg =
                        idx === 0
                          ? '#FFB800'
                          : idx === 1
                          ? '#E2E8F0'
                          : idx === 2
                          ? '#FDBA74'
                          : '#F2E9D8'
                      return (
                        <div
                          key={s.id}
                          className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl"
                          style={{
                            backgroundColor: idx === 0 ? '#FFFBEB' : '#FAF4E8',
                            border:
                              idx === 0
                                ? `1.5px solid ${INK}`
                                : '1.5px solid rgba(35, 28, 53, 0.14)',
                          }}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-6 h-6 rounded-full shrink-0 inline-flex items-center justify-center text-[0.7rem] font-black"
                              style={{
                                backgroundColor: rankBg,
                                color: INK,
                                border: `1.5px solid ${INK}`,
                                fontFamily: 'var(--font-display)',
                              }}
                            >
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p
                                className="text-[0.84rem] font-black truncate leading-tight"
                                style={{ fontFamily: 'var(--font-display)', color: INK }}
                              >
                                {s.name}
                              </p>
                              <p className="text-[0.68rem] font-semibold" style={{ color: '#5B5270' }}>
                                {s.wins}/{s.gamesPlayed} thắng
                                {s.spyWins > 0 ? ` · ${s.spyWins} Gián` : ''}
                                {s.whiteHatWins > 0 ? ` · ${s.whiteHatWins} Mũ` : ''}
                              </p>
                            </div>
                          </div>

                          <span
                            className="px-2.5 py-1 rounded-full text-[0.78rem] font-black shrink-0 tabular-nums"
                            style={{
                              fontFamily: 'var(--font-display)',
                              backgroundColor: idx === 0 ? '#FF5A36' : '#FFFFFF',
                              color: idx === 0 ? '#FFFFFF' : INK,
                              border: `1.5px solid ${INK}`,
                            }}
                          >
                            {s.points}đ
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>

              {/* Match History */}
              {history.length > 0 && (
                <section
                  className="rounded-2xl p-3 space-y-2"
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: `2px solid ${INK}`,
                    boxShadow: `0 2.5px 0 ${INK}`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <ClockCounterClockwise size={16} weight="bold" color={INK} />
                    <h3
                      className="text-[0.86rem] font-black"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      Lịch sử ván gần đây ({history.length})
                    </h3>
                  </div>

                  <div className="space-y-1.5">
                    {history.slice(0, 15).map(h => {
                      const badge = WINNER_BADGE[h.winner]
                      return (
                        <div
                          key={h.id}
                          className="rounded-xl px-2.5 py-2 space-y-1"
                          style={{
                            backgroundColor: '#FAF4E8',
                            border: '1.5px solid rgba(35, 28, 53, 0.14)',
                          }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className="px-2 py-0.5 rounded-md text-[0.66rem] font-extrabold"
                              style={{
                                fontFamily: 'var(--font-display)',
                                backgroundColor: badge.bg,
                                color: badge.color,
                                border: `1px solid ${badge.border}`,
                              }}
                            >
                              {badge.label} thắng
                            </span>
                            <span
                              className="text-[0.66rem] font-semibold"
                              style={{ color: '#5B5270' }}
                            >
                              {h.totalPlayers} người · {formatShortTime(h.endedAt)}
                            </span>
                          </div>
                          <p
                            className="text-[0.76rem] font-bold truncate"
                            style={{ color: INK }}
                          >
                            {h.civilianKeyword}
                            {h.spyKeyword && h.spyKeyword !== '—' ? ` ↔ ${h.spyKeyword}` : ''}
                            {h.whiteHatGuessedWord ? ` (Đoán: "${h.whiteHatGuessedWord}")` : ''}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </>
          )}

          {tab === 'keywords' && (
            <>
              {/* Add Custom Pair Form */}
              <form
                onSubmit={handleAddKeyword}
                className="rounded-2xl p-3 space-y-2.5"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `2px solid ${INK}`,
                  boxShadow: `0 2.5px 0 ${INK}`,
                }}
              >
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="custom-civ-input"
                      className="block text-[0.72rem] font-extrabold"
                      style={{ fontFamily: 'var(--font-display)', color: '#0F766E' }}
                    >
                      Từ Dân thường
                    </label>
                    <input
                      id="custom-civ-input"
                      type="text"
                      value={civilianDraft}
                      onChange={e => setCivilianDraft(e.target.value)}
                      placeholder="VD: Trà đào"
                      maxLength={MAX_KEYWORD_LENGTH}
                      autoComplete="off"
                      className="w-full px-2.5 py-2 rounded-xl text-[0.84rem] font-semibold outline-none select-text"
                      style={{
                        backgroundColor: '#FAF4E8',
                        color: INK,
                        border: `1.5px solid ${INK}`,
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                      }}
                    />
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor="custom-spy-input"
                      className="block text-[0.72rem] font-extrabold"
                      style={{ fontFamily: 'var(--font-display)', color: '#BE123C' }}
                    >
                      Từ Gián điệp
                    </label>
                    <input
                      id="custom-spy-input"
                      type="text"
                      value={spyDraft}
                      onChange={e => setSpyDraft(e.target.value)}
                      placeholder="VD: Trà vải"
                      maxLength={MAX_KEYWORD_LENGTH}
                      autoComplete="off"
                      className="w-full px-2.5 py-2 rounded-xl text-[0.84rem] font-semibold outline-none select-text"
                      style={{
                        backgroundColor: '#FAF4E8',
                        color: INK,
                        border: `1.5px solid ${INK}`,
                        userSelect: 'text',
                        WebkitUserSelect: 'text',
                      }}
                    />
                  </div>
                </div>

                {kwFeedback && (
                  <div
                    role="status"
                    className="rounded-xl px-2.5 py-1.5 flex items-center gap-1.5 text-[0.74rem] font-bold"
                    style={{
                      backgroundColor: kwFeedback.type === 'ok' ? '#CCFBF1' : '#FFE4E6',
                      color: kwFeedback.type === 'ok' ? '#0F766E' : '#BE123C',
                      border: `1.5px solid ${kwFeedback.type === 'ok' ? '#0D9488' : '#E11D48'}`,
                    }}
                  >
                    {kwFeedback.type === 'ok' ? (
                      <CheckCircle size={15} weight="fill" className="shrink-0" />
                    ) : (
                      <WarningCircle size={15} weight="fill" className="shrink-0" />
                    )}
                    <span>{kwFeedback.text}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-party-primary w-full py-2.5 text-[0.86rem] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus size={17} weight="bold" />
                  <span>Thêm cặp từ vào máy</span>
                </button>

                <p className="text-[0.7rem] leading-snug text-center" style={{ color: '#5B5270' }}>
                  Mỗi ván tự động tung đồng xu 50/50 hoán đổi 2 từ nên cả người tạo đề cũng chơi được!
                </p>
              </form>

              {/* Custom Keyword List */}
              <section
                className="rounded-2xl p-3 space-y-2"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `2px solid ${INK}`,
                  boxShadow: `0 2.5px 0 ${INK}`,
                }}
              >
                <h3
                  className="text-[0.86rem] font-black"
                  style={{ fontFamily: 'var(--font-display)', color: INK }}
                >
                  Kho từ của nhóm ({customKeywords.length})
                </h3>

                {customKeywords.length === 0 ? (
                  <div
                    className="rounded-xl px-3 py-4 text-center space-y-1"
                    style={{
                      backgroundColor: '#FAF4E8',
                      border: '1.5px dashed rgba(35, 28, 53, 0.2)',
                    }}
                  >
                    <p
                      className="text-[0.82rem] font-extrabold"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      Chưa có cặp từ tự tạo nào
                    </p>
                    <p className="text-[0.73rem]" style={{ color: '#5B5270' }}>
                      Tạo chủ đề riêng của hội bạn (quán quen, kỷ niệm, biệt danh...) để chọn chế độ "Tự tạo" ở màn Tạo Bàn Chơi.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {customKeywords.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl"
                        style={{
                          backgroundColor: '#FAF4E8',
                          border: '1.5px solid rgba(35, 28, 53, 0.14)',
                        }}
                      >
                        <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-[0.8rem] font-extrabold">
                          <span
                            className="px-2 py-0.5 rounded-md truncate max-w-[130px]"
                            style={{
                              backgroundColor: '#CCFBF1',
                              color: '#0F766E',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {item.civilian}
                          </span>
                          <ArrowsClockwise size={13} weight="bold" color="#8C82A0" />
                          <span
                            className="px-2 py-0.5 rounded-md truncate max-w-[130px]"
                            style={{
                              backgroundColor: '#FFE4E6',
                              color: '#BE123C',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {item.spy}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => void handleDeleteKeyword(item.id)}
                          aria-label={`Xoá cặp từ ${item.civilian} và ${item.spy}`}
                          className="w-8 h-8 rounded-lg shrink-0 inline-flex items-center justify-center cursor-pointer"
                          style={{
                            backgroundColor: '#FFFFFF',
                            color: '#BE123C',
                            border: `1.5px solid ${INK}`,
                          }}
                        >
                          <Trash size={15} weight="bold" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {tab === 'backup' && (
            <>
              <section
                className="rounded-2xl p-3.5 space-y-3"
                style={{
                  backgroundColor: '#FFFFFF',
                  border: `2px solid ${INK}`,
                  boxShadow: `0 2.5px 0 ${INK}`,
                }}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className="w-9 h-9 rounded-xl shrink-0 inline-flex items-center justify-center"
                    style={{
                      backgroundColor: '#CCFBF1',
                      border: `1.5px solid ${INK}`,
                    }}
                  >
                    <ShieldCheck size={20} weight="duotone" color="#0F766E" />
                  </span>
                  <div className="min-w-0 space-y-0.5">
                    <h3
                      className="text-[0.9rem] font-black"
                      style={{ fontFamily: 'var(--font-display)', color: INK }}
                    >
                      Lưu trữ 100% Offline trên máy
                    </h3>
                    <p className="text-[0.74rem] leading-relaxed" style={{ color: '#5B5270' }}>
                      Đang lưu <strong>{customKeywords.length}</strong> cặp từ riêng,{' '}
                      <strong>{scores.length}</strong> người chơi và{' '}
                      <strong>{history.length}</strong> ván đấu trong cơ sở dữ liệu cục bộ (IndexedDB).
                    </p>
                  </div>
                </div>

                {backupFeedback && (
                  <div
                    role="status"
                    className="rounded-xl px-3 py-2 flex items-start gap-2 text-[0.75rem] font-bold leading-snug"
                    style={{
                      backgroundColor: backupFeedback.type === 'ok' ? '#CCFBF1' : '#FFE4E6',
                      color: backupFeedback.type === 'ok' ? '#0F766E' : '#BE123C',
                      border: `1.5px solid ${backupFeedback.type === 'ok' ? '#0D9488' : '#E11D48'}`,
                    }}
                  >
                    {backupFeedback.type === 'ok' ? (
                      <CheckCircle size={16} weight="fill" className="shrink-0 mt-0.5" />
                    ) : (
                      <WarningCircle size={16} weight="fill" className="shrink-0 mt-0.5" />
                    )}
                    <span>{backupFeedback.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleExportJson()}
                    className="btn-party-primary py-2.5 px-3 text-[0.82rem] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <DownloadSimple size={17} weight="bold" />
                    <span>Xuất file .json</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => {
                      playClickSound()
                      triggerHaptic(14)
                      fileInputRef.current?.click()
                    }}
                    className="btn-party-secondary py-2.5 px-3 text-[0.82rem] inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UploadSimple size={17} weight="bold" />
                    <span>Nhập file .json</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={e => void handleImportFileChange(e)}
                  className="hidden"
                />

                <p className="text-[0.7rem] leading-relaxed" style={{ color: '#5B5270' }}>
                  Xuất file <code>.json</code> để chuyển từ tự tạo & bảng điểm sang điện thoại khác mà không cần kết nối mạng hay tài khoản đám mây.
                </p>
              </section>

              {/* Wipe Device Data */}
              <section
                className="rounded-2xl p-3 space-y-2"
                style={{
                  backgroundColor: '#FFFDF9',
                  border: `2px solid ${INK}`,
                }}
              >
                {!confirmWipeAll ? (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p
                        className="text-[0.82rem] font-black"
                        style={{ fontFamily: 'var(--font-display)', color: INK }}
                      >
                        Xoá dữ liệu máy
                      </p>
                      <p className="text-[0.7rem]" style={{ color: '#5B5270' }}>
                        Dọn sạch ván đang lưu, bảng điểm & từ tự tạo
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        playClickSound()
                        setConfirmWipeAll(true)
                      }}
                      className="btn-party-secondary px-3 py-2 text-[0.76rem] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                      style={{ color: '#BE123C' }}
                    >
                      <Trash size={15} weight="bold" />
                      <span>Xoá dữ liệu</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p
                      className="text-[0.78rem] font-extrabold text-center"
                      style={{ fontFamily: 'var(--font-display)', color: '#BE123C' }}
                    >
                      Chắc chắn xoá toàn bộ dữ liệu offline trên thiết bị này?
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playClickSound()
                          setConfirmWipeAll(false)
                        }}
                        className="btn-party-secondary py-2 text-xs cursor-pointer"
                      >
                        Huỷ
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => void handleWipeDeviceData()}
                        className="btn-party-danger py-2 text-xs cursor-pointer"
                      >
                        Xoá sạch
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2.5 shrink-0"
          style={{ backgroundColor: '#FAF4E8', borderTop: `2px solid ${INK}` }}
        >
          <button
            type="button"
            onClick={handleClose}
            className="btn-party-secondary w-full py-2.5 text-[0.88rem] font-extrabold cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
