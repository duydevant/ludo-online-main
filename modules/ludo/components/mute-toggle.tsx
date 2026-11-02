"use client"

import { Volume2Icon, VolumeXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { useLudoSettingsStore } from "../store/ludo-settings.store"

export function MuteToggle() {
  const { t } = useI18n()
  const muted = useLudoSettingsStore((state) => state.muted)
  const toggleMuted = useLudoSettingsStore((state) => state.toggleMuted)

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      onClick={toggleMuted}
      aria-label={t(muted ? "ludo.unmute" : "ludo.mute")}
      title={t(muted ? "ludo.unmute" : "ludo.mute")}
    >
      {muted ? <VolumeXIcon /> : <Volume2Icon />}
    </Button>
  )
}
