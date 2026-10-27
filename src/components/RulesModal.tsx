import { motion, AnimatePresence } from 'motion/react'
import { Scroll, X } from '@phosphor-icons/react'

interface RulesModalProps {
  onClose: () => void
}

export function RulesModal({ onClose }: RulesModalProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/80 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Sheet */}
        <motion.div
          className="relative w-full max-w-lg bg-[#fcfaf3] border-[1.5px] border-[#18120c] p-6 shadow-[6px_6px_0_#18120c] rounded-[3px] overflow-y-auto z-10 space-y-4"
          style={{ maxHeight: '85dvh' }}
          initial={{ y: 80, scale: 0.95 }}
          animate={{ y: 0, scale: 1 }}
          exit={{ y: 80, scale: 0.95 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#18120c]/30">
            <div className="flex items-center gap-2">
              <Scroll size={22} weight="fill" className="text-[#c8a165]" />
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--ink-primary)' }}>
                MẬT LỆNH & LUẬT CHƠI
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng luật chơi"
              className="w-8 h-8 rounded-[2px] flex items-center justify-center bg-[#f4ede0] border border-[#18120c] text-[#18120c] cursor-pointer shadow-[1px_1px_0_#18120c] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
            >
              <X size={16} weight="bold" />
            </button>
          </div>

          <div className="space-y-3.5 pt-1">
            {[
              {
                role: 'DÂN THƯỜNG',
                color: '#1d4ed8',
                bg: '#eff6ff',
                desc: 'Nhận một từ khoá bí mật. Mô tả từ khoá khéo léo mà không được nói thẳng ra. Tìm và biểu quyết loại bỏ Gián Điệp.',
                win: 'Loại bỏ toàn bộ Gián Điệp và Mũ Trắng khỏi bàn.',
              },
              {
                role: 'GIÁN ĐIỆP',
                color: '#b91c1c',
                bg: '#fef2f2',
                desc: 'Nhận từ khoá khác biệt nhưng cùng chủ đề. Lắng nghe thật kỹ, giả vờ là Dân Thường và đánh cắp thông tin.',
                win: 'Tồn tại đến khi số lượng Gián Điệp >= số lượng Dân Thường.',
              },
              {
                role: 'MŨ TRẮNG',
                color: '#6d28d9',
                bg: '#f5f3ff',
                desc: 'Hoàn toàn không có từ khoá. Lắng nghe và phán đoán theo số đông để không ai nghi ngờ.',
                win: 'Sống sót đến cuối cùng HOẶC đoán đúng từ khoá của Phe Dân khi bị biểu quyết loại.',
              },
            ].map(({ role, color, bg, desc, win }) => (
              <div
                key={role}
                className="rounded-[2px] p-3.5 space-y-1 border-[1.5px] shadow-[2px_2px_0_#18120c]"
                style={{
                  backgroundColor: bg,
                  borderColor: color,
                }}
              >
                <p style={{ fontFamily: 'var(--font-stamp)', fontWeight: 900, color, fontSize: '0.92rem' }}>
                  {role}
                </p>
                <p className="text-xs text-[#181410] leading-relaxed font-semibold" style={{ fontFamily: 'var(--font-body)' }}>{desc}</p>
                <p style={{ color, fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-body)' }}>🏆 ĐIỀU KIỆN THẮNG: {win}</p>
              </div>
            ))}

            <div className="rounded-[2px] p-3.5 space-y-2 bg-[#f4ede0] border-[1.5px] border-[#18120c] shadow-[2px_2px_0_#18120c]">
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--ink-primary)', fontSize: '0.98rem' }}>
                CÁC BƯỚC ĐIỀU TRA
              </p>
              {[
                'Mỗi người lần lượt cầm máy và quét vân tay nhận từ khoá riêng tư.',
                'Cả bàn thảo luận lần lượt theo thứ tự phát biểu bốc thăm ngẫu nhiên.',
                'Cả nhóm thảo luận và bấm nút "NGHI NGỜ" để biểu quyết loại bỏ một người.',
                'Khi loại, danh tính người đó sẽ được đóng dấu xác nhận ngay lập tức.',
              ].map((step, i) => (
                <p key={i} className="text-xs text-[#2b1e15] leading-relaxed font-semibold" style={{ fontFamily: 'var(--font-body)' }}>
                  {i + 1}. {step}
                </p>
              ))}
            </div>

            <button
              onClick={onClose}
              className="btn-kraft-stamp w-full py-3.5 text-sm font-black shadow-[3px_3px_0_#18120c]"
            >
              ĐÃ HIỂU MẬT LỆNH, BẮT ĐẦU!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
