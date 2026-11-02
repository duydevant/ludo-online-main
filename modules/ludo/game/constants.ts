export const PLAYER_COLORS = ["red", "green", "yellow", "blue"] as const

export type PlayerColor = (typeof PLAYER_COLORS)[number]

export const TOKENS_PER_PLAYER = 4

/** Số ô vòng ngoài dùng chung cho cả 4 màu. */
export const MAIN_TRACK_LENGTH = 52

/** progress của quân: -1 = trong chuồng, 0..50 = vòng ngoài, 51..55 = đường về, 56 = đã về đích. */
export const BASE_PROGRESS = -1
export const LAST_MAIN_TRACK_PROGRESS = 50
export const FINISH_PROGRESS = 56

export const ROLL_TO_LEAVE_BASE = 6
export const MAX_CONSECUTIVE_SIXES = 3

/** Chỉ số ô xuất phát của mỗi màu trên vòng ngoài. */
export const START_INDEX: Record<PlayerColor, number> = {
  red: 0,
  green: 13,
  yellow: 26,
  blue: 39,
}

/** Ô an toàn: ô xuất phát và ô ngôi sao (cách ô xuất phát 8 bước). */
export const SAFE_TRACK_INDICES: ReadonlySet<number> = new Set(
  Object.values(START_INDEX).flatMap((start) => [start, (start + 8) % MAIN_TRACK_LENGTH])
)

export const COLOR_HEX: Record<PlayerColor, { base: string; light: string; dark: string }> = {
  red: { base: "#ef4444", light: "#fecaca", dark: "#b91c1c" },
  green: { base: "#22c55e", light: "#bbf7d0", dark: "#15803d" },
  yellow: { base: "#eab308", light: "#fef08a", dark: "#a16207" },
  blue: { base: "#3b82f6", light: "#bfdbfe", dark: "#1d4ed8" },
}
