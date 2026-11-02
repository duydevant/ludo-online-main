# System Architecture

Game cờ cá ngựa (Ludo) chạy trên Next.js App Router. Không có backend riêng và không có tài khoản người dùng; chế độ online dùng Firebase (Realtime Database + Anonymous Auth).

## Các lớp

```
app/           — `/` (LudoHome: menu hoặc ván trên máy), `/room/[roomId]` (phòng online). /ludo, /online cũ redirect trong next.config.ts.
modules/ludo/  — toàn bộ game.
components/    — shadcn/ui (`components/ui/`), chọn ngôn ngữ, empty state, JSON-LD.
lib/           — i18n, routes, firebase, site config, SEO.
providers/     — theme (ép tối) + i18n + tooltip.
```

## lib/

- `lib/i18n.tsx` — i18n tự viết (không dùng next-intl), en/vi. Thêm ngôn ngữ: thêm vào `locales` và một dictionary khớp `TranslationKey`.
- `lib/routes.tsx` — `Routes` và `roomPath()`.
- `lib/firebase.ts` — khởi tạo Firebase từ `NEXT_PUBLIC_FIREBASE_*`, đăng nhập ẩn danh.
- `lib/site.ts` — site config tĩnh đọc từ env.
- `lib/seo/` — JSON-LD schema helpers.

## Giao diện

Một theme duy nhất (tối, xanh đêm + nhấn vàng), khai báo trong `app/globals.css`; `next-themes` ép class `dark` để các component shadcn dùng cùng bảng màu.
Lớp dùng chung: `.game-bg` (nền), `.game-panel` (khung kính mờ), `.game-title` (chữ logo), `.ludo-table` (lưới bàn chơi).
Nút: biến thể `game` / `game-secondary` và size `xl` trong `components/ui/button.tsx` (khối nổi có cạnh đáy).
Font Baloo 2 (có tiếng Việt) qua `next/font/google`.

## modules/ludo — game Ludo

Hai chế độ dùng chung engine và giao diện bàn cờ:

- `/` — `LudoHome`: chưa có ván thì hiện `MainMenu` (chọn chế độ; cấu hình người/bot cho ván trên máy hoặc tạo / vào phòng online), có ván thì hiện `OfflineGame`.
- `/room/[roomId]` — phòng online qua Firebase Realtime Database. Cài đặt: `docs/online-setup.md`.

Luồng dữ liệu: mỗi hành động tạo một `GameSnapshot` `{ seq, event, state }` (`game/snapshot.ts`).
Offline giữ snapshot trong zustand; online giữ ở `rooms/{id}/game` và ghi bằng transaction theo `seq`.
Mọi client đưa snapshot vào cùng một animator để phát lại hiệu ứng, nên các máy trong phòng thấy giống nhau.

- `game/` — engine thuần TS, không phụ thuộc React: `rules.ts` (state bất biến: `createGame`, `applyRoll`, `applyMove`), `board-geometry.ts` (lưới 15x15), `bot.ts`, `snapshot.ts`. Có test vitest.
- `presentation/game-animator.ts` — nhận snapshot theo thứ tự, phát hiệu ứng lắc xúc xắc / quân đi từng ô và âm thanh; `busy` chặn thao tác khi hiệu ứng chưa xong.
- `hooks/use-turn-driver.ts` — máy nào điều khiển màu đang tới lượt (`local` / `local-bot` / `remote`) thì tự đi cho bot hoặc tự đi khi chỉ có một nước. Online: ghế bot và ghế trống giữa ván do máy chủ phòng đánh.
- `store/` — các store zustand, đều persist vào localStorage:
  - `ludo-offline.store.ts` (key `ludo-offline-game`) — ván trên máy; tải lại trang vẫn chơi tiếp. Ván kết thúc thì ghi vào lịch sử.
  - `match-history.store.ts` (key `ludo-match-history`) — 100 ván gần nhất. Ván online do `RoomView` ghi khi mình có ghế trong ván; id ghép từ phòng + seq + thứ hạng để tải lại trang không ghi trùng.
  - `ludo-settings.store.ts` (key `ludo-settings`) — tắt tiếng, tên người chơi.
  - Cả ba dùng `skipHydration`; `useRehydrateLudoStores()` (gọi ở `AppProviders`) đọc localStorage sau khi mount để HTML server khớp lần render đầu. Màn nào phụ thuộc dữ liệu đã lưu thì chờ `usePersistHydrated(store.persist)`.
- `history/match-record.ts` — kiểu `MatchRecord`, `computeStats` (số ván, thắng, tỉ lệ, chuỗi thắng), `offlineResult` (offline chỉ tính thắng/thua khi có cả người và bot). Có test.
- `online/` — `room-api.ts` (tạo/vào phòng, presence, ngồi/rời ghế, kick, bot, bắt đầu ván, transaction, gửi chat), `use-room.ts` (theo dõi phòng, tự nhận chủ phòng khi chủ cũ rời), `use-room-chat.ts` (chat realtime ở `chats/{roomId}`, đếm tin chưa đọc, tiếng báo), `components/` (`RoomChat` là nút nổi góc phải dưới, mở ra khung chat).
- `components/` — `GameScreen` (thanh trên + nội dung, dùng cho mọi màn), `MainMenu`, `OfflineSetup`, `LudoBoard` (bàn cờ SVG có khung), `LudoTable` (bàn cờ SVG + 4 `SeatPanel` cạnh 4 chuồng, mỗi panel có xúc xắc riêng), quân ngựa `horse-piece.tsx`, dialog kết thúc. Màu không có người/bot bị làm tối.
- `audio/sound-effects.ts` — âm thanh tổng hợp bằng Web Audio, không có file asset.

Luật: cần 6 để ra chuồng; tung 6 / đá quân / về đích được tung thêm; ba lần 6 liên tiếp mất lượt; ô xuất phát và ô ngôi sao an toàn; phải tung đúng số để về đích.
