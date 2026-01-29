"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HelpDialog } from "@/components/help/help-dialog"
import { CleanupDialog } from "@/components/help/cleanup-dialog"
import { useGameStore } from "@/lib/game/store"
import { Eye, Users, Sparkles, LogIn } from "lucide-react"

export default function HomePage() {
  const [playerName, setPlayerName] = useState("")
  const [roomCodeInput, setRoomCodeInput] = useState("")
  const [mode, setMode] = useState<"presencial" | "online">("presencial")
  const [rounds, setRounds] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { createRoom, joinRoom, resumeSession, status, roomId, roomCode, playerId } = useGameStore()
  const minRounds = 1
  const maxRounds = 10

  const clampRounds = (value: number) => Math.max(minRounds, Math.min(maxRounds, value))
  const updateRounds = (value: number) => setRounds(clampRounds(value))

  const handleCreateRoom = async () => {
    if (!playerName.trim()) return
    setIsLoading(true)
    try {
      await createRoom(playerName.trim(), mode, rounds || 1)
      router.push("/lobby")
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    if (!playerName.trim() || !roomCodeInput.trim()) return
    setIsLoading(true)
    try {
      await joinRoom(playerName.trim(), roomCodeInput.trim().toUpperCase())
      router.push("/lobby")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (roomId && playerId) {
      resumeSession()
    }
  }, [roomId, playerId, resumeSession])

  useEffect(() => {
    if (!roomCode || !roomId || !playerId) return
    if (status === "lobby") {
      router.push("/lobby")
      return
    }
    if (status === "revealing") {
      router.push("/game/card")
      return
    }
    if (status === "playing") {
      router.push("/game/round")
      return
    }
    if (status === "voting") {
      router.push("/game/voting")
      return
    }
    if (status === "results") {
      router.push("/game/results")
    }
  }, [status, roomCode, roomId, playerId, router])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
            <div className="relative flex items-center justify-center w-20 h-20 bg-card border border-border rounded-2xl">
              <Eye className="w-10 h-10 text-primary" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">ALIBI</h1>
          <p className="text-muted-foreground text-lg text-pretty max-w-xs">
            Descubra quem está blefando entre seus amigos
          </p>
        </div>

        <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-card-foreground">Criar Nova Sala</CardTitle>
            <CardDescription>Entre seu nome para começar uma partida</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              placeholder="Seu nome"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="h-12 bg-input border-border text-foreground placeholder:text-muted-foreground"
              maxLength={20}
            />
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <label className="font-medium text-foreground">Modalidade:</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setMode("presencial")}
                  className={`h-10 px-4 rounded-md border ${
                    mode === "presencial" ? "bg-primary text-primary-foreground border-primary" : "border-border"
                  }`}
                >
                  Presencial
                </button>
                <button
                  type="button"
                  onClick={() => setMode("online")}
                  className={`h-10 px-4 rounded-md border ${
                    mode === "online" ? "bg-primary text-primary-foreground border-primary" : "border-border"
                  }`}
                >
                  Online
                </button>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Rodadas</label>
                <span className="rounded-md bg-secondary/60 px-2 py-1 text-sm font-medium text-foreground">
                  {rounds}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-12 text-lg"
                  onClick={() => updateRounds(rounds - 1)}
                  disabled={rounds <= minRounds}
                  aria-label="Diminuir rodadas"
                >
                  -
                </Button>
                <Slider
                  min={minRounds}
                  max={maxRounds}
                  step={1}
                  value={[rounds]}
                  onValueChange={(value) => updateRounds(value[0] ?? minRounds)}
                  className="flex-1 py-2"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-12 text-lg"
                  onClick={() => updateRounds(rounds + 1)}
                  disabled={rounds >= maxRounds}
                  aria-label="Aumentar rodadas"
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Escolha entre {minRounds} e {maxRounds} rodadas</p>
            </div>
            <Button
              onClick={handleCreateRoom}
              disabled={!playerName.trim() || isLoading}
              className="h-12 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Criar Sala
            </Button>
          </CardContent>
        </Card>

        <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-card-foreground">Entrar em Sala</CardTitle>
            <CardDescription>Informe seu nome e o código da sala</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Input
              placeholder="Código da sala"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value)}
              className="h-12 bg-input border-border text-foreground placeholder:text-muted-foreground"
              maxLength={8}
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!playerName.trim() || !roomCodeInput.trim() || isLoading}
              className="h-12 text-base font-medium bg-secondary hover:bg-secondary/90 text-secondary-foreground"
            >
              <LogIn className="w-5 h-5 mr-2" />
              Entrar
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Users className="w-4 h-4" />
            <span>3 a 10 jogadores</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {["Mistério", "Dedução", "Diversão"].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-secondary text-secondary-foreground text-sm rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <CleanupDialog />

        <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-card-foreground mb-3">Como jogar:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <span className="text-primary font-medium">1.</span>
                Crie uma sala e convide seus amigos
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">2.</span>
                Um jogador será o impostor secreto
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">3.</span>
                Fale sobre o tema sem revelar demais
              </li>
              <li className="flex gap-2">
                <span className="text-primary font-medium">4.</span>
                Vote para descobrir quem é o impostor
              </li>
            </ol>
          </CardContent>
        </Card>
      </div>

      <HelpDialog
        title="Como começar"
        description="Ajuda rápida para criar ou entrar em uma sala."
        steps={[
          "Digite seu nome para identificar você na partida.",
          "Escolha a modalidade e a quantidade de rodadas.",
          "Toque em Criar Sala para gerar o código da partida.",
          "Para entrar, informe seu nome e o código e toque em Entrar.",
        ]}
        tips={["Mínimo de 3 jogadores para iniciar a partida."]}
      />
    </main>
  )
}
