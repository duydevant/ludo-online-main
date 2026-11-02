"use client"

import { cn } from "cn"

import { useI18n } from "@/lib/i18n"

import type { PlayerColor } from "../game/constants"
import type { GameState } from "../game/rules"
import type { MovingToken } from "../presentation/game-animator"
import { placeTokens, type PlacedToken } from "../presentation/token-layout"
import { HorsePiece } from "./horse-piece"

interface LaidOutToken extends PlacedToken {
  movable: boolean
}

function layoutTokens(
  state: Pick<GameState, "players" | "tokens">,
  movingToken: MovingToken | null,
  isMovable: (color: PlayerColor, tokenIndex: number) => boolean
): LaidOutToken[] {
  const placed = placeTokens(state, movingToken).map((token) => ({
    ...token,
    movable: isMovable(token.color, token.tokenIndex),
  }))

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
          className={cn("outline-none transition-transform duration-200 ease-out", token.movable && "cursor-pointer")}
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
