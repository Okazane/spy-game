/**
 * PartyVisuals — bộ kit hình ảnh dùng chung cho mọi màn hình.
 *
 * - AvatarPortrait    : chân dung DiceBear minh hoạ trong token board-game.
 * - FluentSticker     : icon minh hoạ Phosphor Duotone có màu ngữ nghĩa (tên giữ nguyên để không vỡ import).
 * - SolarIcon         : icon điều khiển Phosphor Bold sắc nét (mặc định currentColor).
 * - RoleEmblem        : huy hiệu phe (Dân thường / Gián điệp / Mũ Trắng).
 * - TarotCardBack     : mặt lưng lá bài "Clue & Mask — Risograph Court-Card Edition".
 * - SecretCardFront   : mặt trước lá bài (từ khoá bí mật + ấn phe, tôn trọng hideRole).
 * - firePartyConfetti : pháo giấy theo màu phe.
 *
 * 100% offline: Phosphor là component React tree-shake được, lá bài là SVG thuần.
 */
import { useId, type CSSProperties, type ReactNode } from 'react'
// Kit dùng chung: cố ý export kèm hằng số theme + helper (firePartyConfetti) cạnh components.
/* oxlint-disable react/only-export-components */
import {
  Alarm,
  ArrowCounterClockwise,
  ArrowLeft,
  ArrowRight,
  Bomb,
  BookOpenText,
  Cards,
  ChatCircleDots,
  Confetti,
  Crosshair,
  Crown,
  Detective,
  DiceFive,
  Eye,
  EyeClosed,
  EyeSlash,
  Flame,
  Ghost,
  Handshake,
  HandsClapping,
  HandTap,
  House,
  LightbulbFilament,
  Lightning,
  MagicWand,
  MagnifyingGlass,
  Medal,
  MicrophoneStage,
  Pause,
  Play,
  Question,
  SealCheck,
  ShieldCheck,
  ShieldStar,
  Shuffle,
  SmileyWink,
  Timer,
  Trophy,
  UserSound,
  UsersThree,
  Warning,
  XCircle,
  type Icon as PhosphorIcon,
  type IconWeight,
} from '@phosphor-icons/react'
import confetti from 'canvas-confetti'
import type { AvatarItem } from '../data/avatars'

export const INK = '#231C35'
const PAPER = '#FFFBF2'

// Bảng màu ngữ nghĩa
const AMBER = '#D97706'
const CRIMSON = '#E11D48'
const TEAL = '#0D9488'
const VIOLET = '#7C3AED'
const CORAL = '#FF5A36'
const SKY = '#2563EB'

// ───────────────────────────── Icon maps ─────────────────────────────

const STICKERS = {
  detective: { icon: Detective, color: CRIMSON },
  ghost: { icon: Ghost, color: VIOLET },
  'smile-party': { icon: SmileyWink, color: TEAL },
  dice: { icon: DiceFive, color: VIOLET },
  crown: { icon: Crown, color: AMBER },
  cards: { icon: Cards, color: CORAL },
  'crystal-ball': { icon: MagicWand, color: VIOLET },
  'magnifying-glass': { icon: MagnifyingGlass, color: SKY },
  microphone: { icon: MicrophoneStage, color: CORAL },
  'party-popper': { icon: Confetti, color: AMBER },
  trophy: { icon: Trophy, color: AMBER },
  fire: { icon: Flame, color: CORAL },
  sparkles: { icon: Cards, color: AMBER },
  shushing: { icon: EyeSlash, color: VIOLET },
  eyes: { icon: Eye, color: SKY },
  target: { icon: Crosshair, color: CRIMSON },
  bomb: { icon: Bomb, color: INK },
  'light-bulb': { icon: LightbulbFilament, color: AMBER },
  handshake: { icon: Handshake, color: TEAL },
  shield: { icon: ShieldStar, color: TEAL },
  'pointing-up': { icon: HandTap, color: CORAL },
  'alarm-clock': { icon: Alarm, color: CRIMSON },
  'check-badge': { icon: SealCheck, color: TEAL },
  'cross-mark': { icon: XCircle, color: CRIMSON },
} as const satisfies Record<string, { icon: PhosphorIcon; color: string }>

const SOLAR = {
  play: Play,
  book: BookOpenText,
  users: UsersThree,
  'user-speak': UserSound,
  'eye-closed': EyeClosed,
  eye: Eye,
  shuffle: Shuffle,
  restart: ArrowCounterClockwise,
  home: House,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  timer: Timer,
  pause: Pause,
  bolt: Lightning,
  'shield-check': ShieldCheck,
  danger: Warning,
  'magic-stick': MagicWand,
  'chat-round': ChatCircleDots,
  'hand-stars': HandsClapping,
  medal: Medal,
} as const satisfies Record<string, PhosphorIcon>

export type StickerName = keyof typeof STICKERS
export type SolarIconName = keyof typeof SOLAR
export type PartyRole = 'civilian' | 'spy' | 'white-hat'
export type { IconWeight }

export const STICKER_NAMES = Object.keys(STICKERS) as StickerName[]
export const SOLAR_ICON_NAMES = Object.keys(SOLAR) as SolarIconName[]
/** Màu ngữ nghĩa mặc định của từng sticker (để tô pill / viền cùng tông). */
export const STICKER_COLORS = Object.fromEntries(
  Object.entries(STICKERS).map(([k, v]) => [k, v.color]),
) as Record<StickerName, string>

function a11y(label?: string) {
  return label ? { role: 'img' as const, 'aria-label': label } : { 'aria-hidden': true as const }
}

// ───────────────────────────── FluentSticker ─────────────────────────────

export interface FluentStickerProps {
  name: StickerName
  size?: number
  className?: string
  style?: CSSProperties
  /** Nhãn cho trình đọc màn hình; bỏ trống = trang trí (aria-hidden). */
  label?: string
  /** Ghi đè màu ngữ nghĩa mặc định. */
  color?: string
  /** Mặc định 'duotone' (nét 2px + lớp nền mờ). */
  weight?: IconWeight
}

/** Icon minh hoạ Phosphor Duotone với màu ngữ nghĩa — sắc nét từ 14px đến 48px. */
export function FluentSticker({ name, size = 28, className = '', style, label, color, weight = 'duotone' }: FluentStickerProps) {
  const { icon: IconCmp, color: tone } = STICKERS[name]
  return (
    <IconCmp
      size={size}
      weight={weight}
      color={color ?? tone}
      className={`inline-block shrink-0 select-none ${className}`}
      style={{ verticalAlign: 'middle', ...style }}
      {...a11y(label)}
    />
  )
}

// ─────────────────────────────── SolarIcon ───────────────────────────────

export interface SolarIconProps {
  name: SolarIconName
  size?: number
  className?: string
  /** Mặc định currentColor (ăn theo màu chữ của nút). */
  color?: string
  style?: CSSProperties
  label?: string
  /** Mặc định 'bold' — sắc nét cho nút bấm. */
  weight?: IconWeight
}

/** Icon điều khiển Phosphor (Bold mặc định) — kế thừa currentColor. */
export function SolarIcon({ name, size = 22, className = '', color, style, label, weight = 'bold' }: SolarIconProps) {
  const IconCmp = SOLAR[name]
  return (
    <IconCmp
      size={size}
      weight={weight}
      color={color ?? 'currentColor'}
      className={`inline-block shrink-0 ${className}`}
      style={{ verticalAlign: 'middle', ...style }}
      {...a11y(label)}
    />
  )
}

// ───────────────────────────── AvatarPortrait ─────────────────────────────

export interface AvatarPortraitProps {
  avatar: AvatarItem
  size?: number
  className?: string
  /** Sticker góc phải-dưới: tên FluentSticker hoặc node tuỳ ý. */
  badge?: StickerName | ReactNode
  /** 'circle' (mặc định) hoặc 'squircle' (bo góc kiểu thẻ bài). */
  shape?: 'circle' | 'squircle'
  /** Làm mờ + xám (người chơi bị loại). */
  dimmed?: boolean
  style?: CSSProperties
}

function isStickerName(v: unknown): v is StickerName {
  return typeof v === 'string' && Object.prototype.hasOwnProperty.call(STICKERS, v)
}

export function AvatarPortrait({
  avatar,
  size = 48,
  className = '',
  badge,
  shape = 'circle',
  dimmed = false,
  style,
}: AvatarPortraitProps) {
  const lip = Math.max(2, Math.round(size / 16))
  const badgeSize = Math.max(16, Math.round(size * 0.42))
  return (
    <span className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size, ...style }}>
      <span
        className="block h-full w-full overflow-hidden"
        style={{
          backgroundColor: avatar.bg,
          border: `2px solid ${INK}`,
          borderRadius: shape === 'circle' ? '9999px' : `${Math.round(size * 0.3)}px`,
          boxShadow: `0 ${lip}px 0 ${INK}, inset 0 -${Math.max(2, Math.round(size / 14))}px 0 rgba(35,28,53,0.12)`,
          filter: dimmed ? 'grayscale(1)' : undefined,
          opacity: dimmed ? 0.55 : 1,
          transition: 'filter 200ms, opacity 200ms',
        }}
      >
        <img
          src={avatar.svgUri}
          alt={avatar.name}
          width={size}
          height={size}
          draggable={false}
          className="block h-full w-full select-none object-cover"
        />
      </span>
      {badge != null && badge !== false && (
        <span
          className="absolute inline-flex items-center justify-center rounded-full"
          style={{
            right: -badgeSize * 0.22,
            bottom: -badgeSize * 0.18,
            width: badgeSize,
            height: badgeSize,
            backgroundColor: '#FFFFFF',
            border: `2px solid ${INK}`,
            boxShadow: `0 2px 0 ${INK}`,
          }}
        >
          {isStickerName(badge) ? <FluentSticker name={badge} size={Math.round(badgeSize * 0.7)} /> : badge}
        </span>
      )}
    </span>
  )
}

// ─────────────────────────────── RoleEmblem ───────────────────────────────

export const ROLE_THEME: Record<PartyRole, { sticker: StickerName; bg: string; accent: string; label: string }> = {
  civilian: { sticker: 'smile-party', bg: '#CCFBF1', accent: '#0F766E', label: 'Dân Thường' },
  spy: { sticker: 'detective', bg: '#FFE4E6', accent: '#BE123C', label: 'Gián Điệp' },
  'white-hat': { sticker: 'ghost', bg: '#F3E8FF', accent: '#7E22CE', label: 'Mũ Trắng' },
}

export interface RoleEmblemProps {
  role: PartyRole
  size?: number
  className?: string
  style?: CSSProperties
}

export function RoleEmblem({ role, size = 40, className = '', style }: RoleEmblemProps) {
  const t = ROLE_THEME[role]
  return (
    <span
      role="img"
      aria-label={t.label}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: t.bg,
        border: `2px solid ${INK}`,
        boxShadow: `0 ${Math.max(2, Math.round(size / 14))}px 0 ${INK}`,
        ...style,
      }}
    >
      <svg viewBox="0 0 32 32" width={Math.round(size * 0.66)} height={Math.round(size * 0.66)} aria-hidden="true">
        {role === 'civilian' && (
          <g stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="16" cy="16" r="10.5" fill="#99F6E4" />
            <circle cx="12.5" cy="14" r="1.4" fill={INK} stroke="none" />
            <circle cx="19.5" cy="14" r="1.4" fill={INK} stroke="none" />
            <path d="M12 18.5c1.1 2 2.5 2.8 4 2.8s2.9-.8 4-2.8" fill="none" />
          </g>
        )}
        {role === 'spy' && (
          <g stroke={INK} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 15.5h22" strokeWidth="2.6" />
            <path d="M9.5 15.5l2-7.5 4.5 1.8 4.5-1.8 2 7.5z" fill="#FB7185" />
            <circle cx="12" cy="20.5" r="3.2" fill={PAPER} />
            <circle cx="20" cy="20.5" r="3.2" fill={PAPER} />
            <path d="M15.2 20.5h1.6" />
          </g>
        )}
        {role === 'white-hat' && (
          <g stroke={INK} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8.5 17V14a7.5 7.5 0 0 1 15 0v11l-3.7-2.4-3.8 2.4-3.8-2.4-3.7 2.4z" fill="#FFFFFF" />
            <circle cx="13.2" cy="14.5" r="1.5" fill={INK} stroke="none" />
            <circle cx="18.8" cy="14.5" r="1.5" fill={INK} stroke="none" />
          </g>
        )}
      </svg>
    </span>
  )
}

// ═════════════════════ Lá bài: Clue & Mask — Risograph Court-Card ═════════════════════

export interface TarotColorway {
  name: string
  /** Màu chính (nửa trên). */
  base: string
  /** Bản tối của màu chính (bóng in lệch / viền đổ). */
  dark: string
  /** Màu tương phản sáng (nửa dưới). */
  light: string
  /** Màu điểm nhấn. */
  accent: string
}

type ArtName = 'detective' | 'mask' | 'loupe' | 'envelope' | 'phantom' | 'lock' | 'cat' | 'eye'
type PipName = 'diamond' | 'spade' | 'heart' | 'star'

const PALETTES: (TarotColorway & { art: ArtName; pip: PipName })[] = [
  { name: 'Vermilion & Cream', base: '#D9412A', dark: '#7A1E10', light: '#FBE3C4', accent: '#FFB800', art: 'detective', pip: 'diamond' },
  { name: 'Prussian Navy & Ochre', base: '#1D3557', dark: '#0E1B2E', light: '#E9B44C', accent: '#F4E9CD', art: 'mask', pip: 'spade' },
  { name: 'Forest Pine & Mint', base: '#1F5C46', dark: '#0D2E22', light: '#B8E6CF', accent: '#F2C14E', art: 'loupe', pip: 'star' },
  { name: 'Burgundy & Rose-Gold', base: '#7B1E3A', dark: '#3D0C1C', light: '#F1B9A3', accent: '#FFD9C4', art: 'envelope', pip: 'heart' },
  { name: 'Deep Violet & Lavender', base: '#47288A', dark: '#22124A', light: '#D8CCF6', accent: '#FFB800', art: 'phantom', pip: 'diamond' },
  { name: 'Terracotta & Sun', base: '#C0532E', dark: '#5E2412', light: '#FFD25A', accent: '#FFF1D0', art: 'lock', pip: 'spade' },
  { name: 'Deep Teal & Coral', base: '#0F6466', dark: '#06302F', light: '#FFA48A', accent: '#FFE8D6', art: 'cat', pip: 'star' },
  { name: 'Ink & Marigold', base: '#2B2440', dark: '#140F22', light: '#FFC53D', accent: '#FF6B4A', art: 'eye', pip: 'heart' },
]

/** 8 phối màu in lụa — xoay vòng theo `index % 8` (tương thích ngược: name/base/dark/light). */
export const TAROT_COLORWAYS: readonly TarotColorway[] = PALETTES.map(({ name, base, dark, light, accent }) => ({
  name,
  base,
  dark,
  light,
  accent,
}))

const PIPS: Record<PipName, string> = {
  diamond: 'M0 -10 L7 0 L0 10 L-7 0Z',
  heart: 'M0 9 C-12 0 -11 -9 -5 -9 C-2 -9 0 -6 0 -4.5 C0 -6 2 -9 5 -9 C11 -9 12 0 0 9Z',
  spade: 'M0 -10 C10 -2 11 4 6 6 C3 7 1.2 5.5 1 4.5 L3 10 L-3 10 L-1 4.5 C-1.2 5.5 -3 7 -6 6 C-11 4 -10 -2 0 -10Z',
  star: 'M0 -10 L2.8 -2.8 L10 0 L2.8 2.8 L0 10 L-2.8 2.8 L-10 0 L-2.8 -2.8Z',
}

interface ArtColors {
  ink: string
  paper: string
  tone: string
  pop: string
}

const SW = 3.5 // độ dày nét mực

/** Minh hoạ nửa lá bài, vẽ quanh gốc (0,0) trong khoảng ±62. */
const ARTS: Record<ArtName, (c: ArtColors) => ReactNode> = {
  // Thám tử Noir: mũ phớt + cổ áo trench
  detective: (c) => (
    <g stroke={c.ink} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-60 70 C-58 36 -42 24 -18 19 L0 42 L18 19 C42 24 58 36 60 70Z" fill={c.tone} />
      <path d="M-18 19 L-32 36 L-10 60 L0 42Z" fill={c.pop} />
      <path d="M18 19 L32 36 L10 60 L0 42Z" fill={c.pop} />
      <path d="M-9 4 L9 4 L9 24 L0 42 L-9 24Z" fill={c.paper} />
      <path d="M-3.5 27 L3.5 27 L5 42 L0 48 L-5 42Z" fill={c.ink} />
      <ellipse cx={0} cy={-8} rx={22} ry={24} fill={c.paper} />
      <path d="M-22 -12 Q0 -3 22 -12 L22 -22 L-22 -22Z" fill={c.ink} />
      <circle cx={-8} cy={-14} r={2.2} fill={c.paper} stroke="none" />
      <circle cx={8} cy={-14} r={2.2} fill={c.paper} stroke="none" />
      <path d="M-6 4 Q2 9 9 2" fill="none" strokeWidth={2.6} />
      <ellipse cx={0} cy={-24} rx={42} ry={9} fill={c.ink} />
      <path d="M-25 -27 C-25 -52 -14 -60 0 -55 C14 -60 25 -52 25 -27Z" fill={c.ink} />
      <path d="M-25 -34 L25 -34 L25 -27 L-25 -27Z" fill={c.pop} />
      <path d="M0 -55 L0 -45" stroke={c.paper} strokeWidth={2} />
    </g>
  ),
  // Mặt nạ hoá trang Venice có cán cầm
  mask: (c) => (
    <g stroke={c.ink} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
      <path d="M40 18 L58 64" strokeWidth={10} />
      <path d="M40 18 L58 64" stroke={c.pop} strokeWidth={4} />
      <path d="M30 -26 C34 -50 50 -62 64 -66 C58 -50 50 -36 40 -22Z" fill={c.pop} />
      <path d="M36 -28 C42 -42 50 -52 58 -60" fill="none" strokeWidth={2} />
      <path d="M-56 -12 C-42 -36 -14 -30 0 -17 C14 -30 42 -36 56 -12 C58 13 39 31 18 27 C8 25 4 15 0 15 C-4 15 -8 25 -18 27 C-39 31 -58 13 -56 -12Z" fill={c.paper} />
      <path d="M-46 -6 C-36 -22 -16 -18 -4 -8 M46 -6 C36 -22 16 -18 4 -8" fill="none" stroke={c.tone} strokeWidth={3} />
      <ellipse cx={-22} cy={0} rx={13} ry={8} transform="rotate(-10 -22 0)" fill={c.ink} />
      <ellipse cx={22} cy={0} rx={13} ry={8} transform="rotate(10 22 0)" fill={c.ink} />
      <path d="M0 -30 L6 -22 L0 -14 L-6 -22Z" fill={c.tone} />
      <circle cx={-38} cy={-22} r={3.2} fill={c.tone} />
      <circle cx={38} cy={-22} r={3.2} fill={c.tone} />
    </g>
  ),
  // Kính lúp soi dấu vân tay
  loupe: (c) => (
    <g stroke={c.ink} strokeLinejoin="round" strokeLinecap="round">
      <path d="M20 20 L52 52" strokeWidth={18} />
      <path d="M20 20 L52 52" stroke={c.pop} strokeWidth={10} />
      <path d="M16 16 L26 26" strokeWidth={20} />
      <circle cx={-8} cy={-8} r={36} fill={c.paper} strokeWidth={SW + 1} />
      <circle cx={-8} cy={-8} r={30} fill="none" stroke={c.tone} strokeWidth={5} />
      <g fill="none" stroke={c.ink} strokeWidth={2.6}>
        <path d="M-22 -2 C-22 -18 6 -18 6 -2" />
        <path d="M-16 4 C-16 -10 0 -10 0 4 L0 10" />
        <path d="M-28 4 C-30 -26 14 -26 12 2 L12 8" />
        <path d="M-10 -2 L-10 14" />
        <path d="M-22 6 L-22 12" />
      </g>
      <path d="M-34 -18 A28 28 0 0 1 -18 -34" fill="none" stroke={c.pop} strokeWidth={4} />
    </g>
  ),
  // Phong thư mật + dấu sáp
  envelope: (c) => (
    <g stroke={c.ink} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
      <g transform="rotate(-8)">
        <rect x={-56} y={-36} width={112} height={74} rx={6} fill={c.paper} />
        <rect x={-49} y={-29} width={98} height={60} rx={3} fill="none" stroke={c.tone} strokeWidth={3} strokeDasharray="9 6" />
        <path d="M-56 34 L-14 2 M56 34 L14 2" fill="none" strokeWidth={2.6} />
        <path d="M-56 -32 L0 10 L56 -32" fill={c.paper} />
        <circle cx={0} cy={10} r={16} fill={c.pop} />
        <circle cx={0} cy={10} r={10} fill="none" strokeWidth={2.2} />
        <path d="M0 4 L2 8.5 L6.5 10 L2 11.5 L0 16 L-2 11.5 L-6.5 10 L-2 8.5Z" fill={c.ink} stroke="none" />
      </g>
    </g>
  ),
  // Bóng ma trùm áo choàng
  phantom: (c) => (
    <g stroke={c.ink} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-58 70 C-52 20 -42 -42 0 -60 C42 -42 52 20 58 70Z" fill={c.tone} />
      <path d="M-40 70 C-36 40 -30 20 -22 12 M40 70 C36 40 30 20 22 12" fill="none" strokeWidth={2.6} />
      <path d="M-28 12 C-30 -22 -15 -40 0 -42 C15 -40 30 -22 28 12 C17 20 -17 20 -28 12Z" fill={c.ink} />
      <path d="M-18 -30 C-10 -38 10 -38 18 -30" fill="none" stroke={c.pop} strokeWidth={2.5} />
      <ellipse cx={-10} cy={-8} rx={6} ry={3.6} fill={c.pop} stroke="none" />
      <ellipse cx={10} cy={-8} rx={6} ry={3.6} fill={c.pop} stroke="none" />
      <circle cx={0} cy={32} r={7} fill={c.pop} />
    </g>
  ),
  // Ổ khoá + chìa
  lock: (c) => (
    <g stroke={c.ink} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-24 -8 V-28 A24 24 0 0 1 24 -28 V-8" fill="none" strokeWidth={14} />
      <path d="M-24 -8 V-28 A24 24 0 0 1 24 -28 V-8" fill="none" stroke={c.paper} strokeWidth={6} />
      <rect x={-38} y={-12} width={76} height={62} rx={11} fill={c.tone} />
      <rect x={-30} y={-4} width={60} height={46} rx={7} fill="none" stroke={c.pop} strokeWidth={2.5} />
      <circle cx={0} cy={12} r={9} fill={c.ink} />
      <path d="M-4.5 16 L4.5 16 L8 34 L-8 34Z" fill={c.ink} />
      <g transform="translate(46 -40) rotate(35)">
        <circle cx={0} cy={0} r={12} fill={c.pop} />
        <circle cx={0} cy={0} r={4.5} fill={c.tone} />
        <path d="M0 12 L0 48 M0 36 L8 36 M0 44 L6 44" fill="none" strokeWidth={6} />
        <path d="M0 12 L0 48 M0 36 L8 36 M0 44 L6 44" fill="none" stroke={c.pop} strokeWidth={2} />
      </g>
    </g>
  ),
  // Mèo điệp viên đeo kính đen
  cat: (c) => (
    <g stroke={c.ink} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
      <path d="M-42 70 C-38 52 -20 44 0 44 C20 44 38 52 42 70Z" fill={c.pop} />
      <path d="M-14 44 L0 58 L14 44" fill="none" strokeWidth={2.6} />
      <path d="M-46 -4 L-48 -56 L-18 -34 C-6 -38 6 -38 18 -34 L48 -56 L46 -4 C48 26 28 42 0 42 C-28 42 -48 26 -46 -4Z" fill={c.tone} />
      <path d="M-40 -42 L-38 -22 L-26 -32Z M40 -42 L38 -22 L26 -32Z" fill={c.pop} strokeWidth={2.2} />
      <path d="M-34 -14 L34 -14" strokeWidth={4} />
      <path d="M-33 -14 C-33 2 -4 4 -4 -14Z" fill={c.ink} />
      <path d="M33 -14 C33 2 4 4 4 -14Z" fill={c.ink} />
      <path d="M-24 -10 L-16 -10 M14 -10 L22 -10" stroke={c.paper} strokeWidth={2.4} />
      <path d="M-5 12 L5 12 L0 18Z" fill={c.pop} strokeWidth={2.2} />
      <path d="M0 18 Q-6 26 -12 22 M0 18 Q6 26 12 22" fill="none" strokeWidth={2.4} />
      <path d="M-26 14 L-54 10 M-26 20 L-52 26 M26 14 L54 10 M26 20 L52 26" strokeWidth={2.4} />
    </g>
  ),
  // Con mắt bí ẩn
  eye: (c) => (
    <g stroke={c.ink} strokeWidth={SW} strokeLinejoin="round" strokeLinecap="round">
      {[-40, -24, -8, 8, 24, 40].map((x) => (
        <path key={x} d={`M${x * 0.92} ${-22 + Math.abs(x) * 0.36} L${x * 1.18} ${-40 + Math.abs(x) * 0.5}`} strokeWidth={4} />
      ))}
      <path d="M-58 4 Q0 -46 58 4 Q0 54 -58 4Z" fill={c.paper} />
      <circle cx={0} cy={4} r={22} fill={c.tone} />
      <circle cx={0} cy={4} r={10} fill={c.ink} />
      <circle cx={7} cy={-3} r={4} fill={c.paper} stroke="none" />
      <path d="M-58 4 Q0 54 58 4" fill="none" stroke={c.pop} strokeWidth={3} transform="translate(0 6)" />
    </g>
  ),
}

function notchedPanel(x0: number, y0: number, x1: number, y1: number, r: number): string {
  return `M${x0 + r} ${y0} H${x1 - r} A${r} ${r} 0 0 0 ${x1} ${y0 + r} V${y1 - r} A${r} ${r} 0 0 0 ${x1 - r} ${y1} H${x0 + r} A${r} ${r} 0 0 0 ${x0} ${y1 - r} V${y0 + r} A${r} ${r} 0 0 0 ${x0 + r} ${y0}Z`
}

export interface TarotCardBackProps {
  index: number
  isSelected?: boolean
  /** Dải ruy-băng tích hợp gần mép dưới (vd 'Nhấn giữ bài để xem'). */
  hintLabel?: string
  /** Tỉ lệ khung chứa: '3/4' (mặc định — lưới bài) hoặc '5/7' (lá bài lớn trong modal). */
  ratio?: '3/4' | '5/7'
  className?: string
  style?: CSSProperties
}

/**
 * Mặt lưng lá bài "Clue & Mask" — viền ngà dày, khung mực khía góc kiểu poker cổ,
 * khối màu chéo hai tông in lụa, minh hoạ đối xứng hai đầu kiểu lá bài Già/Q/K.
 * SVG tự giãn `w-full h-full` trong khung có `aspect-ratio` tương ứng `ratio`.
 */
export function TarotCardBack({ index, isSelected = false, hintLabel, ratio = '3/4', className = '', style }: TarotCardBackProps) {
  const slot = ((index % 8) + 8) % 8
  const uid = `cb${slot}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const p = PALETTES[slot]
  const W = 300
  const H = ratio === '5/7' ? 420 : 400
  const cx = W / 2
  const cy = H / 2
  const M = 15 // viền ngà
  const R = 46 // bán kính khía góc
  const tilt = 34 // độ nghiêng đường chéo
  const artY = cy - (H / 2 - M) * 0.5
  const panel = notchedPanel(M, M, W - M, H - M, R)
  const num = String(index + 1)
  const fontStack: CSSProperties = { fontFamily: 'var(--font-display), "Trebuchet MS", system-ui, sans-serif' }

  const top: ArtColors = { ink: INK, paper: PAPER, tone: p.light, pop: p.accent }
  const bottom: ArtColors = { ink: INK, paper: PAPER, tone: p.base, pop: p.accent }
  const shadowTop: ArtColors = { ink: p.dark, paper: p.dark, tone: p.dark, pop: p.dark }
  const shadowBottom: ArtColors = { ink: p.base, paper: p.base, tone: p.base, pop: p.base }

  const half = (bg: string, dots: string, colors: ArtColors, shadow: ArtColors, shadowOpacity: number, discFill: string, discOpacity: number) => (
    <g clipPath={`url(#${uid}-top)`}>
      <rect width={W} height={H} fill={bg} />
      <rect width={W} height={H} fill={`url(#${uid}-dots-${dots})`} />
      <circle cx={cx} cy={artY - 4} r={70} fill={discFill} opacity={discOpacity} />
      <circle cx={cx} cy={artY - 4} r={80} fill="none" stroke={colors.tone} strokeWidth={2} strokeDasharray="2 7" strokeLinecap="round" opacity={0.8} />
      <g transform={`translate(${cx + 5} ${artY + 4}) scale(1.06)`} opacity={shadowOpacity}>
        {ARTS[p.art](shadow)}
      </g>
      <g transform={`translate(${cx} ${artY}) scale(1.06)`}>{ARTS[p.art](colors)}</g>
    </g>
  )

  const cornerIndex = (
    <g>
      <text x={M + 17} y={M + 25} textAnchor="middle" fontSize={num.length > 1 ? 21 : 24} fontWeight={900} fill={INK} style={fontStack}>
        {num}
      </text>
      <path d={PIPS[p.pip]} transform={`translate(${M + 17} ${M + 38}) scale(0.62)`} fill={p.base} stroke={INK} strokeWidth={1.6} />
    </g>
  )
  const cornerPip = (
    <path d={PIPS[p.pip]} transform={`translate(${W - M - 15} ${M + 15}) scale(0.7)`} fill={p.base} stroke={INK} strokeWidth={1.6} />
  )

  // Ruy-băng gợi ý
  const ribbonY = H - M - 46
  const label = hintLabel?.toUpperCase()
  const labelSize = label ? Math.min(15, 214 / (0.62 * Math.max(label.length, 1))) : 0

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid slice"
      className={`block h-full w-full select-none ${className}`}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={`${uid}-card`}>
          <rect width={W} height={H} rx={22} />
        </clipPath>
        <clipPath id={`${uid}-panel`}>
          <path d={panel} />
        </clipPath>
        <clipPath id={`${uid}-top`}>
          <polygon points={`0,0 ${W},0 ${W},${cy - tilt} 0,${cy + tilt}`} />
        </clipPath>
        <pattern id={`${uid}-dots-a`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="4" cy="4" r="1.25" fill={INK} opacity={0.22} />
        </pattern>
        <pattern id={`${uid}-dots-b`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
          <circle cx="4" cy="4" r="1.25" fill={p.base} opacity={0.26} />
        </pattern>
      </defs>

      <g clipPath={`url(#${uid}-card)`}>
        {/* Viền ngà */}
        <rect width={W} height={H} fill={PAPER} />
        <rect x={5} y={5} width={W - 10} height={H - 10} rx={18} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.3} />

        {/* Bảng màu chéo + minh hoạ đối xứng hai đầu */}
        <g clipPath={`url(#${uid}-panel)`}>
          {half(p.base, 'a', top, shadowTop, 0.9, p.dark, 0.45)}
          <g transform={`rotate(180 ${cx} ${cy})`}>{half(p.light, 'b', bottom, shadowBottom, 0.35, '#FFFFFF', 0.4)}</g>

          {/* Đường chéo kép + huy hiệu giữa */}
          <line x1={0} y1={cy + tilt} x2={W} y2={cy - tilt} stroke={INK} strokeWidth={SW} />
          <line x1={0} y1={cy + tilt - 7} x2={W} y2={cy - tilt - 7} stroke={PAPER} strokeWidth={1.6} opacity={0.75} />
          <line x1={0} y1={cy + tilt + 7} x2={W} y2={cy - tilt + 7} stroke={INK} strokeWidth={1.4} opacity={0.5} />
        </g>
        <circle cx={cx} cy={cy} r={23} fill={isSelected ? '#FFB800' : PAPER} stroke={INK} strokeWidth={SW} />
        <circle cx={cx} cy={cy} r={17} fill="none" stroke={INK} strokeWidth={1.3} strokeDasharray="2 3" />
        <path d={PIPS[p.pip]} transform={`translate(${cx} ${cy}) scale(1.05)`} fill={p.base} stroke={INK} strokeWidth={1.8} />

        {/* Khung mực khía góc */}
        <path d={panel} fill="none" stroke={INK} strokeWidth={4} />

        {/* Chỉ số góc đối xứng */}
        {cornerIndex}
        <g transform={`rotate(180 ${cx} ${cy})`}>{cornerIndex}</g>
        {cornerPip}
        <g transform={`rotate(180 ${cx} ${cy})`}>{cornerPip}</g>

        {/* Ruy-băng gợi ý */}
        {label && (
          <g>
            <path d={`M58 ${ribbonY - 9} L22 ${ribbonY - 9} L34 ${ribbonY + 5} L22 ${ribbonY + 19} L58 ${ribbonY + 19}Z`} fill={p.accent} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <path d={`M242 ${ribbonY - 9} L278 ${ribbonY - 9} L266 ${ribbonY + 5} L278 ${ribbonY + 19} L242 ${ribbonY + 19}Z`} fill={p.accent} stroke={INK} strokeWidth={3} strokeLinejoin="round" />
            <rect x={36} y={ribbonY - 17} width={228} height={30} rx={6} fill={PAPER} stroke={INK} strokeWidth={3.5} />
            <rect x={36} y={ribbonY + 9} width={228} height={4} fill={INK} opacity={0.12} />
            <text x={cx} y={ribbonY + 3.5} textAnchor="middle" dominantBaseline="middle" fontSize={labelSize} fontWeight={900} letterSpacing={0.8} fill={INK} style={fontStack}>
              {label}
            </text>
          </g>
        )}

        {isSelected && <rect x={3} y={3} width={W - 6} height={H - 6} rx={20} fill="none" stroke="#FFB800" strokeWidth={6} />}
      </g>
    </svg>
  )
}

// ───────────────────────────── SecretCardFront ─────────────────────────────

export interface SecretCardFrontProps {
  keyword: string
  role: PartyRole
  hideRole: boolean
  cardIndex: number
  className?: string
  style?: CSSProperties
}

interface FrontTheme {
  band: string
  bandDark: string
  panel: string
  accent: string
  header: string
  caption: string
  seal: PhosphorIcon
  sealLabel: string
}

const FRONT_THEMES: Record<'civilian' | 'spy' | 'white-hat' | 'hidden', FrontTheme> = {
  civilian: { band: '#0F766E', bandDark: '#064E47', panel: '#CCFBF1', accent: '#14B8A6', header: 'DÂN THƯỜNG', caption: 'Từ khoá của bạn', seal: SmileyWink, sealLabel: 'Tìm ra kẻ lạ mặt!' },
  spy: { band: '#BE123C', bandDark: '#7F0D29', panel: '#FFE4E6', accent: '#FB7185', header: 'GIÁN ĐIỆP', caption: 'Từ khoá của bạn', seal: Detective, sealLabel: 'Hoà vào đám đông!' },
  'white-hat': { band: '#6D28D9', bandDark: '#3B1680', panel: '#EDE4FF', accent: '#A78BFA', header: 'MŨ TRẮNG', caption: 'Bạn không có từ khoá', seal: Ghost, sealLabel: 'Nghe kỹ & đoán từ!' },
  // Mù vai: Dân & Gián dùng CHUNG giao diện vàng nghệ — không lộ phe
  hidden: { band: '#D97706', bandDark: '#92400E', panel: '#FEF3C7', accent: '#FBBF24', header: 'LÁ BÀI BÍ MẬT', caption: 'Từ khoá của bạn', seal: Question, sealLabel: 'Phe của bạn là bí mật!' },
}

function keywordSize(word: string): string {
  const n = [...word].length
  if (n <= 5) return '15cqw'
  if (n <= 8) return '12.5cqw'
  if (n <= 12) return '10.5cqw'
  if (n <= 18) return '9cqw'
  return '7.5cqw'
}

/**
 * Mặt trước lá bài: băng tiêu đề poker, chỉ số góc, từ khoá lớn tương phản cao, ấn phe ở đáy.
 * - `hideRole` + Dân/Gián → giao diện vàng nghệ GIỐNG HỆT nhau (không lộ phe).
 * - Mũ Trắng → giao diện tím, không có từ khoá.
 * Tự giãn `w-full h-full` (dùng được cho khung 3/4 hoặc 5/7).
 */
export function SecretCardFront({ keyword, role, hideRole, cardIndex, className = '', style }: SecretCardFrontProps) {
  const uid = `sf-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const isWhite = role === 'white-hat'
  const t = FRONT_THEMES[isWhite ? 'white-hat' : hideRole ? 'hidden' : role]
  const Seal = t.seal
  const num = String(cardIndex + 1)
  const display: CSSProperties = { fontFamily: 'var(--font-display), "Trebuchet MS", system-ui, sans-serif' }
  const W = 300
  const H = 420
  const M = 15
  const R = 46
  const panel = notchedPanel(M, M, W - M, H - M, R)
  const bandH = 96

  return (
    <div
      className={`relative h-full w-full overflow-hidden select-none ${className}`}
      style={{ containerType: 'inline-size', backgroundColor: PAPER, borderRadius: '7.3% / 5.2%', ...style }}
    >
      {/* Khung SVG */}
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={`${uid}-panel`}>
            <path d={panel} />
          </clipPath>
          <pattern id={`${uid}-dots`} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx="4" cy="4" r="1.25" fill={INK} opacity={0.2} />
          </pattern>
          <pattern id={`${uid}-dots-soft`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
            <circle cx="4.5" cy="4.5" r="1.2" fill={t.band} opacity={0.16} />
          </pattern>
        </defs>
        <rect x={5} y={5} width={W - 10} height={H - 10} rx={18} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.3} vectorEffect="non-scaling-stroke" />
        <g clipPath={`url(#${uid}-panel)`}>
          <rect width={W} height={H} fill={t.panel} />
          <rect width={W} height={H} fill={`url(#${uid}-dots-soft)`} />
          {/* mép răng cưa vintage dưới băng tiêu đề */}
          {Array.from({ length: 16 }, (_, i) => (
            <circle key={`t${i}`} cx={i * 20 + 10} cy={bandH} r={10} fill={t.band} stroke={INK} strokeWidth={2.5} vectorEffect="non-scaling-stroke" />
          ))}
          {/* băng tiêu đề + băng đáy */}
          <rect width={W} height={bandH} fill={t.band} />
          <rect width={W} height={bandH} fill={`url(#${uid}-dots)`} />
          <rect y={H - 84} width={W} height={84} fill={t.band} />
          <rect y={H - 84} width={W} height={84} fill={`url(#${uid}-dots)`} />
          <line x1={0} y1={H - 84} x2={W} y2={H - 84} stroke={INK} strokeWidth={3.5} vectorEffect="non-scaling-stroke" />
          {/* tia chéo nhẹ sau từ khoá */}
          {Array.from({ length: 12 }, (_, i) => (
            <path key={`r${i}`} d={`M150 225 L${150 + 260 * Math.cos((i * 30 * Math.PI) / 180 - 0.07)} ${225 + 260 * Math.sin((i * 30 * Math.PI) / 180 - 0.07)} L${150 + 260 * Math.cos((i * 30 * Math.PI) / 180 + 0.07)} ${225 + 260 * Math.sin((i * 30 * Math.PI) / 180 + 0.07)}Z`} fill={t.accent} opacity={0.16} />
          ))}
        </g>
        <path d={panel} fill="none" stroke={INK} strokeWidth={4} vectorEffect="non-scaling-stroke" />
      </svg>

      {/* Chỉ số góc */}
      {[false, true].map((flip) => (
        <div
          key={String(flip)}
          className="absolute flex flex-col items-center leading-none"
          style={{
            width: '11.5cqw',
            ...(flip ? { right: '5cqw', bottom: '3.8cqw', transform: 'rotate(180deg)' } : { left: '5cqw', top: '3.8cqw' }),
          }}
        >
          <span style={{ ...display, fontSize: num.length > 1 ? '7cqw' : '8cqw', fontWeight: 900, color: INK }}>{num}</span>
          <span style={{ width: '5cqw', height: '5cqw', marginTop: '0.6cqw', color: t.band }}>
            <Seal size="100%" weight="fill" color={t.band} aria-hidden />
          </span>
        </div>
      ))}

      {/* Nội dung */}
      <div className="absolute inset-0 flex flex-col items-center" style={{ padding: '0 9cqw' }}>
        {/* Tiêu đề */}
        <div className="flex flex-col items-center justify-center text-center" style={{ height: `${(bandH / H) * 100}%`, paddingTop: '2cqw' }}>
          <span
            style={{ ...display, fontSize: '3.4cqw', fontWeight: 800, letterSpacing: '0.18em', color: 'rgba(255,251,242,0.85)' }}
          >
            ★ LÁ SỐ {num} ★
          </span>
          <span
            style={{
              ...display,
              fontSize: '7.6cqw',
              fontWeight: 900,
              letterSpacing: '0.06em',
              color: PAPER,
              textShadow: `0 0.6cqw 0 ${t.bandDark}`,
              lineHeight: 1.05,
            }}
          >
            {t.header}
          </span>
        </div>

        {/* Bảng từ khoá */}
        <div className="flex w-full flex-1 items-center justify-center" style={{ padding: '4cqw 0 0' }}>
          <div
            className="relative flex w-full flex-col items-center text-center"
            style={{
              backgroundColor: PAPER,
              border: `0.9cqw solid ${INK}`,
              borderRadius: '5cqw',
              boxShadow: `0 1.6cqw 0 ${INK}`,
              padding: '5cqw 4cqw 5.5cqw',
              transform: 'rotate(-1.5deg)',
            }}
          >
            <span
              className="absolute"
              style={{
                top: '-3.4cqw',
                ...display,
                fontSize: '3.3cqw',
                fontWeight: 900,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: PAPER,
                backgroundColor: INK,
                borderRadius: '99px',
                padding: '1cqw 3.2cqw',
                whiteSpace: 'nowrap',
              }}
            >
              {t.caption}
            </span>
            {isWhite ? (
              <>
                <span style={{ width: '22cqw', height: '22cqw' }}>
                  <Ghost size="100%" weight="duotone" color={t.band} aria-hidden />
                </span>
                <span style={{ ...display, fontSize: '6.4cqw', fontWeight: 900, color: INK, lineHeight: 1.15, marginTop: '1cqw' }}>
                  ??? ? ???
                </span>
                <span style={{ fontSize: '3.6cqw', fontWeight: 700, color: '#5B5270', marginTop: '1.5cqw', lineHeight: 1.3 }}>
                  Lắng nghe mọi người & hoà nhập thật khéo!
                </span>
              </>
            ) : (
              <span
                style={{
                  ...display,
                  fontSize: keywordSize(keyword),
                  fontWeight: 900,
                  color: INK,
                  lineHeight: 1.08,
                  overflowWrap: 'anywhere',
                  textWrap: 'balance',
                  letterSpacing: '-0.01em',
                }}
              >
                {keyword}
              </span>
            )}
          </div>
        </div>

        {/* Ấn phe ở đáy */}
        <div className="flex flex-col items-center" style={{ height: '27%', justifyContent: 'flex-end', paddingBottom: '4.5cqw' }}>
          <span
            className="flex items-center justify-center rounded-full"
            style={{
              width: '17cqw',
              height: '17cqw',
              backgroundColor: PAPER,
              border: `0.9cqw solid ${INK}`,
              boxShadow: `0 1.2cqw 0 ${INK}, inset 0 0 0 1.4cqw ${t.panel}`,
              marginBottom: '2cqw',
            }}
          >
            <span style={{ width: '10cqw', height: '10cqw' }}>
              <Seal size="100%" weight="duotone" color={t.band} aria-hidden />
            </span>
          </span>
          <span style={{ ...display, fontSize: '3.6cqw', fontWeight: 900, letterSpacing: '0.04em', color: PAPER, textAlign: 'center' }}>
            {t.sealLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────── firePartyConfetti ────────────────────────────

export type ConfettiPreset = PartyRole | 'spy+white'

const CONFETTI_COLORS: Record<ConfettiPreset, string[]> = {
  civilian: ['#14B8A6', '#5EEAD4', '#CCFBF1', '#FACC15', '#FFFFFF'],
  spy: ['#E11D48', '#FB7185', '#FFE4E6', '#231C35', '#FACC15'],
  'white-hat': ['#9333EA', '#C084FC', '#F3E8FF', '#FFFFFF', '#FACC15'],
  'spy+white': ['#E11D48', '#FB7185', '#9333EA', '#C084FC', '#FACC15', '#FFFFFF'],
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

/** Bắn pháo giấy đa hướng theo màu phe. Tự bỏ qua nếu người dùng bật giảm chuyển động. */
export function firePartyConfetti(preset: ConfettiPreset = 'civilian'): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return
  const colors = CONFETTI_COLORS[preset]
  const base = { colors, zIndex: 9999, disableForReducedMotion: true, ticks: 220, scalar: 1.05 }

  // Bùng nổ trung tâm
  void confetti({ ...base, particleCount: 90, spread: 80, startVelocity: 48, origin: { x: 0.5, y: 0.6 } })
  // Hai bên chéo vào giữa
  window.setTimeout(() => {
    void confetti({ ...base, particleCount: 55, angle: 60, spread: 60, startVelocity: 55, origin: { x: 0, y: 0.75 } })
    void confetti({ ...base, particleCount: 55, angle: 120, spread: 60, startVelocity: 55, origin: { x: 1, y: 0.75 } })
  }, 180)
  // Mưa sao lấp lánh từ trên
  window.setTimeout(() => {
    void confetti({ ...base, particleCount: 40, spread: 140, startVelocity: 25, gravity: 0.8, shapes: ['star'], origin: { x: 0.5, y: 0.25 } })
  }, 420)
}
