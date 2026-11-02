"use client"

import { useState } from "react"
import { BotIcon, PlayIcon, UserIcon, XIcon } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { COLOR_HEX, PLAYER_COLORS, type PlayerColor } from "../game/constants"
import type { Player } from "../game/rules"
import { HorseAvatar } from "./horse-piece"

type Seat = "human" | "bot" | "off"

const SEAT_OPTIONS = [
  { seat: "human", icon: UserIcon },
  { seat: "bot", icon: BotIcon },
  { seat: "off", icon: XIcon },
] as const satisfies readonly { seat: Seat; icon: unknown }[]

const DEFAULT_SEATS: Record<PlayerColor, Seat> = { red: "human", green: "bot", yellow: "bot", blue: "bot" }

function seatsFrom(players: Player[] | null): Record<PlayerColor, Seat> {
  if (!players) return DEFAULT_SEATS
  return Object.fromEntries(
    PLAYER_COLORS.map((color) => [color, players.find((player) => player.color === color)?.kind ?? "off"])
  ) as Record<PlayerColor, Seat>
}

interface OfflineSetupProps {
  initialPlayers: Player[] | null
  onStart: (players: Player[]) => void
}

/** Chọn ai chơi màu nào (người / bot / tắt) cho ván trên một máy. */
export function OfflineSetup({ initialPlayers, onStart }: OfflineSetupProps) {
  const { t } = useI18n()
  const [seats, setSeats] = useState(() => seatsFrom(initialPlayers))

  const players = PLAYER_COLORS.flatMap((color) => {
    const seat = seats[color]
    return seat === "off" ? [] : [{ color, kind: seat }]
  })

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("ludo.setup.description")}</p>

      <ul className="flex flex-col gap-2">
        {PLAYER_COLORS.map((color) => {
          const hex = COLOR_HEX[color]
          const off = seats[color] === "off"
          return (
            <li
              key={color}
              className={cn(
                "flex items-center gap-3 rounded-2xl border-2 bg-black/15 p-2 transition-opacity",
                off && "opacity-55"
              )}
              style={{ borderColor: off ? "transparent" : `${hex.base}99` }}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: hex.light }}>
                <HorseAvatar color={color} className={cn("size-9", off && "grayscale")} />
              </span>
              <span className="flex-1 font-bold">{t(`ludo.color.${color}`)}</span>

              <div role="radiogroup" aria-label={t(`ludo.color.${color}`)} className="flex rounded-xl bg-black/25 p-1">
                {SEAT_OPTIONS.map(({ seat, icon: Icon }) => {
                  const selected = seats[color] === seat
                  return (
                    <button
                      key={seat}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setSeats((current) => ({ ...current, [color]: seat }))}
                      className={cn(
                        "flex h-8 items-center gap-1 rounded-lg px-2.5 text-xs font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        selected ? "text-white shadow" : "text-muted-foreground hover:text-foreground"
                      )}
                      style={selected ? { backgroundColor: seat === "off" ? "#475569" : hex.dark } : undefined}
                    >
                      <Icon className="size-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline">{t(`ludo.seat.${seat}`)}</span>
                    </button>
                  )
                })}
              </div>
            </li>
          )
        })}
      </ul>

      {players.length < 2 && <p className="text-center text-sm text-destructive-foreground">{t("ludo.setup.needTwoPlayers")}</p>}
      <Button variant="game" size="xl" disabled={players.length < 2} onClick={() => onStart(players)}>
        <PlayIcon data-icon="inline-start" />
        {t("ludo.setup.start")}
      </Button>
    </div>
  )
}
