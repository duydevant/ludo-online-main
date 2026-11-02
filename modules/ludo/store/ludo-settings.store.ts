import { create } from "zustand"
import { persist } from "zustand/middleware"

interface LudoSettingsStore {
  muted: boolean
  /** Tên hiển thị khi chơi online. */
  playerName: string
  toggleMuted: () => void
  setPlayerName: (name: string) => void
}

export const useLudoSettingsStore = create<LudoSettingsStore>()(
  persist(
    (set) => ({
      muted: false,
      playerName: "",
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
      setPlayerName: (playerName) => set({ playerName }),
    }),
    { name: "ludo-settings", skipHydration: true }
  )
)
