"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { AdditiveBlending, BufferAttribute, BufferGeometry, Group, Points, PointsMaterial, Vector3 } from "three"

import { sparkTexture } from "./styles"
import { TILE_TOP } from "./scene-math"

export interface BurstRequest {
  position: Vector3
  color: string
  count?: number
  speed?: number
  /** Thời gian sống (giây). */
  life?: number
  size?: number
  /** Hệ số bắn lên cao (pháo sáng về đích > 1). */
  rise?: number
  /** Chờ bao lâu (giây) rồi mới nổ. */
  delay?: number
}

/** Hàng đợi yêu cầu nổ hạt: phần React ngoài Canvas đẩy vào, `Bursts3D` trong Canvas lấy ra để vẽ. */
export class BurstQueue {
  private pending: BurstRequest[] = []
  private wake: () => void = () => {}

  push(request: BurstRequest) {
    this.pending.push(request)
    this.wake()
  }

  /** Lấy hết yêu cầu đang chờ. */
  drain(): BurstRequest[] {
    return this.pending.splice(0)
  }

  /** Canvas đang dùng `frameloop="demand"`: đánh thức vòng vẽ khi có yêu cầu mới. */
  onPush(wake: () => void) {
    this.wake = wake
    return () => {
      this.wake = () => {}
    }
  }
}

interface ActiveBurst {
  points: Points
  velocities: Vector3[]
  life: number
  age: number
}

const GRAVITY = 7

/** Vẽ các chùm hạt sáng (cộng màu) bắn lên rồi rơi, mờ dần theo thời gian sống. */
export function Bursts3D({ queue }: { queue: BurstQueue }) {
  const invalidate = useThree((state) => state.invalidate)
  const group = useRef<Group>(null)
  const active = useRef<ActiveBurst[]>([])
  const scheduled = useRef<{ at: number; request: BurstRequest }[]>([])
  const texture = useMemo(() => sparkTexture(), [])

  useEffect(() => queue.onPush(invalidate), [queue, invalidate])

  useEffect(
    () => () => {
      for (const burst of active.current) {
        burst.points.geometry.dispose()
        ;(burst.points.material as PointsMaterial).dispose()
      }
      texture.dispose()
    },
    [texture]
  )

  useFrame((state, delta) => {
    const root = group.current
    if (!root) return
    const now = performance.now() / 1000
    const dt = Math.min(delta, 0.05)

    for (const request of queue.drain()) {
      scheduled.current.push({ at: now + (request.delay ?? 0), request })
    }
    const due = scheduled.current.filter((item) => item.at <= now)
    scheduled.current = scheduled.current.filter((item) => item.at > now)

    for (const { request } of due) {
      const { position, color, count = 90, speed = 4, life = 1.1, size = 0.22, rise = 1 } = request
      const positions = new Float32Array(count * 3)
      const velocities: Vector3[] = []
      for (let i = 0; i < count; i++) {
        positions.set([position.x, position.y + 0.4, position.z], i * 3)
        const angle = Math.random() * Math.PI * 2
        const elevation = Math.random() * 0.9 + 0.2
        const velocity = speed * (0.4 + Math.random() * 0.8)
        velocities.push(
          new Vector3(
            Math.cos(angle) * Math.cos(elevation) * velocity,
            Math.sin(elevation) * velocity * rise + 1.5,
            Math.sin(angle) * Math.cos(elevation) * velocity
          )
        )
      }
      const geometry = new BufferGeometry()
      geometry.setAttribute("position", new BufferAttribute(positions, 3))
      const material = new PointsMaterial({
        map: texture,
        color,
        size,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      })
      const points = new Points(geometry, material)
      root.add(points)
      active.current.push({ points, velocities, life, age: 0 })
    }

    for (const burst of [...active.current]) {
      burst.age += dt
      const position = burst.points.geometry.attributes.position as BufferAttribute
      burst.velocities.forEach((velocity, index) => {
        velocity.y -= GRAVITY * dt
        position.setXYZ(
          index,
          position.getX(index) + velocity.x * dt,
          Math.max(TILE_TOP, position.getY(index) + velocity.y * dt),
          position.getZ(index) + velocity.z * dt
        )
      })
      position.needsUpdate = true
      const material = burst.points.material as PointsMaterial
      material.opacity = Math.max(0, 1 - burst.age / burst.life)
      if (burst.age >= burst.life) {
        root.remove(burst.points)
        burst.points.geometry.dispose()
        material.dispose()
        active.current = active.current.filter((item) => item !== burst)
      }
    }

    if (active.current.length > 0 || scheduled.current.length > 0) state.invalidate()
  })

  return <group ref={group} />
}
