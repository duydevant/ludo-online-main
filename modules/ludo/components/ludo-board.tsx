"use client"

import { cn } from "cn"

import { useI18n } from "@/lib/i18n"

import { BOARD_SIZE } from "../game/board-geometry"
import type { PlayerColor } from "../game/constants"
import type { GameState } from "../game/rules"
import type { MovingToken } from "../presentation/game-animator"
import { BoardSurface } from "./board-surface"
import { BoardTokens } from "./board-tokens"

interface LudoBoardProps {
  state: Pick<GameState, "players" | "tokens">
  activeColors: readonly PlayerColor[]
  movingToken?: MovingToken | null
  selectable?: { color: PlayerColor; tokens: number[] } | null
  onChoose?: (tokenIndex: number) => void
  className?: string
}

/** Bàn cờ SVG có khung gỗ; dùng cho màn chơi và hình minh hoạ ở menu. */
export function LudoBoard({ state, activeColors, movingToken = null, selectable = null, onChoose, className }: LudoBoardProps) {
  const { t } = useI18n()

  return (
    <div
      className={cn(
        "aspect-square rounded-[1.4rem] bg-linear-to-b from-amber-700 to-amber-900 p-[2.2%] shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8),inset_0_2px_0_rgb(255_255_255/0.25)]",
        className
      )}
    >
      <svg
        viewBox={`-0.1 -0.1 ${BOARD_SIZE + 0.2} ${BOARD_SIZE + 0.2}`}
        className="block size-full rounded-2xl bg-[#fffaf0] select-none"
        role="img"
        aria-label={t("ludo.boardLabel")}
      >
        <BoardSurface activeColors={activeColors} />
        <BoardTokens state={state} movingToken={movingToken} selectable={selectable} onChoose={onChoose ?? (() => {})} />
      </svg>
    </div>
  )
}
