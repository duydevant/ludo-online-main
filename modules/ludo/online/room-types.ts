import { PLAYER_COLORS, type PlayerColor } from "../game/constants"
import type { SerializedSnapshot } from "../game/snapshot"

export type SeatOccupant = { kind: "human"; uid: string; name: string } | { kind: "bot" }

export interface RoomMember {
  name: string
  joinedAt: number
}

export type RoomStatus = "lobby" | "playing"

/**
 * Dữ liệu tại rooms/{roomId} trong Realtime Database:
 * - members: người đang ở trong phòng (presence, tự xoá khi mất kết nối).
 * - seats: 4 ghế theo màu. Người không có ghế là người xem.
 * - kicked: uid bị chủ phòng kick, không vào lại được.
 * - game: snapshot ván đang chơi, null khi ở phòng chờ.
 */
export interface RoomData {
  hostId: string
  status: RoomStatus
  members: Record<string, RoomMember>
  seats: Partial<Record<PlayerColor, SeatOccupant>>
  kicked: Record<string, boolean>
  game: SerializedSnapshot | null
}

/** Tin nhắn tại chats/{roomId}/{pushId}. Push id tăng theo thời gian nên sắp theo key là đúng thứ tự gửi. */
export interface ChatMessage {
  id: string
  uid: string
  name: string
  text: string
  sentAt: number
}

export const MAX_NAME_LENGTH = 20
export const MAX_CHAT_LENGTH = 200
/** Số tin gần nhất tải về khi vào phòng. */
export const CHAT_HISTORY_LIMIT = 50
export const ROOM_CODE_LENGTH = 6

interface RawRoom {
  hostId?: string
  status?: RoomStatus
  members?: Record<string, RoomMember>
  seats?: Partial<Record<PlayerColor, SeatOccupant>>
  kicked?: Record<string, boolean>
  game?: SerializedSnapshot
}

export function parseRoom(raw: RawRoom): RoomData {
  return {
    hostId: raw.hostId ?? "",
    status: raw.status ?? "lobby",
    members: raw.members ?? {},
    seats: raw.seats ?? {},
    kicked: raw.kicked ?? {},
    game: raw.game ?? null,
  }
}

export function seatOf(room: RoomData, uid: string): PlayerColor | null {
  return PLAYER_COLORS.find((color) => {
    const seat = room.seats[color]
    return seat?.kind === "human" && seat.uid === uid
  }) ?? null
}

export function normalizeRoomCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, ROOM_CODE_LENGTH)
}
