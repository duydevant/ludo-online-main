"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export const locales = ["en", "vi"] as const

export type Locale = (typeof locales)[number]

const STORAGE_KEY = "base-game.locale"

const en = {
  "language.label": "Language",
  "language.en": "English",
  "language.vi": "Tiếng Việt",
  "nav.signIn": "Sign in",
  "nav.signOut": "Sign out",
  "nav.signedOut": "Signed out successfully.",
  "nav.signOutFailed": "Could not sign out. Please try again.",
  "nav.account": "Account",
  "nav.profile": "Profile",
  "profile.title": "Profile",
  "profile.subtitle": "Manage your account details.",
  "profile.cardTitle": "Account information",
  "profile.loading": "Loading your profile...",
  "footer.tagline": "Starter shell for your next game.",
  "home.description":
    "This shell is ready for a new game. UI components, auth, i18n, and the API client are already wired.",
} as const

export type TranslationKey = keyof typeof en
type TranslationDictionary = Record<TranslationKey, string>

const vi: TranslationDictionary = {
  "language.label": "Ngôn ngữ",
  "language.en": "English",
  "language.vi": "Tiếng Việt",
  "nav.signIn": "Đăng nhập",
  "nav.signOut": "Đăng xuất",
  "nav.signedOut": "Đã đăng xuất thành công.",
  "nav.signOutFailed": "Không thể đăng xuất. Vui lòng thử lại.",
  "nav.account": "Tài khoản",
  "nav.profile": "Hồ sơ",
  "profile.title": "Hồ sơ",
  "profile.subtitle": "Quản lý thông tin tài khoản của bạn.",
  "profile.cardTitle": "Thông tin tài khoản",
  "profile.loading": "Đang tải hồ sơ...",
  "footer.tagline": "Khung khởi đầu cho game tiếp theo.",
  "home.description":
    "Khung này sẵn sàng cho một game mới. Component UI, auth, i18n và API client đã được nối sẵn.",
}

const dictionaries: Record<Locale, TranslationDictionary> = { en, vi }
const localeTags: Record<Locale, string> = { en: "en-US", vi: "vi-VN" }

function isLocale(value: string | null | undefined): value is Locale {
  return locales.includes(value as Locale)
}

function preferredLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(saved)) return saved
  } catch {}

  const browserLocale = window.navigator.language.toLowerCase().split("-")[0]
  return isLocale(browserLocale) ? browserLocale : "en"
}

interface I18nContextValue {
  locale: Locale
  localeTag: string
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, values?: Record<string, string | number>) => string
  formatNumber: (value: number) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const timer = window.setTimeout(() => setLocaleState(preferredLocale()), 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    document.documentElement.lang = localeTags[locale]
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const setLocale = (nextLocale: Locale) => {
      setLocaleState(nextLocale)
      try {
        window.localStorage.setItem(STORAGE_KEY, nextLocale)
      } catch {}
    }

    const t = (key: TranslationKey, values: Record<string, string | number> = {}) =>
      dictionaries[locale][key].replace(/\{(\w+)\}/g, (match, name: string) =>
        values[name] === undefined ? match : String(values[name])
      )

    return {
      locale,
      localeTag: localeTags[locale],
      setLocale,
      t,
      formatNumber: (number) => number.toLocaleString(localeTags[locale]),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) throw new Error("useI18n must be used within I18nProvider")
  return context
}

export { isLocale }
