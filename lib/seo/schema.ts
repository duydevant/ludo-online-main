import { siteConfig } from "@/lib/site"

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: ["Cờ cá ngựa", "Ludo online"],
    url: siteConfig.url,
    description: siteConfig.description,
    inLanguage: "vi",
  }
}

/** Mô tả chính game cho công cụ tìm kiếm. Không có rich result riêng, nhưng giúp hiểu trang là game gì. */
export function videoGameJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "VideoGame",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    image: `${siteConfig.url}/icons/icon-512.png`,
    genre: ["Board game", "Party game"],
    gamePlatform: "Web browser",
    applicationCategory: "Game",
    operatingSystem: "Any",
    playMode: ["SinglePlayer", "MultiPlayer"],
    numberOfPlayers: { "@type": "QuantitativeValue", minValue: 2, maxValue: 4 },
    inLanguage: ["vi", "en"],
    isAccessibleForFree: true,
    offers: { "@type": "Offer", price: 0, priceCurrency: "VND" },
  }
}
