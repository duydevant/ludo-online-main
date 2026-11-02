"use client"

import { TrophyIcon } from "lucide-react"

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n"

import type { PlayerColor } from "../game/constants"
import type { GameState } from "../game/rules"
import { HorseAvatar } from "./horse-piece"

interface GameOverDialogProps {
  state: GameState | null
  /** Tên hiển thị của từng màu (tên người chơi online, hoặc tên màu). */
  nameOf: (color: PlayerColor) => string
  actions: React.ReactNode
}

export function GameOverDialog({ state, nameOf, actions }: GameOverDialogProps) {
  const { t } = useI18n()
  const winner = state?.rankings[0]

  return (
    <Dialog open={state?.phase === "finished"}>
      <DialogContent showCloseButton={false}>
        <DialogHeader className="items-center text-center">
          <TrophyIcon className="size-10 text-yellow-500" aria-hidden="true" />
          <DialogTitle className="text-xl">{t("ludo.gameOver.title")}</DialogTitle>
          {winner && <DialogDescription>{t("ludo.gameOver.winner", { player: nameOf(winner) })}</DialogDescription>}
        </DialogHeader>

        <ol className="flex flex-col gap-1.5">
          {state?.rankings.map((color, index) => (
            <li key={color} className="flex items-center gap-3 rounded-md bg-muted/60 px-3 py-1.5">
              <span className="w-6 font-bold">#{index + 1}</span>
              <HorseAvatar color={color} className="size-7" />
              <span className="font-medium">{nameOf(color)}</span>
            </li>
          ))}
        </ol>

        <DialogFooter>{actions}</DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
