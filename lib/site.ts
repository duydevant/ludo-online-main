/** Cấu hình site tĩnh, đọc từ env. */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || "Cờ Cá Ngựa Online",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  description: "Cờ cá ngựa (Ludo) 2–4 người: chơi với bot trên một máy hoặc tạo phòng chơi online cùng bạn bè.",
}
