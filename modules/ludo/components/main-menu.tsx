"use client"

import { useState } from "react"
import { ArrowLeftIcon, ChevronRightIcon, GlobeIcon, UsersRoundIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n"

import { COLOR_HEX, PLAYER_COLORS, type PlayerColor } from "../game/constants"
import type { GameState } from "../game/rules"
import { OnlineEntry } from "../online/components/online-entry"
import { useOfflineLudoStore } from "../store/ludo-offline.store"
import { GameScreen } from "./game-screen"
import { HorseAvatar } from "./horse-piece"
import { LudoBoard } from "./ludo-board"
import { OfflineSetup } from "./offline-setup"
import { RulesDialog } from "./rules-dialog"
import { StatsDialog } from "./stats-dialog"

type MenuScreen = "modes" | "offline" | "online"

/** Thế cờ trang trí cho bàn cờ ở menu: vài quân đã ra sân, một quân sắp về đích. */
const SHOWCASE: Pick<GameState, "players" | "tokens"> = {
  players: PLAYER_COLORS.map((color) => ({ color, kind: "human" })),
  tokens: {
    red: [9, 53, -1, -1],
    green: [-1, 17, -1, -1],
    yellow: [22, -1, -1, 4],
    blue: [-1, -1, 2, 38],
  },
}

const MODES = [
  { screen: "offline", icon: UsersRoundIcon, accent: "green" },
  { screen: "online", icon: GlobeIcon, accent: "blue" },
] as const satisfies readonly {
  screen: Exclude<MenuScreen, "modes">
  icon: unknown
  accent: PlayerColor
}[]

function ModeCard({ mode, onSelect }: { mode: (typeof MODES)[number]; onSelect: () => void }) {
  const { t } = useI18n()
  const hex = COLOR_HEX[mode.accent]
  const Icon = mode.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all outline-none hover:-translate-y-0.5 focus-visible:ring-3 focus-visible:ring-ring active:translate-y-1"
      style={{
        borderColor: `${hex.base}aa`,
        backgroundImage: `linear-gradient(120deg, ${hex.base}55, ${hex.dark}22)`,
        boxShadow: `0 5px 0 0 ${hex.dark}`,
      }}
    >
      <span
        className="flex size-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-inner"
        style={{ backgroundColor: hex.dark }}
      >
        <Icon className="size-7" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-lg leading-tight font-bold">{t(`menu.${mode.screen}.title`)}</span>
        <span className="mt-0.5 block text-sm leading-snug text-white/75">{t(`menu.${mode.screen}.description`)}</span>
      </span>
      <ChevronRightIcon className="size-6 shrink-0 text-white/70 transition-transform group-hover:translate-x-1" />
    </button>
  )
}

export function MainMenu() {
  const { t } = useI18n()
  const lastPlayers = useOfflineLudoStore((state) => state.lastPlayers)
  const startGame = useOfflineLudoStore((state) => state.startGame)
  const [screen, setScreen] = useState<MenuScreen>(lastPlayers ? "offline" : "modes")

  return (
    <GameScreen
      start={
        <span className="flex items-center gap-2 font-bold">
          <HorseAvatar color="red" className="size-8" />
          <span className="hidden sm:inline">{t("app.name")}</span>
        </span>
      }
      className="justify-center"
    >
      <div className="grid items-center gap-6 py-2 lg:grid-cols-[minmax(0,1fr)_27rem] lg:gap-14">
        <LudoBoard
          className="mx-auto hidden w-full max-w-[min(100%,calc(100dvh-7rem))] -rotate-2 lg:block"
          state={SHOWCASE}
          activeColors={PLAYER_COLORS}
        />

        <div className="flex flex-col items-center gap-6">
          <section className="flex flex-col items-center gap-3 text-center">
            <h1 className="game-title text-6xl leading-none font-extrabold tracking-tight sm:text-7xl">
              {t("app.name")}
            </h1>
            <p className="max-w-sm text-base text-muted-foreground sm:text-lg">{t("app.tagline")}</p>

            <div className="flex gap-2 lg:hidden">
              {PLAYER_COLORS.map((color) => (
                <span
                  key={color}
                  className="flex size-12 items-center justify-center rounded-xl"
                  style={{ backgroundColor: COLOR_HEX[color].light }}
                >
                  <HorseAvatar color={color} className="size-11" />
                </span>
              ))}
            </div>
          </section>

          <section className="game-panel mx-auto flex w-full max-w-md flex-col gap-4 rounded-3xl p-5">
            <header className="flex min-h-9 items-center gap-2">
              {screen !== "modes" && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setScreen("modes")}
                  aria-label={t("menu.back")}
                >
                  <ArrowLeftIcon />
                </Button>
              )}
              <h2 className="text-xl font-bold">
                {t(screen === "modes" ? "menu.chooseMode" : `menu.${screen}.title`)}
              </h2>
            </header>

            <div key={screen} className="animate-in duration-300 fade-in slide-in-from-right-4">
              {screen === "modes" && (
                <div className="flex flex-col gap-4">
                  {MODES.map((mode) => (
                    <ModeCard key={mode.screen} mode={mode} onSelect={() => setScreen(mode.screen)} />
                  ))}
                </div>
              )}
              {screen === "offline" && <OfflineSetup initialPlayers={lastPlayers} onStart={startGame} />}
              {screen === "online" && <OnlineEntry />}
            </div>

            <div className="flex justify-center gap-1 border-t border-white/10 pt-3">
              <StatsDialog />
              <RulesDialog />
            </div>
          </section>
        </div>
      </div>
    </GameScreen>
  )
}
