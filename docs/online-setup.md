# Cài đặt chế độ online (Firebase)

Chế độ online dùng **Firebase Realtime Database** để đồng bộ phòng và **Anonymous Auth** để mỗi trình duyệt có một `uid`.

## 1. Tạo project Firebase

1. Vào https://console.firebase.google.com → **Add project**.
2. **Build → Realtime Database → Create database** (chọn region gần, ví dụ `asia-southeast1`), bắt đầu ở *locked mode*.
3. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable**.
4. **Project settings → General → Your apps → Web (</>)**: đăng ký app, copy object `firebaseConfig`.

## 2. Điền biến môi trường

Tạo `.env.local` (copy từ `.env.example`) và điền:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=<project>.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://<project>-default-rtdb.<region>.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=<project>
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Chạy lại `npm run dev` sau khi sửa `.env.local`.

## 3. Áp security rules

Copy nội dung `database.rules.json` vào **Realtime Database → Rules → Publish**
(hoặc `firebase deploy --only database` nếu dùng Firebase CLI).

Rules đảm bảo: chỉ chủ phòng được kick / thêm bot / bắt đầu ván; người chơi chỉ ngồi được ghế trống hoặc ghế bot
và chỉ rời được ghế của mình; người bị kick không vào lại được phòng đó.
Chat: chỉ thành viên đang ở trong phòng được đọc và gửi, tin chỉ thêm được (không sửa, không xoá), tên người gửi
phải trùng tên đang dùng trong phòng, tối đa 200 ký tự; chủ phòng xoá cả nhánh chat khi đóng phòng.

**Mỗi lần `database.rules.json` thay đổi (ví dụ khi thêm chat) phải Publish lại**, nếu không Firebase từ chối
ghi vào nhánh mới (`permission_denied` trong console).

## Dữ liệu

```
rooms/{roomId}
  hostId        uid chủ phòng
  status        "lobby" | "playing"
  members/{uid} { name, joinedAt }      — presence, tự xoá khi mất kết nối
  seats/{color} { kind: "human", uid, name } | { kind: "bot" }
  kicked/{uid}  true
  game          { seq, event, state }   — state là GameState dạng chuỗi JSON

chats/{roomId}/{pushId}                 — tách khỏi rooms/ để tin nhắn không làm tải lại cả phòng
  { uid, name, text, sentAt }           — client chỉ tải 50 tin gần nhất (limitToLast)
```

## Giới hạn hiện tại

- Phòng không tự xoá nếu mọi người cùng mất kết nối (chỉ xoá khi người cuối bấm "Rời phòng").
- Chat chống spam ở phía máy (mỗi tin cách nhau ≥ 0,7 giây); rules chưa giới hạn tốc độ gửi.
- Chưa có giới hạn thời gian mỗi lượt: người ngồi ghế treo máy thì ván phải chờ, chủ phòng có thể kick để bot đánh tạm.
