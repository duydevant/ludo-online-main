import type { Metadata, Viewport } from "next"
// Font tự host qua npm (Fontsource): build không cần gọi Google Fonts.
import "@fontsource-variable/baloo-2"

import { JsonLd } from "@/components/seo/json-ld"
import { Toaster } from "@/components/ui/sonner"
import { DEFAULT_LOCALE } from "@/lib/locale"
import { openGraphMetadata, twitterMetadata } from "@/lib/seo/metadata"
import { videoGameJsonLd, websiteJsonLd } from "@/lib/seo/schema"
import { siteConfig } from "@/lib/site"
import { AppProviders } from "@/providers/app-providers"
import "./globals.css"

// Favicon, apple-icon, ảnh Open Graph lấy tự động từ các file app/favicon.ico, app/icon.svg,
// app/apple-icon.png, app/opengraph-image.png. Manifest ở app/manifest.ts. Xem docs/seo.md.
export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  keywords: siteConfig.keywords,
  category: "game",
  openGraph: openGraphMetadata(),
  twitter: twitterMetadata(),
  appleWebApp: { capable: true, title: siteConfig.shortName, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: siteConfig.themeColor,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang={DEFAULT_LOCALE} className="dark h-full antialiased" suppressHydrationWarning>
      <body className="game-bg relative flex min-h-full flex-col">
        <AppProviders>
          <JsonLd data={[websiteJsonLd(), videoGameJsonLd()]} />
          {children}
          <Toaster position="top-center" />
        </AppProviders>
      </body>
    </html>
  )
}
