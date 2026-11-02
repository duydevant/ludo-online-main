import type { Metadata } from "next"

import { openGraphMetadata, twitterMetadata } from "@/lib/seo/metadata"
import { siteConfig } from "@/lib/site"
import { LudoHome } from "@/modules/ludo/components/ludo-home"

export const metadata: Metadata = {
  // Trang chủ dùng tiêu đề đầy đủ, không ghép template "%s | tên site".
  title: { absolute: siteConfig.title },
  alternates: { canonical: "/" },
  openGraph: openGraphMetadata({ url: "/", title: siteConfig.title, description: siteConfig.description }),
  twitter: twitterMetadata({ title: siteConfig.title, description: siteConfig.description }),
}

export default function HomePage() {
  return <LudoHome />
}
