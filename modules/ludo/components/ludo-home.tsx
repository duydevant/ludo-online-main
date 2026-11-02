"use client"

import { useI18n } from "@/lib/i18n"

import { useOfflineLudoStore } from "../store/ludo-offline.store"
import { usePersistHydrated } from "../store/persist-hydration"
import { MainMenu } from "./main-menu"
import { OfflineGame } from "./offline-game"

/** Trang chủ là game: có ván trên máy (kể cả ván dở trước khi tải lại trang) thì vào bàn chơi,
 * không thì hiện menu chọn chế độ. */
export function LudoHome() {
  const { t } = useI18n()
  const hydrated = usePersistHydrated(useOfflineLudoStore.persist)
  const playing = useOfflineLudoStore((state) => state.snapshot !== null)

  // Chưa đọc xong localStorage thì chưa biết có ván dở hay không: chỉ hiện logo, tránh nháy menu.
  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <p className="game-title animate-pulse text-6xl font-extrabold">{t("app.name")}</p>
      </div>
    )
  }
  return playing ? <OfflineGame /> : <MainMenu />
}
