import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  Shape,
  SphereGeometry,
  TorusGeometry,
  type Material,
} from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"

import { HOME_COLUMN_CELLS, MAIN_TRACK_CELLS, cellCenter, baseSlotPoint, type Cell } from "../game/board-geometry"
import { PLAYER_COLORS, SAFE_TRACK_INDICES, START_INDEX, type PlayerColor } from "../game/constants"
import type { StyleMaterials } from "./styles"
import {
  BASE_TOP,
  PLATE_TOP,
  PYRAMID_TOP,
  SLAB_SIZE,
  SLAB_TOP,
  SLOT_TOP,
  TILE_TOP,
  baseCenter,
  boardToWorld,
} from "./scene-math"

const TILE_SIZE = 0.92
const BASE_FRAME_SIZE = 5.7
const BASE_INNER_SIZE = 4.1

function starShape(): Shape {
  const shape = new Shape()
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 ? 0.15 : 0.36
    const angle = (i / 10) * Math.PI * 2 - Math.PI / 2
    if (i === 0) shape.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
    else shape.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius)
  }
  return shape
}

function arrowShape(): Shape {
  const shape = new Shape()
  shape.moveTo(0.3, 0)
  for (const [x, y] of [
    [0.02, -0.26],
    [0.02, -0.11],
    [-0.3, -0.11],
    [-0.3, 0.11],
    [0.02, 0.11],
    [0.02, 0.26],
  ]) {
    shape.lineTo(x, y)
  }
  shape.closePath()
  return shape
}

/** Khảm kim loại mỏng nằm trên mặt ô. */
const inlay = (shape: Shape) =>
  new ExtrudeGeometry(shape, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  }).rotateX(-Math.PI / 2)

/** Một mặt tam giác của tháp đích; thứ tự (góc sau, góc trước, đỉnh) cho pháp tuyến hướng ra ngoài và lên. */
function pyramidFace(back: number[], front: number[], apex: number[]): BufferGeometry {
  const geometry = new BufferGeometry()
  geometry.setAttribute("position", new Float32BufferAttribute([...back, ...front, ...apex], 3))
  geometry.computeVertexNormals()
  return geometry
}

export interface BoardModel {
  group: Group
  dispose: () => void
}

/**
 * Dựng bàn cờ khối thật theo lưới 15x15 của game: mặt bàn chơi, khối bàn, nẹp kim loại, ô nổi (ô xuất phát
 * tô màu và có mũi tên, ô an toàn khảm sao), đường về, chuồng có khung và 4 hốc, tháp đích 4 mặt, đệm xúc xắc.
 */
export function buildBoardModel(materials: StyleMaterials): BoardModel {
  const group = new Group()
  const geometries: BufferGeometry[] = []
  const track = <T extends BufferGeometry>(geometry: T) => {
    geometries.push(geometry)
    return geometry
  }
  const add = (geometry: BufferGeometry, material: Material, position: [number, number, number], options: { cast?: boolean; rotationY?: number } = {}) => {
    const mesh = new Mesh(geometry, material)
    mesh.position.set(...position)
    if (options.rotationY) mesh.rotation.y = options.rotationY
    mesh.castShadow = options.cast ?? true
    mesh.receiveShadow = true
    group.add(mesh)
    return mesh
  }

  add(track(new CircleGeometry(40, 96).rotateX(-Math.PI / 2)), materials.table, [0, 0, 0], { cast: false })
  add(track(new RoundedBoxGeometry(SLAB_SIZE, SLAB_TOP, SLAB_SIZE, 6, 0.28)), materials.slab, [0, SLAB_TOP / 2, 0])
  add(track(new RoundedBoxGeometry(15.5, 0.05, 15.5, 2, 0.02)), materials.metal, [0, SLAB_TOP + 0.01, 0])
  add(track(new BoxGeometry(15.2, PLATE_TOP - SLAB_TOP, 15.2)), materials.plate, [0, (SLAB_TOP + PLATE_TOP) / 2 + 0.02, 0], {
    cast: false,
  })

  const tile = track(new RoundedBoxGeometry(TILE_SIZE, TILE_TOP - PLATE_TOP + 0.02, TILE_SIZE, 2, 0.05))
  const star = track(inlay(starShape()))
  const arrow = track(inlay(arrowShape()))
  const tileY = (PLATE_TOP + TILE_TOP) / 2 + 0.01
  const placeTile = (cell: Cell, material: Material) => {
    const { x, z } = boardToWorld(cellCenter(cell))
    add(tile, material, [x, tileY, z], { cast: false })
    return { x, z }
  }

  const startOwner = new Map(PLAYER_COLORS.map((color) => [START_INDEX[color], color]))
  MAIN_TRACK_CELLS.forEach((cell, index) => {
    const owner = startOwner.get(index)
    const { x, z } = placeTile(cell, owner ? materials.colored[owner] : materials.tile)
    if (owner) {
      const next = boardToWorld(cellCenter(MAIN_TRACK_CELLS[(index + 1) % MAIN_TRACK_CELLS.length]))
      add(arrow, materials.metal, [x, TILE_TOP + 0.005, z], { rotationY: Math.atan2(-(next.z - z), next.x - x) })
    } else if (SAFE_TRACK_INDICES.has(index)) {
      add(star, materials.metal, [x, TILE_TOP + 0.005, z])
    }
  })

  const frame = track(new RoundedBoxGeometry(BASE_FRAME_SIZE, BASE_TOP - PLATE_TOP, BASE_FRAME_SIZE, 3, 0.2))
  const inner = track(new RoundedBoxGeometry(BASE_INNER_SIZE, 0.06, BASE_INNER_SIZE, 3, 0.18))
  const socket = track(new TorusGeometry(0.44, 0.04, 12, 48).rotateX(Math.PI / 2))
  const dicePad = track(new CylinderGeometry(0.62, 0.62, 0.03, 48))
  const dicePadRing = track(new TorusGeometry(0.64, 0.035, 10, 64).rotateX(Math.PI / 2))
  for (const color of PLAYER_COLORS) {
    for (const cell of HOME_COLUMN_CELLS[color]) placeTile(cell, materials.colored[color])

    const center = boardToWorld(baseCenter(color))
    add(frame, materials.colored[color], [center.x, (PLATE_TOP + BASE_TOP) / 2 + 0.02, center.z])
    add(inner, materials.inner, [center.x, BASE_TOP + 0.02, center.z], { cast: false })
    for (let slot = 0; slot < 4; slot++) {
      const point = boardToWorld(baseSlotPoint(color, slot))
      add(socket, materials.metal, [point.x, SLOT_TOP - 0.01, point.z], { cast: false })
    }
    add(dicePad, materials.felt, [center.x, BASE_TOP + 0.065, center.z], { cast: false })
    add(dicePadRing, materials.metal, [center.x, BASE_TOP + 0.07, center.z], { cast: false })
  }

  // Tháp đích: mỗi mặt quay về đường về của màu đó.
  const half = 1.5
  const base = PLATE_TOP + 0.02
  const apex = [0, PYRAMID_TOP, 0]
  const corner = { nw: [-half, base, -half], ne: [half, base, -half], se: [half, base, half], sw: [-half, base, half] }
  const faces: Record<PlayerColor, [number[], number[]]> = {
    red: [corner.nw, corner.ne],
    green: [corner.ne, corner.se],
    yellow: [corner.se, corner.sw],
    blue: [corner.sw, corner.nw],
  }
  for (const color of PLAYER_COLORS) {
    const [front, back] = faces[color]
    add(track(pyramidFace(back, front, apex)), materials.colored[color], [0, 0, 0])
  }
  add(track(new SphereGeometry(0.12, 24, 16)), materials.metal, [0, PYRAMID_TOP + 0.02, 0])

  return {
    group,
    dispose: () => geometries.forEach((geometry) => geometry.dispose()),
  }
}
