"use client"

import { RotateCcwIcon, UsersIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { backToLobby, startOnlineGame } from "../room-api"
import type { RoomData } from "../room-types"

interface GameOverActionsProps {
  roomId: string
  room: RoomData
  isHost: boolean
}

export function GameOverActions({ roomId, room, isHost }: GameOverActionsProps) {
  const { t } = useI18n()
  if (!isHost) return <p className="text-sm text-muted-foreground">{t("ludo.online.waitingForHost")}</p>

  const run = (action: () => Promise<unknown>) => void action().catch(() => toast.error(t("ludo.online.actionFailed")))
  const canRestart = Object.keys(room.seats).length >= 2

  return (
    <>
      <Button variant="outline" onClick={() => run(() => backToLobby(roomId))}>
        <UsersIcon data-icon="inline-start" />
        {t("ludo.online.backToLobby")}
      </Button>
      <Button disabled={!canRestart} onClick={() => run(() => startOnlineGame(roomId, room))}>
        <RotateCcwIcon data-icon="inline-start" />
        {t("ludo.playAgain")}
      </Button>
    </>
  )
}
