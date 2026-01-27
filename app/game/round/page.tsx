"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGameStore } from "@/lib/game/store"
import { Mic, ArrowRight, Users, CheckCircle2 } from "lucide-react"

export default function RoundPage() {
  const router = useRouter()
  const {
    roomCode,
    roomId,
    players,
    turnOrder,
    currentTurnIndex,
    status,
    nextTurn,
    playerId,
    resumeSession,
  } = useGameStore()

  useEffect(() => {
    if (!roomCode && roomId && playerId && players.length === 0) {
      resumeSession()
    }
  }, [roomCode, roomId, playerId, players.length, resumeSession])

  useEffect(() => {
    if (!roomCode && !roomId) {
      router.push("/")
    }
  }, [roomCode, roomId, router])

  useEffect(() => {
    if (status === "voting") {
      router.push("/game/voting")
    }
  }, [status, router])

  const currentPlayerId = turnOrder[currentTurnIndex]
  const currentPlayer = players.find((player) => player.id === currentPlayerId)
  const localPlayer = players.find((player) => player.id === playerId)
  const isHost = localPlayer?.isHost

  const getPlayerByOrder = (index: number) => {
    const playerIdByOrder = turnOrder[index]
    return players.find((player) => player.id === playerIdByOrder)
  }

  if (!roomCode) {
    return null
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-20 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md pt-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Rodada de Fala</h1>
          <p className="text-muted-foreground mt-1">
            Turno {currentTurnIndex + 1} de {turnOrder.length}
          </p>
        </div>

        <Card className="w-full bg-primary/10 border-primary/30">
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Mic className="w-10 h-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground uppercase tracking-wider">Agora é a vez de</p>
              <h2 className="text-3xl font-bold text-foreground mt-2">{currentPlayer?.name}</h2>
            </div>
            <p className="text-sm text-muted-foreground text-center text-balance max-w-xs">
              Fale algo relacionado ao tema (ou finja, se for o impostor). Os outros jogadores vão
              prestar atenção em você!
            </p>
          </CardContent>
        </Card>

        <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Ordem de fala</span>
            </div>
            <div className="flex flex-col gap-2">
              {turnOrder.map((_, index) => {
                const player = getPlayerByOrder(index)
                const isPast = index < currentTurnIndex
                const isCurrent = index === currentTurnIndex

                return (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      isCurrent
                        ? "bg-primary/20 border border-primary/30"
                        : isPast
                          ? "bg-secondary/30 opacity-60"
                          : "bg-secondary/50"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        isCurrent
                          ? "bg-primary text-primary-foreground"
                          : isPast
                            ? "bg-accent/50 text-accent-foreground"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                    </div>
                    <span className={`font-medium ${isCurrent ? "text-foreground" : "text-muted-foreground"}`}>
                      {player?.name}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto text-xs text-primary font-medium uppercase">Falando</span>
                    )}
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={nextTurn}
          disabled={!isHost}
          size="lg"
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {currentTurnIndex < turnOrder.length - 1 ? (
            <>
              Próximo Jogador
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          ) : (
            <>
              Ir para Votação
              <ArrowRight className="w-5 h-5 ml-2" />
            </>
          )}
        </Button>

        {!isHost && (
          <p className="text-xs text-muted-foreground text-center">Aguardando o host avançar a rodada</p>
        )}
      </div>
    </main>
  )
}