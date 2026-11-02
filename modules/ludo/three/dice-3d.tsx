"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { CylinderGeometry, Quaternion, Vector3, type Group, type MeshBasicMaterial } from "three"
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js"

import { COLOR_HEX, type PlayerColor } from "../game/constants"
import type { StyleMaterials } from "./styles"
import { DICE_FACE_NORMALS, DICE_SIZE, diceRestQuaternion } from "./scene-math"

/** Vị trí chấm trên lưới 3x3 (0..8) cho từng mặt, giống xúc xắc 2D. */
const PIPS: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

const PIP_SPACING = DICE_SIZE * 0.27
const SETTLE_SECONDS = 0.35
const UP = new Vector3(0, 1, 0)

interface PipPlacement {
  key: string
  value: number
  position: [number, number, number]
  quaternion: [number, number, number, number]
}

/** Toạ độ từng chấm (đĩa dẹt nằm sát mặt) trong hệ toạ độ của xúc xắc. */
function pipPlacements(): PipPlacement[] {
  return Object.entries(PIPS).flatMap(([face, cells]) => {
    const value = Number(face)
    const normal = DICE_FACE_NORMALS[value]
    const tangent = Math.abs(normal.y) > 0.9 ? new Vector3(1, 0, 0) : new Vector3().crossVectors(normal, UP).normalize()
    const bitangent = new Vector3().crossVectors(normal, tangent)
    const orientation = new Quaternion().setFromUnitVectors(UP, normal)
    return cells.map((cell) => {
      const column = (cell % 3) - 1
      const row = Math.floor(cell / 3) - 1
      const position = normal
        .clone()
        .multiplyScalar(DICE_SIZE / 2 - 0.004)
        .addScaledVector(tangent, column * PIP_SPACING)
        .addScaledVector(bitangent, row * PIP_SPACING)
      return {
        key: `${value}-${cell}`,
        value,
        position: position.toArray() as [number, number, number],
        quaternion: orientation.toArray() as [number, number, number, number],
      }
    })
  })
}

const PIP_PLACEMENTS = pipPlacements()

interface Dice3DProps {
  color: PlayerColor
  position: [number, number, number]
  value: number
  rolling: boolean
  /** Màu đang tới lượt: có vòng màu dưới xúc xắc. */
  isTurn: boolean
  /** Máy này được bấm tung ngay lúc này: vòng nhấp nháy, bấm vào xúc xắc để tung. */
  canRoll: boolean
  onRoll: () => void
  materials: StyleMaterials
}

/**
 * Xúc xắc 3D: khi lắc thì nảy và xoay tự do, hết lắc thì xoay mượt về đúng mặt `value` do engine quyết định,
 * nên mọi máy trong phòng thấy cùng một kết quả.
 */
export function Dice3D({ color, position, value, rolling, isTurn, canRoll, onRoll, materials }: Dice3DProps) {
  const body = useRef<Group>(null)
  const ring = useRef<MeshBasicMaterial>(null)
  const invalidate = useThree((state) => state.invalidate)

  const geometry = useMemo(() => new RoundedBoxGeometry(DICE_SIZE, DICE_SIZE, DICE_SIZE, 5, DICE_SIZE * 0.14), [])
  const pipGeometry = useMemo(() => new CylinderGeometry(DICE_SIZE * 0.085, DICE_SIZE * 0.085, 0.012, 20), [])
  const pipOneGeometry = useMemo(() => new CylinderGeometry(DICE_SIZE * 0.13, DICE_SIZE * 0.13, 0.012, 28), [])
  const [initialQuaternion] = useState(() => diceRestQuaternion(value).toArray() as [number, number, number, number])

  const spin = useRef({ axis: new Vector3(1, 0.4, 0.2).normalize(), speed: 14 })
  const settle = useRef<{ from: Quaternion; to: Quaternion; start: number } | null>(null)

  useEffect(
    () => () => {
      geometry.dispose()
      pipGeometry.dispose()
      pipOneGeometry.dispose()
    },
    [geometry, pipGeometry, pipOneGeometry]
  )

  // Hết lắc (hoặc mặt đổi): xoay về mặt kết quả, kèm góc ngang ngẫu nhiên cho tự nhiên.
  useEffect(() => {
    if (rolling) {
      spin.current = {
        axis: new Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize(),
        speed: 12 + Math.random() * 6,
      }
      settle.current = null
    } else if (body.current) {
      settle.current = {
        from: body.current.quaternion.clone(),
        to: diceRestQuaternion(value, (Math.random() - 0.5) * 0.6),
        start: performance.now() / 1000,
      }
    }
    invalidate()
  }, [rolling, value, invalidate])

  useEffect(() => invalidate(), [canRoll, isTurn, invalidate])

  useFrame((state, delta) => {
    const dice = body.current
    if (!dice) return
    const now = performance.now() / 1000
    let animating = false

    if (rolling) {
      dice.quaternion.premultiply(new Quaternion().setFromAxisAngle(spin.current.axis, spin.current.speed * delta))
      dice.position.y = Math.abs(Math.sin(now * 9)) * 0.55
      animating = true
    } else if (settle.current) {
      const t = Math.min(1, (now - settle.current.start) / SETTLE_SECONDS)
      const eased = 1 - (1 - t) ** 3
      dice.quaternion.slerpQuaternions(settle.current.from, settle.current.to, eased)
      dice.position.y *= 1 - eased
      if (t >= 1) {
        settle.current = null
        dice.position.y = 0
      }
      animating = true
    }

    if (ring.current) {
      ring.current.opacity = canRoll ? 0.55 + Math.sin(now * 5) * 0.35 : isTurn ? 0.45 : 0
      if (canRoll) animating = true
    }
    if (animating) state.invalidate()
  })

  return (
    <group position={position}>
      <mesh rotation-x={-Math.PI / 2} position={[0, -DICE_SIZE / 2 + 0.01, 0]}>
        {/* Nằm ngoài đệm nỉ và viền kim loại dưới xúc xắc. */}
        <ringGeometry args={[DICE_SIZE * 1.0, DICE_SIZE * 1.28, 48]} />
        <meshBasicMaterial ref={ring} color={COLOR_HEX[color].base} transparent opacity={0} depthWrite={false} />
      </mesh>

      <group
        ref={body}
        quaternion={initialQuaternion}
        onClick={(event) => {
          event.stopPropagation()
          if (canRoll) onRoll()
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          if (canRoll) document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = ""
        }}
      >
        <mesh geometry={geometry} material={materials.diceBody} castShadow receiveShadow />
        {PIP_PLACEMENTS.map((pip) => (
          <mesh
            key={pip.key}
            geometry={pip.value === 1 ? pipOneGeometry : pipGeometry}
            material={pip.value === 1 ? materials.pipOne : materials.pip}
            position={pip.position}
            quaternion={pip.quaternion}
          />
        ))}
      </group>
    </group>
  )
}
