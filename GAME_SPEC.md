# ĐẶC TẢ KỸ THUẬT & MẠCH TRÒ CHƠI "AI LÀ GIÁN ĐIỆP?"

> **Phiên bản:** 3.1.0 (100% Offline-First PWA & Local IndexedDB Edition)  
> **Công nghệ:** React 19, TypeScript 6, Tailwind CSS v4, Zustand 5, Dexie.js (IndexedDB), Motion, Fontsource Offline Fonts, Vite 8 + Workbox PWA  
> **Phong cách thiết kế:** Bàn chơi thẻ bài giấy kem ấm áp (`#FAF4E8`), viền mực in `#231C35`, đồ họa bài tây minh họa Risograph Court-Card, bố cục gọn trọn 1 màn hình (`100dvh` không cuộn dọc, `overscroll-behavior: none` chống kéo làm mới nhầm khi chuyền máy).

---

## 1. Triết lý trò chơi (Hybrid Pass & Play — 100% Offline)

**"Ai Là Gián Điệp?"** hỗ trợ **3–20 người chơi** ngồi quây quần ngoài đời thực và dùng chung **1 chiếc điện thoại duy nhất**, hoạt động **100% không cần Internet**:
1. **Ứng dụng đóng vai trò Trọng tài & Bộ bài vật lý:** Trộn từ khoá bí mật, chia vai ngẫu nhiên, chống nhìn trộm khi chuyền máy, sắp xếp thứ tự nói hợp lệ, xử lý bỏ phiếu mở vai, kiểm tra đoán từ lật kèo của Mũ Trắng, xét điều kiện thắng thua tự động và tích luỹ bảng điểm nhiều ván ngay trên thiết bị.
2. **Người chơi tương tác trực tiếp ngoài đời thực:** Tự mô tả 1 câu theo lượt nói, quan sát biểu cảm, tranh luận vặn hỏi và thống nhất bỏ phiếu loại kẻ tình nghi.

---

## 2. Quy trình 5 Màn Hình (`100dvh` Single-Viewport) & Kho Bàn Tròn Offline

```text
'home' ──> 'setup' ──> 'reveal' ──> 'playing' ──> 'ended'
  ^                                                 │
  └────────────────── resetGame() ──────────────────┘
```

| Phase / Modal | Tệp nguồn | Chức năng chính trên ứng dụng | Hoạt động ngoài đời thực |
| :--- | :--- | :--- | :--- |
| `'home'` | `HomeScreen.tsx` | Quạt 3 lá bài minh họa 3 phe tương tác, mở `RulesModal`, `DataHubModal` (*Bảng điểm & Từ*) hoặc vào bàn chơi. | Nhóm bạn mở máy chuẩn bị ván mới. |
| `'setup'` | `SetupScreen.tsx` | Tuỳ chỉnh tự do số người chơi (`3–20`), Gián Điệp (`0..N-1`), Mũ Trắng (`0..N-1`); chọn Độ khó (*Dễ / Vừa / Khó / Tự tạo*), bật/tắt gộp từ riêng và Chế độ *Lộ vai / Mù vai*. | Thống nhất số người chơi, vai trò và bộ từ khoá cho ván đấu. |
| `'reveal'` | `RevealScreen.tsx` | Bàn bài úp Risograph có nút **Xào bài** trực quan. Chạm chọn lá bài mở `ThumbPeekModal`: **nhấn giữ trực tiếp lên mặt lá bài lớn** để lật 3D xem từ khoá, ký tên (hoặc chọn nhanh tên ván trước), rồi xem bảng **Thứ Tự Nói**. | Giữ im lặng chuyền điện thoại qua từng người; sau khi người cuối nhận bài, đặt máy giữa bàn xem thứ tự nói. |
| `'playing'` | `GameScreen.tsx` | Hiển thị số người còn lại, đồng hồ đếm ngược 90 giây, dải **Thứ tự nói kèm tên** (`1. Tên`, `2. Tên`...) và lưới thẻ người chơi tự co giãn (`3–20`). Bấm thẻ để mở `EliminateDialog` & `RoleRevealDialog`. | Lần lượt mô tả 1 câu theo thứ tự nói, tự do tranh luận và biểu quyết loại 1 người đáng nghi nhất. |
| `'ended'` | `WinScreen.tsx` | Công bố phe thắng kèm pháo giấy `canvas-confetti`, huy hiệu điểm cộng từng người (`+1đ` / `+3đ` / `+4đ` / `+2đ`), so sánh **Từ Dân Thường** vs **Từ Gián Điệp**, bảng vai trò toàn bộ người chơi và nút mở nhanh **Bảng điểm**. | Cả bàn đối chiếu từ khoá hai phe, xem thứ hạng và bắt đầu ván tiếp theo. |
| `DataHubModal` | `DataHubModal.tsx` | **Kho Bàn Tròn Offline** gồm 3 tab: **Bảng Điểm** (bảng xếp hạng + lịch sử tối đa 50 ván + đặt lại điểm), **Từ Tự Tạo** (thêm/xoá cặp từ tiếng Việt riêng), **Sao Lưu** (Xuất/Nhập file `.json` kiểm tra schema nghiêm ngặt & Xoá dữ liệu máy). | Quản lý kho từ nội bộ của nhóm bạn và chuyển dữ liệu sang điện thoại khác không cần mạng. |

---

## 3. Các bất biến logic quan trọng (`src/stores/gameStore.ts`)

### 3.1 Ràng buộc số lượng người chơi & vai trò (`clampSettings`)
- Tổng người chơi: $3 \le \text{totalPlayers} \le 20$
- Đảm bảo luôn có ít nhất 1 Dân Thường: $\text{spyCount} + \text{whiteHatCount} \le \text{totalPlayers} - 1$
- Đảm bảo luôn có ít nhất 1 kẻ ẩn danh: $\text{spyCount} + \text{whiteHatCount} \ge 1$
- Số Dân Thường: $\text{civilianCount} = \text{totalPlayers} - \text{spyCount} - \text{whiteHatCount}$

### 3.2 Bất biến thứ tự phát biểu (`generateSpeakingOrder`)
- **Quy tắc bắt buộc:** Mũ Trắng **không bao giờ** đứng ở vị trí nói `#1` hoặc `#2` (khi bàn có từ 2 người Dân/Gián trở lên), đảm bảo Mũ Trắng luôn được nghe ít nhất 2 câu gợi ý trước khi tới lượt mình.
- Danh sách `speakingOrder` lưu theo `player.id` để không bị trùng lặp nếu hai người chơi đặt tên giống nhau.

### 3.3 Điều kiện chiến thắng (`checkWin` & `whiteHatGuess`)
1. **Dân Thường thắng (`'civilian'`):** Không còn Gián Điệp và không còn Mũ Trắng ($\text{aliveSpy} = 0 \land \text{aliveWhiteHat} = 0$).
2. **Mũ Trắng thắng / lật kèo (`'white-hat'`):**
   - Đoán đúng từ khoá của Dân Thường ngay khi vừa bị bỏ phiếu loại (`isKeywordMatch` so khớp không phân biệt hoa thường và hỗ trợ cả không dấu, kể cả `đ/Đ`), **HOẶC**
   - Không còn Gián Điệp và $\text{aliveWhiteHat} \ge \text{aliveCivilian}$ (trên bàn truyền thống) hoặc $\text{aliveCivilian} = 0$.
3. **Gián Điệp & Mũ Trắng cùng thắng (`'spy+white'`):** Bàn truyền thống còn $\le 3$ người sống sót (hoặc bàn hỗn chiến không còn Dân Thường) và có mặt cả Gián Điệp lẫn Mũ Trắng.
4. **Gián Điệp thắng (`'spy'`):** Không còn Mũ Trắng và $\text{aliveSpy} \ge \text{aliveCivilian}$ (trên bàn truyền thống) hoặc $\text{aliveCivilian} = 0$.

---

## 4. Cơ sở dữ liệu Offline trên thiết bị (`src/db/gameDb.ts` — Dexie.js IndexedDB)

Toàn bộ dữ liệu được lưu cục bộ trong `SpyGameDB` (IndexedDB + `navigator.storage.persist()`), không gửi bất kỳ dữ liệu nào ra ngoài mạng:
1. **Khôi phục ván đấu chống văng trang (`session`):** Tự động đồng bộ trạng thái ván đang chơi (`roundId`, `phase`, `players`, `settings`, `speakingOrder`, `selectedCardIndex`, `winner`, `wasAborted`, `whiteHatGuessedWord`, `eliminatedPlayerId`, `previousNames`, `recentKeywords`). Nếu người chơi lỡ tải lại trang hoặc đóng trình duyệt giữa ván, mở lại ứng dụng sẽ khôi phục đúng vị trí đang chơi.
2. **Kho từ tự tạo (`customKeywords`):** Lưu các cặp từ tiếng Việt do nhóm bạn tự thêm (`id`, `civilian`, `spy`, `canonicalKey`, `createdAt`), ngăn từ rỗng, từ trùng nhau hoặc cặp đảo chiều trùng lặp.
3. **Bảng điểm hội bạn & Lịch sử ván đấu (`scores` & `history`):**
   - Tự động cộng điểm bất biến theo `roundId` (idempotent 100%, không bao giờ cộng đúp khi render lại):
     - Dân Thường thắng: **+1 điểm** / mỗi Dân Thường
     - Gián Điệp thắng: **+3 điểm** / mỗi Gián Điệp
     - Mũ Trắng thắng / lật kèo: **+4 điểm** / mỗi Mũ Trắng
     - Gián Điệp & Mũ Trắng cùng thắng: **+2 điểm** / mỗi Gián Điệp & Mũ Trắng
   - Nếu bấm *"Kết thúc"* huỷ ván sớm trước khi có phe thắng tự nhiên (`wasAborted = true`), hệ thống **không cộng điểm ảo**.
   - Lưu tối đa **50 ván gần nhất** trong bảng `history`.
4. **Sao lưu & Khôi phục `.json` an toàn (`parseAndValidateBackupJson`):**
   - Kiểm tra dung lượng tối đa (`<= 2 MB`), chặn tuyệt đối các khoá gây ô nhiễm nguyên mẫu (`__proto__`, `constructor`, `prototype`), kiểm tra danh sách trường cho phép (whitelist), kiểu dữ liệu, enum và giới hạn độ dài chuỗi/mảng trước khi ghi vào IndexedDB.

---

## 5. Ngân hàng từ khoá (`src/data/keywords.ts`)

- Gồm **200 cặp từ tuyển chọn (400 từ tiếng Việt đơn nhất, 0 trùng lặp)** chia thành 3 cấp độ: `easy` (**65 cặp**), `medium` (**70 cặp**), `hard` (**65 cặp**), cộng thêm kho **Từ tự tạo (`custom`)** không giới hạn chủ đề offline của người chơi.
- Mỗi ván tự động tung đồng xu 50/50 hoán đổi từ giữa Dân Thường và Gián Điệp.
- Bộ đệm chống lặp `recentKeywords` (25 ván gần nhất) lưu theo khoá chuẩn hoá bất biến thứ tự `wordA|wordB` (`getCanonicalKeywordKey`) để việc hoán đổi 50/50 vai trò không bao giờ làm lặp lại cặp từ vừa chơi.

---

## 6. Kiến trúc 100% Offline PWA & Âm thanh Foley

- **Font chữ nhúng nội bộ (`src/fonts.css`):** Sử dụng `@fontsource/be-vietnam-pro` (400, 500, 600, 700) và `@fontsource/nunito` (700, 800, 900) định dạng `.woff2` (Latin + Vietnamese) đóng gói trực tiếp vào precache của Service Worker — **0 yêu cầu mạng ngoài** tới Google Fonts hay CDN.
- **Biểu tượng PWA chuẩn Risograph:** Bộ icon `public/icons/icon-192.png` (`192x192`), `public/icons/icon-512.png` (`512x512`) và `public/favicon.svg` đồng bộ nhận diện thẻ bài giấy kem.
- **Âm thanh Foley (`src/utils/sound.ts`):** Tổng hợp 100% thời gian thực bằng **Web Audio API** (`Master Gain → DynamicsCompressor`), lưu trạng thái bật/tắt trong `localStorage` (`'spy-game-muted'`).
