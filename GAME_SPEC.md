# ĐẶC TẢ KỸ THUẬT & MẠCH TRÒ CHƠI "AI LÀ GIÁN ĐIỆP?"

> **Phiên bản:** 3.0.0 (Cozy Tabletop Cardstock Edition — Production Live)  
> **Công nghệ:** React 19, TypeScript 6, Tailwind CSS v4, Zustand 5, Motion, Vite 8 + PWA  
> **Phong cách thiết kế:** Bàn chơi thẻ bài giấy kem ấm áp (`#FAF4E8`), viền mực in `#231C35`, đồ họa bài tây minh họa Risograph Court-Card, bố cục gọn trọn 1 màn hình (`100dvh` không cuộn dọc).

---

## 1. Triết lý trò chơi (Hybrid Pass & Play)

**"Ai Là Gián Điệp?"** hỗ trợ **3–15 người chơi** ngồi quây quần ngoài đời thực và dùng chung **1 chiếc điện thoại duy nhất**:
1. **Ứng dụng đóng vai trò Trọng tài & Bộ bài vật lý:** Trộn từ khoá bí mật, chia vai ngẫu nhiên, chống nhìn trộm khi chuyền máy, sắp xếp thứ tự nói hợp lệ, xử lý bỏ phiếu mở vai, kiểm tra đoán từ lật kèo của Mũ Trắng và xét điều kiện thắng thua tự động.
2. **Người chơi tương tác trực tiếp ngoài đời thực:** Tự mô tả 1 câu theo lượt nói, quan sát biểu cảm, tranh luận vặn hỏi và thống nhất bỏ phiếu loại kẻ tình nghi.

---

## 2. Quy trình 5 Màn Hình (`100dvh` Single-Viewport)

```text
'home' ──> 'setup' ──> 'reveal' ──> 'playing' ──> 'ended'
  ^                                                 │
  └────────────────── resetGame() ──────────────────┘
```

| Phase | Màn hình | Chức năng chính trên ứng dụng | Hoạt động ngoài đời thực |
| :--- | :--- | :--- | :--- |
| `'home'` | `HomeScreen.tsx` | Quạt 3 lá bài minh họa 3 phe (chạm từng lá để xem giải thích), tóm tắt 3 bước, mở `RulesModal` hoặc vào bàn chơi. | Nhóm bạn mở máy chuẩn bị ván mới. |
| `'setup'` | `SetupScreen.tsx` | Chọn nhanh nhóm 4/6/8/10 bạn hoặc chỉnh từng số lượng người chơi (`3–15`), Gián Điệp, Mũ Trắng; chọn Độ khó (*Khởi động / Vừa sức / Xoắn não*) và Chế độ *Lộ vai / Mù vai*. | Thống nhất số người chơi và mức độ khó cho ván đấu. |
| `'reveal'` | `RevealScreen.tsx` | Bàn bài úp Risograph có nút **Xào bài** trực quan. Chạm chọn lá bài mở rèm nhung tối `ThumbPeekModal`: **nhấn giữ trực tiếp lên mặt lá bài lớn** để lật 3D xem từ khoá, ký tên (hoặc chọn nhanh tên ván trước), rồi xem bảng **Thứ Tự Vòng Nói**. | Giữ im lặng chuyền điện thoại qua từng người; sau khi người cuối nhận bài, đặt máy giữa bàn để xem thứ tự phát biểu. |
| `'playing'` | `GameScreen.tsx` | Hiển thị gọn số người còn lại, dải **Thứ tự nói kèm tên** (`1. Tên`, `2. Tên`...) và lưới thẻ người chơi tự co giãn theo số lượng. Bấm thẻ để mở `EliminateDialog` & `RoleRevealDialog`. | Lần lượt mô tả 1 câu theo thứ tự nói, tự do tranh luận và biểu quyết loại 1 người đáng nghi nhất. |
| `'ended'` | `WinScreen.tsx` | Công bố phe thắng kèm hiệu ứng pháo giấy `canvas-confetti`, lật 2 thẻ so sánh **Từ Dân Thường** vs **Từ Gián Điệp**, bảng vai trò toàn bộ người chơi và nút **Chơi ván nữa** (giữ nguyên tên nhóm cũ). | Cả bàn đối chiếu từ khoá hai phe và bắt đầu ván tiếp theo. |

---

## 3. Các bất biến logic quan trọng (`src/stores/gameStore.ts`)

### 3.1 Ràng buộc cân bằng số lượng vai trò (`clampSettings`)
Đảm bảo phe Dân Thường luôn chiếm đa số khi bắt đầu ván:
- Tổng người chơi: $3 \le \text{totalPlayers} \le 15$
- Số Gián Điệp tối đa bảo thủ: $\text{maxSpy} = \max\left(1, \left\lfloor \frac{\text{totalPlayers} - 1}{2} \right\rfloor\right)$
- Số Mũ Trắng tối đa: $\text{maxWhiteHat} = \max(0, \text{totalPlayers} - 2 \times \text{spyCount} - 1)$
- Số Dân Thường: $\text{civilianCount} = \text{totalPlayers} - \text{spyCount} - \text{whiteHatCount}$

### 3.2 Bất biến thứ tự phát biểu (`generateSpeakingOrder`)
- **Quy tắc bắt buộc:** Mũ Trắng **không bao giờ** đứng ở vị trí nói `#1` hoặc `#2` (khi bàn có từ 2 người Dân/Gián trở lên), đảm bảo Mũ Trắng luôn được nghe ít nhất 2 câu gợi ý trước khi tới lượt mình.
- Danh sách `speakingOrder` lưu theo `player.id` để không bị trùng lặp nếu hai người chơi đặt tên giống nhau.

### 3.3 Điều kiện chiến thắng (`checkWin` & `whiteHatGuess`)
1. **Dân Thường thắng (`'civilian'`):** Không còn Gián Điệp và không còn Mũ Trắng ($\text{aliveSpy} = 0 \land \text{aliveWhiteHat} = 0$).
2. **Mũ Trắng lật kèo (`'white-hat'`):**
   - Đoán đúng từ khoá của Dân Thường ngay khi vừa bị bỏ phiếu loại (`isKeywordMatch` so khớp không phân biệt hoa thường và hỗ trợ cả không dấu), **HOẶC**
   - Sống sót tới khi hết Gián Điệp và $\text{aliveCivilian} \le \text{aliveWhiteHat}$.
3. **Gián Điệp & Mũ Trắng cùng thắng (`'spy+white'`):** Bàn còn $\le 3$ người sống sót và có mặt cả Gián Điệp lẫn Mũ Trắng.
4. **Gián Điệp thắng (`'spy'`):** Không còn Mũ Trắng và $\text{aliveSpy} \ge \text{aliveCivilian}$.

---

## 4. Quy chuẩn Bảo mật chống lộ thông tin (Anti-Peek & Zero-Leak)

- **Chống nhìn trộm khi rút bài:** Từ khoá chỉ xuất hiện khi ngón tay đang nhấn giữ trực tiếp trên lá bài (`onPointerDown`); mọi sự kiện thả tay, trượt ra ngoài hoặc mất tiêu điểm cửa sổ (`pointerup`, `pointerleave`, `pointercancel`, `window` `blur`) đều lập tức lật úp bài lại.
- **Đồng nhất giao diện ở Chế độ Mù Vai (`hideRole = true`):** Cả Dân Thường và Gián Điệp đều hiển thị mặt bài vàng nghệ *"LÁ BÀI BÍ MẬT"* giống hệt nhau để ánh sáng hay màu sắc màn hình không làm lộ phe.
- **Không lộ từ khoá giữa ván:** Khi loại 1 người chơi ở `GameScreen` / `RoleRevealDialog`, ứng dụng chỉ công bố **phe** của người đó (*Dân thường / Gián điệp / Mũ trắng*), tuyệt đối không công bố từ khoá trước khi sang `WinScreen`.

---

## 5. Ngân hàng từ khoá (`src/data/keywords.ts`)

- Gồm **270 cặp từ (540 từ tiếng Việt đơn nhất, 0 trùng lặp)** chia đều 3 cấp độ: `easy` (90 cặp), `medium` (90 cặp), `hard` (90 cặp).
- 100% là danh từ / cụm từ thông dụng, tự nhiên trong giao tiếp tiếng Việt hàng ngày (không có từ cắt cụt vô nghĩa, không có chú thích ngoặc đơn gây cản trở việc nhập đoán của Mũ Trắng, không có cặp từ đồng nghĩa vùng miền Bắc–Nam).
- Mỗi ván tự động tung đồng xu 50/50 hoán đổi từ giữa Dân Thường và Gián Điệp, đồng thời lưu bộ đệm `recentKeywords` (15 ván gần nhất) để tránh lặp lại từ.

---

## 6. Hệ thống Âm thanh Foley (`src/utils/sound.ts`)

- Tổng hợp 100% bằng **Web Audio API** qua chuỗi `Master Gain → DynamicsCompressor` chống vỡ tiếng trên loa điện thoại, dùng chung 1 `AudioBuffer` nhiễu trắng 0.5 giây.
- Bao gồm các hiệu ứng vật liệu bàn bài: tiếng gõ quân cờ gỗ (`playClickSound`, `playPopSound`), tiếng miết lật bài (`playFlipSound`), tiếng chẻ xào bài 5 nhịp (`playShuffleSound`), tiếng hé góc bài & đặt bài xuống mặt nỉ (`playPeekHoldSound`, `playPeekReleaseSound`), tiếng đóng dấu cao su (`playStampSound`), âm trầm loại người chơi (`playEliminateSound`) và 3 bản fanfare riêng theo phe thắng (`playVictorySound`).
- Trạng thái bật/tắt âm thanh được lưu bền vững trong `localStorage` (`'spy-game-muted'`).
