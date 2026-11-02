"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { NeutralToneMapping, Vector3 } from "three"

import { useI18n } from "@/lib/i18n"

import { tokenPoint } from "../game/board-geometry"
import { COLOR_HEX, FINISH_PROGRESS, PLAYER_COLORS, type PlayerColor } from "../game/constants"
import type { GameState } from "../game/rules"
import type { GameView, MovingToken } from "../presentation/game-animator"
import { placeTokens } from "../presentation/token-layout"
import { useLudoSettingsStore } from "../store/ludo-settings.store"
import { Board3D } from "./board-3d"
import { BurstQueue, Bursts3D } from "./bursts-3d"
import { Dice3D } from "./dice-3d"
import { LabelProjector, type LabelPlacement } from "./label-projector"
import { getPieceKit } from "./piece-geometry"
import { CameraRig, SceneLighting } from "./scene-rig"
import {
  CAMERA_TILT,
  PLATE_TOP,
  SLAB_SIZE,
  SLAB_TOP,
  TILE_TOP,
  baseCenter,
  boardToWorld,
  cameraAzimuth,
  dicePosition,
  restHeading,
  tokenHeight,
} from "./scene-math"
import { createStyleMaterials } from "./styles"
import { Token3D } from "./token-3d"

export interface LudoBoard3DProps {
  state: Pick<GameState, "players" | "tokens">
  activeColors: readonly PlayerColor[]
  view: GameView | null
  /** Màu đang chọn quân và các quân đi được; null khi máy này không được chọn. */
  selectable: { color: PlayerColor; tokens: number[] } | null
  onChoose: (tokenIndex: number) => void
  /** Màu đang tới lượt (null khi chưa có ván / đã xong). */
  turnColor: PlayerColor | null
  /** Màu mà máy này được bấm tung xúc xắc ngay lúc này. */
  rollableColor: PlayerColor | null
  onRoll: () => void
  /** Bảng tên nổi cạnh chuồng mỗi màu (tên, vai trò, nút ngồi / kick...). */
  labels?: Partial<Record<PlayerColor, React.ReactNode>>
  /** Màu của người đang xem: camera xoay để chuồng màu này nằm phía dưới. */
  viewerColor: PlayerColor
  /** WebGL bị mất (thường gặp trên điện thoại khi chuyển tab): GameTable chuyển về 2D. */
  onContextLost: () => void
}

const tokenKey = (color: PlayerColor, tokenIndex: number) => `${color}-${tokenIndex}`

/** Điểm neo bảng tên: góc ngoài khối bàn phía chuồng của màu đó. */
const LABEL_ANCHORS = Object.fromEntries(
  PLAYER_COLORS.map((color) => {
    const center = boardToWorld(baseCenter(color))
    const corner = SLAB_SIZE / 2 - 0.3
    return [color, new Vector3(Math.sign(center.x) * corner, SLAB_TOP, Math.sign(center.z) * corner)]
  })
) as Record<PlayerColor, Vector3>

/** Bước đi hiện tại đáp xuống ô đang có quân đối thủ (với luật mỗi ô một quân, đó là nước đá quân). */
function landsOnOpponent(state: GameState, moving: MovingToken): boolean {
  if (moving.progress < 0 || moving.progress >= FINISH_PROGRESS) return false
  const here = tokenPoint(moving.color, moving.tokenIndex, moving.progress)
  return state.players.some(
    ({ color }) =>
      color !== moving.color &&
      state.tokens[color].some((progress, index) => {
        if (progress < 0 || progress >= FINISH_PROGRESS) return false
        const there = tokenPoint(color, index, progress)
        return there.x === here.x && there.y === here.y
      })
  )
}

export default function LudoBoard3D({
  state,
  activeColors,
  view,
  selectable,
  onChoose,
  turnColor,
  rollableColor,
  onRoll,
  labels,
  viewerColor,
  onContextLost,
}: LudoBoard3DProps) {
  const { t } = useI18n()
  const boardStyle = useLudoSettingsStore((settings) => settings.boardStyle)
  const pieceKind = useLudoSettingsStore((settings) => settings.pieceKind)
  const cameraView = useLudoSettingsStore((settings) => settings.cameraView)

  const activeKey = activeColors.join(",")
  const materials = useMemo(
    () => createStyleMaterials(boardStyle, PLAYER_COLORS.filter((color) => activeKey.split(",").includes(color))),
    [boardStyle, activeKey]
  )
  useEffect(() => () => materials.dispose(), [materials])
  const kit = getPieceKit(pieceKind)
  const [bursts] = useState(() => new BurstQueue())
  const labelElements = useRef<Partial<Record<PlayerColor, HTMLDivElement | null>>>({})
  const labelPlacement: LabelPlacement = {
    measure: (color) => {
      const element = labelElements.current[color]
      return element ? { width: element.offsetWidth, height: element.offsetHeight } : null
    },
    place: (color, left, top) => {
      const element = labelElements.current[color]
      if (!element) return
      element.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`
      element.style.visibility = "visible"
    },
  }

  const azimuth = cameraAzimuth(viewerColor)
  const heading = restHeading(azimuth)
  const moving = view?.movingToken ?? null
  const shownState = view?.state ?? null
  // Lúc vừa hiện thế cờ sau nước đá quân: các quân bị đá bay về chuồng kiểu văng lộn vòng.
  const lastMove = shownState && !moving ? shownState.lastMove : null
  const knocked = new Set(lastMove?.captured.map((victim) => tokenKey(victim.color, victim.tokenIndex)))
  const pouncing = moving && shownState && landsOnOpponent(shownState, moving) ? tokenKey(moving.color, moving.tokenIndex) : null

  // Bắn hạt khi thế cờ mới có đá quân / về đích. Bỏ qua thế cờ đầu tiên (vừa tải trang hoặc vào phòng giữa ván).
  const firstState = useRef(shownState)
  useEffect(() => {
    const move = shownState?.lastMove
    if (!move || shownState === firstState.current) return
    if (move.captured.length > 0) {
      const impact = boardToWorld(tokenPoint(move.color, move.tokenIndex, move.to), TILE_TOP)
      bursts.push({ position: impact, color: "#ffd27a", count: 120, speed: 4.8 })
      for (const victim of move.captured) {
        bursts.push({ position: impact, color: COLOR_HEX[victim.color].light, count: 50, speed: 3.5, life: 0.9 })
      }
    }
    if (move.reachedFinish) {
      const finish = boardToWorld(tokenPoint(move.color, move.tokenIndex, FINISH_PROGRESS), PLATE_TOP + 0.2)
      bursts.push({ position: finish, color: "#fff1a8", count: 160, speed: 5.5, life: 1.6, size: 0.26, rise: 1.4 })
      bursts.push({ position: finish, color: "#ff9d5c", count: 90, speed: 4, life: 1.3, delay: 0.18 })
    }
  }, [shownState, bursts])

  const isMovable = (color: PlayerColor, tokenIndex: number) =>
    selectable?.color === color && selectable.tokens.includes(tokenIndex)

  return (
    // Lấp đầy khung cha (màn chơi 3D đặt khung này phủ toàn màn hình dưới thanh trên).
    <div className="relative h-full w-full overflow-hidden">
      <Canvas
        // PCF (three r18x đã bỏ PCFSoft, kiểu mặc định của R3F).
        shadows="percentage"
        dpr={[1, 1.75]}
        frameloop="demand"
        camera={{ fov: 30, near: 1, far: 200, position: [0, 30, 25] }}
        // Neutral giữ màu sát bàn 2D; ACES (mặc định của R3F) làm đỏ / vàng ngả cam và nhợt.
        gl={{ antialias: true, toneMapping: NeutralToneMapping, toneMappingExposure: 1.05 }}
        onCreated={({ gl }) => {
          const canvas = gl.domElement
          canvas.addEventListener("webglcontextlost", (event) => {
            event.preventDefault()
            // R3F cũng tự huỷ context khi gỡ canvas (ví dụ người dùng chuyển sang 2D): lúc đó canvas đã rời
            // trang, không phải lỗi. Chỉ báo lỗi khi canvas vẫn đang hiển thị mà mất context.
            setTimeout(() => {
              if (canvas.isConnected) onContextLost()
            }, 0)
          })
        }}
        aria-label={t("ludo.boardLabel")}
      >
        <color attach="background" args={[materials.background]} />
        <fog attach="fog" args={[materials.background, 34, 75]} />
        <SceneLighting />
        <CameraRig azimuth={azimuth} tilt={CAMERA_TILT[cameraView]} />
        <Board3D materials={materials} />

        {placeTokens(state, moving).map((token) => {
          const position = boardToWorld(token.point, tokenHeight(token.progress))
          const key = tokenKey(token.color, token.tokenIndex)
          return (
            <Token3D
              // Đổi kiểu quân thì dựng lại quân (hình khác hẳn).
              key={`${key}-${pieceKind}`}
              color={token.color}
              x={position.x}
              y={position.y}
              z={position.z}
              scale={token.scale}
              movable={isMovable(token.color, token.tokenIndex)}
              pounce={pouncing === key}
              knocked={knocked.has(key)}
              restHeading={heading}
              kit={kit}
              materials={materials}
              onChoose={() => onChoose(token.tokenIndex)}
            />
          )
        })}

        {PLAYER_COLORS.filter((color) => activeColors.includes(color)).map((color) => (
          <Dice3D
            key={color}
            color={color}
            position={dicePosition(color).toArray() as [number, number, number]}
            value={view?.diceFaces[color] ?? 6}
            rolling={view?.rollingColor === color}
            isTurn={turnColor === color}
            canRoll={rollableColor === color}
            onRoll={onRoll}
            materials={materials}
          />
        ))}

        <Bursts3D queue={bursts} />
        {labels && <LabelProjector anchors={LABEL_ANCHORS} placement={labelPlacement} />}
      </Canvas>

      {/* Viền tối dần như đèn rọi xuống bàn. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_75%_at_50%_50%,transparent_55%,rgb(4_4_10/0.6)_100%)]" />

      {labels && (
        <div className="pointer-events-none absolute inset-0">
          {PLAYER_COLORS.map((color) =>
            labels[color] ? (
              <div
                key={color}
                ref={(element) => {
                  labelElements.current[color] = element
                }}
                // Ẩn tới khi được đặt đúng chỗ ở khung hình đầu tiên.
                className="pointer-events-auto invisible absolute top-0 left-0"
              >
                {labels[color]}
              </div>
            ) : null
          )}
        </div>
      )}

      {/* Canvas không dùng được bằng bàn phím / trình đọc màn hình: thêm nút ẩn cho cùng thao tác. */}
      <div className="sr-only">
        {rollableColor && (
          <button type="button" onClick={onRoll}>
            {t("ludo.rollDice")}
          </button>
        )}
        {selectable?.tokens.map((tokenIndex) => (
          <button key={tokenIndex} type="button" onClick={() => onChoose(tokenIndex)}>
            {t("ludo.tokenLabel", { player: t(`ludo.color.${selectable.color}`), index: tokenIndex + 1 })}
          </button>
        ))}
      </div>
    </div>
  )
}
