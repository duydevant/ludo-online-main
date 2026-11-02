"use client"

import { useEffect, useEffectEvent } from "react"

import { chooseBotMove } from "../game/bot"
import type { PlayerColor } from "../game/constants"
import { currentPlayer, movableTokens, type GameState } from "../game/rules"

const BOT_THINK_MS = 650
const AUTO_MOVE_MS = 350

/**
 * Ai điều khiển lượt của một màu trên máy này:
 * - "local": người ngồi trước máy này tự bấm (tự đi nếu chỉ có một nước).
 * - "local-bot": máy này đánh thay bằng bot.
 * - "remote": máy khác điều khiển, máy này chỉ xem.
 */
export type SeatControl = "local" | "local-bot" | "remote"

interface TurnDriverOptions {
  state: GameState | null
  busy: boolean
  controlOf: (color: PlayerColor) => SeatControl
  roll: () => void
  moveToken: (tokenIndex: number) => void
}

export function useTurnDriver({ state, busy, controlOf, roll, moveToken }: TurnDriverOptions) {
  const color = state && state.phase !== "finished" ? currentPlayer(state).color : null
  const control = color ? controlOf(color) : "remote"

  const act = useEffectEvent((action: "roll" | "bot-move" | "auto-move") => {
    if (!state) return
    if (action === "roll") return roll()

    const choice =
      action === "bot-move" ? chooseBotMove(state) : state.dice !== null ? movableTokens(state, state.dice)[0] : null
    if (choice !== null && choice !== undefined) moveToken(choice)
  })

  useEffect(() => {
    if (!state || busy || control === "remote" || state.phase === "finished") return

    let action: "roll" | "bot-move" | "auto-move" | null = null
    if (control === "local-bot") action = state.phase === "rolling" ? "roll" : "bot-move"
    else if (state.phase === "moving" && state.dice !== null && movableTokens(state, state.dice).length === 1)
      action = "auto-move"

    if (!action) return
    const timer = window.setTimeout(() => act(action), action === "auto-move" ? AUTO_MOVE_MS : BOT_THINK_MS)
    return () => window.clearTimeout(timer)
  }, [state, busy, control])
}
