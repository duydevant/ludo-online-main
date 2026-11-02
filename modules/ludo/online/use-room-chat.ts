"use client"

import { useEffect, useRef, useState } from "react"
import { limitToLast, onValue, orderByKey, query, ref } from "firebase/database"

import { firebaseDatabase } from "@/lib/firebase"

import { playSound } from "../audio/sound-effects"
import { useLudoSettingsStore } from "../store/ludo-settings.store"
import { CHAT_HISTORY_LIMIT, type ChatMessage } from "./room-types"

type RawMessages = Record<string, Omit<ChatMessage, "id">> | null

function parseMessages(raw: RawMessages): ChatMessage[] {
  return Object.entries(raw ?? {})
    .map(([id, message]) => ({ ...message, id }))
    .sort((a, b) => (a.id < b.id ? -1 : 1))
}

/**
 * Theo dõi chat của phòng (tối đa CHAT_HISTORY_LIMIT tin gần nhất).
 * `enabled` chỉ bật khi mình đã là thành viên phòng, vì rules chỉ cho thành viên đọc chat.
 * `open`: khung chat đang mở thì mọi tin coi như đã đọc; gọi `markRead` khi mở và khi đóng khung.
 */
export function useRoomChat(roomId: string, uid: string, enabled: boolean, open: boolean) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // Id tin cuối đã đọc. null = chưa tải lần đầu (lịch sử có sẵn khi vào phòng không tính là chưa đọc).
  const [lastReadId, setLastReadId] = useState<string | null>(null)
  const lastSeenRef = useRef<string | null>(null)

  useEffect(() => {
    if (!enabled) return
    const recent = query(ref(firebaseDatabase(), `chats/${roomId}`), orderByKey(), limitToLast(CHAT_HISTORY_LIMIT))
    const unsubscribe = onValue(
      recent,
      (snapshot) => {
        const next = parseMessages(snapshot.val() as RawMessages)
        const newest = next.at(-1)
        const previous = lastSeenRef.current
        // Kêu "pop" khi có tin mới của người khác (không kêu cho lịch sử lúc vừa vào phòng).
        if (previous !== null && newest && newest.id > previous && newest.uid !== uid) {
          if (!useLudoSettingsStore.getState().muted) playSound("chat")
        }
        lastSeenRef.current = newest?.id ?? ""
        setLastReadId((current) => current ?? newest?.id ?? "")
        setMessages(next)
      },
      // Bị kick hoặc rời phòng thì mất quyền đọc: giữ nguyên tin đã có.
      () => {}
    )
    return unsubscribe
  }, [roomId, uid, enabled])

  const newestId = messages.at(-1)?.id ?? ""
  const markRead = () => setLastReadId(newestId)

  const unread =
    lastReadId === null || open
      ? 0
      : messages.filter((message) => message.id > lastReadId && message.uid !== uid).length

  return { messages, unread, markRead }
}
