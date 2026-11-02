"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeftIcon, Loader2Icon, LogInIcon } from "lucide-react"

import { AppEmptyState } from "@/components/common/app-empty-state"
import { Button } from "@/components/ui/button"
import { isFirebaseConfigured } from "@/lib/firebase"
import { useI18n } from "@/lib/i18n"
import { Routes } from "@/lib/routes"

import { GameScreen } from "../../components/game-screen"
import { useLudoSettingsStore } from "../../store/ludo-settings.store"
import { usePersistHydrated } from "../../store/persist-hydration"
import { useRoom } from "../use-room"
import { PlayerNameField } from "./player-name-field"
import { RoomCodeChip } from "./room-toolbar"
import { RoomView } from "./room-view"

/** Khung cho các trạng thái trước khi vào được phòng (nhập tên, đang kết nối, lỗi). */
function RoomGate({ roomId, children }: { roomId: string; children: React.ReactNode }) {
  const { t } = useI18n()

  return (
    <GameScreen
      start={
        <Button variant="ghost" size="sm" className="rounded-full" nativeButton={false} render={<Link href={Routes.HOME} />}>
          <ArrowLeftIcon data-icon="inline-start" />
          {t("ludo.online.backToEntry")}
        </Button>
      }
      center={<RoomCodeChip roomId={roomId} />}
      className="items-center justify-center"
    >
      {children}
    </GameScreen>
  )
}

function NameGate({ onConfirm }: { onConfirm: (name: string) => void }) {
  const { t } = useI18n()
  const [name, setName] = useState("")

  return (
    <form
      className="game-panel flex w-full max-w-sm flex-col gap-4 rounded-3xl p-5"
      onSubmit={(event) => {
        event.preventDefault()
        if (name.trim()) onConfirm(name.trim())
      }}
    >
      <h1 className="text-xl font-bold">{t("ludo.online.enterNameTitle")}</h1>
      <PlayerNameField value={name} onChange={setName} />
      <Button type="submit" variant="game" size="xl" disabled={!name.trim()}>
        <LogInIcon data-icon="inline-start" />
        {t("ludo.online.joinRoom")}
      </Button>
    </form>
  )
}

function ConnectedRoom({ roomId, playerName }: { roomId: string; playerName: string }) {
  const { t } = useI18n()
  const { uid, room, connection, isHost } = useRoom(roomId, playerName)

  if (connection === "ready" && room && uid) {
    return <RoomView roomId={roomId} room={room} uid={uid} isHost={isHost} />
  }
  if (connection === "connecting") {
    return (
      <RoomGate roomId={roomId}>
        <Loader2Icon className="size-8 animate-spin text-primary" aria-label={t("ludo.online.connecting")} />
      </RoomGate>
    )
  }

  const messageKey =
    connection === "kicked"
      ? "ludo.online.kicked"
      : connection === "not-found"
        ? "ludo.online.roomNotFound"
        : "ludo.online.connectFailed"

  return (
    <RoomGate roomId={roomId}>
      <AppEmptyState
        title={t(messageKey)}
        action={
          <Button variant="game" size="xl" nativeButton={false} render={<Link href={Routes.HOME} />}>
            {t("ludo.online.backToEntry")}
          </Button>
        }
      />
    </RoomGate>
  )
}

export function OnlineRoom({ roomId }: { roomId: string }) {
  const { t } = useI18n()
  const playerName = useLudoSettingsStore((state) => state.playerName.trim())
  const setPlayerName = useLudoSettingsStore((state) => state.setPlayerName)
  const settingsHydrated = usePersistHydrated(useLudoSettingsStore.persist)

  if (!isFirebaseConfigured) {
    return (
      <RoomGate roomId={roomId}>
        <AppEmptyState title={t("ludo.online.notConfigured")} />
      </RoomGate>
    )
  }
  if (!settingsHydrated) {
    return (
      <RoomGate roomId={roomId}>
        <Loader2Icon className="size-8 animate-spin text-primary" aria-label={t("ludo.online.connecting")} />
      </RoomGate>
    )
  }
  if (!playerName) {
    return (
      <RoomGate roomId={roomId}>
        <NameGate onConfirm={setPlayerName} />
      </RoomGate>
    )
  }
  return <ConnectedRoom roomId={roomId} playerName={playerName} />
}
