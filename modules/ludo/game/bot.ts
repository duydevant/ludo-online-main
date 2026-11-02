import {
  BASE_PROGRESS,
  FINISH_PROGRESS,
  LAST_MAIN_TRACK_PROGRESS,
  MAIN_TRACK_LENGTH,
  SAFE_TRACK_INDICES,
  type PlayerColor,
} from "./constants"
import { currentPlayer, movableTokens, planMove, trackIndexOf, type GameState } from "./rules"

/** Có quân đối thủ nào đứng 1..6 ô phía sau ô này và còn đi được tới không. */
function isThreatened(state: GameState, color: PlayerColor, trackIndex: number): boolean {
  if (SAFE_TRACK_INDICES.has(trackIndex)) return false

  return state.players.some(
    (opponent) =>
      opponent.color !== color &&
      state.tokens[opponent.color].some((progress) => {
        const opponentIndex = trackIndexOf(opponent.color, progress)
        if (opponentIndex === null) return false
        const distance = (trackIndex - opponentIndex + MAIN_TRACK_LENGTH) % MAIN_TRACK_LENGTH
        return distance >= 1 && distance <= 6 && progress + distance <= LAST_MAIN_TRACK_PROGRESS
      })
  )
}

function scoreMove(state: GameState, tokenIndex: number, dice: number): number {
  const color = currentPlayer(state).color
  const from = state.tokens[color][tokenIndex]
  const plan = planMove(state, color, tokenIndex, dice)
  if (plan === null) return Number.NEGATIVE_INFINITY
  const { to, captures } = plan

  if (to === FINISH_PROGRESS) return 1000

  let score = to - Math.max(from, 0)
  const fromIndex = trackIndexOf(color, from)
  const toIndex = trackIndexOf(color, to)

  if (from === BASE_PROGRESS) score += 60
  if (toIndex === null && from <= LAST_MAIN_TRACK_PROGRESS) score += 40

  score += captures.reduce((sum, victim) => sum + 80 + victim.progress, 0)
  if (toIndex !== null) {
    if (SAFE_TRACK_INDICES.has(toIndex)) score += 20
    if (isThreatened(state, color, toIndex)) score -= 50 + to
  }

  if (fromIndex !== null && isThreatened(state, color, fromIndex)) score += 30 + from

  return score
}

/** Chọn quân để đi theo heuristic: về đích > đá quân > ra chuồng > né nguy hiểm > tiến xa. */
export function chooseBotMove(state: GameState): number | null {
  if (state.dice === null) return null
  const dice = state.dice
  const options = movableTokens(state, dice)
  if (options.length === 0) return null

  return options.reduce((best, tokenIndex) =>
    scoreMove(state, tokenIndex, dice) > scoreMove(state, best, dice) ? tokenIndex : best
  )
}
