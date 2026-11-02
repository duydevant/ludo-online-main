"use client"

import { useEffect, useMemo } from "react"

import { buildBoardModel } from "./board-model"
import type { StyleMaterials } from "./styles"

/** Bàn cờ khối thật (mặt bàn chơi, khối bàn, ô, chuồng, tháp đích), dựng lại khi đổi phong cách. */
export function Board3D({ materials }: { materials: StyleMaterials }) {
  const model = useMemo(() => buildBoardModel(materials), [materials])
  useEffect(() => () => model.dispose(), [model])
  return <primitive object={model.group} />
}
