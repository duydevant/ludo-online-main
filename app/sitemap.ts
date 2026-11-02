import type { MetadataRoute } from "next"
import { Routes } from "@/lib/routes"
import { siteConfig } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${siteConfig.url}${Routes.HOME}`, lastModified: new Date() }]
}
