import { COLOR_HEX, type PlayerColor } from "../game/constants"

/** Hình quân ngựa vẽ trong khung 100x100, mặt quay sang trái, đế ở đáy. */
const PEDESTAL = "M16 91 Q16 82 26 80 L74 80 Q84 82 84 91 Q84 98 76 98 L24 98 Q16 98 16 91 Z"
const COLLAR = "M27 81 L31 71 L71 71 L74 81 Z"
const HEAD =
  "M71 72 C78 54 76 33 63 19 L62 4 L53 14 C40 15 27 25 18 40 C14 47 18 55 27 55 C33 55 38 52 44 49 C40 57 34 64 31 72 Z"
const MANE = "M65 22 C73 36 74 54 69 69"
const FACE_HIGHLIGHT = "M50 20 C40 22 30 31 24 41 C30 34 40 27 50 25 Z"

interface HorsePieceProps {
  color: PlayerColor
  /** Cạnh khung vẽ theo đơn vị của SVG cha. */
  size?: number
}

/** Quân ngựa có tâm ở (0, 0), đế nằm ở khoảng +0.42 * size. */
export function HorsePiece({ color, size = 0.9 }: HorsePieceProps) {
  const hex = COLOR_HEX[color]
  const scale = size / 100

  return (
    <g transform={`scale(${scale}) translate(-50 -56)`}>
      <ellipse cx={50} cy={97} rx={36} ry={7} fill="#000000" opacity={0.25} />
      <path d={PEDESTAL} fill={hex.dark} />
      <path d={COLLAR} fill={hex.base} stroke={hex.dark} strokeWidth={3} strokeLinejoin="round" />
      <path d={HEAD} fill={hex.base} stroke={hex.dark} strokeWidth={4} strokeLinejoin="round" />
      <path d={MANE} fill="none" stroke={hex.dark} strokeWidth={5} strokeLinecap="round" opacity={0.55} />
      <path d={FACE_HIGHLIGHT} fill="#ffffff" opacity={0.45} />
      <circle cx={46} cy={30} r={4} fill="#0f172a" />
      <circle cx={47.2} cy={28.8} r={1.3} fill="#ffffff" />
      <circle cx={23} cy={46} r={2} fill={hex.dark} />
    </g>
  )
}

/** Avatar ngựa dùng ngoài bàn cờ (panel người chơi, danh sách...). */
export function HorseAvatar({ color, className }: { color: PlayerColor; className?: string }) {
  return (
    <svg viewBox="-0.5 -0.55 1 1" className={className} aria-hidden="true">
      <HorsePiece color={color} size={0.95} />
    </svg>
  )
}
