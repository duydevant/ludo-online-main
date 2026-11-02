"use client"

import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { COLOR_HEX, FINISH_PROGRESS, TOKENS_PER_PLAYER, type PlayerColor } from "../game/constants"
import { DiceFace } from "./dice-face"
import { HorseAvatar } from "./horse-piece"

export interface SeatPanelProps {
  color: PlayerColor
  /** Tên hiển thị, ví dụ tên người chơi hoặc "Bot". */
  title: string
  subtitle?: React.ReactNode
  /** Màu này có tham gia ván (có người hoặc bot). Không tham gia thì làm tối. */
  active: boolean
  isTurn: boolean
  diceFace: number
  rolling: boolean
  canRoll: boolean
  onRoll: () => void
  /** progress các quân, để đếm số quân đã về đích. */
  tokens?: number[]
  rank?: number
  actions?: React.ReactNode
  className?: string
}

/** Panel đặt cạnh chuồng của một màu: thông tin người chơi + xúc xắc riêng của màu đó. */
export function SeatPanel({
  color,
  title,
  subtitle,
  active,
  isTurn,
  diceFace,
  rolling,
  canRoll,
  onRoll,
  tokens,
  rank,
  actions,
  className,
}: SeatPanelProps) {
  const { t } = useI18n()
  const hex = COLOR_HEX[color]
  const home = tokens?.filter((progress) => progress === FINISH_PROGRESS).length ?? 0

  return (
    <section
      className={cn(
        "game-panel relative flex flex-col gap-2 overflow-hidden rounded-2xl border-2 p-2.5 transition-all duration-300",
        !active && "border-dashed",
        isTurn && "-translate-y-0.5",
        className
      )}
      style={{
        gridArea: color,
        borderColor: active ? hex.base : undefined,
        backgroundImage: active ? `linear-gradient(135deg, ${hex.base}40, transparent 65%)` : undefined,
        boxShadow: isTurn ? `0 0 0 3px ${hex.base}66, 0 0 32px -4px ${hex.base}` : undefined,
      }}
      aria-label={t(`ludo.color.${color}`)}
    >
      <div className={cn("flex items-center gap-2.5", !active && "opacity-50 grayscale")}>
        <div
          className="flex size-12 shrink-0 items-center justify-center rounded-xl shadow-inner"
          style={{ backgroundColor: hex.light }}
        >
          <HorseAvatar color={color} className="size-11" />
        </div>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-base font-bold">{title}</p>
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
          {tokens && (
            <p className="mt-0.5 text-xs font-semibold" style={{ color: hex.light }}>
              {rank ? `#${rank} · ` : ""}
              {t("ludo.tokensHome", { count: home, total: TOKENS_PER_PLAYER })}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          className={cn("h-auto rounded-xl p-1 hover:bg-transparent disabled:opacity-100", canRoll && "animate-bounce")}
          disabled={!canRoll}
          onClick={onRoll}
          aria-label={t("ludo.rollDice")}
        >
          <DiceFace value={diceFace} color={color} rolling={rolling} className={cn(!isTurn && !rolling && "opacity-50")} />
        </Button>
      </div>
      {actions && <div className="flex flex-wrap gap-1.5">{actions}</div>}
    </section>
  )
}
