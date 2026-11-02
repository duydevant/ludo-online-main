"use client"

import { useEffect, useSyncExternalStore } from "react"

import { useLudoSettingsStore } from "./ludo-settings.store"
import { useMatchHistoryStore } from "./match-history.store"
import { useOfflineLudoStore } from "./ludo-offline.store"

interface PersistApi {
  hasHydrated: () => boolean
  onFinishHydration: (listener: () => void) => () => void
  rehydrate: () => Promise<void> | void
}

/** Zustand chỉ gắn `.persist` khi có localStorage, nên trên server API này là undefined. */
type MaybePersistApi = PersistApi | undefined

const subscribeNothing = () => () => {}

/** Các store persist dùng `skipHydration` để HTML server khớp lần render đầu ở client;
 * đọc localStorage sau khi mount. Đặt một lần ở gốc app. */
export function useRehydrateLudoStores() {
  useEffect(() => {
    const stores: MaybePersistApi[] = [
      useLudoSettingsStore.persist,
      useMatchHistoryStore.persist,
      useOfflineLudoStore.persist,
    ]
    for (const store of stores) void store?.rehydrate()
  }, [])
}

/** false trên server và cho tới khi store đã đọc xong localStorage. */
export function usePersistHydrated(store: MaybePersistApi): boolean {
  return useSyncExternalStore(
    store?.onFinishHydration ?? subscribeNothing,
    () => store?.hasHydrated() ?? false,
    () => false
  )
}
