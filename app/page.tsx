"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/lib/game/store"
import { Eye, Users, Sparkles, LogIn } from "lucide-react"

export default function HomePage() {
  const [playerName, setPlayerName] = useState("")
  const [roomCode, setRoomCode] = useState("")
  const [mode, setMode] = useState<"presencial" | "online">("presencial")
  const [rounds, setRounds] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { createRoom, joinRoom } = useGameStore()

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
    if (!playerName.trim() || !roomCode.trim()) return
    setIsLoading(true)
    try {
      await joinRoom(playerName.trim(), roomCode.trim().toUpperCase())
      router.push("/lobby")
    } finally {
      setIsLoading(false)
    }
  }

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
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Impostor</h1>
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("presencial")}
                  className={`px-3 py-1 rounded-md border ${
                    mode === "presencial" ? "bg-primary text-primary-foreground border-primary" : "border-border"
                  }`}
                >
                  Presencial
                </button>
                <button
                  type="button"
                  onClick={() => setMode("online")}
                  className={`px-3 py-1 rounded-md border ${
                    mode === "online" ? "bg-primary text-primary-foreground border-primary" : "border-border"
                  }`}
                >
                  Online
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-muted-foreground w-24">Rodadas:</label>
              <Input
                type="number"
                min={1}
                max={10}
                value={rounds}
                onChange={(e) => setRounds(Math.max(1, Math.min(10, Number(e.target.value) || 1)))}
                className="w-24"
              />
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
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              className="h-12 bg-input border-border text-foreground placeholder:text-muted-foreground"
              maxLength={8}
            />
            <Button
              onClick={handleJoinRoom}
              disabled={!playerName.trim() || !roomCode.trim() || isLoading}
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
    </main>
  )
}
