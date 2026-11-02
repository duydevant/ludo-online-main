"use client"

import { useEffect, useEffectEvent, useMemo } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { useI18n } from "@/lib/i18n"
import { Routes } from "@/lib/routes"

import type { PlayerColor } from "../../game/constants"
import { applyMove, applyRoll, rollDice, type GameState } from "../../game/rules"
import { deserializeSnapshot } from "../../game/snapshot"
import { useTurnDriver, type SeatControl } from "../../hooks/use-turn-driver"
import { useGameAnimation } from "../../presentation/use-game-animation"
import { ExitGameButton } from "../../components/exit-game-button"
import { GameOverDialog } from "../../components/game-over-dialog"
import { GameScreen } from "../../components/game-screen"
import { GameTable } from "../../components/game-table"
import { GraphicsToggle } from "../../components/graphics-toggle"
import { useMatchHistoryStore } from "../../store/match-history.store"
import { closeRoom, commitGameAction, setHost } from "../room-api"
import { seatOf, type RoomData } from "../room-types"
import { GameOverActions } from "./game-over-actions"
import { RoomChat } from "./room-chat"
import { HostControls, MIN_PLAYERS, RoomCodeChip, SeatBadge } from "./room-toolbar"
import { SpectatorList, spectatorCount } from "./spectator-list"
import { useSeatInfo } from "./use-seat-info"

interface RoomViewProps {
  roomId: string
  room: RoomData
  uid: string
  isHost: boolean
}

export function RoomView({ roomId, room, uid, isHost }: RoomViewProps) {
  const { t } = useI18n()
  const router = useRouter()
  // Chỉ parse lại khi ván đổi, tránh tạo snapshot mới mỗi lần members/seats thay đổi.
  const { seq, event, state: serializedState } = room.game ?? {}
  const snapshot = useMemo(
    () =>
      seq !== undefined && event && serializedState
        ? deserializeSnapshot({ seq, event, state: serializedState })
        : null,
    [seq, event, serializedState]
  )
  const { view, busy } = useGameAnimation(snapshot)
  const state = view?.state ?? null
  const seats = useSeatInfo({ roomId, room, uid, isHost, gamePlayers: snapshot?.state.players ?? null })

  const controlOf = (color: PlayerColor): SeatControl => {
    const seat = room.seats[color]
    if (seat?.kind === "human") return seat.uid === uid ? "local" : "remote"
    return isHost ? "local-bot" : "remote"
  }

  const commit = (event: "roll" | "move", apply: Parameters<typeof commitGameAction>[3]) => {
    if (!snapshot) return
    void commitGameAction(roomId, snapshot.seq, event, apply).catch(() => toast.error(t("ludo.online.actionFailed")))
  }
  const roll = () => commit("roll", (current) => applyRoll(current, rollDice()))
  const moveToken = (tokenIndex: number) => commit("move", (current) => applyMove(current, tokenIndex))

  useTurnDriver({ state, busy, controlOf, roll, moveToken })

  // Ghi kết quả vào lịch sử của trình duyệt này khi ván kết thúc (sau hiệu ứng), nếu mình có ghế trong ván.
  const recordResult = useEffectEvent((finished: GameState) => {
    const myColor = seatOf(room, uid)
    if (!myColor || !finished.players.some((player) => player.color === myColor)) return
    useMatchHistoryStore.getState().addRecord({
      // Cùng phòng + cùng thứ hạng + cùng số bước = cùng ván, nên tải lại trang không ghi trùng.
      id: `online:${roomId}:${seq}:${finished.rankings.join(",")}`,
      mode: "online",
      finishedAt: Date.now(),
      players: finished.players.map((player) => {
        const seat = room.seats[player.color]
        return { ...player, name: seat?.kind === "human" ? seat.name : "" }
      }),
      rankings: finished.rankings,
      myColor,
      won: finished.rankings[0] === myColor,
    })
  })
  const finishedState = state?.phase === "finished" ? state : null
  useEffect(() => {
    if (finishedState) recordResult(finishedState)
  }, [finishedState])

  const leaveRoom = async () => {
    const others = Object.entries(room.members)
      .filter(([memberId]) => memberId !== uid)
      .sort(([, a], [, b]) => a.joinedAt - b.joinedAt)
    try {
      if (isHost && others.length === 0) await closeRoom(roomId)
      else if (isHost) await setHost(roomId, others[0][0])
    } finally {
      router.push(Routes.HOME)
    }
  }

  const nameOf = (color: PlayerColor) => {
    const seat = room.seats[color]
    return seat?.kind === "human" ? seat.name : `${t(`ludo.color.${color}`)} (${t("ludo.seat.bot")})`
  }

  const activeColors = snapshot
    ? snapshot.state.players.map((player) => player.color)
    : (Object.keys(room.seats) as PlayerColor[])

  const lobbyHint = !isHost
    ? t("ludo.online.waitingForHost")
    : Object.keys(room.seats).length < MIN_PLAYERS
      ? t("ludo.setup.needTwoPlayers")
      : null

  return (
    <GameScreen
      start={
        <ExitGameButton
          label={t("ludo.online.leaveRoom")}
          confirm={room.status === "playing" && seatOf(room, uid) !== null}
          confirmDescription={t("ludo.online.leaveConfirm")}
          onExit={() => void leaveRoom()}
        />
      }
      center={<RoomCodeChip roomId={roomId} />}
      end={<GraphicsToggle />}
      // Chừa chỗ dưới cùng cho nút chat nổi.
      className="gap-4 pb-24"
    >
      <GameTable
        // Người xem nhìn theo hướng mặc định (chuồng xanh dương ở dưới, như bàn 2D).
        viewerColor={seatOf(room, uid) ?? "blue"}
        footer={<SpectatorList roomId={roomId} room={room} uid={uid} isHost={isHost} />}
        footerLabel={t("ludo.online.spectators", { count: spectatorCount(room) })}
        view={view}
        busy={busy}
        activeColors={activeColors}
        seats={seats}
        canControl={(color) => controlOf(color) === "local"}
        onRoll={roll}
        onMove={moveToken}
        bannerStart={<SeatBadge room={room} uid={uid} />}
        bannerEnd={<HostControls roomId={roomId} room={room} isHost={isHost} />}
        idleBanner={<p className="text-sm font-semibold text-muted-foreground">{lobbyHint}</p>}
      />

      <RoomChat roomId={roomId} room={room} uid={uid} />

      <GameOverDialog
        state={state}
        nameOf={nameOf}
        actions={<GameOverActions roomId={roomId} room={room} isHost={isHost} />}
      />
    </GameScreen>
  )
}
