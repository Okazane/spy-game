// Bộ 15 Avatar nhân vật chibi phong cách hoạt hình cho game party

export interface AvatarItem {
  id: string
  name: string
  emoji: string
  bg: string
  color: string
}

export const AVATARS: AvatarItem[] = [
  { id: 'girl1', name: 'Nữ Điệp Viên', emoji: '👧', bg: '#fee2e2', color: '#dc2626' },
  { id: 'detective', name: 'Thám Tử Lừng Danh', emoji: '🕵️', bg: '#fef3c7', color: '#d97706' },
  { id: 'ninja', name: 'Ninja Bóng Đêm', emoji: '🥷', bg: '#f1f5f9', color: '#0f172a' },
  { id: 'fox', name: 'Cáo Tinh Ranh', emoji: '🦊', bg: '#ffedd5', color: '#ea580c' },
  { id: 'cat', name: 'Mèo Mật Vụ', emoji: '🐱', bg: '#e0e7ff', color: '#4f46e5' },
  { id: 'bear', name: 'Gấu Cảnh Vệ', emoji: '🐻', bg: '#fef9c3', color: '#ca8a04' },
  { id: 'wizard', name: 'Phù Thủy Ảo Thuật', emoji: '🧙‍♂️', bg: '#f3e8ff', color: '#9333ea' },
  { id: 'robot', name: 'Robot Trinh Sát', emoji: '🤖', bg: '#e0f2fe', color: '#0284c7' },
  { id: 'alien', name: 'Người Ngoài Hành Tinh', emoji: '👽', bg: '#dcfce7', color: '#16a34a' },
  { id: 'lion', name: 'Sư Tử Dũng Mãnh', emoji: '🦁', bg: '#fef08a', color: '#ca8a04' },
  { id: 'panda', name: 'Gấu Trúc Kungfu', emoji: '🐼', bg: '#f8fafc', color: '#334155' },
  { id: 'wolf', name: 'Sói Cô Độc', emoji: '🐺', bg: '#e2e8f0', color: '#475569' },
  { id: 'pirate', name: 'Thuyền Trưởng Hải Tặc', emoji: '🏴‍☠️', bg: '#fee2e2', color: '#b91c1c' },
  { id: 'hero', name: 'Hiệp Sĩ Áo Choàng', emoji: '🦸', bg: '#cffafe', color: '#0891b2' },
  { id: 'owl', name: 'Cú Mèo Tri Thức', emoji: '🦉', bg: '#fef3c7', color: '#b45309' },
]

export const SPY_CODENAMES = [
  'Cáo Đen', 'Báo Đốm', 'Mắt Đại Bàng', 'Điệp Viên 007', 'Bóng Ma',
  'Tia Chớp', 'Hổ Quyền', 'Sóc Chuột', 'Cú Đêm', 'Gấu Bắc Cực',
  'Rắn Hổ Mang', 'Sói Hoang', 'Cá Mập Xanh', 'Phượng Hoàng', 'Bọ Cạp Vàng'
]

export function getAvatarByIndex(index: number): AvatarItem {
  return AVATARS[index % AVATARS.length]
}
