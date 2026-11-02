# Cờ Cá Ngựa Online

Cờ cá ngựa (Ludo) 2–4 người trên Next.js. Vào `/` là vào thẳng menu game, chọn một trong hai chế độ:

- **Chơi trên máy**: đấu bot hoặc chuyền máy cho bạn bè, không cần mạng.
- **Chơi online**: tạo phòng (mã 6 ký tự, link `/room/<mã>`), tối đa 4 ghế, còn lại là người xem. Dùng Firebase Realtime Database, xem `docs/online-setup.md`.

Không có tài khoản / đăng nhập. Chế độ online tự đăng nhập ẩn danh Firebase để mỗi trình duyệt có một `uid`.

## Bắt đầu

```bash
npm install
cp .env.example .env.local   # điền NEXT_PUBLIC_FIREBASE_* nếu cần chơi online
npm run dev -- -p 1030
```

Mở `http://localhost:1030`.

## Scripts

```bash
npm run dev     # dev server (Turbopack)
npm run build   # production build
npm run lint    # eslint
npm test        # vitest run
npm run test:watch
npx tsc --noEmit
```

## Cấu trúc

```
app/             # `/` (menu + ván trên máy), `/room/[roomId]` (phòng online)
modules/ludo/    # engine, bot, hiệu ứng, giao diện, chế độ online
components/      # shadcn/ui, chọn ngôn ngữ
lib/             # i18n, routes, firebase, SEO
docs/            # kiến trúc, cài đặt online
```

## Chạy bằng Docker

```bash
cp .env.example .env.local   # điền NEXT_PUBLIC_FIREBASE_* (xem docs/online-setup.md)
docker compose up -d --build # mở http://localhost:1030
docker compose logs -f       # xem log
docker compose down          # dừng
```

`NEXT_PUBLIC_*` được nhúng vào bundle lúc build, nên sửa `.env.local` thì phải build lại (`--build`).
Image dùng `output: "standalone"` của Next.js, chạy `node server.js` ở port 3000 trong container, map ra 1030.
