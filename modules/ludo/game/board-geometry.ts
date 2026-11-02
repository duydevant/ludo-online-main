import {
  BASE_PROGRESS,
  FINISH_PROGRESS,
  LAST_MAIN_TRACK_PROGRESS,
  type PlayerColor,
} from "./constants"
import { trackIndexOf } from "./rules"

/** Bàn cờ lưới 15x15. Toạ độ ô là [row, col]; toạ độ điểm vẽ là {x, y} theo đơn vị ô. */
export const BOARD_SIZE = 15

export type Cell = readonly [row: number, col: number]
export interface Point {
  x: number
  y: number
}

function line(from: Cell, to: Cell): Cell[] {
  const [r1, c1] = from
  const [r2, c2] = to
  const steps = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1))
  const dr = Math.sign(r2 - r1)
  const dc = Math.sign(c2 - c1)
  return Array.from({ length: steps + 1 }, (_, i) => [r1 + dr * i, c1 + dc * i] as const)
}

/** 52 ô vòng ngoài theo chiều kim đồng hồ, bắt đầu từ ô xuất phát của đỏ. */
export const MAIN_TRACK_CELLS: readonly Cell[] = [
  ...line([6, 1], [6, 5]),
  ...line([5, 6], [0, 6]),
  [0, 7],
  ...line([0, 8], [5, 8]),
  ...line([6, 9], [6, 14]),
  [7, 14],
  ...line([8, 14], [8, 9]),
  ...line([9, 8], [14, 8]),
  [14, 7],
  ...line([14, 6], [9, 6]),
  ...line([8, 5], [8, 0]),
  [7, 0],
  [6, 0],
]

/** 5 ô đường về của mỗi màu, theo thứ tự đi vào. */
export const HOME_COLUMN_CELLS: Record<PlayerColor, readonly Cell[]> = {
  red: line([7, 1], [7, 5]),
  green: line([1, 7], [5, 7]),
  yellow: line([7, 13], [7, 9]),
  blue: line([13, 7], [9, 7]),
}

/** Góc trên-trái của chuồng 6x6 mỗi màu. */
export const BASE_ORIGIN: Record<PlayerColor, Cell> = {
  red: [0, 0],
  green: [0, 9],
  yellow: [9, 9],
  blue: [9, 0],
}

/** Điểm giữa tam giác đích của mỗi màu trong ô trung tâm 3x3. */
const FINISH_POINT: Record<PlayerColor, Point> = {
  red: { x: 6.55, y: 7.5 },
  green: { x: 7.5, y: 6.55 },
  yellow: { x: 8.45, y: 7.5 },
  blue: { x: 7.5, y: 8.45 },
}

export function cellCenter([row, col]: Cell): Point {
  return { x: col + 0.5, y: row + 0.5 }
}

export function baseSlotPoint(color: PlayerColor, tokenIndex: number): Point {
  const [row, col] = BASE_ORIGIN[color]
  return { x: col + 2 + (tokenIndex % 2) * 2, y: row + 2 + Math.floor(tokenIndex / 2) * 2 }
}

/** Ô (row, col) mà quân đang đứng, null nếu ở chuồng hoặc đã về đích. */
export function tokenCell(color: PlayerColor, progress: number): Cell | null {
  if (progress === BASE_PROGRESS || progress === FINISH_PROGRESS) return null
  const trackIndex = trackIndexOf(color, progress)
  if (trackIndex !== null) return MAIN_TRACK_CELLS[trackIndex]
  return HOME_COLUMN_CELLS[color][progress - LAST_MAIN_TRACK_PROGRESS - 1]
}

export function tokenPoint(color: PlayerColor, tokenIndex: number, progress: number): Point {
  if (progress === BASE_PROGRESS) return baseSlotPoint(color, tokenIndex)
  if (progress === FINISH_PROGRESS) return FINISH_POINT[color]
  const cell = tokenCell(color, progress)
  if (!cell) throw new Error(`No cell for ${color} at progress ${progress}`)
  return cellCenter(cell)
}
