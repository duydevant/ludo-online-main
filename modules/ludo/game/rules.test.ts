import { describe, expect, it } from "vitest"

import { BASE_PROGRESS, FINISH_PROGRESS } from "./constants"
import { applyMove, applyRoll, createGame, movableTokens, planMove, trackIndexOf, type GameState } from "./rules"

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

  it("cannot stop on a safe square held by an opponent", () => {
    // Ô 8 là ô ngôi sao. Vàng progress 34 = ô 8.
    const state = twoPlayerGame({
      tokens: { red: [5, 20, -1, -1], yellow: [34, -1, -1, -1] } as GameState["tokens"],
    } as Partial<GameState>)
    expect(trackIndexOf("yellow", 34)).toBe(8)
    expect(movableTokens(state, 3)).toEqual([1])
  })

  describe("blocking and one token per square", () => {
    it("cannot jump over an opponent, but can land on it to capture", () => {
      // Vàng ở ô 5 (progress 31), đỏ ở ô 2.
      const state = twoPlayerGame({
        tokens: { red: [2, -1, -1, -1], yellow: [31, -1, -1, -1] } as GameState["tokens"],
      } as Partial<GameState>)
      expect(planMove(state, "red", 0, 2)?.captures).toEqual([])
      expect(planMove(state, "red", 0, 3)?.captures).toEqual([{ color: "yellow", tokenIndex: 0, progress: 31 }])
      expect(planMove(state, "red", 0, 4)).toBeNull()
      expect(planMove(state, "red", 0, 6)).toBeNull()
    })

    it("cannot jump over or land on its own token", () => {
      const state = twoPlayerGame({
        tokens: { red: [2, 5, -1, -1], yellow: [-1, -1, -1, -1] } as GameState["tokens"],
      } as Partial<GameState>)
      // Quân 0 (ô 2) bị quân 1 (ô 5) cản: đi 3 thì trùng ô, đi 4 trở lên thì vượt qua.
      expect(planMove(state, "red", 0, 2)).not.toBeNull()
      expect(planMove(state, "red", 0, 3)).toBeNull()
      expect(planMove(state, "red", 0, 4)).toBeNull()
      expect(planMove(state, "red", 1, 4)).not.toBeNull()
    })

    it("loses the turn when every token is blocked", () => {
      // Quân duy nhất ngoài sân đứng sát sau quân vàng ở ô ngôi sao: không đi được 1, không vượt được.
      const state = twoPlayerGame({
        tokens: { red: [7, -1, -1, -1], yellow: [34, -1, -1, -1] } as GameState["tokens"],
      } as Partial<GameState>)
      const rolled = applyRoll(state, 4)
      expect(rolled.currentPlayerIndex).toBe(1)
      expect(rolled.lastTurnEnd).toBe("no-moves")
    })

    it("cannot bring a token out onto its own occupied start", () => {
      const state = twoPlayerGame({
        tokens: { red: [0, -1, -1, -1], yellow: [-1, -1, -1, -1] } as GameState["tokens"],
      } as Partial<GameState>)
      expect(movableTokens(state, 6)).toEqual([0])
    })

    it("captures an opponent sitting on its start when bringing a token out", () => {
      // Ô xuất phát của đỏ là ô 0 = vàng progress 26.
      const state = twoPlayerGame({
        tokens: { red: [-1, -1, -1, -1], yellow: [26, -1, -1, -1] } as GameState["tokens"],
      } as Partial<GameState>)
      const moved = applyMove(applyRoll(state, 6), 0)
      expect(moved.tokens.red[0]).toBe(0)
      expect(moved.tokens.yellow[0]).toBe(BASE_PROGRESS)
      expect(moved.lastMove?.captured).toEqual([{ color: "yellow", tokenIndex: 0, progress: 26 }])
    })

    it("blocks inside the home column but lets several tokens finish", () => {
      const state = twoPlayerGame({
        tokens: { red: [52, 54, FINISH_PROGRESS, -1], yellow: [-1, -1, -1, -1] } as GameState["tokens"],
      } as Partial<GameState>)
      // Quân ở 52 không vượt được quân ở 54; quân ở 54 về đích bằng đúng 2 dù đích đã có quân.
      expect(planMove(state, "red", 0, 4)).toBeNull()
      expect(planMove(state, "red", 0, 1)).not.toBeNull()
      expect(planMove(state, "red", 1, 2)).toEqual({ to: FINISH_PROGRESS, captures: [] })
    })
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
