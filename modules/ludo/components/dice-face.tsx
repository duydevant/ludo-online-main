import { cn } from "cn"

import { COLOR_HEX, type PlayerColor } from "../game/constants"

/** Vị trí chấm trên lưới 3x3 (0..8) cho từng mặt. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

interface DiceFaceProps {
  value: number
  color: PlayerColor
  rolling: boolean
  className?: string
}

export function DiceFace({ value, color, rolling, className }: DiceFaceProps) {
  const hex = COLOR_HEX[color]

  return (
    <div
      className={cn(
        "grid size-14 grid-cols-3 grid-rows-3 place-items-center rounded-xl border-2 bg-white p-2 shadow-[0_3px_0_0_var(--dice-shadow)]",
        rolling && "ludo-dice-rolling",
        className
      )}
      style={{ borderColor: hex.base, "--dice-shadow": hex.dark } as React.CSSProperties}
      aria-hidden="true"
    >
      {Array.from({ length: 9 }, (_, cell) => (
        <span
          key={cell}
          className={cn("size-2.5 rounded-full", !PIPS[value]?.includes(cell) && "invisible")}
          style={{ backgroundColor: value === 1 ? "#dc2626" : "#1e293b" }}
        />
      ))}
    </div>
  )
}
