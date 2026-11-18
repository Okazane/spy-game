// ─────────────────────────────────────────────────────────────────────────────
// Tabletop Foley & Musical Web-Audio Engine (100% offline, không cần file âm thanh)
//
// - Mọi âm thanh đi qua master Gain → DynamicsCompressor → loa, nên chồng nhiều
//   tiếng cùng lúc cũng không vỡ / rè trên loa điện thoại.
// - Bộ đệm nhiễu trắng 0.5s tạo MỘT lần cho mỗi AudioContext (lật bài, xào bài,
//   quẹt nhung... đều không cấp phát bộ nhớ mới mỗi lần phát).
// - Trạng thái tắt tiếng lưu ở localStorage 'spy-game-muted', subscribe được
//   bằng useSyncExternalStore.
// ─────────────────────────────────────────────────────────────────────────────

type Winner = 'civilian' | 'spy' | 'white-hat' | 'spy+white' | null

interface Engine {
  ctx: AudioContext
  out: GainNode
  noise: AudioBuffer
}

let engine: Engine | null = null

function getEngine(): Engine | null {
  if (typeof window === 'undefined') return null
  if (!engine) {
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    const ctx = new Ctor()

    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -10
    comp.knee.value = 12
    comp.ratio.value = 6
    comp.attack.value = 0.003
    comp.release.value = 0.25

    const out = ctx.createGain()
    out.gain.value = 0.85
    out.connect(comp)
    comp.connect(ctx.destination)

    const len = Math.floor(ctx.sampleRate * 0.5)
    const noise = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1

    engine = { ctx, out, noise }
  }
  if (engine.ctx.state === 'suspended') void engine.ctx.resume().catch(() => {})
  return engine
}

// ───────────────────────────── Mute state ─────────────────────────────

const MUTE_KEY = 'spy-game-muted'
let muted = (() => {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()
const muteListeners = new Set<() => void>()

export function getSoundMuted(): boolean {
  return muted
}

export function setSoundMuted(value: boolean): void {
  if (muted === value) return
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    /* private mode */
  }
  if (value && engine) void engine.ctx.suspend().catch(() => {})
  muteListeners.forEach((l) => l())
}

export function toggleSoundMuted(): boolean {
  setSoundMuted(!muted)
  return muted
}

/** Tương thích `useSyncExternalStore(subscribeSoundMuted, getSoundMuted)`. */
export function subscribeSoundMuted(listener: () => void): () => void {
  muteListeners.add(listener)
  return () => {
    muteListeners.delete(listener)
  }
}

/** Gọi trong một cú chạm đầu tiên để "mở khoá" audio trên iOS/Safari (tuỳ chọn). */
export function unlockAudio(): void {
  if (!muted) getEngine()
}

// ───────────────────────────── Primitives ─────────────────────────────

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)
const vary = (amount: number) => 1 + (Math.random() * 2 - 1) * amount

function run(fn: (e: Engine, now: number) => void): void {
  if (muted) return
  try {
    const e = getEngine()
    if (!e) return
    fn(e, e.ctx.currentTime + 0.005)
  } catch {
    // Bị chặn bởi autoplay policy hoặc trình duyệt không hỗ trợ — bỏ qua.
  }
}

function envelope(g: GainNode, t: number, peak: number, attack: number, dur: number): void {
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(dur, attack + 0.005))
}

interface ToneOpts {
  freq: number
  t: number
  dur: number
  gain: number
  type?: OscillatorType
  attack?: number
  endFreq?: number
  /** Lowpass cutoff: [start, end] (Hz) — tạo tiếng gảy ấm. */
  lowpass?: [number, number]
}

function tone(e: Engine, o: ToneOpts): void {
  const { ctx, out } = e
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = o.type ?? 'sine'
  osc.frequency.setValueAtTime(o.freq, o.t)
  if (o.endFreq) osc.frequency.exponentialRampToValueAtTime(o.endFreq, o.t + o.dur)
  envelope(g, o.t, o.gain, o.attack ?? 0.004, o.dur)
  let node: AudioNode = osc
  if (o.lowpass) {
    const f = ctx.createBiquadFilter()
    f.type = 'lowpass'
    f.Q.value = 0.7
    f.frequency.setValueAtTime(o.lowpass[0], o.t)
    f.frequency.exponentialRampToValueAtTime(o.lowpass[1], o.t + o.dur)
    node.connect(f)
    node = f
  }
  node.connect(g)
  g.connect(out)
  osc.start(o.t)
  osc.stop(o.t + o.dur + 0.03)
  osc.onended = () => g.disconnect()
}

interface NoiseOpts {
  t: number
  dur: number
  gain: number
  type?: BiquadFilterType
  /** Tần số lọc theo thời gian: [f0, f1, f2...] trải đều trên dur. */
  freqs: number[]
  Q?: number
  attack?: number
}

function noise(e: Engine, o: NoiseOpts): void {
  const { ctx, out } = e
  const src = ctx.createBufferSource()
  src.buffer = e.noise
  const f = ctx.createBiquadFilter()
  f.type = o.type ?? 'bandpass'
  f.Q.value = o.Q ?? 1
  f.frequency.setValueAtTime(o.freqs[0], o.t)
  const steps = o.freqs.length - 1
  for (let i = 1; i <= steps; i++) f.frequency.exponentialRampToValueAtTime(o.freqs[i], o.t + (o.dur * i) / steps)
  const g = ctx.createGain()
  envelope(g, o.t, o.gain, o.attack ?? 0.002, o.dur)
  src.connect(f)
  f.connect(g)
  g.connect(out)
  const maxOffset = Math.max(0, e.noise.duration - o.dur - 0.01)
  if (o.dur >= e.noise.duration - 0.01) src.loop = true
  src.start(o.t, Math.random() * maxOffset)
  src.stop(o.t + o.dur + 0.03)
  src.onended = () => g.disconnect()
}

/** Phím marimba gỗ: cơ bản + bội âm ~3.9x tắt nhanh. */
function marimba(e: Engine, freq: number, t: number, gain = 0.22, dur = 0.45): void {
  tone(e, { freq, t, dur, gain, type: 'sine', attack: 0.003 })
  tone(e, { freq: freq * 3.93, t, dur: dur * 0.25, gain: gain * 0.35, type: 'sine', attack: 0.002 })
  noise(e, { t, dur: 0.012, gain: gain * 0.35, freqs: [freq * 6], Q: 2 })
}

/** Chuông / celesta: các bội âm không hài hoà. */
function bell(e: Engine, freq: number, t: number, gain = 0.16, dur = 1.1): void {
  tone(e, { freq, t, dur, gain, type: 'sine', attack: 0.002 })
  tone(e, { freq: freq * 2.76, t, dur: dur * 0.55, gain: gain * 0.4, type: 'sine', attack: 0.002 })
  tone(e, { freq: freq * 5.4, t, dur: dur * 0.3, gain: gain * 0.18, type: 'sine', attack: 0.002 })
}

/** Dây gảy ấm (triangle + lowpass khép dần). */
function pluck(e: Engine, freq: number, t: number, gain = 0.2, dur = 0.6, bright = 2400): void {
  tone(e, { freq, t, dur, gain, type: 'triangle', attack: 0.004, lowpass: [bright, Math.max(180, freq * 1.2)] })
}

/** Tiếng giấy lật (paper flick). */
function flick(e: Engine, t: number, from = 2200, to = 950, gain = 0.32, dur = 0.065): void {
  noise(e, { t, dur, gain, freqs: [from, to], Q: 0.9, attack: 0.002 })
}

// ───────────────────────────── UI taps ─────────────────────────────

/** Gõ token gỗ / marimba pop (vi biến ±3% để bấm liên tục vẫn tự nhiên). */
export function playClickSound(pitchMultiplier = 1) {
  run((e, t) => {
    const f = 470 * pitchMultiplier * vary(0.03)
    noise(e, { t, dur: 0.01, gain: 0.12, freqs: [2600], Q: 1.5 })
    tone(e, { freq: f, endFreq: f * 0.92, t, dur: 0.08, gain: 0.2, type: 'sine', attack: 0.002 })
    tone(e, { freq: f * 3.9, t, dur: 0.03, gain: 0.05, type: 'sine', attack: 0.001 })
  })
}

const PENTA = [72, 74, 76, 79, 81, 84, 86, 88, 91]

/** Pop bong bóng nảy theo thang ngũ cung (`step` dịch cao độ — hợp cho +/- và chọn preset). */
export function playPopSound(step = 0) {
  run((e, t) => {
    const idx = ((Math.round(step) % PENTA.length) + PENTA.length) % PENTA.length
    const f = hz(PENTA[idx]) * vary(0.01)
    const osc = e.ctx.createOscillator()
    const g = e.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f * 0.62, t)
    osc.frequency.exponentialRampToValueAtTime(f, t + 0.028)
    envelope(g, t, 0.2, 0.004, 0.14)
    osc.connect(g)
    g.connect(e.out)
    osc.start(t)
    osc.stop(t + 0.17)
    osc.onended = () => g.disconnect()
    noise(e, { t, dur: 0.008, gain: 0.06, freqs: [3200], Q: 2 })
  })
}

// ───────────────────────────── Cards ─────────────────────────────

/** Lật lá bài giấy thật: nhiễu lọc 2200→950Hz + tiếng đệm không khí trầm. */
export function playFlipSound() {
  run((e, t) => {
    flick(e, t, 2200 * vary(0.05), 950, 0.34, 0.065)
    tone(e, { freq: 150, endFreq: 70, t, dur: 0.07, gain: 0.16, type: 'sine', attack: 0.003 })
  })
}

/** Xào bài riffle 5 lá trên nỉ. */
export function playShuffleSound() {
  run((e, t) => {
    for (let i = 0; i < 5; i++) {
      const at = t + i * 0.024 + Math.random() * 0.006
      flick(e, at, (2700 - i * 170) * vary(0.04), 1100 - i * 60, 0.22 + i * 0.015, 0.042)
    }
    tone(e, { freq: 120, endFreq: 60, t: t + 0.13, dur: 0.08, gain: 0.14, type: 'sine' })
    noise(e, { t: t + 0.13, dur: 0.05, gain: 0.08, freqs: [700], Q: 0.8 })
  })
}

/** Nhấn giữ lá bài bí mật: xào xạc góc bài + quãng 5 bí ẩn D4 → A4. */
export function playPeekHoldSound() {
  run((e, t) => {
    noise(e, { t, dur: 0.2, gain: 0.07, freqs: [3200, 2200], Q: 0.7, attack: 0.05 })
    tone(e, { freq: hz(62), t, dur: 0.75, gain: 0.08, type: 'triangle', attack: 0.07, lowpass: [1300, 600] })
    tone(e, { freq: hz(69), t: t + 0.12, dur: 0.7, gain: 0.075, type: 'triangle', attack: 0.07, lowpass: [1500, 700] })
  })
}

/** Thả lá bài úp xuống nỉ: snap giấy + vỗ bàn 110Hz. */
export function playPeekReleaseSound() {
  run((e, t) => {
    noise(e, { t, dur: 0.035, gain: 0.3, freqs: [1900, 1200], Q: 1.1 })
    tone(e, { freq: 110, endFreq: 80, t, dur: 0.1, gain: 0.22, type: 'sine', lowpass: [600, 200] })
  })
}

/** Quẹt nhung trên bàn / vút lá bài (400 → 1200 → 350Hz). */
export function playShutterSound() {
  run((e, t) => {
    noise(e, { t, dur: 0.18, gain: 0.26, freqs: [400, 1200, 350], Q: 1.2, attack: 0.045 })
  })
}

/** Con dấu cao su đóng mực: sub-thump 125 → 38Hz + tiếng chạm giấy. */
export function playStampSound() {
  run((e, t) => {
    tone(e, { freq: 125, endFreq: 38, t, dur: 0.22, gain: 0.5, type: 'sine', attack: 0.002, lowpass: [420, 120] })
    noise(e, { t, dur: 0.025, gain: 0.24, freqs: [1500, 900], Q: 0.9 })
    noise(e, { t: t + 0.01, dur: 0.09, gain: 0.08, type: 'lowpass', freqs: [500, 150], Q: 0.5 })
  })
}

/** Màn trập máy ảnh sạch (2 cú click). */
export function playFlashSound() {
  run((e, t) => {
    noise(e, { t, dur: 0.016, gain: 0.26, freqs: [3200], Q: 1.4 })
    tone(e, { freq: 900, endFreq: 500, t, dur: 0.025, gain: 0.05, type: 'triangle' })
    noise(e, { t: t + 0.06, dur: 0.022, gain: 0.2, freqs: [2400], Q: 1.2 })
  })
}

/** Bút dạ quẹt trên giấy. */
export function playMarkerSound() {
  run((e, t) => {
    noise(e, { t, dur: 0.13, gain: 0.13, freqs: [1700, 3200], Q: 2.2, attack: 0.02 })
    noise(e, { t: t + 0.15, dur: 0.07, gain: 0.09, freqs: [2200, 3000], Q: 2.2, attack: 0.012 })
  })
}

// ───────────────────────────── Game flow ─────────────────────────────

/** Loại người chơi: bass gảy noir A3 → E3 → A2 + trống timpani. */
export function playEliminateSound() {
  run((e, t) => {
    pluck(e, hz(57), t, 0.22, 0.45, 2000)
    pluck(e, hz(52), t + 0.16, 0.22, 0.45, 1800)
    pluck(e, hz(45), t + 0.32, 0.26, 1.1, 1500)
    pluck(e, hz(52), t + 0.32, 0.1, 1.0, 1200)
    tone(e, { freq: 92, endFreq: 68, t: t + 0.32, dur: 0.7, gain: 0.3, type: 'sine', attack: 0.004 })
    noise(e, { t: t + 0.32, dur: 0.5, gain: 0.12, type: 'lowpass', freqs: [260, 90], Q: 0.6 })
  })
}

/** Chuyển lượt: chuông marimba gỗ 2 nốt E5 → A5. */
export function playTurnAdvanceSound() {
  run((e, t) => {
    marimba(e, hz(76), t, 0.2, 0.35)
    marimba(e, hz(81), t + 0.11, 0.22, 0.5)
  })
}

/** Tích tắc đồng hồ cơ gỗ (sáng hơn khi `urgent`). */
export function playTimerTickSound(urgent = false) {
  run((e, t) => {
    const f = urgent ? 1500 : 1100
    noise(e, { t, dur: 0.02, gain: urgent ? 0.26 : 0.18, freqs: [f], Q: 8 })
    tone(e, { freq: f, t, dur: 0.018, gain: urgent ? 0.07 : 0.04, type: 'sine', attack: 0.001 })
  })
}

/** Hết giờ: chuông khách sạn đồng "Ding-ding!" (C6). */
export function playTimeUpSound() {
  run((e, t) => {
    bell(e, hz(84), t, 0.2, 1.0)
    bell(e, hz(84), t + 0.15, 0.2, 1.3)
  })
}

/** Nhạc chiến thắng theo phe. */
export function playVictorySound(winner: Winner = 'civilian') {
  run((e, t) => {
    if (winner === 'spy') {
      // Noir jazz lén lút: D4 F4 A4 C#5 E5 (nhịp swing) + hợp âm treo
      const notes = [62, 65, 69, 73, 76]
      const times = [0, 0.15, 0.25, 0.4, 0.52]
      notes.forEach((n, i) => pluck(e, hz(n), t + times[i], 0.17, 0.5, 2600))
      notes.forEach((n) => tone(e, { freq: hz(n), t: t + 0.7, dur: 1.4, gain: 0.045, type: 'triangle', attack: 0.05, lowpass: [1800, 500] }))
      tone(e, { freq: hz(38), t: t + 0.7, dur: 1.2, gain: 0.18, type: 'sine', attack: 0.01 })
      ;[0.15, 0.4, 0.7].forEach((d) => noise(e, { t: t + d, dur: 0.06, gain: 0.05, type: 'highpass', freqs: [6000], Q: 0.7 }))
      return
    }
    if (winner === 'white-hat' || winner === 'spy+white') {
      // Celesta lấp lánh kỳ ảo: E5 G#5 B5 D#6 E6
      ;[76, 80, 83, 87, 88].forEach((n, i) => bell(e, hz(n), t + i * 0.085, 0.14, 1.0))
      ;[88, 91, 95].forEach((n, i) => bell(e, hz(n), t + 0.55 + i * 0.06, 0.07, 0.9))
      tone(e, { freq: hz(64), t: t + 0.42, dur: 1.4, gain: 0.06, type: 'triangle', attack: 0.1, lowpass: [1500, 600] })
      return
    }
    // Dân thường (mặc định): marimba arpeggio C5 E5 G5 C6 + hợp âm kèn ấm
    ;[72, 76, 79, 84].forEach((n, i) => marimba(e, hz(n), t + i * 0.09, 0.2, 0.5))
    ;[60, 67, 72, 76].forEach((n) =>
      tone(e, { freq: hz(n), t: t + 0.36, dur: 1.1, gain: 0.05, type: 'sawtooth', attack: 0.04, lowpass: [2000, 500] }),
    )
    bell(e, hz(96), t + 0.4, 0.06, 0.8)
  })
}

// ───────────────────────────── Haptics ─────────────────────────────

/** Rung nhẹ (nếu thiết bị hỗ trợ). Khi tắt tiếng vẫn rung nhưng dịu hơn (≤ 25ms mỗi nhịp). */
export function triggerHaptic(pattern: number | number[] = 20) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return
  try {
    const cap = (n: number) => Math.max(0, Math.min(n, muted ? 25 : 80))
    navigator.vibrate(Array.isArray(pattern) ? pattern.map((n, i) => (i % 2 === 0 ? cap(n) : n)) : cap(pattern))
  } catch {
    /* ignore */
  }
}
