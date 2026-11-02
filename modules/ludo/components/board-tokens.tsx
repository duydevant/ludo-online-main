"use client"

import { cn } from "cn"

import { useI18n } from "@/lib/i18n"

import { tokenPoint, type Point } from "../game/board-geometry"
import type { PlayerColor } from "../game/constants"
import type { GameState } from "../game/rules"
import type { MovingToken } from "../presentation/game-animator"
import { HorsePiece } from "./horse-piece"

interface PlacedToken {
  color: PlayerColor
  tokenIndex: number
  point: Point
  scale: number
  movable: boolean
}

/** Gom quân đứng chung một điểm, thu nhỏ và xếp lệch để vẫn thấy đủ. */
function layoutTokens(
  state: Pick<GameState, "players" | "tokens">,
  movingToken: MovingToken | null,
  isMovable: (color: PlayerColor, tokenIndex: number) => boolean
): PlacedToken[] {
  const placed = state.players.flatMap(({ color }) =>
    state.tokens[color].map((storedProgress, tokenIndex) => {
      const isMoving = movingToken?.color === color && movingToken.tokenIndex === tokenIndex
      const progress = isMoving ? movingToken.progress : storedProgress
      return {
        color,
        tokenIndex,
        point: tokenPoint(color, tokenIndex, progress),
        scale: 1,
        movable: isMovable(color, tokenIndex),
      }
    })
  )

  const groups = new Map<string, PlacedToken[]>()
  for (const token of placed) {
    const key = `${token.point.x},${token.point.y}`
    groups.set(key, [...(groups.get(key) ?? []), token])
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue
    group.forEach((token, i) => {
      const angle = (2 * Math.PI * i) / group.length - (3 * Math.PI) / 4
      token.point = { x: token.point.x + Math.cos(angle) * 0.2, y: token.point.y + Math.sin(angle) * 0.2 }
      token.scale = 0.72
    })
  }

  // Vẽ từ trên xuống dưới để quân phía trước che quân phía sau; quân chọn được luôn nằm trên cùng.
  return placed.sort((a, b) => Number(a.movable) - Number(b.movable) || a.point.y - b.point.y)
}

interface BoardTokensProps {
  state: Pick<GameState, "players" | "tokens">
  movingToken: MovingToken | null
  /** Màu đang được chọn quân và các quân của màu đó có thể đi. Rỗng khi máy này không được chọn. */
  selectable: { color: PlayerColor; tokens: number[] } | null
  onChoose: (tokenIndex: number) => void
}

export function BoardTokens({ state, movingToken, selectable, onChoose }: BoardTokensProps) {
  const { t } = useI18n()
  const isMovable = (color: PlayerColor, tokenIndex: number) =>
    selectable?.color === color && selectable.tokens.includes(tokenIndex)

  return (
    <g>
      {layoutTokens(state, movingToken, isMovable).map((token) => (
        <g
          key={`${token.color}-${token.tokenIndex}`}
          role={token.movable ? "button" : undefined}
          tabIndex={token.movable ? 0 : undefined}
          aria-label={
            token.movable
              ? t("ludo.tokenLabel", { player: t(`ludo.color.${token.color}`), index: token.tokenIndex + 1 })
              : undefined
          }
          className={cn("outline-none transition-transform duration-150 ease-out", token.movable && "cursor-pointer")}
          style={{ transform: `translate(${token.point.x}px, ${token.point.y}px) scale(${token.scale})` }}
          onClick={token.movable ? () => onChoose(token.tokenIndex) : undefined}
          onKeyDown={
            token.movable
              ? (event) => {
                  if (event.key === "Enter" || event.key === " ") onChoose(token.tokenIndex)
                }
              : undefined
          }
        >
          {token.movable && <ellipse cy={0.36} rx={0.46} ry={0.2} className="ludo-halo" />}
          <g className={cn(token.movable && "ludo-hop")}>
            <HorsePiece color={token.color} />
          </g>
          {token.movable && <rect x={-0.5} y={-0.5} width={1} height={1} fill="transparent" />}
        </g>
      ))}
    </g>
  )
}
