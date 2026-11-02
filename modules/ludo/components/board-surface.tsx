import { memo } from "react"

import {
  BASE_ORIGIN,
  BOARD_SIZE,
  HOME_COLUMN_CELLS,
  MAIN_TRACK_CELLS,
  baseSlotPoint,
  type Cell,
} from "../game/board-geometry"
import {
  COLOR_HEX,
  MAIN_TRACK_LENGTH,
  PLAYER_COLORS,
  SAFE_TRACK_INDICES,
  START_INDEX,
  type PlayerColor,
} from "../game/constants"

const GRID_STROKE = "#cbd5e1"
const DIM_FILL = "#0f172a"
const DIM_OPACITY = 0.6

const CENTER_TRIANGLES: Record<PlayerColor, string> = {
  red: "6,6 6,9 7.5,7.5",
  green: "6,6 9,6 7.5,7.5",
  yellow: "9,6 9,9 7.5,7.5",
  blue: "6,9 9,9 7.5,7.5",
}

function starPoints(cx: number, cy: number, outer: number, inner: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const radius = i % 2 === 0 ? outer : inner
    const angle = (Math.PI / 5) * i - Math.PI / 2
    return `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`
  }).join(" ")
}

/** Mũi tên trong ô xuất phát, chỉ theo hướng đi. */
function StartArrow({ color }: { color: PlayerColor }) {
  const index = START_INDEX[color]
  const [row, col] = MAIN_TRACK_CELLS[index]
  const [nextRow, nextCol] = MAIN_TRACK_CELLS[(index + 1) % MAIN_TRACK_LENGTH]
  const angle = (Math.atan2(nextRow - row, nextCol - col) * 180) / Math.PI

  return (
    <polygon
      points="-0.28,-0.2 0.08,-0.2 0.08,-0.32 0.34,0 0.08,0.32 0.08,0.2 -0.28,0.2"
      fill="#ffffff"
      transform={`translate(${col + 0.5} ${row + 0.5}) rotate(${angle})`}
    />
  )
}

function TrackCell({ cell, fill }: { cell: Cell; fill: string }) {
  const [row, col] = cell
  return <rect x={col} y={row} width={1} height={1} fill={fill} stroke={GRID_STROKE} strokeWidth={0.03} />
}

function Base({ color, active }: { color: PlayerColor; active: boolean }) {
  const [row, col] = BASE_ORIGIN[color]
  const hex = COLOR_HEX[color]

  return (
    <g>
      <rect x={col} y={row} width={6} height={6} fill={hex.base} />
      <rect x={col + 0.25} y={row + 0.25} width={5.5} height={5.5} rx={0.5} fill="none" stroke={hex.dark} strokeWidth={0.08} opacity={0.5} />
      <rect x={col + 0.85} y={row + 0.85} width={4.3} height={4.3} rx={0.55} fill="#ffffff" stroke={hex.dark} strokeWidth={0.06} />
      {[0, 1, 2, 3].map((slot) => {
        const { x, y } = baseSlotPoint(color, slot)
        return (
          <rect
            key={slot}
            x={x - 0.62}
            y={y - 0.62}
            width={1.24}
            height={1.24}
            rx={0.28}
            fill={hex.light}
            stroke={hex.base}
            strokeWidth={0.06}
            strokeDasharray="0.14 0.1"
          />
        )
      })}
      {!active && <rect x={col} y={row} width={6} height={6} fill={DIM_FILL} opacity={DIM_OPACITY} />}
    </g>
  )
}

interface BoardSurfaceProps {
  /** Màu có người hoặc bot chơi. Màu còn lại bị làm tối. */
  activeColors: readonly PlayerColor[]
}

/** Phần tĩnh của bàn cờ: chuồng, vòng ngoài, đường về chuồng, ô an toàn, đích. */
export const BoardSurface = memo(function BoardSurface({ activeColors }: BoardSurfaceProps) {
  const startColorAt = new Map(PLAYER_COLORS.map((color) => [START_INDEX[color], color]))
  const isActive = (color: PlayerColor) => activeColors.includes(color)

  return (
    <g>
      <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="#ffffff" />

      {PLAYER_COLORS.map((color) => (
        <Base key={color} color={color} active={isActive(color)} />
      ))}

      {MAIN_TRACK_CELLS.map((cell, index) => {
        const startColor = startColorAt.get(index)
        return <TrackCell key={index} cell={cell} fill={startColor ? COLOR_HEX[startColor].base : "#ffffff"} />
      })}

      {PLAYER_COLORS.flatMap((color) =>
        HOME_COLUMN_CELLS[color].map((cell, step) => (
          <g key={`${color}-${step}`}>
            <TrackCell cell={cell} fill={COLOR_HEX[color].base} />
            <text
              x={cell[1] + 0.5}
              y={cell[0] + 0.53}
              fontSize={0.42}
              fontWeight={700}
              fill="#ffffff"
              opacity={0.85}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {step + 1}
            </text>
          </g>
        ))
      )}

      {[...SAFE_TRACK_INDICES]
        .filter((index) => !startColorAt.has(index))
        .map((index) => {
          const [row, col] = MAIN_TRACK_CELLS[index]
          return (
            <polygon
              key={index}
              points={starPoints(col + 0.5, row + 0.5, 0.38, 0.16)}
              fill="#e2e8f0"
              stroke="#64748b"
              strokeWidth={0.04}
              strokeLinejoin="round"
            />
          )
        })}

      {PLAYER_COLORS.map((color) => (
        <StartArrow key={color} color={color} />
      ))}

      {PLAYER_COLORS.map((color) => (
        <polygon key={color} points={CENTER_TRIANGLES[color]} fill={COLOR_HEX[color].base} stroke="#ffffff" strokeWidth={0.05} />
      ))}

      {PLAYER_COLORS.filter((color) => !isActive(color)).flatMap((color) => [
        ...HOME_COLUMN_CELLS[color].map(([row, col]) => (
          <rect key={`dim-${color}-${row}-${col}`} x={col} y={row} width={1} height={1} fill={DIM_FILL} opacity={DIM_OPACITY} />
        )),
        <rect
          key={`dim-start-${color}`}
          x={MAIN_TRACK_CELLS[START_INDEX[color]][1]}
          y={MAIN_TRACK_CELLS[START_INDEX[color]][0]}
          width={1}
          height={1}
          fill={DIM_FILL}
          opacity={DIM_OPACITY}
        />,
        <polygon key={`dim-center-${color}`} points={CENTER_TRIANGLES[color]} fill={DIM_FILL} opacity={DIM_OPACITY} />,
      ])}

      <rect width={BOARD_SIZE} height={BOARD_SIZE} fill="none" stroke="#1e293b" strokeWidth={0.14} />
    </g>
  )
})
