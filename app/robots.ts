import type { MetadataRoute } from "next"
import { Routes } from "@/lib/routes"
import { siteConfig } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Phòng online là link mời tạm thời, không có nội dung để index.
      disallow: `${Routes.ROOM}/`,
    },
    sitemap: `${siteConfig.url}/sitemap.xml`,
  }
}
