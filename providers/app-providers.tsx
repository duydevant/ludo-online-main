"use client"

import { ThemeProvider } from "next-themes"

import { TooltipProvider } from "@/components/ui/tooltip"
import { I18nProvider } from "@/lib/i18n"
import { useRehydrateLudoStores } from "@/modules/ludo/store/persist-hydration"

export function AppProviders({ children }: { children: React.ReactNode }) {
  useRehydrateLudoStores()

  return (
    // Giao diện game chỉ có một theme tối, đồng bộ với bàn cờ.
    <ThemeProvider attribute="class" forcedTheme="dark" disableTransitionOnChange>
      <I18nProvider>
        <TooltipProvider>{children}</TooltipProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
