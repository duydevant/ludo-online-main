"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { isLocale, locales, useI18n } from "@/lib/i18n"

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <Select
      value={locale}
      onValueChange={(value) => {
        if (isLocale(value)) setLocale(value)
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={t("language.label")}
        className="h-8 shrink-0 rounded-full border-white/10 bg-white/5 px-3 font-bold uppercase"
      >
        <SelectValue>{(value: string) => value}</SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        {locales.map((item) => (
          <SelectItem key={item} value={item}>
            {t(`language.${item}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
