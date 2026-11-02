# SEO

Tài liệu SEO cho Cờ Cá Ngựa Online: đã làm gì, file nào lo việc gì, cần làm gì khi lên production, và hướng phát triển tiếp.

Thị trường chính là Việt Nam, nên HTML render trên server và mọi metadata đều bằng tiếng Việt. Tiếng Anh chỉ đổi phía trình duyệt sau khi tải trang.

## 1. Tổng quan

| Hạng mục | File | Ghi chú |
| --- | --- | --- |
| Tên, tiêu đề, mô tả, từ khoá | `lib/site.ts` | Sửa ở đây là đổi toàn site |
| Metadata chung | `app/layout.tsx` | title template, OG, Twitter, apple web app, theme color, `<html lang="vi">` |
| Metadata trang chủ | `app/page.tsx` | tiêu đề đầy đủ, canonical `/` |
| Metadata phòng online | `app/room/[roomId]/page.tsx` | `noindex`, tiêu đề / mô tả riêng cho link mời |
| Helper OG / Twitter | `lib/seo/metadata.ts` | xem mục 3 |
| Dữ liệu cấu trúc | `lib/seo/schema.ts`, `modules/ludo/components/home-guide.tsx` | WebSite, VideoGame, FAQPage |
| Favicon và icon | `app/favicon.ico`, `app/icon.svg`, `app/apple-icon.png`, `public/icons/*` | xuất từ `app/icon.svg` |
| Ảnh chia sẻ | `app/opengraph-image.png` (+ `.alt.txt`) | 1200×630, dùng cho cả Facebook, Zalo, X |
| Manifest (PWA) | `app/manifest.ts` | "Thêm vào màn hình chính" |
| robots.txt | `app/robots.ts` | chặn `/room/` |
| sitemap.xml | `app/sitemap.ts` | chỉ trang chủ |
| Nội dung cho Google đọc | `modules/ludo/components/home-guide.tsx` | giới thiệu, luật, cách chơi online, FAQ |

## 2. Icon và ảnh

Nguồn duy nhất là **`app/icon.svg`**: 4 chuồng màu ở 4 góc, giữa là quân ngựa đỏ, cùng mã màu với trong game. Các file khác được xuất ra từ nó:

```bash
npm run brand:assets   # scripts/generate-brand-assets.mjs, dùng sharp
```

| File | Kích thước | Dùng cho |
| --- | --- | --- |
| `app/icon.svg` | vector | favicon trên trình duyệt mới (nét ở mọi cỡ) |
| `app/favicon.ico` | 16, 32, 48 | trình duyệt cũ, Google Search hiện favicon cạnh kết quả |
| `app/apple-icon.png` | 180×180, nền kín | iPhone/iPad khi thêm vào màn hình chính (iOS tự bo góc) |
| `public/icons/icon-192.png`, `icon-512.png` | 192, 512 | manifest, Android, JSON-LD `image` |
| `public/icons/icon-maskable-512.png` | 512, chừa vùng an toàn 10% | Android cắt icon theo hình tròn / squircle |
| `app/opengraph-image.png` | 1200×630 | ảnh xem trước khi gửi link qua Facebook, Zalo, Messenger, X |

Next.js tự sinh các thẻ `<link rel="icon">`, `apple-touch-icon` và `og:image` từ các file trong `app/`, có gắn hash vào URL nên đổi ảnh là trình duyệt và mạng xã hội lấy bản mới.

**Lưu ý cache:** `next.config.ts` cho mọi file ảnh cache 1 năm (`immutable`). Các file trong `public/icons/` không có hash trong URL, nên khi đổi icon hãy **đổi tên file** (ví dụ `icon-512-v2.png`) và sửa `app/manifest.ts`, `lib/seo/schema.ts`. Nếu không, người đã vào trang sẽ vẫn thấy icon cũ.

Ảnh OG dùng font Segoe UI của Windows lúc chạy script. Chạy script trên máy không có font này thì chữ sẽ rơi về font khác, nên xem lại ảnh trước khi commit.

## 3. Metadata

- **Tiêu đề trang chủ:** "Cờ Cá Ngựa Online – Chơi miễn phí với bạn bè và bot" (≤ 60 ký tự để Google không cắt). Các trang khác dùng template `%s | Cờ Cá Ngựa Online`.
- **Mô tả:** khoảng 150 ký tự, có từ khoá chính "cờ cá ngựa online", "miễn phí", "không cần tải, không cần đăng ký".
- **Canonical:** trang chủ là `/`, ghép với `NEXT_PUBLIC_SITE_URL` (xem mục 6).
- **Open Graph / Twitter:** `og:type=website`, `og:locale=vi_VN`, `og:site_name`, ảnh 1200×630, `twitter:card=summary_large_image`.
- **Phòng online `/room/{mã}`:** `noindex, nofollow`, robots.txt cũng chặn. Tiêu đề kiểu "Vào bàn cờ cá ngựa – phòng ABC123" để link mời gửi qua Zalo / Messenger hiện rõ là lời mời. Không đặt `og:url`, để mạng xã hội giữ đúng link phòng.

**Bẫy cần nhớ:** Next.js gộp metadata **không sâu**. Trang nào khai `openGraph` hoặc `twitter` là thay luôn cả object của layout, mất `og:type`, `og:site_name`, `twitter:card`. Vì vậy luôn tạo hai object này qua `openGraphMetadata()` / `twitterMetadata()` trong `lib/seo/metadata.ts`.

`keywords` gần như không còn ảnh hưởng tới Google. Giữ lại vì một số công cụ khác (Cốc Cốc, các cổng game) vẫn đọc.

## 4. Nội dung cho công cụ tìm kiếm

Trang chủ là game, nên phải chủ động có chữ cho Google đọc:

- **Server luôn render menu** (h1 "Cờ Cá Ngựa", mô tả, hai thẻ chế độ chơi). Ván dở trên máy chỉ được khôi phục sau khi trình duyệt đọc localStorage (`modules/ludo/components/ludo-home.tsx`).
- **Phần hướng dẫn dưới menu** (`HomeGuide`, cuộn xuống mới thấy): "Cờ cá ngựa online là gì?", "Luật chơi cờ cá ngựa", "Cách chơi online với bạn bè", "Câu hỏi thường gặp". Các tiêu đề h2 chứa từ khoá người Việt hay tìm. FAQ dùng `<details>` nên câu trả lời vẫn nằm trong HTML.
- **Ngôn ngữ render server là tiếng Việt** (`DEFAULT_LOCALE` trong `lib/locale.ts`). Người dùng trình duyệt tiếng Anh được đổi sang tiếng Anh sau khi tải trang. Hệ quả là chỉ bản tiếng Việt được index (xem mục 7).

Muốn sửa nội dung thì sửa các key `guide.*` trong `lib/i18n.tsx`, cả `vi` lẫn `en`.

## 5. Dữ liệu cấu trúc (JSON-LD)

| Loại | Ở đâu | Mục đích |
| --- | --- | --- |
| `WebSite` | layout, mọi trang | tên site, tên khác ("Cờ cá ngựa", "Ludo online"), ngôn ngữ |
| `VideoGame` | layout, mọi trang | thể loại, nền tảng web, 2–4 người, chơi đơn / nhiều người, miễn phí |
| `FAQPage` | trang chủ | sinh từ đúng 4 câu FAQ đang hiển thị |

Google hiện chỉ hiện rich result FAQ cho một số trang chính phủ / y tế, nên đừng kỳ vọng thấy FAQ xổ ra trên kết quả tìm kiếm. Dữ liệu vẫn giúp Google hiểu nội dung. Không khai `aggregateRating` khi chưa có đánh giá thật, vì Google phạt đánh giá giả.

Kiểm tra: [Rich Results Test](https://search.google.com/test/rich-results) và [Schema Markup Validator](https://validator.schema.org/).

## 6. Checklist khi lên production

1. **Domain: `https://ludo.antfootage.net`** — đã đặt trong `NEXT_PUBLIC_SITE_URL` (`.env.local`, `.env.example`) và làm giá trị mặc định trong `lib/site.ts`. Biến này quyết định canonical, `og:url`, link ảnh OG, sitemap và robots, nên phải có `https` và không có `/` ở cuối. Đổi domain thì sửa cả ba chỗ rồi build lại: `docker compose up -d --build`.
2. **Chạy HTTPS** (qua reverse proxy như Nginx / Caddy / Cloudflare trước container).
3. **Google Search Console:** thêm property `https://ludo.antfootage.net` (hoặc cả domain `antfootage.net` qua bản ghi DNS TXT), xác minh, gửi `https://ludo.antfootage.net/sitemap.xml`, rồi dùng "Kiểm tra URL" → "Yêu cầu lập chỉ mục" cho trang chủ.
4. **Bing Webmaster Tools:** nhập từ Search Console (Cốc Cốc và một phần lượt tìm dùng Bing).
5. **Kiểm tra ảnh chia sẻ:** [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (bấm "Scrape again" sau mỗi lần đổi ảnh). Gửi thử link vào Zalo: Zalo cache ảnh khá lâu, đổi ảnh thì thêm `?v=2` vào link khi thử.
6. **Tốc độ:** chạy [PageSpeed Insights](https://pagespeed.web.dev/) cho bản mobile. Mục tiêu LCP < 2,5s, CLS < 0,1. Bàn cờ là SVG nên nhẹ. Font Baloo 2 tải qua `next/font`, đã tự host.
7. **Firebase (bảo mật, không bắt buộc):** trong Google Cloud Console → APIs & Services → Credentials, có thể giới hạn API key của web app theo HTTP referrer là domain thật. Nếu giới hạn thì nhớ thêm cả domain thật lẫn `localhost:1030`, không thì chế độ online sẽ không kết nối được.

## 7. Giới hạn hiện tại

- **Chỉ một URL, chỉ index bản tiếng Việt.** Tiếng Anh đổi phía trình duyệt nên Google không thấy. Muốn có khách quốc tế thì tách route `/en` (render server tiếng Anh) và thêm `hreflang` qua `alternates.languages`.
- **Chưa có analytics.** Chưa đo được lượt vào, nguồn truy cập, tỉ lệ bắt đầu ván. Nên gắn Google Analytics 4 hoặc Plausible / Umami (nhẹ, không cần cookie banner).
- **Một trang duy nhất** nên có ít chỗ để xếp hạng nhiều từ khoá (xem mục 8).

## 8. Hướng phát triển SEO

**Từ khoá nên nhắm**

| Nhóm | Ví dụ | Trang |
| --- | --- | --- |
| Chính | cờ cá ngựa online, chơi cờ cá ngựa | trang chủ |
| Theo hành vi | cờ cá ngựa 4 người, chơi cờ cá ngựa với bạn bè, cờ cá ngựa với máy | trang chủ + bài hướng dẫn |
| Thông tin | luật chơi cờ cá ngựa, cách chơi cờ cá ngựa, mẹo chơi cờ cá ngựa | trang luật / mẹo riêng |
| Tiếng Anh | ludo online, play ludo with friends | route `/en` (khi làm) |

**Nội dung nên thêm** (mỗi mục một trang tĩnh, có link về trang chủ và nút "Chơi ngay"):

- `/luat-choi`: luật chơi chi tiết có hình bàn cờ, so sánh luật Việt Nam với luật Ludo quốc tế. Từ khoá "luật chơi cờ cá ngựa" có nhiều lượt tìm và ít đối thủ làm kỹ.
- `/meo-choi`: mẹo thắng (khi nào ra quân, khi nào đá, ô an toàn).
- Khi có chế độ luật Việt Nam hoặc chế độ nhanh: mỗi chế độ một trang giới thiệu.

**Kéo link về trang (backlink)**

- Đăng game lên các cổng game HTML5 (CrazyGames, GameDistribution…) với link về trang.
- Chia sẻ trong các nhóm Facebook boardgame / game Việt. Ảnh OG đã sẵn sàng để link hiện đẹp.
- Link mời phòng online chính là kênh lan truyền: mỗi lần mời bạn là một lần giới thiệu game. Nên thêm nút "Chia sẻ qua Zalo" trong phòng.

**Đo và lặp lại:** sau 4–6 tuần, xem Search Console → Hiệu suất: từ khoá nào có lượt hiển thị nhưng ít click thì sửa tiêu đề / mô tả. Từ khoá nào đang ở trang 2 thì viết thêm nội dung nhắm vào nó.
