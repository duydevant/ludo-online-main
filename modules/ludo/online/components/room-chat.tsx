"use client"

import { useEffect, useRef, useState } from "react"
import { CrownIcon, MessageCircleIcon, SendHorizontalIcon, XIcon } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useI18n } from "@/lib/i18n"

import { COLOR_HEX, PLAYER_COLORS, type PlayerColor } from "../../game/constants"
import { sendChatMessage } from "../room-api"
import { MAX_CHAT_LENGTH, type ChatMessage, type RoomData } from "../room-types"
import { useRoomChat } from "../use-room-chat"

const QUICK_REACTIONS = ["👍", "😂", "😮", "😡", "🎲", "GG"] as const

/** Chặn bấm gửi liên tục; rules không giới hạn tốc độ nên đây là lớp chống spam phía máy. */
const MIN_SEND_INTERVAL_MS = 700

/** Ghi nhận một lần gửi nếu đã đủ giãn cách so với lần trước; false = bấm quá nhanh. */
function claimSendSlot(lastSentAt: { current: number }): boolean {
  const now = Date.now()
  if (now - lastSentAt.current < MIN_SEND_INTERVAL_MS) return false
  lastSentAt.current = now
  return true
}

interface RoomChatProps {
  roomId: string
  room: RoomData
  uid: string
}

function seatColorOf(room: RoomData, senderUid: string): PlayerColor | null {
  return (
    PLAYER_COLORS.find((color) => {
      const seat = room.seats[color]
      return seat?.kind === "human" && seat.uid === senderUid
    }) ?? null
  )
}

function SenderName({ room, message }: { room: RoomData; message: ChatMessage }) {
  const color = seatColorOf(room, message.uid)
  return (
    <span
      className="flex items-center gap-1 px-1 text-xs font-bold"
      style={{ color: color ? COLOR_HEX[color].light : undefined }}
    >
      {color && <span className="size-2 rounded-full" style={{ backgroundColor: COLOR_HEX[color].base }} />}
      {message.name}
      {message.uid === room.hostId && <CrownIcon className="size-3 text-primary" aria-hidden="true" />}
    </span>
  )
}

function MessageList({ room, uid, messages }: { room: RoomData; uid: string; messages: ChatMessage[] }) {
  const { t, localeTag } = useI18n()
  const listRef = useRef<HTMLOListElement>(null)
  const timeFormat = new Intl.DateTimeFormat(localeTag, { timeStyle: "short" })

  // Có tin mới thì cuộn xuống cuối.
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <p className="flex flex-1 items-center justify-center px-6 text-center text-sm text-muted-foreground">
        {t("ludo.chat.empty")}
      </p>
    )
  }

  return (
    <ol ref={listRef} className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-2" aria-live="polite">
      {messages.map((message, index) => {
        const mine = message.uid === uid
        const showName = !mine && messages[index - 1]?.uid !== message.uid
        return (
          <li
            key={message.id}
            className={cn("flex flex-col", mine ? "items-end" : "items-start", showName && "mt-1.5")}
          >
            {showName && <SenderName room={room} message={message} />}
            <p
              title={timeFormat.format(message.sentAt)}
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-1.5 text-sm break-words whitespace-pre-wrap",
                mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md bg-white/10"
              )}
            >
              {message.text}
            </p>
          </li>
        )
      })}
    </ol>
  )
}

/** Chat realtime của phòng (Firebase RTDB): nút nổi góc phải dưới, mở ra khung chat. */
export function RoomChat({ roomId, room, uid }: RoomChatProps) {
  const { t } = useI18n()
  const me = room.members[uid]
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState("")
  const lastSentAt = useRef(0)
  const { messages, unread, markRead } = useRoomChat(roomId, uid, Boolean(me), open)

  const toggle = (next: boolean) => {
    markRead()
    setOpen(next)
  }

  /** Trả về false nếu chưa gửi (rỗng hoặc bấm quá nhanh) để giữ lại nội dung đang gõ. */
  const send = (text: string, onFailed?: () => void): boolean => {
    if (!me || !text.trim() || !claimSendSlot(lastSentAt)) return false
    void sendChatMessage(roomId, uid, me.name, text).catch(() => {
      toast.error(t("ludo.chat.sendFailed"))
      onFailed?.()
    })
    return true
  }

  // Tin mới nhất của người khác chưa đọc: hiện bong bóng xem trước cạnh nút (CSS tự ẩn sau vài giây).
  const preview = unread > 0 ? messages.findLast((message) => message.uid !== uid) : undefined

  if (!open) {
    return (
      <div className="fixed right-4 bottom-4 z-40 flex items-end gap-2">
        {preview && (
          <button
            key={preview.id}
            type="button"
            onClick={() => toggle(true)}
            className="ludo-chat-preview game-panel max-w-56 rounded-2xl rounded-br-md px-3 py-2 text-left text-sm"
          >
            <span className="block truncate text-xs font-bold text-muted-foreground">{preview.name}</span>
            <span className="line-clamp-2">{preview.text}</span>
          </button>
        )}
        <Button
          variant="game"
          className="relative size-14 rounded-full"
          onClick={() => toggle(true)}
          aria-label={unread > 0 ? t("ludo.chat.unread", { count: unread }) : t("ludo.chat.open")}
        >
          <MessageCircleIcon className="size-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Button>
      </div>
    )
  }

  return (
    <section
      role="dialog"
      aria-label={t("ludo.chat.title")}
      onKeyDown={(event) => {
        if (event.key === "Escape") toggle(false)
      }}
      className="game-panel fixed inset-x-3 bottom-3 z-40 flex h-[min(70dvh,30rem)] flex-col overflow-hidden rounded-3xl animate-in duration-200 fade-in slide-in-from-bottom-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[22rem]"
    >
      <header className="flex items-center gap-2 border-b border-white/10 py-2 pr-2 pl-4">
        <MessageCircleIcon className="size-4 text-primary" aria-hidden="true" />
        <h2 className="flex-1 font-bold">{t("ludo.chat.title")}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={() => toggle(false)}
          aria-label={t("ludo.chat.close")}
        >
          <XIcon />
        </Button>
      </header>

      <MessageList room={room} uid={uid} messages={messages} />

      <div className="flex gap-1 overflow-x-auto px-3 pt-1 scrollbar-none">
        {QUICK_REACTIONS.map((reaction) => (
          <button
            key={reaction}
            type="button"
            onClick={() => send(reaction)}
            disabled={!me}
            className="shrink-0 rounded-full bg-white/10 px-2.5 py-0.5 text-sm font-bold transition-colors hover:bg-white/20 disabled:opacity-50"
          >
            {reaction}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 p-3"
        onSubmit={(event) => {
          event.preventDefault()
          const text = draft
          // Gửi lỗi thì trả lại nội dung vào ô nhập (nếu người dùng chưa gõ gì mới).
          if (send(text, () => setDraft((current) => current || text))) setDraft("")
        }}
      >
        <Input
          autoFocus
          value={draft}
          maxLength={MAX_CHAT_LENGTH}
          disabled={!me}
          placeholder={t("ludo.chat.placeholder")}
          aria-label={t("ludo.chat.placeholder")}
          className="h-10 rounded-full bg-black/20 px-4"
          onChange={(event) => setDraft(event.target.value)}
        />
        <Button
          type="submit"
          variant="game"
          size="icon-lg"
          className="size-10 rounded-full"
          disabled={!me || !draft.trim()}
          aria-label={t("ludo.chat.send")}
        >
          <SendHorizontalIcon />
        </Button>
      </form>
    </section>
  )
}
