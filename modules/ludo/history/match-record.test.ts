import { describe, expect, it } from "vitest"

import { createGame, type GameState } from "../game/rules"
import { computeStats, offlineResult, type MatchRecord } from "./match-record"

function record(won: boolean | null, index: number): MatchRecord {
  return { id: String(index), mode: "offline", finishedAt: index, players: [], rankings: [], myColor: null, won }
}

function finished(state: GameState, rankings: GameState["rankings"]): GameState {
  return { ...state, phase: "finished", rankings }
}

describe("computeStats", () => {
  it("returns zeros and no win rate for an empty history", () => {
    expect(computeStats([])).toEqual({ played: 0, wins: 0, losses: 0, winRate: null, currentStreak: 0, bestStreak: 0 })
  })

  it("counts streaks newest first and skips undecided games", () => {
    // mới nhất trước: thắng, (không tính), thắng, thua, thắng, thắng, thắng
    const results = [true, null, true, false, true, true, true]
    const stats = computeStats(results.map(record))
    expect(stats).toEqual({ played: 7, wins: 5, losses: 1, winRate: 5 / 6, currentStreak: 2, bestStreak: 3 })
  })
})

describe("offlineResult", () => {
  const vsBot = createGame([
    { color: "red", kind: "human" },
    { color: "green", kind: "bot" },
  ])

  it("is a win when a human finishes first against bots", () => {
    expect(offlineResult(finished(vsBot, ["red", "green"]))).toBe(true)
    expect(offlineResult(finished(vsBot, ["green", "red"]))).toBe(false)
  })

  it("is undecided when everyone is human", () => {
    const hotSeat = createGame([
      { color: "red", kind: "human" },
      { color: "blue", kind: "human" },
    ])
    expect(offlineResult(finished(hotSeat, ["blue", "red"]))).toBeNull()
  })
})
