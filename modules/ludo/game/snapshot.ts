import type { GameState } from "./rules"

export type GameEvent = "start" | "roll" | "move"

/** Một bước của ván: state sau khi áp dụng event. seq tăng dần để client biết bước mới. */
export interface GameSnapshot {
  seq: number
  event: GameEvent
  state: GameState
}

/** Firebase Realtime Database làm mất mảng rỗng / null, nên state được lưu dạng chuỗi JSON. */
export interface SerializedSnapshot {
  seq: number
  event: GameEvent
  state: string
}

export function serializeSnapshot(snapshot: GameSnapshot): SerializedSnapshot {
  return { ...snapshot, state: JSON.stringify(snapshot.state) }
}

export function deserializeSnapshot(serialized: SerializedSnapshot): GameSnapshot {
  return { ...serialized, state: JSON.parse(serialized.state) as GameState }
}
