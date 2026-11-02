import { describe, expect, it } from "vitest"

import { PLAYER_COLORS, START_INDEX } from "./constants"
import { HOME_COLUMN_CELLS, MAIN_TRACK_CELLS, tokenCell } from "./board-geometry"

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
})
