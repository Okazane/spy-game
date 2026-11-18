# Ai Là Gián Điệp? — Trò Chơi Hội Bạn Thân

Trò chơi suy luận xã hội **Pass & Play** (chơi chung trên **1 chiếc điện thoại duy nhất** cho nhóm **3–15 người**), lấy cảm hứng từ *Undercover* và *Spyfall* với phong cách thẻ bài bàn tròn ấm áp, đồ họa lá bài **Risograph Court-Card**, âm thanh **Web Audio Foley** giả lập vật liệu thật và bộ **270 cặp từ tiếng Việt thông dụng**.

- **Chơi ngay (Live Demo):** https://spy-game-virid-nine.vercel.app
- **Hỗ trợ Offline (PWA):** Có thể thêm vào màn hình chính điện thoại (iOS / Android) và chơi không cần mạng.

---

## Điểm nổi bật

- **Giao diện Bàn Tròn Gọn 1 Màn Hình (`100dvh` Zero-Scroll):** Toàn bộ 5 màn hình (*Sảnh chính → Sắp bàn chơi → Rút bài bí mật → Thảo luận & Bỏ phiếu → Tổng kết*) được thiết kế nằm trọn trong khung nhìn điện thoại, không phải cuộn lên xuống rườm rà.
- **Đồ họa lá bài Risograph Court-Card & Lật bài 3D chống nhìn trộm:**
  - 8 mẫu mặt lưng bài đối xứng hai đầu vẽ vector riêng biệt (*Thám tử, Mặt nạ, Kính lúp, Phong bì niêm sáp, Áo choàng, Ổ khóa, Mèo điệp viên, Con mắt*).
  - Khi rút bài, rèm nhung tối phủ nền chống nhìn trộm từ góc nghiêng; nhấn giữ trực tiếp lên mặt lá bài để lật 3D xem từ bí mật, thả tay ra lá bài lập tức úp lại.
- **Chế độ Mù Vai (Ẩn danh tính):** Khi bật *Mù vai*, cả **Dân Thường** và **Gián Điệp** đều nhận diện mạo thẻ bài giống hệt nhau và chỉ thấy từ khoá của mình — không ai biết mình thuộc phe đa số hay thiểu số cho tới khi lắng nghe cả bàn mô tả.
- **270 cặp từ tiếng Việt chọn lọc (540 từ đơn nhất, 0 trùng lặp):**
  - **Khởi động (90 cặp):** Đồ vật, món ăn, con vật quen thuộc dễ bắt nhịp.
  - **Vừa sức (90 cặp):** Nhiều nét tương đồng, đòi hỏi đặt câu khéo léo.
  - **Xoắn não (90 cặp):** Món ăn anh em, địa điểm du lịch, ứng dụng, tình huống giới trẻ cực sát nghĩa (*Bánh bao / Bánh giò*, *Bánh xèo / Bánh khọt*, *Crush / Người yêu cũ*, *Shopee / TikTok Shop*...).
- **Âm thanh Board Game Foley thời gian thực (Web Audio API):** Tổng hợp trực tiếp tiếng chẻ xào bài 5 nhịp, tiếng miết giấy lật bài, tiếng đặt bài xuống mặt nỉ, tiếng gõ quân cờ gỗ ngũ cung, tiếng đóng dấu cao su và 3 bản nhạc chiến thắng riêng cho từng phe (có nút Bật/Tắt lưu tự động).

---

## Luật chơi nhanh (3 Phe)

| Phe | Từ nhận được | Nhiệm vụ & Điều kiện thắng |
| :--- | :--- | :--- |
| **Dân Thường** | Từ khoá chung (VD: *Trà đào*) | Mô tả vừa đủ tinh tế để đồng đội nhận ra nhau mà không lộ từ. **Thắng** khi loại hết Gián Điệp và Mũ Trắng. |
| **Gián Điệp** | Từ khoá lệch gần giống (VD: *Trà vải*) | Lắng nghe, suy đoán từ của phe Dân và hòa nhập tự nhiên. **Thắng** khi trụ đến lúc số Gián Điệp ≥ số Dân Thường (khi không còn Mũ Trắng). |
| **Mũ Trắng** | *Không có từ khoá* | Luôn được xếp nói từ vị trí **#3 trở đi** để nghe ít nhất 2 người trước. Nếu bị cả bàn bỏ phiếu loại, Mũ Trắng có **1 cơ hội đoán từ của Dân Thường để lật kèo thắng ngay lập tức**! |

---

## Công nghệ sử dụng

- **Frontend:** React 19, TypeScript 6, Vite 8
- **State Management:** Zustand 5
- **Styling & Animation:** Tailwind CSS v4, Motion (`motion/react`), Google Fonts (`Nunito` & `Be Vietnam Pro`)
- **Đồ họa & Âm thanh:** SVG Risograph Playing Cards tự thiết kế, chân dung nhân vật `@dicebear` (`adventurer`), `@phosphor-icons/react`, `canvas-confetti`, Web Audio API (`DynamicsCompressor` + Foley Synthesizer)
- **PWA:** `vite-plugin-pwa` (Workbox offline caching)

---

## Cấu trúc thư mục

```text
spy-game/
├── index.html                  # Khởi tạo trang, meta PWA & font chữ tiếng Việt
├── vite.config.ts              # Cấu hình Vite, Tailwind CSS v4 & PWA manifest
├── GAME_SPEC.md                # Tài liệu đặc tả kỹ thuật & logic bất biến của trò chơi
└── src/
    ├── App.tsx                 # Quản lý chuyển cảnh 5 phase, ErrorBoundary & nút Âm thanh
    ├── index.css               # Hệ thống token màu giấy kem (#FAF4E8) & nút bấm 3D
    ├── components/
    │   ├── PartyVisuals.tsx    # Đồ họa lá bài Risograph (TarotCardBack, SecretCardFront), AvatarPortrait, RoleEmblem & Confetti
    │   ├── GameCard.tsx        # Thẻ bài úp / thẻ nhân vật đã nhận trên bàn
    │   ├── EliminateDialog.tsx # Hộp thoại chốt phiếu loại & lật vai + Mũ Trắng đoán từ lật kèo
    │   └── RulesModal.tsx      # Bảng hướng dẫn nhanh 3 vai trò & 4 bước chơi
    ├── data/
    │   ├── avatars.ts          # 15 chân dung nhân vật minh họa DiceBear & biệt danh ngẫu nhiên
    │   └── keywords.ts         # 270 cặp từ tiếng Việt thông dụng (90 dễ / 90 vừa / 90 khó)
    ├── screens/
    │   ├── HomeScreen.tsx      # Sảnh chính với quạt 3 lá bài vai trò tương tác
    │   ├── SetupScreen.tsx     # Sắp bàn chơi gọn 1 màn hình (3–15 người, độ khó, lộ/mù vai)
    │   ├── RevealScreen.tsx    # Bàn rút bài, xào bài trực tiếp, lật bài 3D & bảng thứ tự nói
    │   ├── GameScreen.tsx      # Màn thảo luận: dải thứ tự nói kèm tên & lưới bỏ phiếu tự co giãn
    │   └── WinScreen.tsx       # Bảng vinh danh phe thắng, so từ khoá 2 phe & danh sách vai trò
    ├── stores/
    │   └── gameStore.ts        # State machine, thuật toán chia vai, ràng buộc Mũ Trắng >= #3 & xét thắng thua
    └── utils/
        └── sound.ts            # Bộ tổng hợp âm thanh Foley bằng Web Audio API & phản hồi rung
```

---

## Chạy dự án trên máy cá nhân

```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy môi trường phát triển (http://localhost:5173)
npm run dev

# 3. Kiểm tra lỗi lint (Oxlint)
npm run lint

# 4. Đóng gói bản Production + PWA
npm run build
```
