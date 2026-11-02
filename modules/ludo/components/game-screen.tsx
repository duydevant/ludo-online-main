"use client"

import { cn } from "cn"

import { LanguageSwitcher } from "@/components/layout/language-switcher"

import { MuteToggle } from "./mute-toggle"

interface GameScreenProps {
  /** Góc trái thanh trên: nút thoát / quay lại, hoặc logo. */
  start?: React.ReactNode
  /** Giữa thanh trên: tiêu đề hoặc mã phòng. */
  center?: React.ReactNode
  /** Nút thêm ở góc phải, đứng trước nút âm thanh và ngôn ngữ. */
  end?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/** Khung một màn hình game: thanh trên mỏng (thoát · tiêu đề · âm thanh, ngôn ngữ) và nội dung. */
export function GameScreen({ start, center, end, children, className }: GameScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-md">
        <div className="mx-auto grid h-14 w-full max-w-7xl grid-cols-[1fr_auto_1fr] items-center gap-2 px-4">
          <div className="flex min-w-0 items-center gap-2">{start}</div>
          <div className="flex min-w-0 items-center justify-center">{center}</div>
          <div className="flex items-center justify-end gap-1.5">
            {end}
            <MuteToggle />
            <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className={cn("mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-4", className)}>{children}</main>
    </div>
  )
}
