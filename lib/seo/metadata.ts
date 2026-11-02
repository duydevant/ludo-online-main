import type { Metadata } from "next"

import { siteConfig } from "@/lib/site"

type OpenGraph = NonNullable<Metadata["openGraph"]>
type Twitter = NonNullable<Metadata["twitter"]>

/**
 * Next.js không gộp sâu metadata: trang nào khai `openGraph` / `twitter` là thay cả object của layout.
 * Mọi trang tạo hai object này qua helper để không mất các trường chung (type, siteName, locale, card).
 */
export function openGraphMetadata(fields: Pick<OpenGraph, "title" | "description" | "url"> = {}): OpenGraph {
  return {
    type: "website",
    siteName: siteConfig.name,
    locale: "vi_VN",
    alternateLocale: ["en_US"],
    ...fields,
  }
}

export function twitterMetadata(fields: Pick<Twitter, "title" | "description"> = {}): Twitter {
  return { card: "summary_large_image", ...fields }
}
