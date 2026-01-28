"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useGameStore } from "@/lib/game/store"
import { Vote, User, Check } from "lucide-react"
import { supabase } from "@/lib/supabase/client"

export default function VotingPage() {
  const [selectedVote, setSelectedVote] = useState<string | null>(null)
  const [messages, setMessages] = useState<
    { id: string; text: string; player_id: string; created_at: string; round_number: number }[]
  >([])
  const router = useRouter()
  const { roomCode, roomId, players, status, castVote, playerId, resumeSession } = useGameStore()

  const currentPlayer = players.find((player) => player.id === playerId)
  const hasVoted = Boolean(currentPlayer?.votedFor)

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
    if (status === "results") {
      router.push("/game/results")
    }
  }, [status, router])

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const loadMessages = async () => {
      if (!roomId) return
      const { data } = await supabase
        .from("messages")
        .select("id, text, player_id, created_at, round_number")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
      if (data) setMessages(data)
    }
    loadMessages()
    timer = setInterval(loadMessages, 2000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [roomId])

  const handleConfirmVote = async () => {
    if (!selectedVote) return
    await castVote(selectedVote)
    setSelectedVote(null)
  }

  const otherPlayers = players.filter((player) => player.id !== currentPlayer?.id)
  const missingVoters = players.filter((player) => !player.votedFor).map((player) => player.name)
  const playersById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p.name])), [players])

  if (!roomCode || !currentPlayer) {
    return null
  }

  return (
    <main className="min-h-screen flex flex-col items-center p-4 bg-background">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-md pt-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Vote className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Votação</h1>
          </div>
          <p className="text-muted-foreground">Escolha quem você acha que é o impostor</p>
        </div>

        {!hasVoted ? (
          <>
            {messages.length > 0 && (
              <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg text-card-foreground">Histórico de dicas</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                  {messages.map((msg) => (
                    <div key={msg.id} className="flex flex-col bg-secondary/50 rounded-md px-3 py-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">
                          {playersById[msg.player_id] || "Jogador"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">R{msg.round_number}</span>
                      </div>
                      <span className="text-sm text-foreground break-words">{msg.text}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-card-foreground">Quem você acha que é o impostor?</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {otherPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedVote(player.id)}
                    className={`flex items-center gap-3 p-4 rounded-lg transition-all ${
                      selectedVote === player.id
                        ? "bg-destructive/20 border-2 border-destructive/50"
                        : "bg-secondary/50 border-2 border-transparent hover:bg-secondary"
                    }`}
                  >
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full ${
                        selectedVote === player.id
                          ? "bg-destructive/30 text-destructive"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <span
                      className={`font-medium ${
                        selectedVote === player.id ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {player.name}
                    </span>
                    {selectedVote === player.id && <Check className="w-5 h-5 text-destructive ml-auto" />}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Button
              onClick={handleConfirmVote}
              disabled={!selectedVote}
              size="lg"
              className="w-full h-14 text-lg bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Vote className="w-5 h-5 mr-2" />
              Confirmar Voto
            </Button>
            {missingVoters.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Faltando votar: {missingVoters.join(", ")}
              </p>
            )}
          </>
        ) : (
          <>
            <Card className="w-full bg-accent/10 border-accent/30">
              <CardContent className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                  <Check className="w-8 h-8 text-accent" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-foreground">Voto registrado!</h3>
                  <p className="text-muted-foreground mt-2">Aguardando os outros jogadores...</p>
                </div>
              </CardContent>
            </Card>
            {missingVoters.length > 0 && (
              <p className="text-xs text-muted-foreground text-center">
                Faltando votar: {missingVoters.join(", ")}
              </p>
            )}
          </>
        )}

        <p className="text-xs text-muted-foreground text-center">
          Certifique-se que apenas você está vendo a tela ao votar
        </p>
      </div>
    </main>
  )
}
