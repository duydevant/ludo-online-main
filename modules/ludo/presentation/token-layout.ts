import { tokenPoint, type Point } from "../game/board-geometry"
import { FINISH_PROGRESS, BASE_PROGRESS, type PlayerColor } from "../game/constants"
import type { GameState } from "../game/rules"
import type { MovingToken } from "./game-animator"

export interface PlacedToken {
  color: PlayerColor
  tokenIndex: number
  /** progress đang hiển thị (quân đang đi thì là bước hiện tại của hiệu ứng). */
  progress: number
  /** Toạ độ trên bàn theo đơn vị ô (lưới 15x15), dùng chung cho 2D và 3D. */
  point: Point
  scale: number
}

/** Vị trí từng quân; quân đứng chung một điểm (chuồng, đích) được thu nhỏ và xếp lệch để vẫn thấy đủ. */
export function placeTokens(
  state: Pick<GameState, "players" | "tokens">,
  movingToken: MovingToken | null
): PlacedToken[] {
  const placed = state.players.flatMap(({ color }) =>
    state.tokens[color].map((storedProgress, tokenIndex) => {
      const isMoving = movingToken?.color === color && movingToken.tokenIndex === tokenIndex
      const progress = isMoving ? movingToken.progress : storedProgress
      return { color, tokenIndex, progress, point: tokenPoint(color, tokenIndex, progress), scale: 1 }
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
  return placed
}

/** Hướng đi tiếp theo của quân (vector theo đơn vị ô); quân trong chuồng / ở đích quay vào giữa bàn. */
export function tokenDirection(token: PlacedToken): Point {
  const { color, tokenIndex, progress, point } = token
  if (progress === BASE_PROGRESS || progress === FINISH_PROGRESS) {
    return { x: 7.5 - point.x, y: 7.5 - point.y }
  }
  const next = tokenPoint(color, tokenIndex, progress + 1)
  const here = tokenPoint(color, tokenIndex, progress)
  return { x: next.x - here.x, y: next.y - here.y }
}
