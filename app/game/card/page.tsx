"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HelpDialog } from "@/components/help/help-dialog"
import { useGameStore } from "@/lib/game/store"
import { Eye, EyeOff, Skull, MessageCircle } from "lucide-react"

export default function CardRevealPage() {
  const [isRevealed, setIsRevealed] = useState(false)
  const router = useRouter()
  const {
    roomCode,
    roomId,
    players,
    status,
    playerId,
    theme,
    cardRole,
    fetchMyCard,
    markCardSeen,
    resumeSession,
  } = useGameStore()

  const currentPlayer = players.find((player) => player.id === playerId)
  const hasSeenCard = currentPlayer?.hasSeenCard

  useEffect(() => {
    if (roomId && playerId && players.length === 0) {
      resumeSession()
    }
  }, [roomId, playerId, players.length, resumeSession])

  useEffect(() => {
    if (!roomCode && !roomId) {
      router.push("/")
    }
  }, [roomCode, roomId, router])

  useEffect(() => {
    if (status === "playing") {
      router.push("/game/round")
    }
  }, [status, router])

  const handleReveal = async () => {
    setIsRevealed(true)
    if (!cardRole) {
      await fetchMyCard()
    }
  }

  const handleReady = async () => {
    await markCardSeen()
  }

  if (!roomCode || !currentPlayer) {
    return null
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {cardRole === "impostor" ? (
          <div className="absolute inset-0 bg-destructive/5" />
        ) : (
          <div className="absolute inset-0 bg-accent/5" />
        )}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">{currentPlayer.name}</h1>
          <p className="text-muted-foreground mt-1">Esta é a sua carta secreta</p>
        </div>

        <Card
          className={`w-full aspect-[3/4] relative overflow-hidden transition-all duration-500 ${
            isRevealed
              ? cardRole === "impostor"
                ? "bg-destructive/10 border-destructive/50"
                : "bg-accent/10 border-accent/50"
              : "bg-card border-border"
          }`}
        >
          <CardContent className="flex flex-col items-center justify-center h-full p-6">
            {!isRevealed ? (
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
                  <EyeOff className="w-10 h-10 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg text-muted-foreground">Carta escondida</p>
                  <p className="text-sm text-muted-foreground/70 mt-2">
                    Certifique-se que apenas você está vendo a tela
                  </p>
                </div>
                <Button
                  onClick={handleReveal}
                  size="lg"
                  className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Eye className="w-5 h-5 mr-2" />
                  Revelar Carta
                </Button>
              </div>
            ) : !cardRole ? (
              <p className="text-muted-foreground">Carregando carta...</p>
            ) : (
              <div className="flex flex-col items-center gap-6 text-center animate-in fade-in zoom-in duration-300">
                {cardRole === "impostor" ? (
                  <>
                    <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center">
                      <Skull className="w-12 h-12 text-destructive" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-destructive">IMPOSTOR</h2>
                      <p className="text-muted-foreground mt-3 text-balance">
                        Você não sabe o tema. Tente se passar por um jogador normal sem ser descoberto!
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center">
                      <MessageCircle className="w-12 h-12 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground uppercase tracking-wider">O tema é</p>
                      <h2 className="text-3xl font-bold text-accent mt-2">{theme}</h2>
                      <p className="text-muted-foreground mt-3 text-balance">
                        Fale sobre o tema sem revelar demais para o impostor!
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {isRevealed && !hasSeenCard && (
          <Button
            onClick={handleReady}
            size="lg"
            className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Estou pronto
          </Button>
        )}

        {hasSeenCard && (
          <p className="text-xs text-muted-foreground text-center">Aguardando os outros jogadores...</p>
        )}
      </div>

      <HelpDialog
        title="Sua carta secreta"
        description="Cada jogador revela a carta só para si."
        steps={[
          "Garanta que ninguém esteja vendo sua tela.",
          "Toque em Revelar Carta para ver seu papel.",
          "Se for impostor, blefe sem entregar o tema.",
          "Toque em Estou pronto para avisar que já viu a carta.",
        ]}
        tips={["Se não for impostor, fale do tema sem facilitar demais."]}
      />
    </main>
  )
}
