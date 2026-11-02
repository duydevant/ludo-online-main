"use client"

import { CrownIcon, EyeIcon, UserXIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { PLAYER_COLORS } from "../../game/constants"
import { kickMember } from "../room-api"
import type { RoomData } from "../room-types"

interface SpectatorListProps {
  roomId: string
  room: RoomData
  uid: string
  isHost: boolean
}

/** Thành viên trong phòng chưa ngồi ghế nào. */
export function SpectatorList({ roomId, room, uid, isHost }: SpectatorListProps) {
  const { t } = useI18n()
  const seatedUids = new Set(
    PLAYER_COLORS.flatMap((color) => {
      const seat = room.seats[color]
      return seat?.kind === "human" ? [seat.uid] : []
    })
  )
  const spectators = Object.entries(room.members)
    .filter(([memberId]) => !seatedUids.has(memberId))
    .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)

  return (
    <section className="game-panel rounded-2xl p-3">
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <EyeIcon className="size-4" aria-hidden="true" />
        {t("ludo.online.spectators", { count: spectators.length })}
      </h2>
      {spectators.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("ludo.online.noSpectators")}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {spectators.map(([memberId, member]) => (
            <li key={memberId} className="flex items-center gap-1.5 rounded-full bg-white/10 py-1 pr-1 pl-3 text-sm">
              {memberId === room.hostId && <CrownIcon className="size-3.5 text-yellow-500" aria-label={t("ludo.online.host")} />}
              <span>{memberId === uid ? t("ludo.online.you", { name: member.name }) : member.name}</span>
              {isHost && memberId !== uid ? (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  aria-label={t("ludo.online.kick")}
                  onClick={() => void kickMember(roomId, room, memberId).catch(() => toast.error(t("ludo.online.actionFailed")))}
                >
                  <UserXIcon />
                </Button>
              ) : (
                <span className="w-1" />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
