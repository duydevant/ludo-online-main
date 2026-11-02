"use client"

import { useI18n } from "@/lib/i18n"

import { BASE_PROGRESS, COLOR_HEX, PLAYER_COLORS, TOKENS_PER_PLAYER, type PlayerColor } from "../game/constants"
import { currentPlayer, movableTokens, type GameState } from "../game/rules"
import type { GameView } from "../presentation/game-animator"
import { LudoBoard } from "./ludo-board"
import { SeatPanel } from "./seat-panel"

export interface SeatInfo {
  title: string
  subtitle?: React.ReactNode
  actions?: React.ReactNode
}

export interface LudoTableProps {
  /** null = chưa có ván (phòng chờ): chỉ hiện quân trong chuồng của các màu đã có người. */
  view: GameView | null
  busy: boolean
  /** Màu có người hoặc bot. Khi đang chơi, lấy theo danh sách người chơi của ván. */
  activeColors: readonly PlayerColor[]
  seats: Record<PlayerColor, SeatInfo>
  /** Máy này có được bấm tung / chọn quân cho màu đó không. */
  canControl: (color: PlayerColor) => boolean
  onRoll: () => void
  onMove: (tokenIndex: number) => void
  /** Nội dung thay cho dòng báo lượt khi chưa có ván (ví dụ nút bắt đầu của chủ phòng). */
  idleBanner?: React.ReactNode
  /** Nội dung hai bên dòng báo lượt (ví dụ trạng thái ghế và nút của chủ phòng khi chơi online). */
  bannerStart?: React.ReactNode
  bannerEnd?: React.ReactNode
}

export function previewState(colors: readonly PlayerColor[]): Pick<GameState, "players" | "tokens"> {
  const tokens = {} as GameState["tokens"]
  for (const color of colors) tokens[color] = Array(TOKENS_PER_PLAYER).fill(BASE_PROGRESS)
  return { players: colors.map((color) => ({ color, kind: "human" as const })), tokens }
}

/** Lượt hiện tại nhìn từ máy này: ai đang tới lượt, máy này được tung / chọn quân nào. Dùng chung cho 2D và 3D. */
export function tableTurn({ view, busy, canControl }: Pick<LudoTableProps, "view" | "busy" | "canControl">) {
  const state = view?.state ?? null
  const playing = state && state.phase !== "finished" ? currentPlayer(state).color : null
  const iControlTurn = playing !== null && !busy && canControl(playing)
  const selectable =
    iControlTurn && state?.phase === "moving" && state.dice !== null
      ? { color: playing, tokens: movableTokens(state, state.dice) }
      : null
  const rollableColor = iControlTurn && state?.phase === "rolling" ? playing : null
  return { state, playing, selectable, rollableColor }
}

/** Số quân đã về đích và thứ hạng (nếu đã về hết) của một màu. */
export function seatProgress(state: GameState | null, color: PlayerColor) {
  return {
    tokens: state?.tokens[color],
    rank: state ? state.rankings.indexOf(color) + 1 || undefined : undefined,
  }
}

/** Dòng báo lượt: màu đang đi, hoặc "Kết thúc"; kèm thông báo mất lượt. */
export function TurnBanner({ state, busy }: { state: GameState; busy: boolean }) {
  const { t } = useI18n()
  if (state.phase === "finished") {
    return <p className="rounded-full bg-primary px-4 py-1 font-bold text-primary-foreground">{t("ludo.gameOver.title")}</p>
  }

  const color = currentPlayer(state).color
  const lastRoll = state.lastRoll
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
      <span
        className="flex items-center gap-2 rounded-full px-4 py-1 font-bold text-white shadow-md"
        style={{ backgroundColor: COLOR_HEX[color].dark }}
      >
        <span className="size-2.5 animate-pulse rounded-full bg-white" />
        {t("ludo.status.turn", { player: t(`ludo.color.${color}`) })}
      </span>
      {state.lastTurnEnd && lastRoll && !busy && (
        <span className="rounded-full bg-background/70 px-3 py-0.5 text-sm font-semibold text-destructive-foreground">
          {t(state.lastTurnEnd === "three-sixes" ? "ludo.status.threeSixes" : "ludo.status.noMoves", {
            player: t(`ludo.color.${lastRoll.color}`),
          })}
        </span>
      )}
    </div>
  )
}

/** Dòng trên cùng của bàn chơi: (trái) trạng thái ghế, (giữa) báo lượt, (phải) nút của chủ phòng. */
export function TableBanner({
  state,
  busy,
  idleBanner,
  bannerStart,
  bannerEnd,
}: Pick<LudoTableProps, "busy" | "idleBanner" | "bannerStart" | "bannerEnd"> & { state: GameState | null }) {
  return (
    <div className="flex min-h-9 flex-wrap items-center justify-center gap-2 sm:grid sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex justify-start">{bannerStart}</div>
      <div className="order-last flex w-full justify-center sm:order-none sm:w-auto">
        {state ? <TurnBanner state={state} busy={busy} /> : idleBanner}
      </div>
      <div className="ml-auto flex justify-end gap-2">{bannerEnd}</div>
    </div>
  )
}

/** Bàn chơi 2D: bàn cờ SVG ở giữa, 4 panel ghế (kèm xúc xắc) cạnh 4 chuồng. */
export function LudoTable(props: LudoTableProps) {
  const { view, activeColors, seats, onRoll, onMove } = props
  const { state, playing, selectable, rollableColor } = tableTurn(props)

  return (
    <div className="flex flex-col gap-3">
      <TableBanner {...props} state={state} />

      <div className="ludo-table">
        {PLAYER_COLORS.map((color) => (
          <SeatPanel
            key={color}
            color={color}
            {...seats[color]}
            {...seatProgress(state, color)}
            active={activeColors.includes(color)}
            isTurn={playing === color}
            diceFace={view?.diceFaces[color] ?? 6}
            rolling={view?.rollingColor === color}
            canRoll={rollableColor === color}
            onRoll={onRoll}
            className={color === "blue" || color === "yellow" ? "lg:self-end" : "lg:self-start"}
          />
        ))}

        <div className="flex justify-center" style={{ gridArea: "board" }}>
          <LudoBoard
            className="w-full max-w-[min(100%,calc(100dvh-9rem))]"
            state={state ?? previewState(activeColors)}
            activeColors={activeColors}
            movingToken={view?.movingToken ?? null}
            selectable={selectable}
            onChoose={onMove}
          />
        </div>
      </div>
    </div>
  )
}
