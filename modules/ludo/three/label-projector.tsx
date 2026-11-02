"use client"

import { useFrame } from "@react-three/fiber"
import { Vector3 } from "three"

import type { PlayerColor } from "../game/constants"

const MARGIN = 8
/** Chừa dòng báo lượt / nút chủ phòng ở trên và nút người xem / chat ở dưới. */
const SAFE_TOP = 60
const SAFE_BOTTOM = 72
const GAP = 6

export interface LabelPlacement {
  /** Kích thước bảng tên hiện tại (px), null nếu chưa có trên trang. */
  measure: (color: PlayerColor) => { width: number; height: number } | null
  /** Đặt góc trên-trái bảng tên tại (left, top) trong khung canvas. */
  place: (color: PlayerColor, left: number, top: number) => void
}

/**
 * Đặt các bảng tên (HTML nằm trên canvas) theo vị trí 3D: mỗi khung hình chiếu điểm neo ra màn hình rồi đặt
 * bảng chéo ra phía ngoài điểm neo (góc trái thì sang trái, nửa trên thì lên trên), giữ trong khung.
 * Chạy trong Canvas nên chỉ cập nhật khi khung hình được vẽ (camera / kích thước / nội dung đổi).
 */
export function LabelProjector({ anchors, placement }: { anchors: Record<PlayerColor, Vector3>; placement: LabelPlacement }) {
  useFrame(({ camera, size }) => {
    for (const [color, anchor] of Object.entries(anchors) as [PlayerColor, Vector3][]) {
      const box = placement.measure(color)
      if (!box) continue
      const projected = anchor.clone().project(camera)
      const x = ((projected.x + 1) / 2) * size.width
      const y = ((1 - projected.y) / 2) * size.height
      const left = x < size.width / 2 ? x - box.width - GAP : x + GAP
      const top = y < size.height / 2 ? y - box.height - GAP : y + GAP
      placement.place(
        color,
        Math.min(Math.max(left, MARGIN), size.width - box.width - MARGIN),
        Math.min(Math.max(top, SAFE_TOP), size.height - box.height - SAFE_BOTTOM)
      )
    }
  })
  return null
}
