// Bộ 20 Avatar đồ hoạ Pixel Pop-Arcade (16-Bit) cho bàn chơi 3–20 người.
// Hình ảnh WebP lossless sắc nét tại /avatars/01.webp .. /avatars/20.webp,
// hiển thị với image-rendering: pixelated và được precache offline bởi PWA.

export interface AvatarItem {
  id: string
  name: string
  emoji: string
  bg: string
  color: string
  /** Đường dẫn ảnh avatar dùng trực tiếp cho <img src>. */
  svgUri: string
}

export const AVATARS: AvatarItem[] = [
  { id: 'girl1',     name: 'Cô Gái Kẹo Cao Su',    emoji: '🍬', bg: '#FFE4E6', color: '#E11D48', svgUri: '/avatars/01.webp' },
  { id: 'detective', name: 'Thám Tử Kính Râm',     emoji: '🕵️', bg: '#FEF3C7', color: '#D97706', svgUri: '/avatars/02.webp' },
  { id: 'ninja',     name: 'Ninja Tia Chớp',       emoji: '🥷', bg: '#E2E8F0', color: '#1E293B', svgUri: '/avatars/03.webp' },
  { id: 'fox',       name: 'Cáo Đỏ Điệp Viên',     emoji: '🦊', bg: '#FFEDD5', color: '#EA580C', svgUri: '/avatars/04.webp' },
  { id: 'cat',       name: 'Mèo Đen Hacker',       emoji: '🐱', bg: '#E0E7FF', color: '#4F46E5', svgUri: '/avatars/05.webp' },
  { id: 'bear',      name: 'Gấu Nâu DJ',           emoji: '🐻', bg: '#FEF9C3', color: '#CA8A04', svgUri: '/avatars/06.webp' },
  { id: 'wizard',    name: 'Bóng Ma Quý Tộc',      emoji: '👻', bg: '#EDE9FE', color: '#7C3AED', svgUri: '/avatars/07.webp' },
  { id: 'robot',     name: 'Robot Điện Tử',        emoji: '🤖', bg: '#CCFBF1', color: '#0D9488', svgUri: '/avatars/08.webp' },
  { id: 'alien',     name: 'Người Vũ Trụ 3 Mắt',   emoji: '👽', bg: '#DCFCE7', color: '#16A34A', svgUri: '/avatars/09.webp' },
  { id: 'lion',      name: 'Ngôi Sao Nhạc Rock',   emoji: '🎸', bg: '#FFEDD5', color: '#D97706', svgUri: '/avatars/10.webp' },
  { id: 'panda',     name: 'Gấu Trúc Kungfu',      emoji: '🐼', bg: '#F1F5F9', color: '#334155', svgUri: '/avatars/11.webp' },
  { id: 'wolf',      name: 'Sói Xám Áo Da',        emoji: '🐺', bg: '#EDE9FE', color: '#5B21B6', svgUri: '/avatars/12.webp' },
  { id: 'pirate',    name: 'Nữ Hải Tặc Ngầu',      emoji: '🏴‍☠️', bg: '#FCE7F3', color: '#DB2777', svgUri: '/avatars/13.webp' },
  { id: 'hero',      name: 'Hiệp Sĩ Game Thùng',   emoji: '🛡️', bg: '#CFFAFE', color: '#0891B2', svgUri: '/avatars/14.webp' },
  { id: 'owl',       name: 'Cú Mèo Học Giả',       emoji: '🦉', bg: '#FEF3C7', color: '#92400E', svgUri: '/avatars/15.webp' },
  { id: 'sakura',    name: 'Phù Thủy Sao Đêm',     emoji: '🔮', bg: '#FFE4E6', color: '#BE123C', svgUri: '/avatars/16.webp' },
  { id: 'kaito',     name: 'Ảo Thuật Gia Đêm',     emoji: '🎩', bg: '#DBEAFE', color: '#1D4ED8', svgUri: '/avatars/17.webp' },
  { id: 'yuki',      name: 'Cánh Cụt Vương Miện',  emoji: '🐧', bg: '#E0F2FE', color: '#0369A1', svgUri: '/avatars/18.webp' },
  { id: 'ren',       name: 'Ếch Xanh Kính Ngầu',   emoji: '🐸', bg: '#CCFBF1', color: '#0F766E', svgUri: '/avatars/19.webp' },
  { id: 'mio',       name: 'Shiba Khăn Đỏ',        emoji: '🐕', bg: '#FEF3C7', color: '#D97706', svgUri: '/avatars/20.webp' },
]

export const SPY_CODENAMES = [
  'Thám Tử Đêm',
  'Cáo Đỏ',
  'Mèo Hacker',
  'Bóng Ma',
  'Ninja Bạc',
  'Gấu DJ',
  'Ếch Ngầu',
  'Sói Xám',
  'Cú Học Giả',
  'Cánh Cụt Vua',
  'Shiba Đỏ',
  'Hải Tặc Đỏ',
  'Ảo Thuật Gia',
  'Hiệp Sĩ Xanh',
  'Robot Tia Chớp',
  'Phù Thủy Sao',
  'Gấu Trúc Võ',
  'Khách Vũ Trụ',
  'Kẹo Cao Su',
  'Sao Nhạc Rock',
]

export function getAvatarByIndex(index: number): AvatarItem {
  return AVATARS[((index % AVATARS.length) + AVATARS.length) % AVATARS.length]
}
