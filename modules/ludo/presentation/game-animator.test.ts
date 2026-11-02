import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { applyMove, applyRoll, createGame } from "../game/rules"
import type { GameSnapshot } from "../game/snapshot"
import { createGameAnimator } from "./game-animator"

const start = createGame([
  { color: "red", kind: "human" },
  { color: "yellow", kind: "bot" },
])
const rolled = applyRoll(start, 6)
const moved = applyMove(rolled, 0)

const snap = (seq: number, event: GameSnapshot["event"], state = start): GameSnapshot => ({ seq, event, state })

describe("game animator", () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it("shows the first snapshot immediately", () => {
    const animator = createGameAnimator()
    animator.getState().push(snap(1, "start"))
    expect(animator.getState().view?.state).toBe(start)
    expect(animator.getState().busy).toBe(false)
  })

  it("animates a roll then reveals the dice value", async () => {
    const animator = createGameAnimator()
    animator.getState().push(snap(1, "start"))
    animator.getState().push(snap(2, "roll", rolled))

    expect(animator.getState().busy).toBe(true)
    expect(animator.getState().view?.rollingColor).toBe("red")
    expect(animator.getState().view?.state).toBe(start)

    await vi.runAllTimersAsync()
    expect(animator.getState().busy).toBe(false)
    expect(animator.getState().view?.state).toBe(rolled)
    expect(animator.getState().view?.diceFaces.red).toBe(6)
  })

  it("queues snapshots that arrive during an animation", async () => {
    const animator = createGameAnimator()
    animator.getState().push(snap(1, "start"))
    animator.getState().push(snap(2, "roll", rolled))
    animator.getState().push(snap(3, "move", moved))

    await vi.advanceTimersByTimeAsync(700)
    expect(animator.getState().view?.movingToken).toEqual({ color: "red", tokenIndex: 0, progress: 0 })

    await vi.runAllTimersAsync()
    expect(animator.getState().view?.state).toBe(moved)
    expect(animator.getState().view?.movingToken).toBeNull()
  })

  it("ignores duplicates and jumps straight to the state after a gap", () => {
    const animator = createGameAnimator()
    animator.getState().push(snap(1, "start"))
    animator.getState().push(snap(1, "start", rolled))
    expect(animator.getState().view?.state).toBe(start)

    animator.getState().push(snap(5, "move", moved))
    expect(animator.getState().busy).toBe(false)
    expect(animator.getState().view?.state).toBe(moved)
  })

  it("resets on a new game even if seq restarts", () => {
    const animator = createGameAnimator()
    animator.getState().push(snap(40, "move", moved))
    animator.getState().push(snap(1, "start"))
    expect(animator.getState().view?.state).toBe(start)
  })
})
