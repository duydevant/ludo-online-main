import {
  CircleGeometry,
  CubicBezierCurve,
  CurvePath,
  ExtrudeGeometry,
  LatheGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  type BufferGeometry,
} from "three"
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js"
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js"

import type { PieceKind } from "../store/ludo-settings.store"

/**
 * Quân cờ dựng bằng code. Mỗi hình vẽ trong khung 100x100 (y hướng xuống, mõm quay sang trái), đùn thành khối
 * rồi "nặn": bóp bề dày theo vùng (mõm thon, đầu hẹp hơn cổ...) và gộp đỉnh để mặt cong mượt như tượng tiện.
 * Mô hình nhìn về −X, đế tâm ở gốc toạ độ, cao khoảng 1 ô.
 */
export const PEDESTAL_TOP = 0.38

type Taper = (x: number, y: number) => number
type Segment = [[number, number], [number, number], [number, number], [number, number]]

interface PieceSpec {
  scale: number
  anchor: [number, number]
  depth: number
  bevel: number
  taper: Taper
}

function shapesFrom(path: string): Shape[] {
  const svg = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${path}"/></svg>`)
  return svg.paths.flatMap((item) => item.toShapes())
}

function sculpt(source: string | Shape[], spec: PieceSpec): BufferGeometry {
  const shapes = typeof source === "string" ? shapesFrom(source) : source
  let geometry: BufferGeometry = new ExtrudeGeometry(shapes, {
    depth: spec.depth,
    bevelEnabled: true,
    bevelThickness: spec.bevel,
    bevelSize: spec.bevel * 0.75,
    bevelSegments: 6,
    curveSegments: 36,
  })
  geometry.translate(-spec.anchor[0], -spec.anchor[1], -spec.depth / 2)
  geometry.rotateX(Math.PI) // lật khung SVG (y xuống) thành y lên mà không soi gương
  geometry.scale(spec.scale, spec.scale, spec.scale)
  const position = geometry.attributes.position
  for (let i = 0; i < position.count; i++) {
    position.setZ(i, position.getZ(i) * spec.taper(position.getX(i), position.getY(i)))
  }
  geometry.deleteAttribute("normal")
  geometry.deleteAttribute("uv")
  geometry = mergeVertices(geometry, 1e-4)
  geometry.translate(0, PEDESTAL_TOP, 0)
  geometry.computeVertexNormals()
  return geometry
}

function bezierPath(...segments: Segment[]): CurvePath<Vector2> {
  const path = new CurvePath<Vector2>()
  for (const [a, b, c, d] of segments) {
    path.add(new CubicBezierCurve(new Vector2(...a), new Vector2(...b), new Vector2(...c), new Vector2(...d)))
  }
  return path
}

/** Dải tua chạy dọc một đường cong: mép trong ôm sát đường cong, mép ngoài răng cưa (bờm, vây). */
function fringeShape(
  curve: CurvePath<Vector2>,
  { segments, inset, short, long }: { segments: number; inset: number; short: number; long: number }
): Shape[] {
  const inner: Vector2[] = []
  const outer: Vector2[] = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const point = curve.getPointAt(t)
    const tangent = curve.getTangentAt(t)
    const normal = new Vector2(tangent.y, -tangent.x) // phía lưng (ra ngoài) trong khung y-xuống
    const fade = Math.sqrt(Math.sin(Math.PI * Math.min(1, t * 1.15)))
    inner.push(point.clone().addScaledVector(normal, -inset))
    outer.push(point.clone().addScaledVector(normal, (i % 2 ? long : short) * fade))
  }
  const shape = new Shape()
  shape.moveTo(inner[0].x, inner[0].y)
  for (const point of [...inner.slice(1), ...outer.reverse()]) shape.lineTo(point.x, point.y)
  shape.closePath()
  return [shape]
}

const flat: Taper = () => 1

const HORSE: PieceSpec & { body: string; ear: string; forelock: string; crest: CurvePath<Vector2> } = {
  scale: 0.0094,
  anchor: [50, 80],
  depth: 26,
  bevel: 7,
  body: "M28 80 C31 68 36 60 40 54 C34 56 27 58 21 56 C14 54 9 49 10 43 C11 37 15 33 20 29 C25 23 30 17 36 13 C40 10 45 9 50 9 C60 10 68 18 72 30 C76 42 76 56 74 66 C73 72 72 76 72 80 Z",
  crest: bezierPath(
    [[49, 10], [60, 10], [68, 18], [72, 30]],
    [[72, 30], [76, 42], [76, 56], [74, 66]],
    [[74, 66], [73, 72], [72, 76], [72, 80]]
  ),
  ear: "M41 14 L45 0 L52 11 Z",
  forelock: "M37 15 L41 23 L44 14 L49 20 L50 10 L42 9 Z",
  taper(x, y) {
    let factor = 1
    if (x < -0.12) factor *= 1 - Math.min(0.42, (-x - 0.12) * 1.7) // mõm thon dần
    if (y > 0.42) factor *= 1 - Math.min(0.28, (y - 0.42) * 1.1) // đầu hẹp hơn cổ
    if (y < 0.12) factor *= 1 + (0.12 - y) * 1.4 // chân cổ loe ra đế
    return factor
  },
}

const SEAHORSE: PieceSpec & { body: string; fin: CurvePath<Vector2> } = {
  scale: 0.0082,
  anchor: [40, 92],
  depth: 24,
  bevel: 6,
  body: "M46 92 C40 84 42 76 46 70 C34 66 28 56 30 46 C31 38 35 33 38 30 C30 31 22 31 16 30 C12 30 9 28 10 25 C11 22 15 22 20 23 C26 23 31 22 35 21 C35 15 38 11 42 9 L44 3 L48 8 L52 2 L55 9 C60 11 62 17 60 23 C64 28 68 36 66 46 C65 56 60 64 56 70 C62 73 67 79 63 86 C60 91 53 92 46 92 Z",
  fin: bezierPath([[64, 34], [69, 42], [70, 52], [65, 62]]),
  taper(x, y) {
    let factor = 1
    if (x < -0.1) factor *= 1 - Math.min(0.58, (-x - 0.1) * 2.6) // vòi nhỏ dần
    if (y < 0.16) factor *= 1 - Math.min(0.45, (0.16 - y) * 2.6) // đuôi thon
    if (y > 0.16 && y < 0.5) factor *= 1 + 0.07 * Math.sin(y * 75) // ngấn thân
    return factor
  },
}

/** Điểm (x, y) trong khung 100x100 → điểm trên bề mặt bên phải của thân, để gắn mắt / lỗ mũi. */
function surfacePoint(spec: PieceSpec, [px, py]: [number, number], inset = 0.012): [number, number, number] {
  const x = (px - spec.anchor[0]) * spec.scale
  const y = (spec.anchor[1] - py) * spec.scale
  const z = (spec.depth / 2 + spec.bevel) * spec.scale * spec.taper(x, y) - inset
  return [x, y + PEDESTAL_TOP, z]
}

/** Vai trò vật liệu của từng phần: thân theo màu, bờm / vây là tông tối / sáng (hoặc dát vàng). */
export type PartRole = "body" | "trim" | "fin"

export interface PiecePart {
  role: PartRole
  geometry: BufferGeometry
  offsetZ?: number
}

export interface PieceKit {
  parts: PiecePart[]
  /** Toạ độ mắt / lỗ mũi bên phải; bên trái lấy đối xứng qua z. */
  eye: [number, number, number]
  nostril: [number, number, number] | null
  /** Phóng to cả quân cho cân với ô 1x1. */
  scale: number
}

/** Phần dùng chung cho mọi kiểu quân: đế tiện tròn, vòng cổ kim loại, đáy nỉ, mắt. */
export interface CommonPieceGeometry {
  pedestal: BufferGeometry
  collar: BufferGeometry
  felt: BufferGeometry
  eye: BufferGeometry
  glint: BufferGeometry
  nostril: BufferGeometry
}

/** Mặt cắt đế quân (bán kính, độ cao) để tiện tròn: chân rộng, các gờ, cổ thắt, đĩa đỡ. */
const PEDESTAL_PROFILE: [number, number][] = [
  [0.001, 0],
  [0.36, 0],
  [0.378, 0.02],
  [0.372, 0.055],
  [0.33, 0.08],
  [0.338, 0.108],
  [0.29, 0.135],
  [0.226, 0.185],
  [0.196, 0.25],
  [0.208, 0.29],
  [0.256, 0.312],
  [0.258, 0.34],
  [0.214, 0.364],
  [0.001, PEDESTAL_TOP],
]

let common: CommonPieceGeometry | null = null
const kits = new Map<PieceKind, PieceKit>()

export function getCommonPieceGeometry(): CommonPieceGeometry {
  common ??= {
    pedestal: new LatheGeometry(
      PEDESTAL_PROFILE.map(([radius, height]) => new Vector2(radius, height)),
      72
    ),
    collar: new TorusGeometry(0.236, 0.022, 12, 64).rotateX(Math.PI / 2).translate(0, 0.302, 0),
    felt: new CircleGeometry(0.35, 48).rotateX(Math.PI / 2).translate(0, 0.002, 0),
    eye: new SphereGeometry(0.036, 20, 14),
    glint: new SphereGeometry(0.011, 10, 8),
    nostril: new SphereGeometry(0.02, 12, 10),
  }
  return common
}

/** Hình của một kiểu quân (dựng một lần, dùng chung cho mọi quân). */
export function getPieceKit(kind: PieceKind): PieceKit {
  let kit = kits.get(kind)
  if (kit) return kit

  if (kind === "horse") {
    const thin = (depth: number, bevel: number) => ({ ...HORSE, depth, bevel, taper: flat })
    kit = {
      parts: [
        { role: "body", geometry: sculpt(HORSE.body, HORSE) },
        {
          role: "trim",
          geometry: sculpt(fringeShape(HORSE.crest, { segments: 26, inset: 4, short: 4, long: 9 }), thin(12, 3)),
        },
        { role: "trim", geometry: sculpt(HORSE.forelock, thin(14, 2)) },
        { role: "body", geometry: sculpt(HORSE.ear, thin(5, 2)), offsetZ: 0.07 },
        { role: "body", geometry: sculpt(HORSE.ear, thin(5, 2)), offsetZ: -0.07 },
      ],
      eye: surfacePoint(HORSE, [31, 22]),
      nostril: surfacePoint(HORSE, [13, 45], 0.006),
      scale: 1.12,
    }
  } else {
    kit = {
      parts: [
        { role: "body", geometry: sculpt(SEAHORSE.body, SEAHORSE) },
        {
          role: "fin",
          geometry: sculpt(fringeShape(SEAHORSE.fin, { segments: 14, inset: 3, short: 7, long: 11 }), {
            ...SEAHORSE,
            depth: 3,
            bevel: 1.2,
            taper: flat,
          }),
        },
      ],
      eye: surfacePoint(SEAHORSE, [41, 17]),
      nostril: null,
      scale: 1.18,
    }
  }
  kits.set(kind, kit)
  return kit
}
