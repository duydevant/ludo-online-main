import type { Metadata } from "next"

import { openGraphMetadata, twitterMetadata } from "@/lib/seo/metadata"
import { normalizeRoomCode } from "@/modules/ludo/online/room-types"
import { OnlineRoom } from "@/modules/ludo/online/components/online-room"

interface RoomPageProps {
  params: Promise<{ roomId: string }>
}

/** Không index phòng, nhưng vẫn có tiêu đề / mô tả riêng để link mời gửi qua Zalo, Messenger hiện đẹp. */
export async function generateMetadata({ params }: RoomPageProps): Promise<Metadata> {
  const roomId = normalizeRoomCode((await params).roomId)
  const title = `Vào bàn cờ cá ngựa – phòng ${roomId}`
  const description = `Bạn được mời chơi cờ cá ngựa online ở phòng ${roomId}. Bấm vào là vào bàn, không cần tải hay đăng ký.`

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: openGraphMetadata({ title, description }),
    twitter: twitterMetadata({ title, description }),
  }
}

export default async function OnlineRoomPage({ params }: RoomPageProps) {
  const { roomId } = await params

  return <OnlineRoom roomId={normalizeRoomCode(roomId)} />
}
