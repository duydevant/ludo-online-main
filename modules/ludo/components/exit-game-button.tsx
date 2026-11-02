"use client"

import { ArrowLeftIcon } from "lucide-react"

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
import { useI18n } from "@/lib/i18n"

interface ExitGameButtonProps {
  label: string
  /** Hỏi lại trước khi thoát (ván đang dở). */
  confirm: boolean
  /** Nội dung hộp thoại xác nhận, mặc định là "ván không được lưu". */
  confirmDescription?: string
  onExit: () => void
}

/** Nút thoát ở góc trái thanh trên của màn chơi. */
export function ExitGameButton({ label, confirm, confirmDescription, onExit }: ExitGameButtonProps) {
  const { t } = useI18n()
  const content = (
    <>
      <ArrowLeftIcon data-icon="inline-start" />
      {label}
    </>
  )

  if (!confirm) {
    return (
      <Button variant="ghost" size="sm" className="rounded-full" onClick={onExit}>
        {content}
      </Button>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="ghost" size="sm" className="rounded-full" />}>{content}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("menu.exitConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{confirmDescription ?? t("menu.exitConfirm")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("menu.keepPlaying")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onExit}>
            {label}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
