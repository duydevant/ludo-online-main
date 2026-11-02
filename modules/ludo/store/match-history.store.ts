import { create } from "zustand"
import { persist } from "zustand/middleware"

import type { MatchRecord } from "../history/match-record"

/** Giữ bấy nhiêu ván gần nhất; thống kê tính trên các ván này. */
const MAX_RECORDS = 100

interface MatchHistoryStore {
  /** Mới nhất trước. */
  records: MatchRecord[]
  /** Bỏ qua nếu đã có ván cùng id (ví dụ tải lại trang khi phòng online đang ở màn kết thúc). */
  addRecord: (record: MatchRecord) => void
  clearHistory: () => void
}

export const useMatchHistoryStore = create<MatchHistoryStore>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (record) =>
        set((state) =>
          state.records.some((existing) => existing.id === record.id)
            ? state
            : { records: [record, ...state.records].slice(0, MAX_RECORDS) }
        ),
      clearHistory: () => set({ records: [] }),
    }),
    { name: "ludo-match-history", version: 1, skipHydration: true }
  )
)
