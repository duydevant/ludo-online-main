import { Quaternion, Vector3 } from "three"

import { BASE_ORIGIN, BOARD_SIZE, type Point } from "../game/board-geometry"
import { BASE_PROGRESS, FINISH_PROGRESS, type PlayerColor } from "../game/constants"

/**
 * Quy ước scene: 1 ô cờ = 1 đơn vị, tâm bàn ở gốc toạ độ, trục Y hướng lên.
 * Toạ độ 2D (x sang phải, y xuống dưới) ứng với (x, z) trong 3D, nên nhìn từ trên xuống giống hệt bàn 2D.
 */
export const HALF_BOARD = BOARD_SIZE / 2
/** Khối bàn (viền gỗ / đá) rộng hơn lưới ô mỗi bên một khoảng. */
export const SLAB_SIZE = BOARD_SIZE + 2.4
/** Các lớp của bàn, từ dưới lên: khối bàn, tấm nền, mặt ô, mặt chuồng, hốc đặt quân. */
export const SLAB_TOP = 0.7
export const PLATE_TOP = 0.74
export const TILE_TOP = 0.82
export const BASE_TOP = 0.86
export const SLOT_TOP = 0.885
/** Đỉnh tháp đích giữa bàn. */
export const PYRAMID_TOP = PLATE_TOP + 0.57
export const DICE_SIZE = 0.72

export function boardToWorld(point: Point, height = TILE_TOP): Vector3 {
  return new Vector3(point.x - HALF_BOARD, height, point.y - HALF_BOARD)
}

/** Độ cao mặt đặt quân theo vị trí: hốc trong chuồng, mặt ô, hay sườn tháp đích. */
export function tokenHeight(progress: number): number {
  if (progress === BASE_PROGRESS) return SLOT_TOP
  if (progress === FINISH_PROGRESS) return PLATE_TOP + 0.2
  return TILE_TOP
}

/** Tâm chuồng 6x6 của một màu, theo đơn vị ô. */
export function baseCenter(color: PlayerColor): Point {
  const [row, col] = BASE_ORIGIN[color]
  return { x: col + 3, y: row + 3 }
}

/** Xúc xắc nằm giữa chuồng của màu đó (giữa 4 hốc), nên luôn thấy được trong khung hình. */
export function dicePosition(color: PlayerColor): Vector3 {
  return boardToWorld(baseCenter(color), BASE_TOP + 0.08 + DICE_SIZE / 2)
}

/** Góc phương vị của một điểm quanh trục Y (0 = hướng +Z, tức phía người nhìn). */
function azimuthOf(point: Vector3): number {
  return Math.atan2(point.x, point.z)
}

/**
 * Góc quay camera quanh bàn để chuồng của `color` nằm ở góc dưới-trái màn hình
 * (vị trí của chuồng xanh dương khi camera đứng ở phía +Z).
 */
export function cameraAzimuth(color: PlayerColor): number {
  return azimuthOf(boardToWorld(baseCenter(color))) - azimuthOf(boardToWorld(baseCenter("blue")))
}

const UP_AXIS = new Vector3(0, 1, 0)

/** Góc nghiêng camera so với phương thẳng đứng: nghiêng thấp như ngồi ở bàn, hoặc gần như từ trên xuống. */
export const CAMERA_TILT = { angled: (54 * Math.PI) / 180, top: (6 * Math.PI) / 180 } as const
/** Điểm camera nhìn vào: hơi lệch về phía người xem để nửa bàn gần không bị cắt. */
export const CAMERA_TARGET = new Vector3(0, 0.4, 0)

/** Các điểm phải luôn nằm trong khung hình: 4 góc khối bàn, ở chân bàn và ở độ cao đầu quân. */
const FIT_POINTS: Vector3[] = [-1, 1].flatMap((sx) =>
  [-1, 1].flatMap((sz) => [0, 1.5].map((y) => new Vector3((sx * SLAB_SIZE) / 2, y, (sz * SLAB_SIZE) / 2)))
)

/** Hướng từ tâm nhìn tới camera (vector đơn vị) khi quay quanh bàn góc `azimuth` và nghiêng `tilt`. */
export function cameraDirection(azimuth: number, tilt: number): Vector3 {
  return new Vector3(Math.sin(tilt) * Math.sin(azimuth), Math.cos(tilt), Math.sin(tilt) * Math.cos(azimuth))
}

/**
 * Khoảng cách camera nhỏ nhất để mọi điểm FIT_POINTS nằm trong khung hình (có phối cảnh).
 * Với mỗi điểm p, toạ độ trong hệ camera là (p·right, p·up) ở độ sâu (distance + p·forward);
 * điểm nằm trong khung khi |p·right| ≤ tan(fovNgang/2)·độ sâu và tương tự theo chiều dọc.
 */
export function fitCameraDistance(azimuth: number, tilt: number, verticalFovDeg: number, aspect: number, margin = 1.03): number {
  const forward = cameraDirection(azimuth, tilt).negate()
  const right = new Vector3().crossVectors(forward, UP_AXIS)
  if (right.lengthSq() < 1e-8) right.set(Math.cos(azimuth), 0, -Math.sin(azimuth))
  right.normalize()
  const up = new Vector3().crossVectors(right, forward)
  const tanVertical = Math.tan((verticalFovDeg * Math.PI) / 360)
  const tanHorizontal = tanVertical * aspect

  const distance = Math.max(
    ...FIT_POINTS.map((point) => {
      const relative = point.clone().sub(CAMERA_TARGET)
      const depthOffset = relative.dot(forward)
      return Math.max(
        Math.abs(relative.dot(right)) / tanHorizontal - depthOffset,
        Math.abs(relative.dot(up)) / tanVertical - depthOffset
      )
    })
  )
  return distance * margin
}

/** Vị trí camera: tâm nhìn + hướng × khoảng cách. */
export function cameraPosition(azimuth: number, tilt: number, distance: number): Vector3 {
  return cameraDirection(azimuth, tilt).multiplyScalar(distance).add(CAMERA_TARGET)
}

/** Pháp tuyến của từng mặt xúc xắc trong hệ toạ độ của xúc xắc. Mặt đối diện cộng lại bằng 7. */
export const DICE_FACE_NORMALS: Record<number, Vector3> = {
  1: new Vector3(0, 1, 0),
  6: new Vector3(0, -1, 0),
  2: new Vector3(1, 0, 0),
  5: new Vector3(-1, 0, 0),
  3: new Vector3(0, 0, 1),
  4: new Vector3(0, 0, -1),
}

/** Hướng xoay để mặt `value` ngửa lên trên, cộng thêm góc xoay ngang `yaw` (không đổi mặt ngửa). */
export function diceRestQuaternion(value: number, yaw = 0): Quaternion {
  const faceUp = new Quaternion().setFromUnitVectors(DICE_FACE_NORMALS[value] ?? UP_AXIS, UP_AXIS)
  return new Quaternion().setFromAxisAngle(UP_AXIS, yaw).multiply(faceUp)
}

/** Góc quay quanh Y để quân (mô hình nhìn về −X) nhìn theo hướng (dx, dz). */
export function headingFor(dx: number, dz: number): number {
  return Math.atan2(dz, -dx)
}

/**
 * Hướng quân khi đứng yên: nghiêng ba phần tư về phía người xem, mõm chỉ sang trái màn hình,
 * để luôn thấy dáng nghiêng của quân (nhìn từ sau chỉ là một khối tròn).
 */
export function restHeading(viewerAzimuth: number): number {
  return viewerAzimuth + 0.45
}

/** Nội suy góc theo đường ngắn nhất. */
export function lerpAngle(from: number, to: number, t: number): number {
  const delta = Math.atan2(Math.sin(to - from), Math.cos(to - from))
  return from + delta * t
}
