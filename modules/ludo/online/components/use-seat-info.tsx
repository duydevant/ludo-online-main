"use client"

import { BotIcon, CrownIcon, LogOutIcon, ArmchairIcon, UserXIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { PLAYER_COLORS, type PlayerColor } from "../../game/constants"
import type { Player } from "../../game/rules"
import type { SeatInfo } from "../../components/ludo-table"
import { kickMember, leaveSeat, setBotSeat, takeSeat } from "../room-api"
import { seatOf, type RoomData } from "../room-types"

interface UseSeatInfoOptions {
  roomId: string
  room: RoomData
  uid: string
  isHost: boolean
  /** Người chơi của ván đang diễn ra, null khi ở phòng chờ. */
  gamePlayers: Player[] | null
}

/** Bỏ các phần tử false; trả undefined khi không còn nút nào để panel khỏi vẽ hàng trống. */
function compact(items: React.ReactNode[]): React.ReactNode[] | undefined {
  const list = items.filter(Boolean)
  return list.length > 0 ? list : undefined
}

/** Tiêu đề, mô tả và nút thao tác (ngồi, rời ghế, kick, thêm bot) cho panel của từng ghế. */
export function useSeatInfo({ roomId, room, uid, isHost, gamePlayers }: UseSeatInfoOptions) {
  const { t } = useI18n()
  const mySeat = seatOf(room, uid)
  const myName = room.members[uid]?.name ?? ""
  const inLobby = gamePlayers === null

  const run = (action: () => Promise<unknown>, failedKey: Parameters<typeof t>[0] = "ludo.online.actionFailed") =>
    void action()
      .then((ok) => {
        if (ok === false) toast.error(t(failedKey))
      })
      .catch(() => toast.error(t("ludo.online.actionFailed")))

  const sitButton = (color: PlayerColor) => (
    <Button
      key="sit"
      size="sm"
      onClick={() => run(() => takeSeat(roomId, color, uid, myName, mySeat), "ludo.online.seatTaken")}
    >
      <ArmchairIcon data-icon="inline-start" />
      {t("ludo.online.sit")}
    </Button>
  )

  const infoFor = (color: PlayerColor): SeatInfo => {
    const seat = room.seats[color]
    const inGame = gamePlayers?.some((player) => player.color === color) ?? false
    // Đang chơi thì chỉ người xem mới được ngồi; ở phòng chờ ai cũng đổi ghế được.
    const canSit = inLobby || (inGame && mySeat === null)

    if (seat?.kind === "human") {
      const isMe = seat.uid === uid
      return {
        title: isMe ? t("ludo.online.you", { name: seat.name }) : seat.name,
        subtitle:
          seat.uid === room.hostId ? (
            <span className="inline-flex items-center gap-1">
              <CrownIcon className="size-3 text-yellow-500" aria-hidden="true" />
              {t("ludo.online.host")}
            </span>
          ) : (
            t("ludo.seat.human")
          ),
        actions: compact([
          isMe && (
            <Button key="leave" size="sm" variant="outline" onClick={() => run(() => leaveSeat(roomId, color))}>
              <LogOutIcon data-icon="inline-start" />
              {t("ludo.online.standUp")}
            </Button>
          ),
          isHost && !isMe && (
            <Button
              key="kick"
              size="sm"
              variant="destructive"
              onClick={() => run(() => kickMember(roomId, room, seat.uid))}
            >
              <UserXIcon data-icon="inline-start" />
              {t("ludo.online.kick")}
            </Button>
          ),
        ]),
      }
    }

    if (seat?.kind === "bot") {
      return {
        title: t("ludo.seat.bot"),
        subtitle: t("ludo.online.botSeat"),
        actions: compact([
          canSit && mySeat !== color && sitButton(color),
          isHost && inLobby && (
            <Button key="remove-bot" size="sm" variant="outline" onClick={() => run(() => setBotSeat(roomId, color, false))}>
              {t("ludo.online.removeBot")}
            </Button>
          ),
        ]),
      }
    }

    if (!inLobby && !inGame) return { title: t("ludo.online.emptySeat"), subtitle: t("ludo.seat.notPlaying") }

    return {
      title: t("ludo.online.emptySeat"),
      subtitle: inLobby ? t("ludo.online.waitingForPlayer") : t("ludo.online.botStandIn"),
      actions: compact([
        canSit && sitButton(color),
        isHost && inLobby && (
          <Button key="add-bot" size="sm" variant="outline" onClick={() => run(() => setBotSeat(roomId, color, true))}>
            <BotIcon data-icon="inline-start" />
            {t("ludo.online.addBot")}
          </Button>
        ),
      ]),
    }
  }

  return Object.fromEntries(PLAYER_COLORS.map((color) => [color, infoFor(color)])) as Record<PlayerColor, SeatInfo>
}
