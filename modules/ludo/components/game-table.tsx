"use client"

import { Component, Suspense, lazy, useState, type ErrorInfo, type ReactNode } from "react"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { PLAYER_COLORS, type PlayerColor } from "../game/constants"
import { useLudoSettingsStore } from "../store/ludo-settings.store"
import { LudoTable, TableBanner, previewState, seatProgress, tableTurn, type LudoTableProps } from "./ludo-table"
import { SeatTag } from "./seat-tag"

// three.js chỉ được tải khi thật sự vẽ bàn 3D; menu và bản 2D không phải tải.
const LudoBoard3D = lazy(() => import("../three/ludo-board-3d"))

let webglSupport: boolean | null = null

/** Trình duyệt có tạo được WebGL không (kiểm tra một lần). */
export function supportsWebGL(): boolean {
  if (webglSupport !== null) return webglSupport
  try {
    const canvas = document.createElement("canvas")
    webglSupport = Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))
  } catch {
    webglSupport = false
  }
  return webglSupport
}

interface FallbackBoundaryProps {
  onError: () => void
  children: ReactNode
}

/** Bàn 3D lỗi khi chạy (shader, driver...) thì báo lên để chuyển sang 2D thay vì làm sập cả màn chơi. */
class FallbackBoundary extends Component<FallbackBoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ludo-3d] falling back to 2D", error, info.componentStack)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

interface GameTableProps extends LudoTableProps {
  /** Màu của người đang xem (màu mình ngồi, hoặc người chơi đầu tiên): camera 3D quay chuồng màu này về phía dưới. */
  viewerColor: PlayerColor
  /** Phần phụ dưới bàn (ví dụ danh sách người xem). Bản 3D thu thành nút ở góc dưới-trái, bấm mới mở. */
  footer?: ReactNode
  /** Chữ trên nút thu gọn của phần phụ (bản 3D). */
  footerLabel?: string
}

/** Phần phụ của bàn 3D: nút nhỏ ở góc dưới-trái, bấm mở bảng phía trên nút. */
function CollapsedFooter({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-[max(1rem,env(safe-area-inset-left))] z-20 flex w-[min(22rem,calc(100vw-6rem))] flex-col items-start gap-2">
      {open && <div className="w-full">{children}</div>}
      <Button
        variant="game-secondary"
        size="sm"
        className="rounded-full"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <ChevronDownIcon data-icon="inline-start" /> : <ChevronUpIcon data-icon="inline-start" />}
        {label}
      </Button>
    </div>
  )
}

function Loading3D() {
  const { t } = useI18n()
  return (
    <div className="grid h-full place-items-center">
      <p className="game-title animate-pulse text-3xl font-extrabold">{t("ludo.board.loading")}</p>
    </div>
  )
}

/**
 * Màn chơi 3D: bàn cờ phủ toàn màn hình dưới thanh trên, tên người chơi nổi ngay trên bàn cạnh chuồng
 * của họ, dòng báo lượt và nút chủ phòng nổi phía trên, phần phụ (người xem) ở góc dưới-trái.
 */
function Stage3D({ viewerColor, footer, footerLabel, onFail, ...table }: GameTableProps & { onFail: () => void }) {
  const { view, busy, activeColors, seats, onRoll, onMove } = table
  const { state, playing, selectable, rollableColor } = tableTurn(table)

  const labels = Object.fromEntries(
    PLAYER_COLORS.map((color) => [
      color,
      <SeatTag
        key={color}
        color={color}
        {...seats[color]}
        {...seatProgress(state, color)}
        active={activeColors.includes(color)}
        isTurn={playing === color}
      />,
    ])
  ) as Record<PlayerColor, ReactNode>

  return (
    <>
      <div className="fixed inset-x-0 top-14 bottom-0 z-0">
        <FallbackBoundary onError={onFail}>
          <Suspense fallback={<Loading3D />}>
            <LudoBoard3D
              state={state ?? previewState(activeColors)}
              activeColors={activeColors}
              view={view}
              selectable={selectable}
              onChoose={onMove}
              turnColor={playing}
              rollableColor={rollableColor}
              onRoll={onRoll}
              labels={labels}
              viewerColor={viewerColor}
              onContextLost={onFail}
            />
          </Suspense>
        </FallbackBoundary>
      </div>

      {/* Nổi trên canvas: chỉ các nút / huy hiệu nhận chuột, phần trống vẫn bấm xuyên xuống bàn. */}
      <div className="pointer-events-none relative z-10 [&_a]:pointer-events-auto [&_button]:pointer-events-auto">
        <TableBanner {...table} state={state} busy={busy} />
      </div>

      {footer && <CollapsedFooter label={footerLabel ?? ""}>{footer}</CollapsedFooter>}
    </>
  )
}

/** Bàn chơi 3D (toàn màn hình) hoặc 2D theo cài đặt; 3D gặp sự cố thì tự về 2D trong phiên này. */
export function GameTable({ viewerColor, footer, footerLabel, ...tableProps }: GameTableProps) {
  const { t } = useI18n()
  const graphics = useLudoSettingsStore((state) => state.graphics)
  const [webgl] = useState(supportsWebGL)
  const [failed, setFailed] = useState(false)

  if (graphics !== "3d" || !webgl || failed) {
    return (
      <>
        <LudoTable {...tableProps} />
        {footer}
      </>
    )
  }

  const fallBack = () => {
    setFailed(true)
    toast.info(t("ludo.graphics.fellBack"))
  }

  return <Stage3D {...tableProps} viewerColor={viewerColor} footer={footer} footerLabel={footerLabel} onFail={fallBack} />
}
