"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/lib/game/store"
import { Trophy, Skull, RotateCcw, Home, MessageCircle, Users } from "lucide-react"

export default function ResultsPage() {
  const router = useRouter()
  const {
    roomCode,
    roomId,
    players,
    status,
    results,
    fetchResults,
    resetToLobby,
    resetGame,
    playerId,
    resumeSession,
  } = useGameStore()

  const localPlayer = players.find((player) => player.id === playerId)
  const isHost = localPlayer?.isHost

  useEffect(() => {
    if (!roomCode && roomId && playerId && players.length === 0) {
      resumeSession()
    }
  }, [roomCode, roomId, playerId, players.length, resumeSession])

  useEffect(() => {
    if (!roomCode && !roomId) {
      router.push("/")
      return
    }
    if (status !== "results" && roomCode) {
      router.push("/")
    }
  }, [roomCode, roomId, status, router])

  useEffect(() => {
    if (status === "results" && !results) {
      fetchResults()
    }
  }, [status, results, fetchResults])

  if (!roomCode || status !== "results") {
    return null
  }

  if (!results) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-background">
        <p className="text-muted-foreground">Carregando resultados...</p>
      </main>
    )
  }

  const handlePlayAgain = async () => {
    if (!isHost) return
    await resetToLobby()
    router.push("/")
  }

  const handleGoHome = async () => {
    await resetGame()
    router.push("/")
  }

  const voteCounts = players
    .map((player) => ({
      ...player,
      voteCount: results.votes[player.id] || 0,
    }))
    .sort((a, b) => b.voteCount - a.voteCount)

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {results.impostorCaught ? (
          <div className="absolute inset-0 bg-accent/5" />
        ) : (
          <div className="absolute inset-0 bg-destructive/5" />
        )}
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md py-8">
        <Card
          className={`w-full ${
            results.impostorCaught ? "bg-accent/10 border-accent/30" : "bg-destructive/10 border-destructive/30"
          }`}
        >
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center ${
                results.impostorCaught ? "bg-accent/20" : "bg-destructive/20"
              }`}
            >
              {results.impostorCaught ? (
                <Trophy className="w-12 h-12 text-accent" />
              ) : (
                <Skull className="w-12 h-12 text-destructive" />
              )}
            </div>
            <div className="text-center">
              <h1
                className={`text-3xl font-bold ${results.impostorCaught ? "text-accent" : "text-destructive"}`}
              >
                {results.impostorCaught ? "Impostor Capturado!" : "Impostor Escapou!"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {results.impostorCaught
                  ? "A equipe descobriu quem estava blefando!"
                  : "O impostor conseguiu enganar todos!"}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 w-full">
          <Card className="bg-destructive/10 border-destructive/30">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <Skull className="w-8 h-8 text-destructive" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Impostor</p>
              <p className="text-lg font-bold text-foreground">{results.impostorName}</p>
            </CardContent>
          </Card>

          <Card className="bg-accent/10 border-accent/30">
            <CardContent className="flex flex-col items-center gap-2 py-6">
              <MessageCircle className="w-8 h-8 text-accent" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Tema</p>
              <p className="text-lg font-bold text-foreground">{results.theme}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Resultado da Votação
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {voteCounts.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  player.id === results.impostorId ? "bg-destructive/20 border border-destructive/30" : "bg-secondary/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      index === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index + 1}
                  </div>
                  <span
                    className={`font-medium ${
                      player.id === results.impostorId ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {player.name}
                    {player.id === results.impostorId && " (Impostor)"}
                  </span>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {player.voteCount} {player.voteCount === 1 ? "voto" : "votos"}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={handlePlayAgain}
            disabled={!isHost}
            size="lg"
            className="h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <RotateCcw className="w-5 h-5 mr-2" />
            Jogar Novamente
          </Button>
          {!isHost && (
            <p className="text-center text-sm text-muted-foreground">Aguardando o host reiniciar a sala</p>
          )}
          <Button
            onClick={handleGoHome}
            variant="outline"
            size="lg"
            className="h-12 bg-transparent border-border text-foreground hover:bg-secondary"
          >
            <Home className="w-5 h-5 mr-2" />
            Voltar ao Início
          </Button>
        </div>
      </div>
    </main>
  )
}