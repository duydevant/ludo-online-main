"use client"

import { HomeIcon, RotateCcwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { PLAYER_COLORS, type PlayerColor } from "../game/constants"
import { useTurnDriver } from "../hooks/use-turn-driver"
import { useGameAnimation } from "../presentation/use-game-animation"
import { useOfflineLudoStore } from "../store/ludo-offline.store"
import { ExitGameButton } from "./exit-game-button"
import { GameOverDialog } from "./game-over-dialog"
import { GameScreen } from "./game-screen"
import { GameTable } from "./game-table"
import { GraphicsToggle } from "./graphics-toggle"
import { type SeatInfo } from "./ludo-table"

export function OfflineGame() {
  const { t } = useI18n()
  const snapshot = useOfflineLudoStore((state) => state.snapshot)
  const { startGame, quitGame, roll, moveToken } = useOfflineLudoStore.getState()
  const { view, busy } = useGameAnimation(snapshot)
  const state = view?.state ?? null

  const kindOf = (color: PlayerColor) => state?.players.find((player) => player.color === color)?.kind
  const isHuman = (color: PlayerColor) => kindOf(color) === "human"

  useTurnDriver({
    state,
    busy,
    controlOf: (color) => (isHuman(color) ? "local" : "local-bot"),
    roll,
    moveToken,
  })

  if (!snapshot) return null

  // Chơi chung một máy: camera 3D nhìn từ phía người chơi (không phải bot) đầu tiên.
  const players = snapshot.state.players
  const viewerColor = (players.find((player) => player.kind === "human") ?? players[0]).color

  const seats = Object.fromEntries(
    PLAYER_COLORS.map((color): [PlayerColor, SeatInfo] => {
      const kind = kindOf(color)
      return [
        color,
        { title: t(`ludo.color.${color}`), subtitle: kind ? t(`ludo.seat.${kind}`) : t("ludo.seat.notPlaying") },
      ]
    })
  ) as Record<PlayerColor, SeatInfo>

  return (
    <GameScreen
      start={<ExitGameButton label={t("menu.exit")} confirm={snapshot.state.phase !== "finished"} onExit={quitGame} />}
      center={<span className="truncate font-bold">{t("menu.offline.title")}</span>}
      end={<GraphicsToggle />}
    >
      <GameTable
        viewerColor={viewerColor}
        view={view}
        busy={busy}
        activeColors={snapshot.state.players.map((player) => player.color)}
        seats={seats}
        canControl={isHuman}
        onRoll={roll}
        onMove={moveToken}
      />

      <GameOverDialog
        state={state}
        nameOf={(color) => t(`ludo.color.${color}`)}
        actions={
          <>
            <Button variant="game-secondary" size="lg" onClick={quitGame}>
              <HomeIcon data-icon="inline-start" />
              {t("ludo.changeSetup")}
            </Button>
            <Button variant="game" size="lg" onClick={() => startGame(snapshot.state.players)}>
              <RotateCcwIcon data-icon="inline-start" />
              {t("ludo.playAgain")}
            </Button>
          </>
        }
      />
    </GameScreen>
  )
}
