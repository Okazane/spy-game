# Ai Là Gián Điệp? — Trò Chơi Hội Bạn Thân (100% Offline PWA)

Trò chơi suy luận xã hội **Pass & Play** (chơi chung trên **1 chiếc điện thoại duy nhất** cho nhóm **3–20 người**), lấy cảm hứng từ *Undercover* và *Spyfall* với phong cách thẻ bài bàn tròn ấm áp, đồ họa lá bài **Risograph Court-Card**, 20 nhân vật **Pixel Pop-Arcade**, âm thanh **Web Audio Foley**, cơ sở dữ liệu cục bộ **IndexedDB (Dexie.js)** kèm sao lưu **`.json`** và bộ **200 cặp từ tiếng Việt tuyển chọn + Từ tự tạo**.

- **Chơi ngay (Live Demo):** https://spy-game-virid-nine.vercel.app
- **100% Offline-First PWA:** Toàn bộ giao diện, font chữ tiếng Việt (`.woff2`), biểu tượng, âm thanh và cơ sở dữ liệu đều nằm gọn trên thiết bị — cài ra màn hình chính (iOS / Android / Desktop) và chơi mượt mà ngay cả khi bật Chế độ máy bay.

---

## Điểm nổi bật

- **Giao diện Bàn Tròn Gọn 1 Màn Hình (`100dvh` Zero-Scroll):** Toàn bộ 5 màn hình (*Sảnh chính → Tạo bàn chơi → Rút bài bí mật → Thảo luận & Bỏ phiếu → Tổng kết*) nằm trọn trong khung nhìn điện thoại kèm khoá `overscroll-behavior: none` chống kéo tải lại trang nhầm khi chuyền máy.
- **Đồ họa lá bài Risograph Court-Card & Lật bài 3D chống nhìn trộm:**
  - 8 mẫu mặt lưng bài đối xứng hai đầu vẽ vector riêng biệt (*Thám tử, Mặt nạ, Kính lúp, Phong bì niêm sáp, Áo choàng, Ổ khóa, Mèo điệp viên, Con mắt*).
  - Khi rút bài, rèm nhung tối phủ nền chống nhìn trộm từ góc nghiêng; nhấn giữ trực tiếp lên mặt lá bài để lật 3D xem từ bí mật, thả tay ra lá bài lập tức úp lại.
- **Khôi phục ván đấu chống văng trang (Crash-Proof Session):** Tự động lưu ván đang chơi dở xuống IndexedDB — lỡ tắt nhầm tab hoặc tải lại trình duyệt giữa ván vẫn giữ nguyên lá bài, tên người chơi và lượt nói.
- **200 cặp từ tiếng Việt tuyển chọn + Bộ bài Từ Tự Tạo:**
  - **Dễ (65 cặp):** Cùng nhóm rõ nét, chung ngữ cảnh đời sống (*Chó / Mèo*, *Dầu gội / Sữa tắm*, *Đàn guitar / Đàn ukulele*...).
  - **Vừa (70 cặp):** Anh em cùng họ, dễ tả trùng (*Phở bò / Bún bò Huế*, *Bánh cuốn / Bánh ướt*, *Cờ vua / Cờ tướng*...).
  - **Khó (65 cặp):** Song sinh xoắn não cực sát nghĩa, hớ 1 từ là lộ (*Bánh bao / Bánh giò*, *Bánh xèo / Bánh khọt*, *Shopee / Lazada*, *Mắm tôm / Mắm nêm*...).
  - **Từ Tự Tạo (Offline):** Tự tạo bộ từ khoá theo câu chuyện riêng của nhóm bạn, chơi riêng chế độ *Tự tạo* hoặc trộn chung vào kho chuẩn (tự động tráo 50/50 vai Dân/Gián mỗi ván).
- **Bảng Điểm Hội Bạn & Sao Lưu `.json`:**
  - Tự động cộng điểm sau mỗi ván thắng (*Dân +1đ · Gián +3đ · Mũ Trắng +4đ · Gián & Mũ +2đ*) và lưu lịch sử 50 ván gần nhất.
  - Xuất / Nhập file `.json` có kiểm duyệt schema nghiêm ngặt để sao lưu hoặc chuyển kho từ & bảng điểm sang máy khác không cần tài khoản đám mây.
- **Tuỳ chỉnh tự do 3–20 người & Chế độ Mù Vai:** Chỉnh linh hoạt số lượng **Người chơi (3–20)**, **Gián điệp (0..N-1)**, **Mũ trắng (0..N-1)** và bật/tắt *Lộ vai / Mù vai*.

---

## Luật chơi nhanh (3 Phe)

| Phe | Từ nhận được | Nhiệm vụ & Điều kiện thắng |
| :--- | :--- | :--- |
| **Dân Thường** | Từ khoá chung (VD: *Trà đào*) | Mô tả vừa đủ tinh tế để đồng đội nhận ra nhau mà không lộ từ. **Thắng (+1đ)** khi loại hết Gián Điệp và Mũ Trắng. |
| **Gián Điệp** | Từ khoá lệch gần giống (VD: *Trà vải*) | Lắng nghe, suy đoán từ của phe Dân và hòa nhập tự nhiên. **Thắng (+3đ)** khi trụ đến lúc số Gián Điệp ≥ số Dân Thường (khi không còn Mũ Trắng). |
| **Mũ Trắng** | *Không có từ khoá* | Luôn được xếp nói từ vị trí **#3 trở đi** để nghe ít nhất 2 người trước. Nếu bị cả bàn bỏ phiếu loại, Mũ Trắng có **1 cơ hội đoán từ của Dân Thường để lật kèo thắng ngay (+4đ)**! |

---

## Công nghệ sử dụng

- **Frontend:** React 19, TypeScript 6, Vite 8
- **State & Local Database:** Zustand 5 + Dexie.js 4 (IndexedDB Offline + `.json` Backup/Restore)
- **Styling, Fonts & Animation:** Tailwind CSS v4, Motion (`motion/react`), `@fontsource/nunito` & `@fontsource/be-vietnam-pro` (nhúng `.woff2` nội bộ 100% offline)
- **Đồ họa & Âm thanh:** SVG Risograph Playing Cards, 20 chân dung **Pixel Pop-Arcade** (`public/avatars/*.webp`), `@phosphor-icons/react`, `canvas-confetti`, Web Audio API Foley Synthesizer
- **PWA:** `vite-plugin-pwa` (Workbox precache toàn bộ HTML/JS/CSS/WebP/PNG/WOFF2)

---

## Cấu trúc thư mục

```text
spy-game/
├── index.html                        # Khởi tạo trang, meta PWA & apple-touch-icon
├── vite.config.ts                    # Cấu hình Vite, Tailwind CSS v4 & Workbox PWA manifest
├── GAME_SPEC.md                      # Tài liệu đặc tả kỹ thuật, cơ sở dữ liệu & bất biến logic
├── tests/
│   └── game_and_db_validation.test.mjs # Kiểm thử tự động luật chơi, chống lặp từ & bảo mật JSON backup
└── src/
    ├── App.tsx                       # Quản lý chuyển cảnh 5 phase, ErrorBoundary & nút Âm thanh
    ├── fonts.css                     # Khai báo @font-face nội bộ (.woff2 Latin + Vietnamese)
    ├── index.css                     # Hệ thống token màu giấy kem (#FAF4E8) & nút bấm 3D
    ├── db/
    │   └── gameDb.ts                 # SpyGameDB (Dexie IndexedDB): session, customKeywords, scores, history & JSON backup
    ├── components/
    │   ├── PartyVisuals.tsx          # Đồ họa lá bài Risograph, AvatarPortrait, RoleEmblem & Confetti
    │   ├── GameCard.tsx              # Thẻ bài úp / thẻ nhân vật đã nhận trên bàn
    │   ├── EliminateDialog.tsx       # Hộp thoại chốt phiếu loại & lật vai + Mũ Trắng đoán từ lật kèo
    │   ├── RulesModal.tsx            # Bảng hướng dẫn nhanh 3 vai trò & 4 bước chơi
    │   └── DataHubModal.tsx          # Kho Bàn Tròn Offline (Bảng Điểm, Từ Tự Tạo, Sao Lưu .json)
    ├── data/
    │   ├── avatars.ts                # 20 chân dung Pixel Pop-Arcade (/avatars/01..20.webp) & mật danh
    │   └── keywords.ts               # 200 cặp từ tuyển chọn + bộ chọn từ chuẩn hoá chống lặp
    ├── screens/
    │   ├── HomeScreen.tsx            # Sảnh chính gọn gàng với quạt 3 lá bài vai trò tương tác
    │   ├── SetupScreen.tsx           # Tuỳ chỉnh 3–20 người, Gián điệp, Mũ trắng, độ khó & từ tự tạo
    │   ├── RevealScreen.tsx          # Bàn rút bài, xào bài trực tiếp, lật bài 3D & bảng thứ tự nói
    │   ├── GameScreen.tsx            # Màn thảo luận: đồng hồ 90s, thứ tự nói & lưới bỏ phiếu
    │   └── WinScreen.tsx             # Bảng vinh danh phe thắng, điểm cộng, từ khoá & danh sách vai trò
    ├── stores/
    │   └── gameStore.ts              # State machine đồng bộ IndexedDB, chia vai & xét thắng thua
    └── utils/
        └── sound.ts                  # Bộ tổng hợp âm thanh Foley bằng Web Audio API & phản hồi rung
```

---

## Chạy dự án trên máy cá nhân

```bash
# 1. Cài đặt thư viện
npm install

# 2. Chạy môi trường phát triển (http://localhost:5173)
npm run dev

# 3. Kiểm tra lỗi lint (Oxlint) & chạy bộ kiểm thử tự động
npm run lint
npm test

# 4. Đóng gói bản Production + Offline PWA
npm run build
```
