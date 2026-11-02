# Kế hoạch nâng cấp 3D

> **Trạng thái:** đã đưa bản thiết kế 2 vào game (bàn khối thật, 3 phong cách, quân ngựa / cá ngựa, cảnh đá quân). Xem mục 7.

Mục tiêu: bàn cờ, quân ngựa và xúc xắc hiển thị 3D bằng three.js. Luật chơi, đồng bộ online, bot, âm thanh, lịch sử ván **giữ nguyên**, vì 3D chỉ thay lớp hiển thị.

## 1. Công nghệ

| Phần | Chọn | Lý do |
| --- | --- | --- |
| Render | **three.js** 0.187 qua **@react-three/fiber** 9.8 | Viết scene bằng React, dùng chung state / hook với app hiện tại; fiber 9 hỗ trợ React 19.2 |
| Tiện ích | `three/examples` (RoundedBoxGeometry, SVGLoader, RoomEnvironment) | Đủ dùng nên **không cài drei**: ít phụ thuộc, không tải HDR từ CDN lúc chạy |
| Mô hình | **Blender** → xuất **glTF 2.0 (.glb)** | glTF là định dạng three.js đọc tốt nhất; Blender xuất sẵn |
| Tối ưu mô hình | **@gltf-transform/cli** | Nén lưới (meshopt), nén texture (WebP), gộp node, nhỏ file 5–10 lần |
| Vật lý xúc xắc (tuỳ chọn, giai đoạn 4) | @react-three/rapier 2.2 | Chỉ cần nếu muốn xúc xắc lăn thật |

**Blender không phải thư viện chạy trong web.** Nó là phần mềm dựng mô hình: mình dựng quân ngựa, xúc xắc, khung bàn trong Blender, xuất ra file `.glb`, rồi three.js tải file đó lên trình duyệt. Máy dev hiện **chưa cài Blender**.

## 2. Kiến trúc

```
engine (game/*)  →  snapshot  →  animator (presentation/game-animator.ts)  →  GameView
                                                                              ├─ LudoTable    (2D, SVG — giữ nguyên)
                                                                              └─ LudoTable3D  (3D, mới)
```

`GameView` đã có đủ thứ 3D cần: thế cờ, mặt xúc xắc đang lắc của từng màu, quân đang đi và đi tới bước nào. Vì vậy:

- `LudoTable3D` nhận **đúng props** như `LudoTable` (`view`, `busy`, `activeColors`, `seats`, `canControl`, `onRoll`, `onMove`). `OfflineGame` và `RoomView` chỉ đổi component, không đổi logic.
- Online không phải sửa gì: mọi máy vẫn nhận cùng snapshot, chỉ cách vẽ khác nhau. Trong cùng một phòng, người 2D và người 3D chơi chung được.
- Thư mục mới `modules/ludo/three/`:

| File | Việc |
| --- | --- |
| `ludo-table-3d.tsx` | Khung ngoài: lưới `.ludo-table` như 2D, ô giữa là `<Canvas>`; 4 panel ghế (HTML) giữ nguyên ở 4 góc |
| `table-scene.tsx` | Camera, đèn, bóng, môi trường |
| `board-3d.tsx` | Khung bàn (model) + mặt bàn |
| `token-3d.tsx` | Một quân: vị trí, nhảy từng ô, sáng khi chọn được, bấm để đi |
| `dice-3d.tsx` | Xúc xắc của từng màu cạnh chuồng, lắc và dừng đúng mặt |
| `coords.ts` | Đổi toạ độ ô (`board-geometry.ts`, lưới 15×15) sang toạ độ 3D (x, y, z) |
| `use-token-tween.ts` | Nội suy vị trí quân theo thời gian (cung nhảy giữa hai ô) |
| `models.ts` | Đường dẫn `.glb`, preload |

**Mặt bàn tái dùng hình 2D:** vẽ `BoardSurface` (SVG hiện có) thành texture phủ lên mặt bàn 3D. Bàn 3D vì thế giống hệt bàn 2D, gồm cả việc làm tối chuồng không có người chơi, mà không phải dựng từng ô trong Blender. Blender chỉ cần dựng **khung bàn, quân ngựa, xúc xắc** (và mặt bàn gỗ / môi trường nếu muốn).

### Hoạt cảnh

- **Quân đi:** animator đã phát từng bước (mỗi bước 150 ms). 3D chỉ nội suy giữa ô cũ và ô mới theo một cung nhảy nhỏ, hạ xuống có nảy nhẹ.
- **Bị đá:** quân đổi từ ngoài sân về chuồng thì bay cung về ô trong chuồng, kèm hiệu ứng hạt nhỏ.
- **Xúc xắc:** khi `rollingColor` là màu đó thì xúc xắc tung lên và xoay; hết thời gian lắc thì xoay mượt về đúng mặt có kết quả (mỗi mặt 1–6 có sẵn một hướng xoay). Kết quả vẫn do engine quyết định, nên **mọi máy trong phòng thấy cùng một mặt**.
- **Quân chọn được:** vòng sáng dưới chân và nhấp nhô như bản 2D. Vùng bấm (hit area) to hơn quân để dễ chạm trên điện thoại.

### Camera

- Góc nghiêng khoảng 45°, xoay sao cho **chuồng của mình nằm ở phía dưới**: online là màu mình ngồi, offline là người chơi đầu tiên.
- Cho xoay và zoom trong giới hạn hẹp (OrbitControls), có nút "Về góc mặc định". Trên điện thoại khoá xoay, chỉ cho zoom, tránh vuốt nhầm.

### Hiệu năng

- **Chỉ tải 3D khi cần:** `dynamic(() => import("./ludo-table-3d"), { ssr: false })`. Menu, trang chủ và SEO không phải tải three.js (khoảng 200–250 KB gzip). Trong lúc tải 3D thì hiện bàn 2D.
- **Chỉ vẽ lại khi có chuyển động:** `frameloop="demand"`, gọi `invalidate()` khi có hoạt cảnh, nên lúc chờ lượt gần như không tốn pin.
- **Giới hạn độ phân giải:** `dpr` tối đa 1.75. Bóng dùng `ContactShadows` vẽ 1 lần hoặc một đèn có shadow map nhỏ.
- **Ngân sách mô hình:** quân ngựa ≤ 3.000 tam giác, xúc xắc ≤ 1.000, khung bàn ≤ 15.000. Tổng các file `.glb` sau nén ≤ 1,5 MB, texture ≤ 1024 px.
- **Ngân sách khung hình:** 60 fps trên điện thoại Android tầm trung, không tụt dưới 30 fps khi có hoạt cảnh.

### 2D vẫn giữ

- Settings thêm tuỳ chọn **Đồ hoạ: 2D / 3D**, lưu trong `ludo-settings`, có nút ở thanh trên màn chơi.
- Tự về 2D khi trình duyệt không có WebGL, khi WebGL bị mất (context lost), hoặc người dùng bật "giảm chuyển động".
- Với trình đọc màn hình: thêm danh sách nút ẩn "Đi quân 1…4" song song với canvas, vì 3D không bấm được bằng bàn phím.

## 3. Quy trình mô hình Blender

Quy ước để model khớp code, áp dụng cho dù ai dựng:

- **Đơn vị:** 1 ô cờ = 1 đơn vị. Mặt bàn 15×15 đơn vị, tâm ở gốc toạ độ, mặt trên ở độ cao 0.
- **Trục:** dựng như bình thường trong Blender (Z hướng lên). Lúc xuất glTF bật **+Y Up**.
- **Trước khi xuất:** Apply All Transforms (Ctrl+A).
- **Gốc toạ độ (origin):** quân ngựa đặt ở tâm đáy; xúc xắc đặt ở tâm khối.
- **Kích thước:** quân ngựa cao khoảng 1,1 đơn vị, đế rộng khoảng 0,7. Xúc xắc khoảng 0,6.
- **Vật liệu:** chỉ dùng Principled BSDF (glTF hiểu được). Thân quân ngựa đặt tên vật liệu `Body` màu trắng, để code tô 4 màu từ cùng một model. Phần không đổi màu (mắt, viền) dùng vật liệu khác.
- **Đặt tên node:** `Horse`, `Dice` (6 mặt theo quy ước: mặt 1 hướng +Y, mặt 6 hướng −Y, mặt 2 hướng +Z…, ghi lại trong `models.ts`), `BoardFrame`.
- **Texture:** bake ambient occlusion vào base color để có bóng mềm mà không cần đèn đắt tiền. Tối đa 1024 px.
- **Xuất:** File → Export → glTF Binary (.glb), mỗi vật một file.
- **Tối ưu:**
  ```
  npx gltf-transform optimize horse.glb public/models/horse.glb --compress meshopt --texture-compress webp
  ```
- **Lưu file:** `public/models/`. File nguồn `.blend` lưu ở `assets/blender/` (hoặc Git LFS nếu nặng).

**Ai dựng mô hình** (cần mày chọn, xem mục 6):

1. **Tao viết script Python cho Blender** (`assets/blender/*.py`) dựng mô hình bằng code, chạy không cần mở giao diện: `blender -b -P build_horse.py`. Quân ngựa dựng bằng cách đùn (extrude) và vát cạnh chính đường viền con ngựa đang dùng ở bản 2D, nên đồng bộ với icon và bản 2D. Ưu điểm: tái tạo được, sửa bằng code, có lịch sử git. Nhược: phong cách low-poly / đồ chơi, không chi tiết như hoạ sĩ dựng tay. Cần cài Blender trên máy: `winget install BlenderFoundation.Blender`.
2. **Hoạ sĩ / mày tự dựng** trong Blender theo quy ước trên. Đẹp nhất, nhưng phụ thuộc thời gian của người dựng.
3. **Không dùng Blender**, dựng hình trong three.js bằng code (đùn đường viền SVG, khối bo góc). Nhanh nhất nhưng ít chi tiết nhất.

Đề xuất: giai đoạn 1 dùng cách 3 làm hình tạm để có game 3D chơi được ngay. Giai đoạn 2 thay bằng model từ cách 1 hoặc 2. Code không đổi, chỉ đổi file `.glb`.

## 4. Các giai đoạn

| Giai đoạn | Việc | Kết quả để duyệt | Ước lượng |
| --- | --- | --- | --- |
| **0. Thử nghiệm** | Cài three / fiber / drei; `coords.ts` + test; mặt bàn từ texture SVG; quân là khối tạm; bấm quân để đi; tuỳ chọn 2D/3D | Chơi được một ván 3D thô, không có hoạt cảnh | 1–2 ngày |
| **1. Lối chơi 3D** | Quân nhảy từng ô, bị đá bay về chuồng, xúc xắc 3D lắc và dừng đúng mặt, vòng sáng quân chọn được, camera theo màu mình, panel ghế quanh canvas, fallback 2D, tải lười | Chơi offline + online trọn vẹn ở 3D | 3–5 ngày |
| **2. Mô hình Blender** | Quân ngựa, xúc xắc, khung bàn theo quy ước; nén; thay hình tạm | Bàn cờ có model thật | 3–7 ngày (cách 1) hoặc theo lịch người dựng |
| **3. Hoàn thiện** | Ánh sáng, môi trường, hạt khi đá quân / về đích, màn thắng, chất lượng Thấp/Cao, đo hiệu năng trên điện thoại thật | Đạt ngân sách hiệu năng ở mục 2 | 2–4 ngày |
| **4. Tuỳ chọn** | Xúc xắc lăn bằng vật lý (rapier, tính trước rồi xoay mặt cho khớp kết quả), skin bàn / ngựa / xúc xắc (gắn với ý tưởng đồ trang trí) | — | 2–3 ngày mỗi mục |

Mỗi giai đoạn một nhánh / PR riêng. Engine có test sẵn nên chỉ thêm test cho `coords.ts` và phần nội suy hoạt cảnh. Phần hình ảnh kiểm tra bằng tay theo checklist: chơi 1 ván offline, 1 ván online 2 máy, thử trên điện thoại, thử tắt WebGL.

## 5. Rủi ro

- **Điện thoại yếu nóng máy / giật:** đã có `frameloop="demand"`, giới hạn `dpr`, mức chất lượng Thấp và fallback 2D.
- **Quân nhỏ khó bấm trên điện thoại:** vùng bấm lớn hơn quân, camera mặc định đủ gần, có zoom.
- **Bundle nặng:** chỉ tải ở màn chơi 3D (React.lazy), không dùng drei.
- **Model sai tỉ lệ / trục:** quy ước ở mục 3, thêm một scene kiểm tra hiện lưới 15×15 để đặt model lên so.
- **WebGL mất context** (thường gặp khi chuyển tab trên điện thoại): bắt sự kiện, tự dựng lại hoặc về 2D.

## 6. Đã chốt

1. **Mô hình dựng bằng code trong three.js**, không dùng Blender. Mục 3 giữ lại làm quy ước nếu sau này thay bằng model `.glb`.
2. **Giữ bản 2D** làm tuỳ chọn và dự phòng.
3. **Xúc xắc:** hoạt cảnh dừng đúng mặt (không dùng vật lý).
4. **Camera:** cố định theo màu mình, không cho xoay.
5. **Phong cách:** tả thực (gỗ đánh vecni, quân sơn bóng, xúc xắc ngà, bóng đổ).

## 7. Đã làm

Bản xem thử thiết kế (đã duyệt): https://claude.ai/artifact/CXX65MZ3KXZa6WAexWXLy8

Mã ở `modules/ludo/three/`:

| File | Nội dung |
| --- | --- |
| `scene-math.ts` (+ test) | Toạ độ ô → 3D, độ cao các lớp bàn, xúc xắc giữa chuồng, góc camera theo màu, khoảng cách camera vừa khung (chiếu phối cảnh thật, cả góc nghiêng lẫn từ trên), hướng xúc xắc, hướng quân |
| `styles.ts` | 3 phong cách (gỗ óc chó, sơn mài, cẩm thạch): texture vẽ bằng canvas, toàn bộ vật liệu, làm xỉn màu không chơi |
| `board-model.ts` | Bàn khối thật: mặt bàn chơi, khối bàn, nẹp kim loại, ô nổi, mũi tên ô xuất phát, sao ô an toàn, chuồng có khung và 4 hốc, đệm xúc xắc, tháp đích 4 mặt màu |
| `piece-geometry.ts` | Quân ngựa (cổ cong, tai, bờm tua, mõm thon) và cá ngựa (vương miện, vây lưng, thân ngấn, đuôi cuộn): đùn đường viền rồi nặn bề dày theo vùng và làm mượt |
| `token-3d.tsx` | Chuyển động: bước, bay (ra quân), bổ nhào (đá quân), văng lộn vòng (bị đá) kèm nén khi đáp; đứng yên thì quay nghiêng ba phần tư về phía người xem |
| `dice-3d.tsx` | Xúc xắc giữa chuồng; lắc rồi dừng đúng mặt engine trả; vòng màu khi tới lượt |
| `bursts-3d.tsx` | Hạt sáng khi đá quân và pháo sáng khi về đích |
| `scene-rig.tsx` | Đèn chính ấm đổ bóng, đèn viền lạnh, môi trường phản chiếu; camera khoá theo màu, chuyển mượt |
| `ludo-board-3d.tsx` | Ghép scene; nhận biết bước bổ nhào / quân bị đá từ `GameView`; nền và sương mờ theo phong cách |

Ngoài thư mục `three/`:

- `presentation/game-animator.ts`: thêm nhịp `CAPTURE_IMPACT_MS` (320 ms) trước khi hiện thế cờ sau nước đá quân, để quân tấn công kịp bổ xuống và tiếng đá khớp lúc chạm (bản 2D cũng có nhịp này).
- `components/game-table.tsx` (`Stage3D`): bàn 3D phủ toàn màn hình dưới thanh trên. Tên người chơi là bảng nổi trên bàn (`components/seat-tag.tsx`, đặt bằng `three/label-projector.tsx`) ở góc chuồng của họ, kèm nút ngồi / kick / thêm bot. Dòng báo lượt và nút chủ phòng nổi phía trên; người xem thu thành nút ở góc dưới-trái.
- `components/graphics-toggle.tsx`: menu "Cài đặt bàn cờ" (2D/3D, phong cách, kiểu quân, góc nhìn), lưu trong `ludo-settings`.

Còn lại: màn thắng 3D, mức chất lượng Thấp/Cao, cho người xem phòng online chọn đứng sau màu nào, đo hiệu năng trên điện thoại thật.
