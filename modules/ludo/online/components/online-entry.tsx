"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2Icon, LogInIcon, PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ensureFirebaseUser, isFirebaseConfigured } from "@/lib/firebase"
import { useI18n } from "@/lib/i18n"
import { roomPath } from "@/lib/routes"

import { useLudoSettingsStore } from "../../store/ludo-settings.store"
import { createRoom, roomExists } from "../room-api"
import { ROOM_CODE_LENGTH, normalizeRoomCode } from "../room-types"
import { PlayerNameField } from "./player-name-field"

/** Nội dung menu chế độ online: nhập tên, tạo phòng hoặc vào phòng bằng mã. */
export function OnlineEntry() {
  const { t } = useI18n()
  const router = useRouter()
  const playerName = useLudoSettingsStore((state) => state.playerName)
  const setPlayerName = useLudoSettingsStore((state) => state.setPlayerName)
  const [roomCode, setRoomCode] = useState("")
  const [pending, setPending] = useState<"create" | "join" | null>(null)

  if (!isFirebaseConfigured) {
    return (
      <Alert>
        <AlertTitle>{t("ludo.online.notConfiguredTitle")}</AlertTitle>
        <AlertDescription>{t("ludo.online.notConfigured")}</AlertDescription>
      </Alert>
    )
  }

  const name = playerName.trim()

  const create = async () => {
    setPending("create")
    try {
      const roomId = await createRoom(await ensureFirebaseUser())
      router.push(roomPath(roomId))
    } catch {
      toast.error(t("ludo.online.connectFailed"))
      setPending(null)
    }
  }

  const join = async () => {
    setPending("join")
    try {
      await ensureFirebaseUser()
      if (!(await roomExists(roomCode))) {
        toast.error(t("ludo.online.roomNotFound"))
        setPending(null)
        return
      }
      router.push(roomPath(roomCode))
    } catch {
      toast.error(t("ludo.online.connectFailed"))
      setPending(null)
    }
  }

  const spinner = <Loader2Icon data-icon="inline-start" className="animate-spin" />

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("ludo.online.description")}</p>

      <PlayerNameField value={playerName} onChange={setPlayerName} />

      <Button variant="game" size="xl" disabled={!name || pending !== null} onClick={create}>
        {pending === "create" ? spinner : <PlusIcon data-icon="inline-start" />}
        {t("ludo.online.createRoom")}
      </Button>

      <div className="flex items-center gap-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-white/10" />
        {t("ludo.online.or")}
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          void join()
        }}
      >
        <Input
          value={roomCode}
          placeholder={t("ludo.online.roomCodePlaceholder")}
          aria-label={t("ludo.online.roomCode")}
          className="h-12 rounded-2xl bg-black/20 text-center font-mono text-lg font-bold tracking-[0.3em] uppercase"
          onChange={(event) => setRoomCode(normalizeRoomCode(event.target.value))}
        />
        <Button
          type="submit"
          variant="game-secondary"
          size="xl"
          disabled={!name || roomCode.length !== ROOM_CODE_LENGTH || pending !== null}
        >
          {pending === "join" ? spinner : <LogInIcon data-icon="inline-start" />}
          {t("ludo.online.joinRoom")}
        </Button>
      </form>
    </div>
  )
}
