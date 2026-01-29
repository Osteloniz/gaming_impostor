"use client"

import { useEffect, useState, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { HelpDialog } from "@/components/help/help-dialog"
import { ExitActions } from "@/components/help/exit-actions"
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

  const [chatMessages, setChatMessages] = useState<
    { id: string; text: string; player_id: string; created_at: string; round_number: number }[]
  >([])
  const [chatInput, setChatInput] = useState("")
  const [voteRequest, setVoteRequest] = useState<{
    id: string
    requester_player_id: string
    status: string
  } | null>(null)
  const [voteNotice, setVoteNotice] = useState<string | null>(null)
  const lastTurnRef = useRef<string | null>(null)

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
    if (status === "voting") {
      router.push("/game/voting")
    }
  }, [status, router])

  const currentPlayerId = turnOrder[currentTurnIndex]
  const currentPlayer = players.find((player) => player.id === currentPlayerId)
  const localPlayer = players.find((player) => player.id === playerId)
  const isHost = localPlayer?.isHost
  const canAdvance = mode === "presencial" ? isHost || currentPlayerId === playerId : isHost
  const isMyTurn = currentPlayerId === playerId

  const getPlayerByOrder = (index: number) => {
    const playerIdByOrder = turnOrder[index]
    return players.find((player) => player.id === playerIdByOrder)
  }

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null
    const loadRoundData = async () => {
      if (!roomId) return
      const { data } = await supabase
        .from("messages")
        .select("id, text, player_id, created_at, round_number")
        .eq("room_id", roomId)
        .order("created_at", { ascending: true })
      if (data) setChatMessages(data)

      const { data: request } = await supabase
        .from("vote_requests")
        .select("id, requester_player_id, status, created_at")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      if (request && request.status === "pending") {
        setVoteRequest({
          id: request.id,
          requester_player_id: request.requester_player_id,
          status: request.status,
        })
      } else {
        setVoteRequest(null)
        if (request?.status === "denied" && request.requester_player_id === playerId) {
          setVoteNotice("Pedido de votação recusado.")
          setTimeout(() => setVoteNotice(null), 3000)
        }
      }
    }
    loadRoundData()
    timer = setInterval(loadRoundData, 2000)
    return () => {
      if (timer) clearInterval(timer)
    }
  }, [roomId, currentRound, playerId])

  useEffect(() => {
    if (!currentPlayerId) return
    if (currentPlayerId !== lastTurnRef.current) {
      lastTurnRef.current = currentPlayerId
      if (currentPlayerId === playerId) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gain = audioContext.createGain()
          oscillator.type = "sine"
          oscillator.frequency.value = 880
          gain.gain.value = 0.05
          oscillator.connect(gain)
          gain.connect(audioContext.destination)
          oscillator.start()
          setTimeout(() => {
            oscillator.stop()
            audioContext.close()
          }, 200)
        } catch {
          // ignore audio errors
        }
      }
    }
  }, [currentPlayerId, playerId])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !roomId || !playerId || playerId !== currentPlayerId) return
    await supabase.from("messages").insert({
      room_id: roomId,
      player_id: playerId,
      text: chatInput.trim(),
      round_number: currentRound,
    })
    setChatInput("")
    if (mode === "online") {
      await nextTurn()
    }
  }

  const handleForceVoting = async () => {
    if (!isHost || !roomId) return
    await supabase.from("rooms").update({ status: "voting" }).eq("id", roomId)
  }

  const handleRequestVote = async () => {
    if (!roomId || !playerId || voteRequest) return
    await fetch("/api/game/request-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, playerId }),
    })
  }

  const handleRespondVote = async (approved: boolean) => {
    if (!voteRequest || !roomId || !playerId) return
    await fetch("/api/game/respond-vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomId,
        playerId,
        requestId: voteRequest.id,
        approved,
      }),
    })
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
          {localPlayer && (
            <p className="text-sm text-muted-foreground mt-1">Você é: {localPlayer.name}</p>
          )}
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
              {isMyTurn && (
                <span className="inline-flex mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground">
                  Sua vez!
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground text-center text-balance max-w-xs">
              Fale algo relacionado ao tema (ou finja, se for o impostor). Os outros jogadores vão
              prestar atenção em você!
            </p>
          </CardContent>
        </Card>

        {mode === "online" && (
          <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
            <CardContent className="pt-4 pb-4 flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Chat do tema</span>
                <span className="text-xs text-muted-foreground">visível para todos</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {chatMessages.map((msg) => (
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
                {chatMessages.length === 0 && (
                  <p className="text-xs text-muted-foreground">Sem mensagens ainda.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder={playerId === currentPlayerId ? "Digite sua dica..." : "Aguardando sua vez"}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={playerId !== currentPlayerId}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!chatInput.trim() || playerId !== currentPlayerId}>
                  Enviar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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

        <Button
          onClick={handleRequestVote}
          variant="secondary"
          className="w-full"
          disabled={Boolean(voteRequest)}
        >
          Solicitar votação
        </Button>

        {voteRequest && (
          <Card className="w-full bg-card/80 backdrop-blur-sm border-border">
            <CardContent className="pt-4 pb-4 flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {voteRequest.requester_player_id === playerId
                  ? "Você solicitou votação. Aguardando respostas..."
                  : `${playersById[voteRequest.requester_player_id] || "Alguém"} pediu votação.`}
              </p>
              {voteRequest.requester_player_id !== playerId && (
                <div className="flex gap-2">
                  <Button onClick={() => handleRespondVote(true)} className="flex-1">
                    Aprovar
                  </Button>
                  <Button onClick={() => handleRespondVote(false)} variant="outline" className="flex-1">
                    Recusar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {voteNotice && (
          <p className="text-xs text-muted-foreground text-center">{voteNotice}</p>
        )}

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

        <ExitActions className="mt-2" />
      </div>

      <HelpDialog
        title="Rodada de fala"
        description="Cada jogador dá uma dica sobre o tema."
        steps={[
          "Veja quem está na vez e aguarde seu turno.",
          "Quando for sua vez, escreva uma dica curta sobre o tema.",
          "Evite palavras óbvias para não ajudar o impostor.",
          "Depois de todos falarem, o jogo vai para a votação.",
        ]}
        tips={["Dicas curtas deixam o jogo mais rápido e divertido."]}
      />
    </main>
  )
}
