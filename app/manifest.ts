import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site"

/** Web app manifest: cho phép "Thêm vào màn hình chính" và cung cấp icon cho Android / Chrome. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: siteConfig.shortName,
    description: siteConfig.description,
    lang: "vi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: siteConfig.themeColor,
    theme_color: siteConfig.themeColor,
    categories: ["games", "entertainment"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  }
}
