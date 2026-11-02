import {
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  runTransaction,
  serverTimestamp,
  set,
  update,
} from "firebase/database"

import { firebaseDatabase } from "@/lib/firebase"

import { PLAYER_COLORS, type PlayerColor } from "../game/constants"
import { createGame, type GameState } from "../game/rules"
import {
  deserializeSnapshot,
  serializeSnapshot,
  type GameEvent,
  type SerializedSnapshot,
} from "../game/snapshot"
import { MAX_CHAT_LENGTH, ROOM_CODE_LENGTH, type RoomData, type SeatOccupant } from "./room-types"

/** Bỏ các ký tự dễ nhầm (0/O, 1/I) để đọc mã phòng cho nhau dễ hơn. */
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

const roomRef = (roomId: string, path = "") => ref(firebaseDatabase(), `rooms/${roomId}${path && `/${path}`}`)

function randomRoomCode(): string {
  return Array.from(
    { length: ROOM_CODE_LENGTH },
    () => ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]
  ).join("")
}

export async function createRoom(uid: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const roomId = randomRoomCode()
    if ((await get(roomRef(roomId, "hostId"))).exists()) continue

    await update(ref(firebaseDatabase()), {
      [`rooms/${roomId}/hostId`]: uid,
      [`rooms/${roomId}/createdAt`]: serverTimestamp(),
      [`rooms/${roomId}/status`]: "lobby",
    })
    return roomId
  }
  throw new Error("Could not allocate a room code")
}

export async function roomExists(roomId: string): Promise<boolean> {
  return (await get(roomRef(roomId, "hostId"))).exists()
}

/** Bỏ mọi ghế đang do uid ngồi. Dùng khi rời phòng. */
async function releaseSeatsOf(roomId: string, uid: string) {
  const seats = ((await get(roomRef(roomId, "seats"))).val() ?? {}) as Partial<Record<PlayerColor, SeatOccupant>>
  const updates: Record<string, null> = {}
  for (const color of PLAYER_COLORS) {
    const seat = seats[color]
    if (seat?.kind === "human" && seat.uid === uid) updates[`seats/${color}`] = null
  }
  if (Object.keys(updates).length > 0) await update(roomRef(roomId), updates)
}

/**
 * Đánh dấu có mặt trong phòng: ghi members/{uid} mỗi lần (re)connect, tự xoá khi mất kết nối.
 * Hàm trả về dùng để rời phòng (xoá member + nhả ghế).
 */
export function enterRoomPresence(roomId: string, uid: string, name: string): () => void {
  const memberRef = roomRef(roomId, `members/${uid}`)
  const unsubscribe = onValue(ref(firebaseDatabase(), ".info/connected"), (snapshot) => {
    if (snapshot.val() !== true) return
    void onDisconnect(memberRef)
      .remove()
      .then(() => set(memberRef, { name, joinedAt: serverTimestamp() }))
      .catch(() => {
        // Bị kick thì rules chặn ghi: bỏ qua, UI đã xử lý qua cờ kicked.
      })
  })

  return () => {
    unsubscribe()
    void onDisconnect(memberRef).cancel()
    void remove(memberRef).catch(() => {})
    void releaseSeatsOf(roomId, uid).catch(() => {})
  }
}

/** Ngồi vào ghế trống (hoặc ghế bot). Trả về false nếu đã có người khác ngồi trước. */
export async function takeSeat(
  roomId: string,
  color: PlayerColor,
  uid: string,
  name: string,
  previousSeat: PlayerColor | null
): Promise<boolean> {
  const seatRef = roomRef(roomId, `seats/${color}`)
  const result = await runTransaction(seatRef, (current: SeatOccupant | null) =>
    current && current.kind === "human" ? undefined : { kind: "human", uid, name }
  )
  if (!result.committed) return false

  await onDisconnect(seatRef).remove()
  if (previousSeat && previousSeat !== color) await leaveSeat(roomId, previousSeat)
  return true
}

export async function leaveSeat(roomId: string, color: PlayerColor) {
  const seatRef = roomRef(roomId, `seats/${color}`)
  await onDisconnect(seatRef).cancel()
  await remove(seatRef)
}

export async function setBotSeat(roomId: string, color: PlayerColor, bot: boolean) {
  await set(roomRef(roomId, `seats/${color}`), bot ? { kind: "bot" } : null)
}

export async function kickMember(roomId: string, room: RoomData, targetUid: string) {
  const updates: Record<string, unknown> = {
    [`members/${targetUid}`]: null,
    [`kicked/${targetUid}`]: true,
  }
  for (const color of PLAYER_COLORS) {
    const seat = room.seats[color]
    if (seat?.kind === "human" && seat.uid === targetUid) updates[`seats/${color}`] = null
  }
  await update(roomRef(roomId), updates)
}

/**
 * Đổi chủ phòng. Rules chỉ cho: chủ hiện tại nhường quyền, hoặc một thành viên tự nhận
 * khi chủ cũ đã rời phòng (mất kết nối).
 */
export async function setHost(roomId: string, uid: string) {
  await set(roomRef(roomId, "hostId"), uid)
}

/** Người cuối cùng rời phòng thì xoá luôn phòng và chat của phòng. */
export async function closeRoom(roomId: string) {
  // Xoá chat trước, khi mình còn là chủ phòng (rules kiểm tra hostId). Tách riêng khỏi lệnh xoá phòng:
  // nếu rules trên Firebase chưa có nhánh chats thì chỉ bước này lỗi, phòng vẫn được xoá.
  await remove(ref(firebaseDatabase(), `chats/${roomId}`)).catch(() => {})
  await remove(roomRef(roomId))
}

/** Gửi tin nhắn vào chat phòng. Rules kiểm tra người gửi đang ở trong phòng và đúng tên đang dùng. */
export async function sendChatMessage(roomId: string, uid: string, name: string, text: string) {
  const trimmed = text.trim().slice(0, MAX_CHAT_LENGTH)
  if (!trimmed) return
  await push(ref(firebaseDatabase(), `chats/${roomId}`), { uid, name, text: trimmed, sentAt: serverTimestamp() })
}

export async function startOnlineGame(roomId: string, room: RoomData) {
  const players = PLAYER_COLORS.flatMap((color) => {
    const seat = room.seats[color]
    return seat ? [{ color, kind: seat.kind }] : []
  })
  const snapshot = serializeSnapshot({ seq: 1, event: "start", state: createGame(players) })
  await update(roomRef(roomId), { status: "playing", game: snapshot })
}

export async function backToLobby(roomId: string) {
  await update(roomRef(roomId), { status: "lobby", game: null })
}

/**
 * Áp dụng một hành động lên ván bằng transaction: chỉ ghi nếu ván vẫn đang ở bước expectedSeq,
 * nên hai máy cùng bấm (hoặc chủ phòng đánh bot cùng lúc người vừa ngồi vào) không bị đi hai lần.
 */
export async function commitGameAction(
  roomId: string,
  expectedSeq: number,
  event: GameEvent,
  apply: (state: GameState) => GameState
): Promise<boolean> {
  const result = await runTransaction(roomRef(roomId, "game"), (current: SerializedSnapshot | null) => {
    if (current === null) return null
    if (current.seq !== expectedSeq) return
    try {
      const next = apply(deserializeSnapshot(current).state)
      return serializeSnapshot({ seq: current.seq + 1, event, state: next })
    } catch {
      return
    }
  })
  return result.committed
}
