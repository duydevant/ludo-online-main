"use client"

import { BookOpenIcon, CrownIcon, DicesIcon, ShieldIcon, SwordsIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n"

const RULES = [
  { key: "ludo.rules.leaveBase", icon: DicesIcon },
  { key: "ludo.rules.bonus", icon: DicesIcon },
  { key: "ludo.rules.capture", icon: SwordsIcon },
  { key: "ludo.rules.finish", icon: CrownIcon },
] as const

export function RulesDialog() {
  const { t } = useI18n()

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" />}>
        <BookOpenIcon data-icon="inline-start" />
        {t("menu.howToPlay")}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ShieldIcon className="size-5 text-primary" aria-hidden="true" />
            {t("ludo.rules.title")}
          </DialogTitle>
        </DialogHeader>
        <ul className="flex flex-col gap-2">
          {RULES.map(({ key, icon: Icon }) => (
            <li key={key} className="flex gap-3 rounded-xl bg-black/20 p-3 text-sm">
              <Icon className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span>{t(key)}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  )
}
