import type { Metadata } from "next"

import { normalizeRoomCode } from "@/modules/ludo/online/room-types"
import { OnlineRoom } from "@/modules/ludo/online/components/online-room"

export const metadata: Metadata = {
  title: "Phòng online",
  robots: { index: false },
}

export default async function OnlineRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params

  return <OnlineRoom roomId={normalizeRoomCode(roomId)} />
}
