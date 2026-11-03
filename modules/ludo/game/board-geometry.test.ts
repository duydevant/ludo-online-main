import { describe, expect, it } from "vitest"

import { PLAYER_COLORS, START_INDEX, TURN_ORDER } from "./constants"
import { BASE_ORIGIN, HOME_COLUMN_CELLS, MAIN_TRACK_CELLS, tokenCell } from "./board-geometry"
import { createGame } from "./rules"

/** Kề nhau theo 8 hướng: vòng ngoài có 4 bước chéo ở các góc giữa chuồng. */
function isAdjacent([r1, c1]: readonly number[], [r2, c2]: readonly number[]): boolean {
  return Math.max(Math.abs(r1 - r2), Math.abs(c1 - c2)) === 1
}

describe("board geometry", () => {
  it("has 52 unique cells forming a connected loop", () => {
    expect(MAIN_TRACK_CELLS).toHaveLength(52)
    expect(new Set(MAIN_TRACK_CELLS.map((cell) => cell.join(","))).size).toBe(52)
    MAIN_TRACK_CELLS.forEach((cell, index) => {
      expect(isAdjacent(cell, MAIN_TRACK_CELLS[(index + 1) % 52])).toBe(true)
    })
  })

  it("connects each color's last track cell to its home column", () => {
    for (const color of PLAYER_COLORS) {
      const entry = MAIN_TRACK_CELLS[(START_INDEX[color] + 50) % 52]
      expect(isAdjacent(entry, HOME_COLUMN_CELLS[color][0])).toBe(true)
      expect(tokenCell(color, 51)).toEqual(HOME_COLUMN_CELLS[color][0])
    }
  })

  it("runs counterclockwise on screen (Vietnamese rules)", () => {
    // Shoelace trên toạ độ màn hình (x = cột, y = hàng, y hướng xuống): âm = ngược chiều kim đồng hồ.
    const area = MAIN_TRACK_CELLS.reduce((sum, [r1, c1], index) => {
      const [r2, c2] = MAIN_TRACK_CELLS[(index + 1) % MAIN_TRACK_CELLS.length]
      return sum + c1 * r2 - c2 * r1
    }, 0)
    expect(area).toBeLessThan(0)
  })

  it("puts each color's start cell right next to its own base", () => {
    for (const color of PLAYER_COLORS) {
      const [baseRow, baseCol] = BASE_ORIGIN[color]
      const [row, col] = MAIN_TRACK_CELLS[START_INDEX[color]]
      const rowGap = Math.max(baseRow - row, row - (baseRow + 5), 0)
      const colGap = Math.max(baseCol - col, col - (baseCol + 5), 0)
      expect(Math.max(rowGap, colGap)).toBe(1)
    }
  })

  it("takes turns counterclockwise whatever order seats are passed in", () => {
    const state = createGame(PLAYER_COLORS.map((color) => ({ color, kind: "human" as const })))
    expect(state.players.map((player) => player.color)).toEqual([...TURN_ORDER])
  })
})
