import { describe, expect, it } from "vitest"

import { PLAYER_COLORS } from "./constants"
import { chooseBotMove } from "./bot"
import { applyMove, applyRoll, createGame, rollDice, type GameState } from "./rules"

/** PRNG cố định để ván mô phỏng lặp lại được. */
function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

describe("ludo bot", () => {
  it("prefers capturing over a plain advance", () => {
    const base = createGame([
      { color: "red", kind: "bot" },
      { color: "yellow", kind: "human" },
    ])
    // Quân 0 đi 3 sẽ đá vàng ở ô 5 (vàng progress 31); quân 1 chỉ tiến bình thường.
    const state: GameState = {
      ...base,
      tokens: { ...base.tokens, red: [2, 20, -1, -1], yellow: [31, -1, -1, -1] },
      dice: 3,
      phase: "moving",
    }
    expect(chooseBotMove(state)).toBe(0)
  })

  // Luật cản có thể làm quân kẹt vài lượt; chạy nhiều ván để chắc chắn không ván nào kẹt mãi.
  it.each([2, 3, 4])("finishes many seeded %i-bot games", (playerCount) => {
    for (let seed = 1; seed <= 40; seed++) {
      const random = seededRandom(seed * 7919 + playerCount)
      let state = createGame(PLAYER_COLORS.slice(0, playerCount).map((color) => ({ color, kind: "bot" as const })))

      for (let turn = 0; turn < 10000 && state.phase !== "finished"; turn++) {
        state = applyRoll(state, rollDice(random))
        if (state.phase === "moving") state = applyMove(state, chooseBotMove(state)!)
      }

      expect(state.phase, `seed ${seed}`).toBe("finished")
      expect([...state.rankings].sort()).toEqual([...PLAYER_COLORS.slice(0, playerCount)].sort())
    }
  })
})
