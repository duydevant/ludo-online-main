import type { PlayerColor } from "../game/constants"
import type { GameState, PlayerKind } from "../game/rules"

export type MatchMode = "offline" | "online"

export interface MatchPlayer {
  color: PlayerColor
  kind: PlayerKind
  /** Tên người chơi online; offline để trống, hiển thị bằng tên màu. */
  name: string
}

/** Kết quả một ván đã xong, lưu trên trình duyệt này. */
export interface MatchRecord {
  id: string
  mode: MatchMode
  finishedAt: number
  players: MatchPlayer[]
  /** Thứ hạng về đích, màu đầu tiên là người thắng. */
  rankings: PlayerColor[]
  /** Màu của người dùng máy này (online). Offline null vì có thể nhiều người chung máy. */
  myColor: PlayerColor | null
  /** null = ván không tính thắng/thua (offline toàn người, không có bot để so). */
  won: boolean | null
}

export interface MatchStats {
  played: number
  wins: number
  losses: number
  /** 0..1, null khi chưa có ván nào tính thắng/thua. */
  winRate: number | null
  currentStreak: number
  bestStreak: number
}

/** Offline: tính thắng khi một người (không phải bot) về nhất; ván chỉ có người thì không tính. */
export function offlineResult(state: GameState): boolean | null {
  const hasBot = state.players.some((player) => player.kind === "bot")
  const hasHuman = state.players.some((player) => player.kind === "human")
  if (!hasBot || !hasHuman) return null
  const winner = state.players.find((player) => player.color === state.rankings[0])
  return winner?.kind === "human"
}

/** `records` xếp mới nhất trước. Ván `won === null` không làm đứt hay cộng chuỗi thắng. */
export function computeStats(records: readonly MatchRecord[]): MatchStats {
  const decided = records.filter((record) => record.won !== null)
  const wins = decided.filter((record) => record.won).length

  let currentStreak = 0
  for (const record of decided) {
    if (!record.won) break
    currentStreak += 1
  }

  let bestStreak = 0
  let run = 0
  for (const record of decided) {
    run = record.won ? run + 1 : 0
    bestStreak = Math.max(bestStreak, run)
  }

  return {
    played: records.length,
    wins,
    losses: decided.length - wins,
    winRate: decided.length > 0 ? wins / decided.length : null,
    currentStreak,
    bestStreak,
  }
}
