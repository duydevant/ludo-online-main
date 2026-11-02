import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // ─── Deploy ──────────────────────────────────────────────────────────────
  // Build ra .next/standalone (server.js + node_modules tối thiểu) cho Docker image.
  output: "standalone",

  // ─── Performance ─────────────────────────────────────────────────────────
  compress: true,

  // Remove the X-Powered-By header to avoid exposing server info (security + minor SEO)
  poweredByHeader: false,

  // ─── Image Optimisation ───────────────────────────────────────────────────
  images: {
    // Modern formats for smaller file sizes → faster LCP (Core Web Vitals)
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // ─── Redirects ───────────────────────────────────────────────────────────
  // Đường dẫn cũ trước khi gộp menu vào trang chủ.
  async redirects() {
    return [
      { source: "/ludo", destination: "/", permanent: true },
      { source: "/online", destination: "/", permanent: true },
      { source: "/online/:roomId", destination: "/room/:roomId", permanent: true },
    ]
  },

  // ─── Security & SEO HTTP Headers ─────────────────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent MIME sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Controls how much referrer info is sent → privacy + SEO signal
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Legacy XSS protection for old browsers
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Restrict browser features not needed by this site
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      // Cache static assets aggressively
      {
        source: "/(.*)\\.(ico|svg|png|jpg|jpeg|webp|avif|woff2|woff|ttf)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ]
  },
}

export default nextConfig
