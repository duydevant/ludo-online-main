"use client"

import { cn } from "cn"

import { useI18n } from "@/lib/i18n"

import { COLOR_HEX, FINISH_PROGRESS, TOKENS_PER_PLAYER, type PlayerColor } from "../game/constants"
import { HorseAvatar } from "./horse-piece"
import type { SeatInfo } from "./ludo-table"

interface SeatTagProps extends SeatInfo {
  color: PlayerColor
  /** Màu có người hoặc bot chơi. */
  active: boolean
  isTurn: boolean
  /** progress các quân, để đếm số quân đã về đích. */
  tokens?: number[]
  rank?: number
}

/**
 * Bảng tên nổi trên bàn 3D, cạnh chuồng của màu đó: tên, vai trò, số quân đã về đích và các nút
 * (ngồi vào, kick, thêm bot...). Sáng viền khi tới lượt.
 */
export function SeatTag({ color, title, subtitle, actions, active, isTurn, tokens, rank }: SeatTagProps) {
  const { t } = useI18n()
  const hex = COLOR_HEX[color]
  const home = tokens?.filter((progress) => progress === FINISH_PROGRESS).length ?? 0

  return (
    <div
      className={cn(
        "game-panel flex w-max max-w-[13.5rem] flex-col gap-1.5 rounded-2xl border-2 px-2.5 py-2 transition-[box-shadow,opacity] duration-300",
        !active && "border-dashed opacity-70"
      )}
      style={{
        borderColor: active ? hex.base : undefined,
        backgroundImage: active ? `linear-gradient(135deg, ${hex.base}55, transparent 70%)` : undefined,
        boxShadow: isTurn ? `0 0 0 3px ${hex.base}77, 0 0 28px -2px ${hex.base}` : undefined,
      }}
      aria-label={t(`ludo.color.${color}`)}
    >
      <div className={cn("flex items-center gap-2", !active && "grayscale")}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: hex.light }}>
          <HorseAvatar color={color} className="size-7" />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="max-w-[8rem] truncate text-sm font-bold">{title}</p>
          <div className="max-w-[8rem] truncate text-[11px] text-muted-foreground">{subtitle}</div>
        </div>
        {tokens && (
          <span
            className="ml-auto shrink-0 rounded-full bg-black/35 px-2 py-0.5 text-xs font-bold tabular-nums"
            style={{ color: hex.light }}
            title={t("ludo.tokensHome", { count: home, total: TOKENS_PER_PLAYER })}
          >
            {rank ? `#${rank}` : `${home}/${TOKENS_PER_PLAYER}`}
          </span>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-1">{actions}</div>}
    </div>
  )
}
