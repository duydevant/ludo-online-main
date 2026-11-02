"use client"

import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { PMREMGenerator, type PerspectiveCamera } from "three"
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js"

import { CAMERA_TARGET, cameraPosition, fitCameraDistance, lerpAngle } from "./scene-math"

/** Ánh sáng: môi trường phòng (phản chiếu trên lớp sơn bóng), đèn chính ấm đổ bóng, đèn viền lạnh, đèn trời. */
export function SceneLighting() {
  const get = useThree((state) => state.get)

  useEffect(() => {
    // Lấy scene / renderer qua get() trong effect: đây là object three.js dùng chung, không phải state React.
    const { gl, scene } = get()
    const pmrem = new PMREMGenerator(gl)
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = environment
    scene.environmentIntensity = 0.42
    pmrem.dispose()
    return () => {
      scene.environment = null
      environment.dispose()
    }
  }, [get])

  return (
    <>
      <hemisphereLight args={["#fff3df", "#20182a", 0.35]} />
      <directionalLight
        position={[-7, 20, 9]}
        color="#ffe6c4"
        intensity={2.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-camera-near={2}
        shadow-camera-far={50}
        shadow-bias={-0.0003}
        shadow-normalBias={0.025}
        shadow-radius={4}
      />
      <directionalLight position={[12, 8, -14]} color="#9fb8ff" intensity={0.6} />
    </>
  )
}

/**
 * Camera cố định theo màu: quay quanh bàn tới góc `azimuth` (chuồng của mình ở góc dưới-trái), nghiêng `tilt`,
 * lùi vừa đủ để thấy trọn bàn ở mọi tỉ lệ khung. Đổi góc / màu thì chuyển mượt.
 */
export function CameraRig({ azimuth, tilt }: { azimuth: number; tilt: number }) {
  const camera = useThree((state) => state.camera) as PerspectiveCamera
  const aspect = useThree((state) => state.size.width / Math.max(state.size.height, 1))
  const invalidate = useThree((state) => state.invalidate)
  const current = useRef<{ azimuth: number; tilt: number } | null>(null)

  useEffect(() => invalidate(), [azimuth, tilt, aspect, invalidate])

  useFrame((state) => {
    const previous = current.current ?? { azimuth, tilt }
    let nextAzimuth = lerpAngle(previous.azimuth, azimuth, 0.08)
    let nextTilt = previous.tilt + (tilt - previous.tilt) * 0.08
    if (Math.abs(nextAzimuth - azimuth) < 1e-3) nextAzimuth = azimuth
    if (Math.abs(nextTilt - tilt) < 1e-3) nextTilt = tilt
    current.current = { azimuth: nextAzimuth, tilt: nextTilt }

    camera.position.copy(
      cameraPosition(nextAzimuth, nextTilt, fitCameraDistance(nextAzimuth, nextTilt, camera.fov, aspect))
    )
    camera.lookAt(CAMERA_TARGET)
    camera.updateProjectionMatrix()

    if (nextAzimuth !== azimuth || nextTilt !== tilt) state.invalidate()
  })

  return null
}
