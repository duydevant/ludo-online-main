/** Danh sách ngôn ngữ, tách khỏi lib/i18n.tsx ("use client") để component server cũng import được. */
export const locales = ["en", "vi"] as const

export type Locale = (typeof locales)[number]

/** Ngôn ngữ của HTML render trên server (thứ công cụ tìm kiếm đọc), cũng là `<html lang>`. */
export const DEFAULT_LOCALE: Locale = "vi"
