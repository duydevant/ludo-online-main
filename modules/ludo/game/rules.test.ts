import { describe, expect, it } from "vitest"

import { BASE_PROGRESS, FINISH_PROGRESS } from "./constants"
import { applyMove, applyRoll, createGame, movableTokens, trackIndexOf, type GameState } from "./rules"

function twoPlayerGame(overrides: Partial<GameState> = {}): GameState {
  return {
    ...createGame([
      { color: "red", kind: "human" },
      { color: "yellow", kind: "bot" },
    ]),
    ...overrides,
  }
}

describe("ludo rules", () => {
  it("rejects games with fewer than 2 players", () => {
    expect(() => createGame([{ color: "red", kind: "human" }])).toThrow()
  })

  it("passes the turn when no token can leave base", () => {
    const state = applyRoll(twoPlayerGame(), 3)
    expect(state.currentPlayerIndex).toBe(1)
    expect(state.phase).toBe("rolling")
    expect(state.lastTurnEnd).toBe("no-moves")
  })

  it("lets a 6 bring a token out and grants a bonus roll", () => {
    const rolled = applyRoll(twoPlayerGame(), 6)
    expect(movableTokens(rolled, 6)).toEqual([0, 1, 2, 3])

    const moved = applyMove(rolled, 0)
    expect(moved.tokens.red[0]).toBe(0)
    expect(moved.currentPlayerIndex).toBe(0)
    expect(moved.phase).toBe("rolling")
  })

  it("forfeits the turn on three consecutive sixes", () => {
    const state = applyRoll(twoPlayerGame({ consecutiveSixes: 2 }), 6)
    expect(state.currentPlayerIndex).toBe(1)
    expect(state.lastTurnEnd).toBe("three-sixes")
  })

  it("captures an opponent on a normal square and grants a bonus roll", () => {
    // Đỏ progress 2 -> 5 (ô 5). Vàng xuất phát ô 26, ô 5 tương ứng progress 31.
    const state = twoPlayerGame({
      tokens: { red: [2, -1, -1, -1], yellow: [31, -1, -1, -1] } as GameState["tokens"],
    } as Partial<GameState>)
    expect(trackIndexOf("yellow", 31)).toBe(5)

    const moved = applyMove(applyRoll(state, 3), 0)
    expect(moved.tokens.yellow[0]).toBe(BASE_PROGRESS)
    expect(moved.lastMove?.captured).toEqual([{ color: "yellow", tokenIndex: 0, progress: 31 }])
    expect(moved.currentPlayerIndex).toBe(0)
  })

  it("does not capture on a safe square", () => {
    // Ô 8 là ô ngôi sao. Vàng progress 34 = ô 8.
    const state = twoPlayerGame({
      tokens: { red: [5, -1, -1, -1], yellow: [34, -1, -1, -1] } as GameState["tokens"],
    } as Partial<GameState>)
    const moved = applyMove(applyRoll(state, 3), 0)
    expect(moved.tokens.yellow[0]).toBe(34)
    expect(moved.currentPlayerIndex).toBe(1)
  })

  it("requires an exact roll to finish", () => {
    const state = twoPlayerGame({
      tokens: { red: [54, -1, -1, -1], yellow: [-1, -1, -1, -1] } as GameState["tokens"],
    } as Partial<GameState>)
    expect(movableTokens(state, 3)).toEqual([])
    expect(movableTokens(state, 2)).toEqual([0])
  })

  it("ends the game when only one player is left", () => {
    const state = twoPlayerGame({
      tokens: {
        red: [FINISH_PROGRESS, FINISH_PROGRESS, FINISH_PROGRESS, 55],
        yellow: [10, -1, -1, -1],
      } as GameState["tokens"],
    } as Partial<GameState>)
    const moved = applyMove(applyRoll(state, 1), 3)
    expect(moved.phase).toBe("finished")
    expect(moved.rankings).toEqual(["red", "yellow"])
  })
})
