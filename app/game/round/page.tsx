"use client"

import { useEffect, useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useGameStore } from "@/lib/game/store"
import { Mic, ArrowRight, Users, CheckCircle2 } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"

export default function RoundPage() {
  const router = useRouter()
  const {
    roomCode,
    roomId,
    players,
    turnOrder,
    currentTurnIndex,
    currentRound,
    totalRounds,
    mode,
    status,
    nextTurn,
    playerId,
    resumeSession,
  } = useGameStore()

  const [chatMessages, setChatMessages] = useState<{ id: string; text: string; player_id: string; created_at: string }[]>([])
  const [chatInput, setChatInput] = useState("")

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
  const canAdvance = mode === "presencial" ? isHost || currentPlayerId === playerId : isHost

  const getPlayerByOrder = (index: number) => {
    const playerIdByOrder = turnOrder[index]
    return players.find((player) => player.id === playerIdByOrder)
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const loadMessages = async () => {
      if (!roomId) return
      const { data } = await supabase
        .from("messages")
        .select("id, text, player_id, created_at")
        .eq("room_id", roomId)
        .eq("round_number", currentRound)
        .order("created_at", { ascending: true })
      if (data) setChatMessages(data)
    }
    loadMessages()
    timer = setInterval(loadMessages, 2000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [roomId, currentRound])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !roomId || !playerId) return
    await supabase.from("messages").insert({
      room_id: roomId,
      player_id: playerId,
      text: chatInput.trim(),
      round_number: currentRound,
    })
    setChatInput("")
  }

  const handleForceVoting = async () => {
    if (!isHost || !roomId) return
    await supabase.from("rooms").update({ status: "voting" }).eq("id", roomId)
  }

  const playersById = useMemo(() => Object.fromEntries(players.map((p) => [p.id, p.name])), [players])

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
            Rodada {currentRound} de {totalRounds} · Turno {currentTurnIndex + 1} de {turnOrder.length}
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
          disabled={!canAdvance}
          size="lg"
          className="w-full h-14 text-lg bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {(() => {
            const isLastInTurn = currentTurnIndex >= turnOrder.length - 1
            if (!isLastInTurn) {
              return (
                <>
                  Próximo Jogador
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )
            }
            const isLastRound = currentRound >= totalRounds
            if (isLastRound) {
              return (
                <>
                  Ir para Votação
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )
            }
            return (
              <>
                Próxima Rodada
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )
          })()}
        </Button>

        {isHost && (
          <Button
            onClick={handleForceVoting}
            variant="outline"
            className="w-full"
          >
            Iniciar votação agora
          </Button>
        )}

        {!canAdvance && (
          <p className="text-xs text-muted-foreground text-center">
            {mode === "presencial"
              ? "Aguardando o jogador da vez ou o host avançar"
              : "Aguardando o host avançar a rodada"}
          </p>
        )}

        {mode === "online" && (
          <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
            <CardContent className="pt-4 pb-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Chat da rodada</span>
                <span className="text-xs text-muted-foreground">apaga ao trocar de rodada</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="flex flex-col bg-secondary/50 rounded-md px-3 py-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {playersById[msg.player_id] || "Jogador"}
                    </span>
                    <span className="text-sm text-foreground break-words">{msg.text}</span>
                  </div>
                ))}
                {chatMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem mensagens nesta rodada.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Dica rápida..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!chatInput.trim()}>
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
