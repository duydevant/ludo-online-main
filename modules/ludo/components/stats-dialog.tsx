"use client"

import { GlobeIcon, MonitorSmartphoneIcon, TrophyIcon } from "lucide-react"
import { cn } from "cn"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useI18n } from "@/lib/i18n"

import { COLOR_HEX } from "../game/constants"
import { computeStats, type MatchRecord } from "../history/match-record"
import { useMatchHistoryStore } from "../store/match-history.store"
import { HorseAvatar } from "./horse-piece"

/** Số ván hiện trong danh sách; thống kê vẫn tính trên toàn bộ lịch sử đã lưu. */
const RECENT_LIMIT = 30

function StatTile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl bg-black/20 px-2 py-3 text-center">
      <span className={cn("text-3xl leading-none font-extrabold", accent && "text-primary")}>{value}</span>
      <span className="mt-1 text-xs text-muted-foreground">{label}</span>
    </div>
  )
}

function ResultBadge({ won }: { won: boolean | null }) {
  const { t } = useI18n()
  const key = won === null ? "stats.result.friendly" : won ? "stats.result.win" : "stats.result.loss"
  return (
    <span
      className={cn(
        "w-16 shrink-0 rounded-full py-0.5 text-center text-xs font-bold",
        won === null && "bg-white/10 text-muted-foreground",
        won === true && "bg-emerald-500/20 text-emerald-300",
        won === false && "bg-red-500/20 text-red-300"
      )}
    >
      {t(key)}
    </span>
  )
}

function MatchRow({ record, formatTime }: { record: MatchRecord; formatTime: (time: number) => string }) {
  const { t } = useI18n()
  const ModeIcon = record.mode === "online" ? GlobeIcon : MonitorSmartphoneIcon
  const nameOf = (color: MatchRecord["rankings"][number]) => {
    const player = record.players.find((item) => item.color === color)
    if (player?.name) return player.name
    return `${t(`ludo.color.${color}`)}${player?.kind === "bot" ? ` (${t("ludo.seat.bot")})` : ""}`
  }

  return (
    <li className="flex items-center gap-3 rounded-xl bg-black/15 px-3 py-2">
      <ResultBadge won={record.won} />
      <ol className="flex min-w-0 flex-1 items-center gap-1" aria-label={t("stats.ranking")}>
        {record.rankings.map((color, index) => (
          <li
            key={color}
            title={`#${index + 1} ${nameOf(color)}`}
            className={cn("relative rounded-lg p-0.5", color === record.myColor && "ring-2 ring-primary")}
            style={{ backgroundColor: COLOR_HEX[color].light }}
          >
            <HorseAvatar color={color} className="size-6" />
            {index === 0 && (
              <TrophyIcon className="absolute -top-1.5 -right-1.5 size-3.5 text-primary" aria-hidden="true" />
            )}
          </li>
        ))}
      </ol>
      <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
        <ModeIcon className="size-3.5" aria-label={t(`stats.mode.${record.mode}`)} />
        {formatTime(record.finishedAt)}
      </span>
    </li>
  )
}

/** Thống kê thắng/thua và các ván gần đây, lưu trên trình duyệt này. */
export function StatsDialog() {
  const { t, localeTag } = useI18n()
  const records = useMatchHistoryStore((state) => state.records)
  const clearHistory = useMatchHistoryStore((state) => state.clearHistory)
  const stats = computeStats(records)
  const timeFormat = new Intl.DateTimeFormat(localeTag, { dateStyle: "short", timeStyle: "short" })

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="sm" className="rounded-full text-muted-foreground" />}>
        <TrophyIcon data-icon="inline-start" />
        {t("stats.title")}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrophyIcon className="size-5 text-primary" aria-hidden="true" />
            {t("stats.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <StatTile label={t("stats.played")} value={String(stats.played)} />
          <StatTile label={t("stats.wins")} value={String(stats.wins)} accent />
          <StatTile
            label={t("stats.winRate")}
            value={stats.winRate === null ? "–" : `${Math.round(stats.winRate * 100)}%`}
          />
          <StatTile label={t("stats.bestStreak")} value={String(stats.bestStreak)} />
        </div>
        {stats.currentStreak > 1 && (
          <p className="text-center text-sm font-semibold text-primary">
            {t("stats.currentStreak", { count: stats.currentStreak })}
          </p>
        )}

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-bold">{t("stats.recent")}</h3>
          {records.length === 0 ? (
            <p className="rounded-xl bg-black/15 p-4 text-center text-sm text-muted-foreground">{t("stats.empty")}</p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1.5 overflow-y-auto pr-1">
              {records.slice(0, RECENT_LIMIT).map((record) => (
                <MatchRow key={record.id} record={record} formatTime={(time) => timeFormat.format(time)} />
              ))}
            </ul>
          )}
        </section>

        <footer className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>{t("stats.note")}</span>
          {records.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="text-muted-foreground" />}>
                {t("stats.clear")}
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("stats.clearConfirmTitle")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("stats.clearConfirm")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("stats.cancel")}</AlertDialogCancel>
                  <AlertDialogAction variant="destructive" onClick={clearHistory}>
                    {t("stats.clear")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  )
}
