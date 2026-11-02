"use client"

import { CopyIcon, EyeIcon, PlayIcon, SquareIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { COLOR_HEX } from "../../game/constants"
import { HorseAvatar } from "../../components/horse-piece"
import { backToLobby, startOnlineGame } from "../room-api"
import { seatOf, type RoomData } from "../room-types"

export const MIN_PLAYERS = 2

/** Mã phòng ở giữa thanh trên, bấm để sao chép link mời. */
export function RoomCodeChip({ roomId }: { roomId: string }) {
  const { t } = useI18n()

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success(t("ludo.online.linkCopied"))
    } catch {
      toast.error(t("ludo.online.actionFailed"))
    }
  }

  return (
    <button
      type="button"
      onClick={copyInvite}
      title={t("ludo.online.copyLink")}
      className="flex items-center gap-2 rounded-full border border-white/10 bg-black/25 py-1 pr-2.5 pl-3 transition-colors outline-none hover:bg-black/40 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="hidden text-xs text-muted-foreground sm:inline">{t("ludo.online.roomCode")}</span>
      <span className="font-mono text-lg font-bold tracking-[0.2em] text-primary">{roomId}</span>
      <CopyIcon className="size-4 text-muted-foreground" aria-label={t("ludo.online.copyLink")} />
    </button>
  )
}

/** Mình đang chơi màu gì, hay đang xem. */
export function SeatBadge({ room, uid }: { room: RoomData; uid: string }) {
  const { t } = useI18n()
  const mySeat = seatOf(room, uid)

  if (!mySeat) {
    return (
      <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
        <EyeIcon className="size-4" aria-hidden="true" />
        {t("ludo.online.spectating")}
      </span>
    )
  }

  return (
    <span
      className="flex items-center gap-1.5 rounded-full py-0.5 pr-3 pl-1 text-sm font-bold text-white"
      style={{ backgroundColor: COLOR_HEX[mySeat].dark }}
    >
      <HorseAvatar color={mySeat} className="size-6" />
      {t("ludo.online.seatedAs", { color: t(`ludo.color.${mySeat}`) })}
    </span>
  )
}

interface HostControlsProps {
  roomId: string
  room: RoomData
  isHost: boolean
}

/** Nút bắt đầu / kết thúc ván, chỉ chủ phòng thấy. */
export function HostControls({ roomId, room, isHost }: HostControlsProps) {
  const { t } = useI18n()
  if (!isHost) return null

  const run = (action: () => Promise<unknown>) => void action().catch(() => toast.error(t("ludo.online.actionFailed")))

  if (room.status === "playing") {
    return (
      <Button variant="game-secondary" onClick={() => run(() => backToLobby(roomId))}>
        <SquareIcon data-icon="inline-start" />
        {t("ludo.online.endGame")}
      </Button>
    )
  }

  return (
    <Button
      variant="game"
      disabled={Object.keys(room.seats).length < MIN_PLAYERS}
      onClick={() => run(() => startOnlineGame(roomId, room))}
    >
      <PlayIcon data-icon="inline-start" />
      {t("ludo.setup.start")}
    </Button>
  )
}
