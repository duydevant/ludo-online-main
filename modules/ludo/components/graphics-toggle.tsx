"use client"

import { useState } from "react"
import { BoxIcon, SquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useI18n, type TranslationKey } from "@/lib/i18n"

import {
  useLudoSettingsStore,
  type BoardStyle,
  type CameraView,
  type GraphicsMode,
  type PieceKind,
} from "../store/ludo-settings.store"
import { supportsWebGL } from "./game-table"

interface OptionGroupProps<T extends string> {
  label: TranslationKey
  value: T
  options: readonly { value: T; label: TranslationKey }[]
  onChange: (value: T) => void
}

function OptionGroup<T extends string>({ label, value, options, onChange }: OptionGroupProps<T>) {
  const { t } = useI18n()
  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{t(label)}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={value} onValueChange={(next) => onChange(next as T)}>
        {options.map((option) => (
          <DropdownMenuRadioItem key={option.value} value={option.value} closeOnClick={false}>
            {t(option.label)}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  )
}

const GRAPHICS = [
  { value: "3d", label: "ludo.board.graphics.3d" },
  { value: "2d", label: "ludo.board.graphics.2d" },
] as const satisfies readonly { value: GraphicsMode; label: TranslationKey }[]
const STYLES = [
  { value: "walnut", label: "ludo.board.style.walnut" },
  { value: "lacquer", label: "ludo.board.style.lacquer" },
  { value: "marble", label: "ludo.board.style.marble" },
] as const satisfies readonly { value: BoardStyle; label: TranslationKey }[]
const PIECES = [
  { value: "horse", label: "ludo.board.piece.horse" },
  { value: "seahorse", label: "ludo.board.piece.seahorse" },
] as const satisfies readonly { value: PieceKind; label: TranslationKey }[]
const VIEWS = [
  { value: "angled", label: "ludo.board.view.angled" },
  { value: "top", label: "ludo.board.view.top" },
] as const satisfies readonly { value: CameraView; label: TranslationKey }[]

/** Menu "Bàn cờ" ở thanh trên màn chơi: 2D / 3D, và với 3D là phong cách, kiểu quân, góc nhìn. */
export function GraphicsToggle() {
  const { t } = useI18n()
  const settings = useLudoSettingsStore()
  const [webgl] = useState(supportsWebGL)
  const mode = webgl ? settings.graphics : "2d"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="rounded-full font-bold" aria-label={t("ludo.board.menu")} />
        }
      >
        {mode === "3d" ? <BoxIcon data-icon="inline-start" /> : <SquareIcon data-icon="inline-start" />}
        {mode.toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {webgl ? (
          <OptionGroup label="ludo.board.graphics" value={mode} options={GRAPHICS} onChange={settings.setGraphics} />
        ) : (
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("ludo.graphics.unsupported")}</DropdownMenuLabel>
          </DropdownMenuGroup>
        )}
        {mode === "3d" && (
          <>
            <DropdownMenuSeparator />
            <OptionGroup label="ludo.board.style" value={settings.boardStyle} options={STYLES} onChange={settings.setBoardStyle} />
            <DropdownMenuSeparator />
            <OptionGroup label="ludo.board.piece" value={settings.pieceKind} options={PIECES} onChange={settings.setPieceKind} />
            <DropdownMenuSeparator />
            <OptionGroup label="ludo.board.view" value={settings.cameraView} options={VIEWS} onChange={settings.setCameraView} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
