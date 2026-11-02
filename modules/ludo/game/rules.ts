import {
  BASE_PROGRESS,
  FINISH_PROGRESS,
  LAST_MAIN_TRACK_PROGRESS,
  MAIN_TRACK_LENGTH,
  MAX_CONSECUTIVE_SIXES,
  ROLL_TO_LEAVE_BASE,
  SAFE_TRACK_INDICES,
  START_INDEX,
  TOKENS_PER_PLAYER,
  type PlayerColor,
} from "./constants"

export type PlayerKind = "human" | "bot"

export interface Player {
  color: PlayerColor
  kind: PlayerKind
}

export type GamePhase = "rolling" | "moving" | "finished"

export interface LastMove {
  color: PlayerColor
  tokenIndex: number
  from: number
  to: number
  /** progress = vị trí của quân bị đá trước khi về chuồng. */
  captured: { color: PlayerColor; tokenIndex: number; progress: number }[]
  reachedFinish: boolean
}

export type TurnEndReason = "no-moves" | "three-sixes"

export interface LastRoll {
  color: PlayerColor
  value: number
}

export interface GameState {
  players: Player[]
  /** progress của từng quân theo màu, xem constants.ts. */
  tokens: Record<PlayerColor, number[]>
  currentPlayerIndex: number
  dice: number | null
  phase: GamePhase
  consecutiveSixes: number
  /** Thứ tự về đích, phần tử đầu là người thắng. */
  rankings: PlayerColor[]
  lastRoll: LastRoll | null
  lastMove: LastMove | null
  lastTurnEnd: TurnEndReason | null
}

export function createGame(players: Player[]): GameState {
  if (players.length < 2) throw new Error("Ludo needs at least 2 players")

  const tokens = {} as Record<PlayerColor, number[]>
  for (const player of players) tokens[player.color] = Array(TOKENS_PER_PLAYER).fill(BASE_PROGRESS)

  return {
    players,
    tokens,
    currentPlayerIndex: 0,
    dice: null,
    phase: "rolling",
    consecutiveSixes: 0,
    rankings: [],
    lastRoll: null,
    lastMove: null,
    lastTurnEnd: null,
  }
}

export function currentPlayer(state: GameState): Player {
  return state.players[state.currentPlayerIndex]
}

/** Chỉ số ô trên vòng ngoài, hoặc null nếu quân đang ở chuồng / đường về / đích. */
export function trackIndexOf(color: PlayerColor, progress: number): number | null {
  if (progress < 0 || progress > LAST_MAIN_TRACK_PROGRESS) return null
  return (START_INDEX[color] + progress) % MAIN_TRACK_LENGTH
}

export function targetProgress(progress: number, dice: number): number | null {
  if (progress === BASE_PROGRESS) return dice === ROLL_TO_LEAVE_BASE ? 0 : null
  const target = progress + dice
  return target > FINISH_PROGRESS ? null : target
}

export function movableTokens(state: GameState, dice: number): number[] {
  const color = currentPlayer(state).color
  return state.tokens[color].flatMap((progress, index) =>
    targetProgress(progress, dice) === null ? [] : [index]
  )
}

function hasFinishedAllTokens(state: GameState, color: PlayerColor): boolean {
  return state.tokens[color].every((progress) => progress === FINISH_PROGRESS)
}

function nextActivePlayerIndex(state: GameState): number {
  for (let step = 1; step <= state.players.length; step++) {
    const index = (state.currentPlayerIndex + step) % state.players.length
    if (!state.rankings.includes(state.players[index].color)) return index
  }
  return state.currentPlayerIndex
}

function passTurn(state: GameState, reason: TurnEndReason | null): GameState {
  return {
    ...state,
    currentPlayerIndex: nextActivePlayerIndex(state),
    dice: null,
    phase: "rolling",
    consecutiveSixes: 0,
    lastTurnEnd: reason,
  }
}

export function applyRoll(state: GameState, dice: number): GameState {
  if (state.phase !== "rolling") throw new Error(`Cannot roll during phase "${state.phase}"`)
  if (!Number.isInteger(dice) || dice < 1 || dice > 6) throw new Error(`Invalid dice value ${dice}`)

  const consecutiveSixes = dice === 6 ? state.consecutiveSixes + 1 : 0
  const rolled: GameState = {
    ...state,
    dice,
    consecutiveSixes,
    lastRoll: { color: currentPlayer(state).color, value: dice },
    lastMove: null,
    lastTurnEnd: null,
  }

  if (consecutiveSixes >= MAX_CONSECUTIVE_SIXES) return passTurn(rolled, "three-sixes")
  if (movableTokens(rolled, dice).length === 0) return passTurn(rolled, "no-moves")
  return { ...rolled, phase: "moving" }
}

export function applyMove(state: GameState, tokenIndex: number): GameState {
  if (state.phase !== "moving" || state.dice === null) throw new Error("No dice to move with")
  const dice = state.dice
  const color = currentPlayer(state).color
  const from = state.tokens[color][tokenIndex]
  const to = from === undefined ? null : targetProgress(from, dice)
  if (from === undefined || to === null) throw new Error(`Token ${tokenIndex} cannot move ${dice}`)

  const tokens = {
    ...state.tokens,
    [color]: state.tokens[color].map((progress, index) => (index === tokenIndex ? to : progress)),
  }
  const captured: LastMove["captured"] = []
  const landingIndex = trackIndexOf(color, to)

  if (landingIndex !== null && !SAFE_TRACK_INDICES.has(landingIndex)) {
    for (const opponent of state.players) {
      if (opponent.color === color) continue
      tokens[opponent.color] = tokens[opponent.color].map((progress, index) => {
        if (trackIndexOf(opponent.color, progress) !== landingIndex) return progress
        captured.push({ color: opponent.color, tokenIndex: index, progress })
        return BASE_PROGRESS
      })
    }
  }

  const reachedFinish = to === FINISH_PROGRESS
  const moved: GameState = {
    ...state,
    tokens,
    lastMove: { color, tokenIndex, from, to, captured, reachedFinish },
  }

  if (hasFinishedAllTokens(moved, color)) {
    const rankings = [...moved.rankings, color]
    const remaining = moved.players.filter((player) => !rankings.includes(player.color))
    if (remaining.length <= 1) {
      return {
        ...moved,
        rankings: [...rankings, ...remaining.map((player) => player.color)],
        dice: null,
        phase: "finished",
      }
    }
    return passTurn({ ...moved, rankings }, null)
  }

  const earnsBonusRoll = dice === 6 || captured.length > 0 || reachedFinish
  if (earnsBonusRoll) return { ...moved, dice: null, phase: "rolling", lastTurnEnd: null }
  return passTurn(moved, null)
}

export function rollDice(random: () => number = Math.random): number {
  return Math.floor(random() * 6) + 1
}
