import { create } from "zustand"
import { persist } from "zustand/middleware"

export type GraphicsMode = "3d" | "2d"
/** Chất liệu bàn 3D. */
export type BoardStyle = "walnut" | "lacquer" | "marble"
/** Hình quân 3D. */
export type PieceKind = "horse" | "seahorse"
/** Góc camera 3D: nghiêng như ngồi ở bàn, hoặc nhìn từ trên xuống. Cả hai đều khoá theo màu của mình. */
export type CameraView = "angled" | "top"

interface LudoSettingsStore {
  muted: boolean
  /** Tên hiển thị khi chơi online. */
  playerName: string
  /** Bàn cờ 3D (three.js) hay 2D (SVG). 3D tự về 2D khi thiết bị không chạy được. */
  graphics: GraphicsMode
  boardStyle: BoardStyle
  pieceKind: PieceKind
  cameraView: CameraView
  toggleMuted: () => void
  setPlayerName: (name: string) => void
  setGraphics: (graphics: GraphicsMode) => void
  setBoardStyle: (boardStyle: BoardStyle) => void
  setPieceKind: (pieceKind: PieceKind) => void
  setCameraView: (cameraView: CameraView) => void
}

export const useLudoSettingsStore = create<LudoSettingsStore>()(
  persist(
    (set) => ({
      muted: false,
      playerName: "",
      graphics: "3d",
      boardStyle: "walnut",
      pieceKind: "horse",
      cameraView: "angled",
      toggleMuted: () => set((state) => ({ muted: !state.muted })),
      setPlayerName: (playerName) => set({ playerName }),
      setGraphics: (graphics) => set({ graphics }),
      setBoardStyle: (boardStyle) => set({ boardStyle }),
      setPieceKind: (pieceKind) => set({ pieceKind }),
      setCameraView: (cameraView) => set({ cameraView }),
    }),
    { name: "ludo-settings", skipHydration: true }
  )
)
