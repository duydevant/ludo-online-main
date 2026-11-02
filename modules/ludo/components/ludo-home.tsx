"use client"

import { useOfflineLudoStore } from "../store/ludo-offline.store"
import { usePersistHydrated } from "../store/persist-hydration"
import { MainMenu } from "./main-menu"
import { OfflineGame } from "./offline-game"

/** Trang chủ là game: có ván trên máy (kể cả ván dở trước khi tải lại trang) thì vào bàn chơi,
 * không thì hiện menu chọn chế độ. */
export function LudoHome() {
  const hydrated = usePersistHydrated(useOfflineLudoStore.persist)
  const playing = useOfflineLudoStore((state) => state.snapshot !== null)

  // Server và lần render đầu luôn là menu, để HTML có đủ nội dung cho công cụ tìm kiếm.
  // Đọc xong localStorage mới biết có ván dở; key đổi để menu mở lại đúng màn cấu hình gần nhất.
  if (hydrated && playing) return <OfflineGame />
  return <MainMenu key={hydrated ? "restored" : "initial"} />
}
