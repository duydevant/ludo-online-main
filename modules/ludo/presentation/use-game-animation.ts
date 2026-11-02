"use client"

import { useEffect, useState } from "react"
import { useStore } from "zustand"

import type { GameSnapshot } from "../game/snapshot"
import { createGameAnimator } from "./game-animator"

export function useGameAnimation(snapshot: GameSnapshot | null) {
  const [animator] = useState(createGameAnimator)

  useEffect(() => {
    animator.getState().push(snapshot)
  }, [animator, snapshot])

  useEffect(() => () => animator.getState().push(null), [animator])

  return useStore(animator)
}
