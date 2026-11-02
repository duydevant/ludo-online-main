/** Cấu hình site tĩnh dùng cho metadata, manifest và JSON-LD. Xem docs/seo.md. */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Cờ Cá Ngựa Online",
  /** Tên ngắn cho icon trên màn hình điện thoại (≤ 12 ký tự). */
  shortName: "Cá Ngựa",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://ludo.antfootage.net",
  /** Tiêu đề trang chủ (≤ 60 ký tự để không bị cắt trên Google). */
  title: "Cờ Cá Ngựa Online – Chơi miễn phí với bạn bè và bot",
  /** Mô tả trang chủ (~150 ký tự). */
  description:
    "Chơi cờ cá ngựa (Ludo) online miễn phí trên trình duyệt: đấu bot, chơi chung máy hoặc tạo phòng 4 người có chat. Không cần tải, không cần đăng ký.",
  keywords: [
    "cờ cá ngựa",
    "cờ cá ngựa online",
    "chơi cờ cá ngựa",
    "cờ cá ngựa 4 người",
    "cờ cá ngựa với bạn bè",
    "game cờ cá ngựa",
    "ludo",
    "ludo online",
  ],
  /** Màu nền app (thanh địa chỉ trên điện thoại, splash khi cài như app). */
  themeColor: "#161a3a",
}
