"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/lib/i18n"

import { MAX_NAME_LENGTH } from "../room-types"

interface PlayerNameFieldProps {
  value: string
  onChange: (value: string) => void
}

export function PlayerNameField({ value, onChange }: PlayerNameFieldProps) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="ludo-player-name">{t("ludo.online.yourName")}</Label>
      <Input
        id="ludo-player-name"
        value={value}
        maxLength={MAX_NAME_LENGTH}
        placeholder={t("ludo.online.namePlaceholder")}
        className="h-11 rounded-xl bg-black/20 text-base"
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  )
}
