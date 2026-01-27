"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/lib/game/store"
import { Users, Crown, Play, Copy, Check } from "lucide-react"

export default function LobbyPage() {
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const { roomCode, roomId, players, status, startGame, playerId, resumeSession } = useGameStore()

  const currentPlayer = players.find((player) => player.id === playerId)
  const isHost = currentPlayer?.isHost

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
    if (status === "revealing") {
      router.push("/game/card")
    }
  }, [status, router])

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const canStart = players.length >= 3 && isHost

  if (!roomCode) {
    return null
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 -right-32 w-80 h-80 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md pt-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Lobby da Sala</h1>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
          >
            <span className="text-lg font-mono font-bold text-secondary-foreground tracking-wider">
              {roomCode}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-accent" />
            ) : (
              <Copy className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <p className="text-sm text-muted-foreground">Compartilhe o código com seus amigos</p>
        </div>

        <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg text-card-foreground flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Jogadores
              </CardTitle>
              <span className="text-sm text-muted-foreground">{players.length}/10</span>
            </div>
            <CardDescription>Mínimo de 3 jogadores para começar</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {players.map((player, index) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-primary/20 text-primary rounded-full text-sm font-medium">
                      {index + 1}
                    </div>
                    <span className="font-medium text-secondary-foreground">{player.name}</span>
                    {player.isHost && <Crown className="w-4 h-4 text-amber-500" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={startGame}
            disabled={!canStart}
            className="h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Play className="w-6 h-6 mr-2" />
            Iniciar Jogo
          </Button>
          {!isHost && (
            <p className="text-center text-sm text-muted-foreground">Aguardando o host iniciar</p>
          )}
          {isHost && players.length < 3 && (
            <p className="text-center text-sm text-muted-foreground">
              Adicione pelo menos {3 - players.length} jogador(es) para começar
            </p>
          )}
        </div>

        <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-muted-foreground text-center">
              Cada jogador entra pelo próprio dispositivo e vê sua carta secreta.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}