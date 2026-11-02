import {
  CanvasTexture,
  Color,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  type Material,
} from "three"

import { PLAYER_COLORS, type PlayerColor } from "../game/constants"
import type { BoardStyle } from "../store/ludo-settings.store"

// ─── Texture vẽ bằng canvas (không tải file ảnh) ───────────────────────────────────────────────

/** PRNG cố định để vân gỗ / đá giống nhau mỗi lần tải. */
function seededRandom(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 2 ** 32
    return seed / 2 ** 32
  }
}

function canvasTexture(size: number, draw: (ctx: CanvasRenderingContext2D, size: number) => void, repeat = 1) {
  const canvas = document.createElement("canvas")
  canvas.width = size
  canvas.height = size
  draw(canvas.getContext("2d")!, size)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = RepeatWrapping
  texture.repeat.set(repeat, repeat)
  texture.anisotropy = 8
  return texture
}

/** Vân gỗ: nền chuyển sắc và các thớ gợn sóng. */
function woodTexture(light: string, dark: string, seed: number) {
  return canvasTexture(1024, (ctx, size) => {
    const random = seededRandom(seed)
    const gradient = ctx.createLinearGradient(0, 0, size, size)
    gradient.addColorStop(0, light)
    gradient.addColorStop(1, dark)
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
    for (let i = 0; i < 260; i++) {
      const y = random() * size
      const amplitude = 3 + random() * 12
      const wavelength = 160 + random() * 420
      const phase = random() * Math.PI * 2
      ctx.beginPath()
      for (let x = 0; x <= size; x += 8) {
        const offset = Math.sin(x / wavelength + phase) * amplitude + Math.sin(x / 31 + i) * 1.2
        if (x === 0) ctx.moveTo(x, y + offset)
        else ctx.lineTo(x, y + offset)
      }
      ctx.strokeStyle =
        random() < 0.65 ? `rgba(20,10,4,${0.07 + random() * 0.2})` : `rgba(255,220,170,${0.04 + random() * 0.08})`
      ctx.lineWidth = 0.6 + random() * 2.2
      ctx.stroke()
    }
  })
}

/** Nỉ: nền đặc và nhiều chấm sáng tối li ti. */
function feltTexture(base: string, seed: number) {
  return canvasTexture(
    512,
    (ctx, size) => {
      const random = seededRandom(seed)
      ctx.fillStyle = base
      ctx.fillRect(0, 0, size, size)
      for (let i = 0; i < 22000; i++) {
        ctx.fillStyle = random() < 0.5 ? `rgba(255,255,255,${random() * 0.05})` : `rgba(0,0,0,${random() * 0.08})`
        ctx.fillRect(random() * size, random() * size, 1.5, 1.5)
      }
    },
    6
  )
}

/** Đá cẩm thạch: nền và các vân gãy khúc làm mờ. `vein` có chữ A thay cho độ trong suốt. */
function marbleTexture(base: string, vein: string, seed: number) {
  return canvasTexture(1024, (ctx, size) => {
    const random = seededRandom(seed)
    ctx.fillStyle = base
    ctx.fillRect(0, 0, size, size)
    ctx.filter = "blur(1.2px)"
    for (let i = 0; i < 46; i++) {
      let x = random() * size
      let y = random() * size
      ctx.beginPath()
      ctx.moveTo(x, y)
      for (let k = 0; k < 24; k++) {
        x += (random() - 0.3) * 60
        y += (random() - 0.5) * 60
        ctx.lineTo(x, y)
      }
      ctx.strokeStyle = vein.replace("A", (0.05 + random() * 0.25).toFixed(2))
      ctx.lineWidth = 0.5 + random() * 2.5
      ctx.stroke()
    }
    ctx.filter = "none"
  })
}

/** Đốm sáng tròn mờ dần cho hạt hiệu ứng. */
export function sparkTexture() {
  return canvasTexture(64, (ctx, size) => {
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    gradient.addColorStop(0, "rgba(255,255,255,1)")
    gradient.addColorStop(0.35, "rgba(255,255,255,0.6)")
    gradient.addColorStop(1, "rgba(255,255,255,0)")
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  })
}

// ─── Ba phong cách ─────────────────────────────────────────────────────────────────────────────

interface StyleSpec {
  /** Nền và sương mờ xa: mặt bàn chơi tan dần vào màu này. */
  background: string
  table: () => Material
  slab: () => Material
  plate: string
  /** null = mặt ô cẩm thạch (texture). */
  tile: string | null
  tileClearcoat: number
  inner: string
  metal: { color: string; roughness: number }
  colors: Record<PlayerColor, string>
  piece: { roughness: number; clearcoat: number; clearcoatRoughness: number }
  /** Bờm / vây dát vàng hay theo màu quân. */
  gildedTrim: boolean
  felt: string
}

const STYLES: Record<BoardStyle, StyleSpec> = {
  walnut: {
    background: "#0c1210",
    table: () => new MeshStandardMaterial({ map: feltTexture("#1d4a37", 3), roughness: 1 }),
    slab: () =>
      new MeshPhysicalMaterial({
        map: woodTexture("#6b3f22", "#3a1f0e", 7),
        roughness: 0.45,
        clearcoat: 0.8,
        clearcoatRoughness: 0.18,
      }),
    plate: "#e9dcc0",
    tile: "#fbf5e6",
    tileClearcoat: 0.35,
    inner: "#fbf5e6",
    metal: { color: "#c9a14a", roughness: 0.32 },
    colors: { red: "#d1242f", green: "#1f9a4b", yellow: "#e8ad0b", blue: "#1f66cc" },
    piece: { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 },
    gildedTrim: false,
    felt: "#163a2b",
  },
  lacquer: {
    background: "#0d0807",
    table: () =>
      new MeshPhysicalMaterial({ map: woodTexture("#3a2214", "#1a0d06", 21), roughness: 0.6, clearcoat: 0.4 }),
    slab: () => new MeshPhysicalMaterial({ color: "#0b0908", roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.05 }),
    plate: "#2a0c08",
    tile: "#16100d",
    tileClearcoat: 1,
    inner: "#1b1210",
    metal: { color: "#e2b347", roughness: 0.22 },
    colors: { red: "#b3121b", green: "#0f7a5a", yellow: "#d9a21b", blue: "#1d4f9c" },
    piece: { roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04 },
    gildedTrim: true,
    felt: "#3a0a0a",
  },
  marble: {
    background: "#111318",
    table: () => new MeshStandardMaterial({ map: feltTexture("#2a2e36", 9), roughness: 0.9 }),
    slab: () =>
      new MeshPhysicalMaterial({
        map: marbleTexture("#1f3a33", "rgba(200,230,220,A)", 5),
        roughness: 0.25,
        clearcoat: 0.9,
        clearcoatRoughness: 0.1,
      }),
    plate: "#d9d6cf",
    tile: null,
    tileClearcoat: 0.9,
    inner: "#f4f2ee",
    metal: { color: "#b98a3e", roughness: 0.28 },
    colors: { red: "#c92a3a", green: "#22935f", yellow: "#e0a91c", blue: "#2a62c7" },
    piece: { roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.03 },
    gildedTrim: false,
    felt: "#2a2e36",
  },
}

/** Màu chuồng / ô của màu không có người chơi: xỉn và tối đi, giống bản 2D làm tối chuồng. */
const INACTIVE_TINT = new Color("#3b3d48")

export interface StyleMaterials {
  background: string
  table: Material
  slab: Material
  plate: Material
  tile: Material
  inner: Material
  metal: Material
  felt: Material
  /** Ô / khung chuồng / mặt tháp theo màu (đã làm tối nếu màu không chơi). */
  colored: Record<PlayerColor, Material>
  /** Thân quân, bờm (hoặc vây) theo màu. */
  pieceBody: Record<PlayerColor, Material>
  pieceTrim: Record<PlayerColor, Material>
  pieceFin: Record<PlayerColor, Material>
  pieceBase: Material
  eye: Material
  glint: Material
  diceBody: Material
  pip: Material
  pipOne: Material
  dispose: () => void
}

const physical = (color: Color | string, options: Record<string, unknown> = {}) =>
  new MeshPhysicalMaterial({ color, roughness: 0.4, ...options })

/** Tạo toàn bộ vật liệu cho một phong cách. Gọi `dispose` khi đổi phong cách / gỡ bàn. */
export function createStyleMaterials(style: BoardStyle, activeColors: readonly PlayerColor[]): StyleMaterials {
  const spec = STYLES[style]
  const metal = physical(spec.metal.color, { metalness: 1, roughness: spec.metal.roughness })
  const tile = spec.tile
    ? physical(spec.tile, { roughness: 0.42, clearcoat: spec.tileClearcoat, clearcoatRoughness: 0.15 })
    : new MeshPhysicalMaterial({
        map: marbleTexture("#f2f0eb", "rgba(120,120,130,A)", 17),
        roughness: 0.2,
        clearcoat: 0.9,
        clearcoatRoughness: 0.08,
      })

  const byColor = (make: (color: PlayerColor) => Material) =>
    Object.fromEntries(PLAYER_COLORS.map((color) => [color, make(color)])) as Record<PlayerColor, Material>
  const tone = (color: PlayerColor) => new Color(spec.colors[color])

  const materials: Omit<StyleMaterials, "dispose" | "background"> = {
    table: spec.table(),
    slab: spec.slab(),
    plate: physical(spec.plate, { roughness: 0.6 }),
    tile,
    inner: physical(spec.inner, { roughness: 0.5, clearcoat: spec.tileClearcoat }),
    metal,
    felt: physical(spec.felt, { roughness: 1 }),
    colored: byColor((color) =>
      physical(activeColors.includes(color) ? tone(color) : tone(color).lerp(INACTIVE_TINT, 0.72), {
        roughness: 0.32,
        clearcoat: 0.8,
        clearcoatRoughness: 0.12,
      })
    ),
    pieceBody: byColor((color) => physical(tone(color), spec.piece)),
    pieceTrim: byColor((color) => (spec.gildedTrim ? metal : physical(tone(color).multiplyScalar(0.45), spec.piece))),
    pieceFin: byColor((color) =>
      spec.gildedTrim ? metal : physical(tone(color).lerp(new Color("#ffffff"), 0.45), { ...spec.piece, roughness: 0.35 })
    ),
    pieceBase: physical("#1a1a1a", { roughness: 1 }),
    eye: physical("#06070c", { roughness: 0.08, clearcoat: 1 }),
    glint: new MeshBasicMaterial({ color: "#ffffff" }),
    diceBody: physical("#f6f0e1", { roughness: 0.25, clearcoat: 0.9, clearcoatRoughness: 0.12 }),
    pip: physical("#14161d", { roughness: 0.5 }),
    pipOne: physical("#c4161c", { roughness: 0.45 }),
  }

  const dispose = () => {
    const seen = new Set<Material>()
    const collect = (value: unknown) => {
      if (!value || typeof value !== "object") return
      if ("isMaterial" in value) seen.add(value as Material)
      else Object.values(value).forEach(collect)
    }
    collect(materials)
    for (const material of seen) {
      const map = (material as MeshStandardMaterial).map
      map?.dispose()
      material.dispose()
    }
  }

  return { ...materials, background: spec.background, dispose }
}
