"use client"

import { useEffect, useRef, useState } from "react"
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import type { Group, MeshBasicMaterial } from "three"

import type { PlayerColor } from "../game/constants"
import { getCommonPieceGeometry, type PieceKit } from "./piece-geometry"
import type { StyleMaterials } from "./styles"
import { headingFor, lerpAngle } from "./scene-math"

/** Kiểu chuyển động khi quân đổi chỗ. */
type MotionKind = "step" | "flight" | "pounce" | "knock"

const MOTION: Record<MotionKind, { seconds: number; height: number }> = {
  /** Một ô: khớp nhịp STEP_MS của animator (210 ms). */
  step: { seconds: 0.21, height: 0.32 },
  /** Quãng dài (ra quân): bay cung. */
  flight: { seconds: 0.62, height: 1.3 },
  /** Đá quân: bật cao rồi bổ xuống ô đối thủ, vừa khớp STEP_MS + CAPTURE_IMPACT_MS của animator. */
  pounce: { seconds: 0.52, height: 1.9 },
  /** Bị đá: văng cao, lộn vòng, rơi về chuồng. */
  knock: { seconds: 1, height: 3.4 },
}
/** Xa hơn khoảng này (đơn vị ô) thì coi là bay chứ không phải bước. */
const STEP_DISTANCE = 1.6
/** Vòng sáng quân chọn được: vàng, nổi trên mọi màu chuồng. */
const HALO_COLOR = "#fde047"

interface Token3DProps {
  color: PlayerColor
  /** Vị trí đích (mặt đặt quân). */
  x: number
  y: number
  z: number
  /** Thu nhỏ khi nhiều quân chung một điểm (đích). */
  scale: number
  movable: boolean
  /** Bước này đáp xuống ô có quân đối thủ: bổ nhào. */
  pounce: boolean
  /** Quân vừa bị đá: bay về chuồng kiểu văng lộn vòng. */
  knocked: boolean
  /** Hướng khi đứng yên (quay nghiêng về phía người xem). */
  restHeading: number
  kit: PieceKit
  materials: StyleMaterials
  onChoose: () => void
}

interface Motion {
  kind: MotionKind
  fromX: number
  fromY: number
  fromZ: number
  start: number
  heading: number
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/** Độ cao cung bay (0..1) tại t ∈ [0, 1]. Bổ nhào: lên nhanh tới đỉnh rồi lao xuống ngày càng nhanh. */
function arc(kind: MotionKind, t: number) {
  if (kind !== "pounce") return Math.sin(Math.PI * t)
  return t < 0.45 ? Math.sin((Math.PI / 2) * (t / 0.45)) : Math.cos((Math.PI / 2) * ((t - 0.45) / 0.55)) ** 1.6
}

export function Token3D({
  color,
  x,
  y,
  z,
  scale,
  movable,
  pounce,
  knocked,
  restHeading,
  kit,
  materials,
  onChoose,
}: Token3DProps) {
  const common = getCommonPieceGeometry()
  const outer = useRef<Group>(null)
  const body = useRef<Group>(null)
  const tumbler = useRef<Group>(null)
  const halo = useRef<MeshBasicMaterial>(null)
  const motion = useRef<Motion | null>(null)
  /** Lần đáp đất gần nhất, để nén quân (squash) một nhịp. */
  const landedAt = useRef<{ time: number; strength: number } | null>(null)
  /** Tỉ lệ chưa tính nhịp nén khi đáp đất. */
  const baseScale = useRef(scale * kit.scale)
  // Kiểu chuyển động đọc ở đúng lúc đích đổi, không làm effect di chuyển chạy lại khi chỉ cờ này đổi.
  const motionFlags = useRef({ pounce, knocked })
  const invalidate = useThree((state) => state.invalidate)

  // Khai báo trước effect di chuyển để chạy trước nó trong cùng lần commit.
  useEffect(() => {
    motionFlags.current = { pounce, knocked }
  }, [pounce, knocked])
  // Vị trí ban đầu chỉ đặt một lần; sau đó useFrame tự di chuyển, không để prop ghi đè giữa hoạt cảnh.
  const [initialPosition] = useState<[number, number, number]>(() => [x, y, z])
  const [initialHeading] = useState(restHeading)

  // Đích thay đổi: bắt đầu chuyển động từ chỗ đang đứng (kể cả đang bay dở) tới đích mới.
  useEffect(() => {
    const object = outer.current
    if (!object) return
    const dx = x - object.position.x
    const dz = z - object.position.z
    const distance = Math.hypot(dx, dz)
    if (distance < 1e-3 && Math.abs(y - object.position.y) < 1e-3) return
    const flags = motionFlags.current
    const kind: MotionKind = flags.knocked ? "knock" : flags.pounce ? "pounce" : distance > STEP_DISTANCE ? "flight" : "step"
    motion.current = {
      kind,
      fromX: object.position.x,
      fromY: object.position.y,
      fromZ: object.position.z,
      start: performance.now() / 1000,
      heading: distance > 1e-3 ? headingFor(dx, dz) : (body.current?.rotation.y ?? 0),
    }
    invalidate()
  }, [x, y, z, invalidate])

  useEffect(() => invalidate(), [restHeading, scale, movable, invalidate])

  useFrame((state) => {
    const object = outer.current
    const inner = body.current
    const tumble = tumbler.current
    if (!object || !inner || !tumble) return
    const now = performance.now() / 1000
    let animating = false
    let lift = 0
    let squash = 0
    let targetHeading = restHeading

    const current = motion.current
    if (current) {
      const { seconds, height } = MOTION[current.kind]
      const t = Math.min(1, (now - current.start) / seconds)
      const eased = easeInOut(t)
      object.position.set(
        current.fromX + (x - current.fromX) * eased,
        current.fromY + (y - current.fromY) * eased + arc(current.kind, t) * height,
        current.fromZ + (z - current.fromZ) * eased
      )
      targetHeading = current.heading
      if (current.kind === "knock") {
        tumble.rotation.x = -t * Math.PI * 4
        tumble.rotation.z = Math.sin(t * Math.PI) * 0.6
      }
      if (t >= 1) {
        motion.current = null
        tumble.rotation.set(0, 0, 0)
        if (current.kind !== "step") {
          const strength = current.kind === "pounce" ? 0.28 : current.kind === "knock" ? 0.2 : 0.12
          landedAt.current = { time: now, strength }
        }
      }
      animating = true
    }

    const landing = landedAt.current
    if (landing) {
      const t = (now - landing.time) / 0.22
      if (t >= 1) landedAt.current = null
      else squash = Math.sin(Math.PI * t) * landing.strength
      animating = true
    }

    if (movable && !current) {
      lift = (Math.sin(now * 6) + 1) * 0.06
      if (halo.current) halo.current.opacity = 0.45 + Math.sin(now * 6) * 0.25
      animating = true
    }

    inner.position.y = lift
    const turned = lerpAngle(inner.rotation.y, targetHeading, current ? 0.35 : 0.12)
    if (Math.abs(turned - targetHeading) > 1e-3) animating = true
    inner.rotation.y = turned

    const targetScale = scale * kit.scale
    baseScale.current += (targetScale - baseScale.current) * 0.25
    if (Math.abs(baseScale.current - targetScale) < 1e-3) baseScale.current = targetScale
    else animating = true
    const size = baseScale.current
    inner.scale.set(size * (1 + squash * 0.5), size * (1 - squash), size * (1 + squash * 0.5))

    if (animating) state.invalidate()
  })

  const choose = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (movable) onChoose()
  }

  const roleMaterial = { body: materials.pieceBody[color], trim: materials.pieceTrim[color], fin: materials.pieceFin[color] }
  const [eyeX, eyeY, eyeZ] = kit.eye

  return (
    <group ref={outer} position={initialPosition}>
      {movable && (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.012, 0]}>
          <ringGeometry args={[0.4, 0.56, 48]} />
          <meshBasicMaterial ref={halo} color={HALO_COLOR} transparent opacity={0.7} depthWrite={false} />
        </mesh>
      )}

      <group ref={body} rotation-y={initialHeading} scale={scale * kit.scale}>
        {/* Lộn vòng quanh giữa thân chứ không quanh đáy. */}
        <group ref={tumbler} position={[0, 0.5, 0]}>
          <group position={[0, -0.5, 0]}>
            <mesh geometry={common.pedestal} material={materials.pieceBody[color]} castShadow receiveShadow />
            <mesh geometry={common.collar} material={materials.metal} castShadow />
            <mesh geometry={common.felt} material={materials.pieceBase} />
            {kit.parts.map((part, index) => (
              <mesh
                key={index}
                geometry={part.geometry}
                material={roleMaterial[part.role]}
                position={[0, 0, part.offsetZ ?? 0]}
                castShadow
                receiveShadow
              />
            ))}
            {[1, -1].map((side) => (
              <group key={side}>
                <mesh geometry={common.eye} material={materials.eye} position={[eyeX, eyeY, eyeZ * side]} />
                <mesh
                  geometry={common.glint}
                  material={materials.glint}
                  position={[eyeX - 0.012, eyeY + 0.014, (eyeZ + 0.028) * side]}
                />
                {kit.nostril && (
                  <mesh
                    geometry={common.nostril}
                    material={materials.eye}
                    position={[kit.nostril[0], kit.nostril[1], kit.nostril[2] * side]}
                  />
                )}
              </group>
            ))}
          </group>
        </group>
      </group>

      {/* Vùng bấm rộng hơn quân để dễ chạm trên điện thoại. */}
      <mesh
        position={[0, 0.55, 0]}
        onClick={choose}
        onPointerOver={(event) => {
          event.stopPropagation()
          if (movable) document.body.style.cursor = "pointer"
        }}
        onPointerOut={() => {
          document.body.style.cursor = ""
        }}
      >
        <cylinderGeometry args={[0.5, 0.5, 1.2, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  )
}
