import { createStore } from "zustand/vanilla"

import { playSound, type SoundName } from "../audio/sound-effects"
import { BASE_PROGRESS, type PlayerColor } from "../game/constants"
import { rollDice, type GameState } from "../game/rules"
import type { GameSnapshot } from "../game/snapshot"
import { useLudoSettingsStore } from "../store/ludo-settings.store"

const DICE_ROLL_MS = 640
const DICE_FACE_MS = 80
/** Mỗi ô quân đi (2D và 3D đều theo nhịp này). */
export const STEP_MS = 210
/** Đá quân: quân tấn công bổ xuống ô nạn nhân rồi mới hiện thế cờ mới (nạn nhân bay về chuồng, tiếng đá). */
export const CAPTURE_IMPACT_MS = 320

export interface MovingToken {
  color: PlayerColor
  tokenIndex: number
  progress: number
}

/** Những gì đang hiển thị: có thể chậm hơn snapshot mới nhất trong lúc chạy hiệu ứng. */
export interface GameView {
  state: GameState
  diceFaces: Partial<Record<PlayerColor, number>>
  rollingColor: PlayerColor | null
  movingToken: MovingToken | null
}

export interface GameAnimatorState {
  view: GameView | null
  /** true khi còn hiệu ứng chưa chạy xong: không cho tung / đi trong lúc này. */
  busy: boolean
  push: (snapshot: GameSnapshot | null) => void
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Nhận snapshot theo thứ tự seq và phát lại thành hiệu ứng (lắc xúc xắc, quân đi từng ô).
 * Mọi client trong phòng đều chạy cùng hiệu ứng từ cùng chuỗi snapshot.
 */
export function createGameAnimator() {
  let lastSeq = 0
  let generation = 0
  let queue: GameSnapshot[] = []
  let draining = false

  return createStore<GameAnimatorState>()((set, get) => {
    const sound = (name: SoundName) => {
      if (!useLudoSettingsStore.getState().muted) playSound(name)
    }

    const patchView = (patch: Partial<GameView>) =>
      set(({ view }) => ({ view: view && { ...view, ...patch } }))

    const show = (state: GameState) =>
      set(({ view }) => {
        const roll = state.lastRoll
        const diceFaces = { ...view?.diceFaces, ...(roll && { [roll.color]: roll.value }) }
        return { view: { state, diceFaces, rollingColor: null, movingToken: null } }
      })

    async function animateRoll(state: GameState, gen: number) {
      const roll = state.lastRoll
      if (!roll || !get().view) return show(state)

      patchView({ rollingColor: roll.color })
      sound("dice")
      for (let elapsed = 0; elapsed < DICE_ROLL_MS; elapsed += DICE_FACE_MS) {
        const diceFaces = { ...get().view?.diceFaces, [roll.color]: rollDice() }
        patchView({ diceFaces })
        await wait(DICE_FACE_MS)
        if (gen !== generation) return
      }

      show(state)
      if (state.lastTurnEnd) sound("turnLost")
    }

    async function animateMove(state: GameState, gen: number) {
      const move = state.lastMove
      if (!move || !get().view) return show(state)

      const { color, tokenIndex, from, to } = move
      const path = from === BASE_PROGRESS ? [to] : Array.from({ length: to - from }, (_, i) => from + i + 1)
      for (const progress of path) {
        patchView({ movingToken: { color, tokenIndex, progress } })
        sound(from === BASE_PROGRESS ? "leaveBase" : "step")
        await wait(STEP_MS)
        if (gen !== generation) return
      }
      if (move.captured.length > 0) {
        await wait(CAPTURE_IMPACT_MS)
        if (gen !== generation) return
      }

      show(state)
      if (state.phase === "finished") sound("win")
      else if (move.captured.length > 0) sound("capture")
      else if (move.reachedFinish) sound("finishToken")
    }

    async function drain(gen: number) {
      if (draining) return
      draining = true
      set({ busy: true })

      while (queue.length > 0 && gen === generation) {
        const snapshot = queue.shift()!
        if (snapshot.event === "roll") await animateRoll(snapshot.state, gen)
        else if (snapshot.event === "move") await animateMove(snapshot.state, gen)
        else show(snapshot.state)
      }

      if (gen === generation) {
        draining = false
        set({ busy: false })
      }
    }

    const reset = () => {
      generation++
      draining = false
      queue = []
    }

    return {
      view: null,
      busy: false,
      push: (snapshot) => {
        if (!snapshot) {
          reset()
          lastSeq = 0
          set({ view: null, busy: false })
          return
        }
        if (snapshot.seq === lastSeq) return

        // Ván mới, lần đầu nhận (vào phòng giữa ván) hoặc bị hụt bước: hiện thẳng, không hiệu ứng.
        const isNextStep = lastSeq !== 0 && snapshot.seq === lastSeq + 1 && snapshot.event !== "start"
        if (!isNextStep && snapshot.event !== "start" && snapshot.seq < lastSeq) return
        lastSeq = snapshot.seq

        if (!isNextStep) {
          reset()
          set({ busy: false })
          show(snapshot.state)
          return
        }

        queue.push(snapshot)
        void drain(generation)
      },
    }
  })
}
