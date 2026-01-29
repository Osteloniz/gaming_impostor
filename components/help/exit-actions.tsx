"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useGameStore } from "@/lib/game/store"
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
import { cn } from "@/lib/utils"

type ExitActionsProps = {
  showEndRoom?: boolean
  className?: string
}

export function ExitActions({ showEndRoom = true, className }: ExitActionsProps) {
  const router = useRouter()
  const { resetGame, resetToLobby } = useGameStore()
  const [isLeaving, setIsLeaving] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  const handleLeave = async () => {
    setIsLeaving(true)
    try {
      await resetGame()
      router.push("/")
    } finally {
      setIsLeaving(false)
    }
  }

  const handleEndRoom = async () => {
    setIsEnding(true)
    try {
      await resetToLobby()
      router.push("/")
    } finally {
      setIsEnding(false)
    }
  }

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <Button onClick={handleLeave} variant="outline" className="h-12" disabled={isLeaving || isEnding}>
        Sair da sala
      </Button>
      {showEndRoom && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="h-12" disabled={isLeaving || isEnding}>
              Encerrar sala
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Encerrar sala para todos?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso remove todos os jogadores e fecha a partida. Use apenas se a sala estiver travada.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleEndRoom}>Encerrar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
