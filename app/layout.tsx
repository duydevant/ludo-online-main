import type { Metadata, Viewport } from "next"
import { Baloo_2 } from "next/font/google"

import { JsonLd } from "@/components/seo/json-ld"
import { Toaster } from "@/components/ui/sonner"
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/schema"
import { siteConfig } from "@/lib/site"
import { AppProviders } from "@/providers/app-providers"
import "./globals.css"

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin", "vietnamese"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
}

export const viewport: Viewport = {
  themeColor: "#161a3a",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${baloo.variable} dark h-full antialiased`} suppressHydrationWarning>
      <body className="game-bg relative flex min-h-full flex-col">
        <AppProviders>
          <JsonLd data={[websiteJsonLd(), organizationJsonLd()]} />
          {children}
          <Toaster position="top-center" />
        </AppProviders>
      </body>
    </html>
  )
}
