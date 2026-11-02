import { create } from "zustand"
import { persist } from "zustand/middleware"

import { applyMove, applyRoll, createGame, rollDice, type GameState, type Player } from "../game/rules"
import type { GameEvent, GameSnapshot } from "../game/snapshot"
import { offlineResult } from "../history/match-record"
import { useMatchHistoryStore } from "./match-history.store"

interface OfflineLudoStore {
  snapshot: GameSnapshot | null
  /** Người chơi của ván gần nhất, để menu mở lại đúng cấu hình khi thoát ván. */
  lastPlayers: Player[] | null
  startGame: (players: Player[]) => void
  quitGame: () => void
  roll: () => void
  moveToken: (tokenIndex: number) => void
}

function recordFinishedGame(state: GameState) {
  useMatchHistoryStore.getState().addRecord({
    id: crypto.randomUUID(),
    mode: "offline",
    finishedAt: Date.now(),
    players: state.players.map((player) => ({ ...player, name: "" })),
    rankings: state.rankings,
    myColor: null,
    won: offlineResult(state),
  })
}

/** Ván chơi trên một thiết bị: người thay phiên nhau, bot do chính máy này đánh.
 * Lưu vào localStorage nên tải lại trang vẫn chơi tiếp. */
export const useOfflineLudoStore = create<OfflineLudoStore>()(
  persist(
    (set, get) => {
      const commit = (event: GameEvent, state: GameState) => {
        const previous = get().snapshot
        set({ snapshot: { seq: (previous?.seq ?? 0) + 1, event, state } })
        if (state.phase === "finished" && previous?.state.phase !== "finished") recordFinishedGame(state)
      }

      return {
        snapshot: null,
        lastPlayers: null,
        startGame: (players) => {
          set({ lastPlayers: players })
          commit("start", createGame(players))
        },
        quitGame: () => set({ snapshot: null }),
        roll: () => {
          const state = get().snapshot?.state
          if (state?.phase === "rolling") commit("roll", applyRoll(state, rollDice()))
        },
        moveToken: (tokenIndex) => {
          const state = get().snapshot?.state
          if (state?.phase === "moving") commit("move", applyMove(state, tokenIndex))
        },
      }
    },
    {
      name: "ludo-offline-game",
      version: 1,
      skipHydration: true,
      partialize: ({ snapshot, lastPlayers }) => ({ snapshot, lastPlayers }),
    }
  )
)
