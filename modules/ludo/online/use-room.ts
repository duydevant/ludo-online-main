"use client"

import { useEffect, useState } from "react"
import { onValue, ref } from "firebase/database"

import { ensureFirebaseUser, firebaseDatabase } from "@/lib/firebase"

import { enterRoomPresence, setHost } from "./room-api"
import { parseRoom, type RoomData } from "./room-types"

export type RoomConnection = "connecting" | "ready" | "not-found" | "kicked" | "error"

/** Theo dõi phòng realtime, tự vào phòng (presence) và tự nhận chủ phòng khi chủ cũ rời. */
export function useRoom(roomId: string, playerName: string) {
  const [uid, setUid] = useState<string | null>(null)
  const [room, setRoom] = useState<RoomData | null>(null)
  const [connection, setConnection] = useState<RoomConnection>("connecting")

  useEffect(() => {
    let cancelled = false
    ensureFirebaseUser()
      .then((id) => !cancelled && setUid(id))
      .catch(() => !cancelled && setConnection("error"))
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!uid || !playerName) return
    let leave: (() => void) | null = null

    const unsubscribe = onValue(
      ref(firebaseDatabase(), `rooms/${roomId}`),
      (snapshot) => {
        if (!snapshot.child("hostId").exists()) {
          setRoom(null)
          setConnection("not-found")
          return
        }
        const data = parseRoom(snapshot.val())
        if (data.kicked[uid]) {
          leave?.()
          leave = null
          setRoom(null)
          setConnection("kicked")
          return
        }
        setRoom(data)
        setConnection("ready")
        leave ??= enterRoomPresence(roomId, uid, playerName)
      },
      () => setConnection("error")
    )

    return () => {
      unsubscribe()
      leave?.()
    }
  }, [roomId, uid, playerName])

  // Chủ phòng mất kết nối: thành viên vào sớm nhất tự nhận quyền.
  useEffect(() => {
    if (!room || !uid || room.members[room.hostId]) return
    const [earliest] = Object.entries(room.members).sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
    if (earliest?.[0] === uid) void setHost(roomId, uid).catch(() => {})
  }, [room, uid, roomId])

  return { uid, room, connection, isHost: Boolean(uid && room?.hostId === uid) }
}
