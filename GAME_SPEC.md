# TÀI LIỆU ĐẶC TẢ KỸ THUẬT VÀ MẠCH TRÒ CHƠI "AI LÀ GIÁN ĐIỆP?"
> **Dành cho AI và Nhà phát triển phần mềm (Software Engineers & AI Agents)**  
> **Phiên bản:** 2.1.0 (Production Live - Đã bổ sung phân định Tương tác Bàn bạc Ngoại đời thực)  
> **Ngôn ngữ triển khai:** TypeScript, React 19, Tailwind CSS 4, Zustand 5, Motion (Framer Motion)  
> **Thiết kế chủ đạo:** Vintage Spy Dossier / Tactile Kraft & Manila / Điện ảnh Trinh thám  

---

## 1. TỔNG QUAN DỰ ÁN (PROJECT OVERVIEW)

### 1.1 Định nghĩa trò chơi
**"AI LÀ GIÁN ĐIỆP?"** là một trò chơi giải đố xã hội (Social Deduction Party Game) lấy cảm hứng từ Board game kinh điển *Spyfall* và *Undercover*, được hiện đại hóa với phong cách trinh thám hồ sơ mật cổ điển (Detective Dossier). Trò chơi hỗ trợ từ **3 đến 15 người chơi** dùng chung một thiết bị di động duy nhất (Pass & Play / Chuyền tay).

### 1.2 Triết lý phân định kép: Ứng dụng (App) vs Ngoài đời thực (Real-life Social Interaction)
Trò chơi hoạt động theo mô hình **Hybrid Pass & Play**:
1. **Ứng dụng đóng vai trò "Trọng tài & Bảng điều tra":** Phát từ bí mật, chia vai ngẫu nhiên, tạo thứ tự nói chống lộ, ghi nhận loại trừ, tự động xét thắng/thua, bảo mật bằng quét vân tay ảo và mở niêm phong danh tính.
2. **Người chơi tự thực hiện "Phần hồn" của trò chơi bằng lời nói ngoài đời thực:** Lần lượt mô tả gợi ý từ khoá, tự do bàn luận, tra khảo, nghi vấn, đấu tố và giơ tay bỏ phiếu bên ngoài bàn tiệc/phòng khách.

---

## 2. BẢNG PHÂN ĐỊNH CHI TIẾT: APP XỬ LÝ vs NGƯỜI CHƠI TỰ BÀN BẠC

Để AI hiểu chính xác mạch trò chơi diễn ra như thế nào trong thực tế, dưới đây là bảng đối chiếu từng giai đoạn:

| Giai đoạn (Phase) | Ứng dụng (App UI / State) xử lý | Người chơi tự làm ngoài đời thực (Social Interaction) | Mức độ bàn bạc |
| :--- | :--- | :--- | :--- |
| **1. Chuẩn bị (`setup`)** | Chọn số người (3-15), chỉnh số Gián/Mũ Trắng, chọn gói từ (Dễ/TB/Khó), bật/tắt Ẩn vai trò. | Thỏa thuận nhanh cả nhóm: chơi bao nhiêu người, có cho Mũ Trắng không, muốn gói từ dễ hay hóc búa. | 🗣️ Bàn bạc công khai tự do |
| **2. Xem bài (`reveal`)** | Lưới thẻ bài 3D. Yêu cầu nhấn giữ vân tay (Hold to Reveal) để hiện từ, thả tay tự che lại. Nhập mật danh. | **HOÀN TOÀN IM LẶNG!** Chuyền tay 1 chiếc điện thoại qua từng người. Giữ kín cảm xúc khuôn mặt, không để lộ từ khoá. | 🤫 **CẤM BÀN BẠC / NÓI CHUYỆN** |
| **3. Xác định thứ tự nói (Cuối `reveal`)** | Khi người cuối cùng bấm xác nhận, app tự động bốc ngẫu nhiên danh sách phát biểu (đảm bảo Mũ Trắng $\ge$ vị trí #3). | Nhìn vào màn hình để biết ai là người nói đầu tiên (`#1 👑`), ai nói tiếp theo. Đặt điện thoại ra giữa bàn. | 📢 Thông báo thứ tự phát biểu |
| **4. Vòng phát biểu mô tả (`playing`)** | Màn hình hiển thị thanh chip thứ tự `#1`, `#2`, `#3`... và danh sách người chơi còn sống. | **TỪNG NGƯỜI LẦN LƯỢT NÓI:** Người #1 nói 1 câu gợi ý về từ khoá của mình (không được nói thẳng tên từ). Lần lượt #2, #3... nói theo thứ tự. | 🎙️ **Mỗi người nói 1 câu theo lượt** |
| **5. Tranh luận & Đấu tố (`playing`)** | Màn hình đóng vai trò bảng theo dõi (Dossier Board), giữ nguyên trạng thái chờ kết quả vote. | **CẢ BÀN TỰ DO TRANH CÃI / CHẤT VẤN:** Bắt bẻ câu từ ("Tại sao A bảo cái này ngọt trong khi B bảo mặn?"), quan sát ai lúng túng, ai nghi là Mũ Trắng. | 🔥 **TỰ DO BÀN BẠC 100% (ĐỈNH ĐIỂM)** |
| **6. Biểu quyết loại trừ (`playing`)** | Mở dialog `EliminateDialog` $\rightarrow$ bấm "LOẠI NGAY ✕". App mở niêm phong `RoleRevealDialog`. | Cả nhóm đếm "1, 2, 3" cùng chỉ tay vào kẻ tình nghi nhất (hoặc giơ tay biểu quyết quá bán). Người cầm máy bấm loại người đó. | 🗳️ Biểu quyết dân chủ bằng tay/miệng |
| **7. Mũ Trắng lật kèo (Nếu trúng Mũ Trắng)** | Hiện ô nhập "CƠ HỘI ĐOÁN TỪ LẬT KÈO!". Check từ bằng hàm chuẩn hóa bỏ dấu. | Cả bàn nín thở quan sát. Mũ Trắng cầm máy nhập từ khoá phe Dân mà mình suy luận được trong các vòng nói. | 🎯 Mũ Trắng thao tác cá nhân |
| **8. Tổng kết vụ án (`ended`)** | Chớp flash, dập dấu cao su, so sánh 2 cột từ khoá Dân vs Gián, hiển thị toàn bộ danh tính mọi người. | **CẢ BÀN Ồ LÊN & GIẢI TỎA:** Kể lại vì sao lúc nãy lại nói thế, khen người diễn xuất giỏi, tiếc nuối khi phe mình thua. | 🎉 Bàn luận hào hứng sau trận |

---

## 3. CƠ CHẾ 3 PHE PHÁI VÀ CHIẾN THUẬT NGOẠI ĐỜI THỰC (FACTIONS & PSYCHOLOGY)

```
+-------------------------------------------------------------------------------+
|                               3 PHE TRONG VÁN                                 |
+-----------------------+-------------------------------+-----------------------+
|  🛡️ DÂN THƯỜNG        |  🕶️ GIÁN ĐIỆP                 |  👻 MŨ TRẮNG           |
|  (Civilian)           |  (Spy)                        |  (White Hat)          |
+-----------------------+-------------------------------+-----------------------+
| Biết Từ A             | Biết Từ B (tương tự Từ A)     | KHÔNG BIẾT TỪ NÀO     |
| Cùng phe đa số        | Giả vờ là Dân Thường          | Phải diễn theo đám đông|
+-----------------------+-------------------------------+-----------------------+
```

### 3.1 Phe Dân Thường (Civilian - 🛡️)
- **Thông tin nhận được:** Từ khoá của phe Dân (VD: *"Trái cam"*).
- **Cách người chơi tự bàn bạc & hành động:**
  - Mô tả vừa đủ mơ hồ để Gián không đoán được từ của Dân (VD: *"Thứ này có nhiều vitamin C"* thay vì *"Quả này màu da cam"*).
  - Lắng nghe kỹ để tìm ai mô tả hơi "lệch pha" (VD: nói *"vỏ mỏng dễ bóc"* thì nghi là Trái Quýt $\rightarrow$ Gián Điệp).
- **Điều kiện Thắng:** Loại hết Gián Điệp và Mũ Trắng:
  $$\text{aliveSpy} = 0 \land \text{aliveWhiteHat} = 0$$

### 3.2 Phe Gián Điệp (Spy - 🕶️)
- **Thông tin nhận được:** Từ khoá khác tương tự (VD: *"Trái quýt"*).
- **Cách người chơi tự bàn bạc & hành động:**
  - Gián Điệp ban đầu thường **tưởng mình là Dân Thường** (đặc biệt khi bật chế độ Ẩn vai trò).
  - Khi nghe người khác mô tả, Gián Điệp bắt đầu nhận ra mình có từ khác biệt và phải lập tức "chuyển hệ" sang diễn xuất: nói chung chung, xuôi theo đám đông, hướng sự nghi ngờ sang người khác.
- **Điều kiện Thắng:**
  1. Số Gián Điệp $\ge$ số Dân Thường (khi không còn Mũ Trắng):
     $$\text{aliveWhiteHat} = 0 \land \text{aliveSpy} \ge \text{aliveCivilian}$$
  2. Hoặc bàn chơi còn $\le 3$ người sống sót mà có cả Gián lẫn Mũ Trắng (`'spy+white'`).

### 3.3 Phe Mũ Trắng (White Hat - 👻)
- **Thông tin nhận được:** Màn hình ghi: *"— Không có từ khoá —"*.
- **Cách người chơi tự bàn bạc & hành động:**
  - Không được hoảng loạn! Vì hệ thống đã bảo vệ không để Mũ Trắng nói ở vị trí #1 hoặc #2, Mũ Trắng được nghe ít nhất 2 người nói trước.
  - Phải dùng kỹ năng suy luận ngôn ngữ: nếu người #1 nói *"ăn vào mùa hè"*, người #2 nói *"chứa nhiều nước"* $\rightarrow$ suy ra có thể là đồ uống hoặc trái cây mùa hè $\rightarrow$ Mũ Trắng nói câu an toàn: *"Rất tốt cho sức khoẻ giải nhiệt"*.
- **ĐẶC QUYỀN LẬT KÈO (The Comeback Mechanic):**
  - Khi bị cả bàn nghi ngờ và bỏ phiếu loại, Mũ Trắng có **1 cơ hội duy nhất nhập đoán từ khoá của Phe Dân**.
  - Nếu đúng $\rightarrow$ Mũ Trắng **THẮNG NGAY LẬP TỨC**! Toàn bộ Dân và Gián đều thua cuộc.

---

## 4. CÁC BẤT BIẾN TOÁN HỌC & THIẾT KẾ CÂN BẰNG (GAME INVARIANTS)

Để đảm bảo ván chơi luôn công bằng, không bị lỗi thế trận hoặc lỗi vô nghiệm, hệ thống thiết lập các quy tắc bất biến trong `src/stores/gameStore.ts`:

### 4.1 Ràng buộc tỉ lệ vai trò (`clampSettings`)
Quy tắc tiên quyết: **Phe Dân luôn phải chiếm đa số ban đầu** ($\text{Civilian} \ge \text{Spy} + 1$).
$$\text{Total} \in [3, 15]$$
$$\text{MaxSpy} = \max\left(1, \left\lfloor \frac{\text{Total} - 1}{2} \right\rfloor\right)$$
$$\text{MaxWhiteHat} = \max(0, \text{Total} - 2 \times \text{SpyCount} - 1)$$
$$\text{CivilianCount} = \text{Total} - \text{SpyCount} - \text{WhiteHatCount}$$

### 4.2 Bất biến thứ tự phát biểu (`generateSpeakingOrder`)
> **QUY TẮC SỐNG CÒN:** Mũ Trắng **KHÔNG BAO GIỜ** được xếp ở vị trí phát biểu số #1 hoặc số #2.

- **Nguyên nhân thiết kế:** Mũ Trắng hoàn toàn không biết từ khoá. Nếu bắt Mũ Trắng nói đầu tiên hoặc thứ hai, họ không có bất kỳ dữ liệu nào để phán đoán ngữ cảnh, dẫn đến việc bị lộ 100% gây ức chế trải nghiệm.
- **Thuật toán triển khai:**
  1. Tách danh sách ID người chơi thành 2 nhóm: `nonWhiteHatIds` (Dân + Gián) và `whiteHatIds` (Mũ Trắng).
  2. Trộn ngẫu nhiên (`shuffle`) từng nhóm.
  3. Lấy 2 người chơi đầu tiên (`front`) chắc chắn thuộc nhóm `nonWhiteHatIds`.
  4. Gom phần còn lại của nhóm Non-White-Hat và toàn bộ White-Hat, xáo trộn chung để tạo thành nửa sau của vòng phát biểu.
  5. Ghép `[...front, ...rest]` thành danh sách lượt phát biểu chính thức.

### 4.3 Ràng buộc đối xứng ngân hàng từ khoá (`keywords.ts`)
- **Bộ dữ liệu:** 300 cặp từ phân bố đều 3 cấp độ: Dễ (100 cặp), Trung bình (100 cặp), Khó (100 cặp).
- **100% Đối xứng số chữ (Symmetric Word Count):** Số chữ (tokens) của từ phe Dân luôn bằng chính xác số chữ của từ phe Gián (ví dụ: *"trái cam"* 2 chữ thì *"trái quýt"* 2 chữ, *"tàu hoả"* 2 chữ thì *"tàu thuỷ"* 2 chữ, *"bay"* 1 chữ thì *"nhảy"* 1 chữ). Điều này triệt tiêu hoàn toàn mánh gian lận: "Từ của tôi có 3 chữ".
- **Tráo đổi vai trò ngẫu nhiên 50/50 (Random Role Assignment):**
  Trong cấu trúc dữ liệu, mỗi cặp từ được lưu dưới dạng `[w1, w2]`. Khi bắt đầu ván, thuật toán tung đồng xu ngẫu nhiên:
  ```typescript
  const swap = Math.random() < 0.5
  return {
    civilian: swap ? pair[0] : pair[1],
    spy: swap ? pair[1] : pair[0],
  }
  ```
  Nhờ đó, dù chơi lại cùng một cặp từ, người chơi không bao giờ đoán được từ nào mặc định là của Dân và từ nào của Gián.
- **Bộ nhớ đệm chống lặp từ (Anti-repetition Buffer):** Hệ thống lưu lịch sử 15 cặp từ của các ván gần nhất, ngăn không cho trùng lặp từ trong các buổi chơi nhóm dài.

---

## 5. MÔ TẢ CHI TIẾT TỪNG KHUNG CẢNH VÀ CHỨC NĂNG (SCENE-BY-SCENE SPECIFICATION)

Vòng đời của ván đấu trải qua **5 màn hình tương ứng 5 Phase trong State Machine**:
```
'home' ──> 'setup' ──> 'reveal' ──> 'playing' ──> 'ended'
  ^                                                 │
  └────────────────── resetGame() ──────────────────┘
```

---

### MÀN HÌNH 1: SẢNH CHÍNH (HomeScreen.tsx - Phase: `'home'`)
- **Mục đích:** Đón tiếp người chơi, tạo bầu không khí trinh thám cổ điển.
- **Giao diện:**
  - Nền sảnh văn phòng trinh thám (`lobby.webp`).
  - Tiêu đề Typewriter chạy từng chữ "AI LÀ GIÁN ĐIỆP?" kèm con trỏ nhấp nháy `_`.
  - Con dấu nghiêng `TOP SECRET 🔍`.
  - Thẻ Index Card dán băng dính tóm tắt mục tiêu ván chơi.
  - Nút lớn **"VÀO BÀN CHƠI NGAY"** và nút **"XEM LUẬT CHƠI MẬT"** (mở popup hướng dẫn).
- **Hành vi người chơi ngoài đời:** Người cầm máy bấm vào nút để bắt đầu thiết lập ván đấu cho cả nhóm.

---

### MÀN HÌNH 2: THIẾT LẬP VÁN ĐẤU (SetupScreen.tsx - Phase: `'setup'`)
- **Mục đích:** Cài đặt thông số ván chơi.
- **Giao diện:**
  - Thanh trượt cơ học (Mechanical Slider) chọn số lượng người từ **3 đến 15** người kèm icon động vật trượt theo.
  - Stepper tăng giảm Gián Điệp và Mũ Trắng (tự động kẹp giới hạn an toàn để Dân luôn chiếm đa số). Dân Thường tự động tính.
  - Hộp cài đặt bổ sung: Modal chọn gói từ (Dễ/Trung bình/Khó) và công tắc gạt "Ẩn vai trò" (Blind Role Mode).
  - Nút **"BẮT ĐẦU VÁN ➔"**.
- **Hành vi người chơi ngoài đời:** Cả nhóm cùng thảo luận nhanh: *"Hôm nay bàn mình có 6 đứa, cho 1 Gián với 1 Mũ Trắng cho vui nhé!", "Chọn gói khó đi cho hack não!"*. Chủ phòng thao tác theo ý kiến cả bàn.

---

### MÀN HÌNH 3: CHUYỀN TAY LẬT BÀI & NHẬP MẬT DANH (RevealScreen.tsx - Phase: `'reveal'`)
- **Mục đích:** Chia bài bí mật cho từng người, chuyền tay 1 máy điện thoại.
- **Giao diện:**
  - Lưới bài 3D Tactile (`GameCard.tsx`) co giãn theo số lượng người.
  - Khi chọn 1 lá bài: Mở modal quét vân tay sinh trắc học.
  - **Quét vân tay (Hold to Reveal):** Phải ấn giữ ngón tay vào biểu tượng vân tay thì từ khoá mới hiện ra; thả tay ra lập tức che lại.
  - Chọn gợi ý mật danh hoặc tự gõ tên $\rightarrow$ Bấm "XÁC NHẬN" $\rightarrow$ Thẻ bài chuyển sang trạng thái "ĐÃ NHẬN".
  - **Bảng Thứ Tự Phát Biểu:** Khi toàn bộ người chơi đã nhận bài (`allClaimed = true`), bảng thứ tự nói từ `#1` đến `#N` hiện ra kèm nút "BỐC LẠI" (xáo lại thứ tự nếu muốn).
  - Nút lớn **"BẮT ĐẦU THẢO LUẬN ➔"**.
- **Hành vi người chơi ngoài đời:**
  - **TUYỆT ĐỐI GIỮ IM LẶNG.** Người chơi lần lượt chuyền tay máy cho nhau. Người này xem xong thì chuyển cho người bên cạnh.
  - Không được cười, không được nói *"Á đù từ này khó thế!"* hay làm lộ biểu cảm.
  - Khi tất cả đã xem xong, người cầm máy giơ màn hình cho cả bàn thấy thứ tự nói: *"Bạn Huy nói đầu tiên nhé, tiếp theo đến My, rồi đến Nam..."*. Sau đó bấm bắt đầu và đặt điện thoại ra giữa bàn.

---

### MÀN HÌNH 4: VÒNG TRANH LUẬN & LOẠI TRỪ (GameScreen.tsx - Phase: `'playing'`)
- **Mục đích:** Quản lý vòng tranh luận, đếm số người còn sống và thực hiện bỏ phiếu trục xuất.
- **Giao diện:**
  - Màn hình Splash rùng rợn: *"HÃY CẨN THẬN... Kẻ trà trộn đang ở ngay bên cạnh bạn"* (1.8s).
  - Header: Trạng thái *"X/Y điệp viên còn sống"* và nút "DỪNG VÁN 🏳️".
  - Thanh cuộn ngang hiển thị thứ tự phát biểu (`#1 👑`, `#2`...).
  - Danh sách thẻ người chơi: Người còn sống có nút đỏ **"NGHI NGỜ ✕"**; người đã loại bị gạch tên và hiện vai trò thật.
  - Modal xác nhận loại (`EliminateDialog.tsx`).
  - Modal mở niêm phong (`RoleRevealDialog.tsx`): Kèm ô đoán từ lật kèo nếu người bị loại là Mũ Trắng.
- **HÀNH VI NGƯỜI CHƠI NGOÀI ĐỜI THỰC (TRỌNG TÂM CỦA VÁN CHƠI):**
  1. **Vòng nói (Speaking Round):** Từng người phát biểu 1 câu theo thứ tự đã định trên màn hình.
  2. **Vòng tranh luận tự do (Free Discussion):** Cả bàn bắt đầu bàn tán xôn xao, tra hỏi nhau, phân tích từng câu nói của mọi người.
  3. **Biểu quyết (Voting):** Cả bàn hô 1-2-3 và cùng chỉ tay vào người bị nghi ngờ nhiều nhất. Người nào nhận quá bán phiếu sẽ bị trục xuất.
  4. **Thao tác máy:** Một người bấm vào nút "NGHI NGỜ ✕" của người đó trên điện thoại, bấm xác nhận "LOẠI NGAY ✕".
  5. **Mở niêm phong:** Cả bàn cùng nhìn màn hình điện thoại để xem người vừa bị loại là Dân hay Gián. Nếu là Mũ Trắng, đưa máy cho họ nhập từ đoán.

---

### MÀN HÌNH 5: TỔNG KẾT VỤ ÁN & VINH DANH (WinScreen.tsx - Phase: `'ended'`)
- **Mục đích:** Vinh danh phe chiến thắng, công bố toàn bộ sự thật và cho phép chơi lại ván mới nhanh chóng.
- **Giao diện:**
  - Nền điện ảnh chuyên biệt theo phe thắng: Xanh (Dân thắng), Đỏ (Gián thắng), Tím (Mũ Trắng thắng).
  - Hiệu ứng chớp Flash máy ảnh + Rung màn hình + Con dấu cao su khổng lồ dập xuống: "ĐÃ BẮT GIỮ" / "TẨU THOÁT" / "LẬT KÈO".
  - Bảng so sánh 2 cột từ khoá: Phe Dân cầm từ gì và Gián Điệp cầm từ gì.
  - Bảng danh sách toàn bộ người chơi: Hiển thị avatar, tên, từ khoá và vai trò thực tế.
  - Nút **"CHƠI VÁN MỚI ↺"**: Tự động lưu lại danh sách tên người chơi ván trước, chuyển về màn `'setup'` sẵn sàng chơi ván tiếp theo trong 1 giây.
- **Hành vi người chơi ngoài đời:** Cả nhóm cùng xúm lại xem từ khoá của nhau, cười đùa và mổ xẻ trận đấu vừa qua trước khi bấm chơi tiếp ván mới.

---

## 6. HỆ THỐNG ÂM THANH VÀ PHẢN HỒI XÚC GIÁC (AUDIO & HAPTIC SUBSYSTEM)

Module `src/utils/sound.ts` tổng hợp âm thanh bằng Web Audio API thời gian thực:

```
+-------------------+--------------------+------------------------+------------------------------------+
| Tên hàm âm thanh  | Loại sóng (Osc)    | Dải tần số (Hz)        | Tác dụng giao diện                |
+-------------------+--------------------+------------------------+------------------------------------+
| playClickSound    | Sine               | 600Hz -> 300Hz (0.04s) | Bấm nút, tăng giảm stepper, slider |
| playFlipSound     | Triangle           | 250Hz -> 550Hz (0.08s) | Bấm giữ quét vân tay, lật bài      |
| playEliminateSound| Sawtooth           | 220Hz -> 90Hz (0.25s)  | Bỏ phiếu loại trừ người chơi       |
| playStampSound    | Triangle           | 110Hz -> 25Hz (0.22s)  | Đóng con dấu cao su kết luận       |
| playFlashSound    | Sine               | 850Hz -> 180Hz (0.09s) | Chớp flash máy ảnh khi kết thúc    |
| playVictorySound  | Triangle (Chord)   | 440, 554, 659, 880Hz   | Khi tất cả lật bài xong & thắng    |
| playMarkerSound   | Sawtooth           | 320Hz -> 120Hz (0.14s) | Quẹt bút lông đánh dấu hồ sơ       |
| triggerHaptic(ms) | Vibration API      | 10ms - 60ms            | Rung phản hồi xúc giác trên phone  |
+-------------------+--------------------+------------------------+------------------------------------+
```

---

## 7. ĐIỀU HƯỚNG STATE MACHINE VÀ CẤU TRÚC STORE (`gameStore.ts`)

```typescript
interface GameState {
  players: Player[]                 // Danh sách người chơi trong ván
  phase: Phase                      // 'home' | 'setup' | 'reveal' | 'playing' | 'ended'
  selectedCardIndex: number | null  // Index lá bài đang được xem
  winner: Winner                    // 'civilian' | 'spy' | 'white-hat' | 'spy+white' | null
  settings: GameSettings            // { totalPlayers, spyCount, whiteHatCount, difficulty, hideRole }
  eliminatedPlayerId: string | null // ID người vừa bị loại gần nhất
  previousNames: string[]           // Bộ nhớ lưu tên nhóm ván trước
  speakingOrder: string[]           // Mảng chứa player.id theo thứ tự phát biểu
  whiteHatGuessedWord: string | null// Từ khoá mà Mũ Trắng đoán
}
```

---

## 8. HƯỚNG DẪN DÀNH CHO AI KHÁC ĐỂ PHÁT TRIỂN TIẾP
1. **Luôn nhớ đây là game Pass & Play trực tiếp:** Ứng dụng là công cụ điều phối (Moderator Tool), không phải game chat online. Mọi logic bàn luận đều diễn ra trực tiếp bằng miệng ngoài đời thực giữa những người ngồi cùng phòng.
2. **Không làm lộ thông tin:** Mọi màn hình trước `WinScreen` tuyệt đối không được hiển thị danh tính của người khác hay từ khoá của phe đối phương.
3. **Tuân thủ thiết kế Tactile Kraft:** Sử dụng nút dập dấu `btn-kraft-stamp`, bóng đổ góc vuông `box-shadow: 4px 4px 0 #18120c`, tông giấy ngà `#fcfaf3` và màu mực trinh thám.
