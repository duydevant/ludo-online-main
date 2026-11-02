import { PerspectiveCamera, Vector3 } from "three"
import { describe, expect, it } from "vitest"

import { PLAYER_COLORS } from "../game/constants"
import {
  CAMERA_TARGET,
  CAMERA_TILT,
  DICE_FACE_NORMALS,
  SLAB_SIZE,
  baseCenter,
  boardToWorld,
  cameraAzimuth,
  cameraPosition,
  diceRestQuaternion,
  dicePosition,
  fitCameraDistance,
  headingFor,
  lerpAngle,
  restHeading,
} from "./scene-math"

const UP = new Vector3(0, 1, 0)

/** Điểm thế giới nhìn từ camera đặt ở góc `azimuth` sẽ trông như điểm này khi camera đứng ở góc 0. */
function asSeenFrom(azimuth: number, point: Vector3): Vector3 {
  return point.clone().applyAxisAngle(UP, -azimuth)
}

function cameraFor(azimuth: number, tilt: number, aspect: number) {
  const camera = new PerspectiveCamera(32, aspect, 1, 300)
  camera.position.copy(cameraPosition(azimuth, tilt, fitCameraDistance(azimuth, tilt, 32, aspect)))
  camera.lookAt(CAMERA_TARGET)
  camera.updateMatrixWorld()
  camera.updateProjectionMatrix()
  return camera
}

describe("scene math", () => {
  it("maps board cell coordinates onto a centred plane", () => {
    expect(boardToWorld({ x: 7.5, y: 7.5 }, 0.5).toArray()).toEqual([0, 0.5, 0])
    expect(boardToWorld({ x: 0, y: 15 }, 0).toArray()).toEqual([-7.5, 0, 7.5])
  })

  it.each(PLAYER_COLORS)("turns the camera so %s's base sits bottom-left", (color) => {
    const seen = asSeenFrom(cameraAzimuth(color), boardToWorld(baseCenter(color)))
    // Góc dưới-trái khi camera đứng ở phía +Z: x âm (trái), z dương (gần người nhìn).
    expect(seen.x).toBeCloseTo(-4.5)
    expect(seen.z).toBeCloseTo(4.5)
  })

  it.each(PLAYER_COLORS)("puts %s's dice in the middle of its base", (color) => {
    const center = boardToWorld(baseCenter(color))
    const dice = dicePosition(color)
    expect([dice.x, dice.z]).toEqual([center.x, center.z])
  })

  it.each([
    ["angled", CAMERA_TILT.angled, 4 / 3],
    ["top", CAMERA_TILT.top, 1],
    ["angled portrait", CAMERA_TILT.angled, 0.7],
  ] as const)("fits the whole board in the %s view for every seat", (_, tilt, aspect) => {
    for (const color of PLAYER_COLORS) {
      const azimuth = cameraAzimuth(color)
      const camera = cameraFor(azimuth, tilt, aspect)
      let widest = 0
      for (const sx of [-1, 1]) {
        for (const sz of [-1, 1]) {
          for (const y of [0, 1.5]) {
            const ndc = new Vector3((sx * SLAB_SIZE) / 2, y, (sz * SLAB_SIZE) / 2).project(camera)
            expect(Math.abs(ndc.x)).toBeLessThanOrEqual(1)
            expect(Math.abs(ndc.y)).toBeLessThanOrEqual(1)
            widest = Math.max(widest, Math.abs(ndc.x), Math.abs(ndc.y))
          }
        }
      }
      // Không lùi quá xa: ít nhất một góc chạm gần mép khung.
      expect(widest).toBeGreaterThan(0.9)
    }
  })

  it.each([1, 2, 3, 4, 5, 6])("rests the dice with face %i up, whatever the yaw", (value) => {
    for (const yaw of [0, 0.7, -2.1]) {
      const up = DICE_FACE_NORMALS[value].clone().applyQuaternion(diceRestQuaternion(value, yaw))
      expect(up.x).toBeCloseTo(0)
      expect(up.y).toBeCloseTo(1)
      expect(up.z).toBeCloseTo(0)
    }
  })

  it("points a piece (modelled facing -X) along the travel direction", () => {
    for (const [dx, dz] of [
      [1, 0],
      [0, -1],
      [-1, 1],
    ]) {
      const facing = new Vector3(-1, 0, 0).applyAxisAngle(UP, headingFor(dx, dz))
      expect(facing.distanceTo(new Vector3(dx, 0, dz).normalize())).toBeLessThan(1e-9)
    }
  })

  it.each(PLAYER_COLORS)("turns resting pieces to show their profile to the %s player", (color) => {
    const azimuth = cameraAzimuth(color)
    const facing = new Vector3(-1, 0, 0).applyAxisAngle(UP, restHeading(azimuth))
    const seen = asSeenFrom(azimuth, facing)
    // Mõm chỉ sang trái màn hình và hơi quay về phía người xem.
    expect(seen.x).toBeLessThan(-0.8)
    expect(seen.z).toBeGreaterThan(0.2)
  })

  it("interpolates angles the short way round", () => {
    expect(lerpAngle(3, -3, 0.5)).toBeCloseTo(Math.PI, 1)
  })
})
