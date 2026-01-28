"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GameState, Player, GameResults, CardRole } from "./types"
import { supabase } from "@/lib/supabase/client"

interface GameStore extends GameState {
  createRoom: (hostName: string, mode: GameState["mode"], totalRounds: number) => Promise<void>
  joinRoom: (playerName: string, roomCode: string) => Promise<void>
  resumeSession: () => Promise<void>
  startGame: () => Promise<void>
  markCardSeen: () => Promise<void>
  fetchMyCard: () => Promise<void>
  nextTurn: () => Promise<void>
  castVote: (votedForId: string) => Promise<void>
  fetchResults: () => Promise<void>
  resetToLobby: () => Promise<void>
  resetGame: () => Promise<void>
}

const initialState: GameState = {
  roomId: "",
  roomCode: "",
  playerId: "",
  status: "lobby",
  mode: "presencial",
  totalRounds: 1,
  currentRound: 1,
  players: [],
  theme: null,
  cardRole: null,
  turnOrder: [],
  currentTurnIndex: 0,
  currentRevealingPlayer: 0,
  results: null,
}

type RoomRow = {
  id: string
  code: string
  status: GameState["status"]
  host_player_id: string | null
  mode?: GameState["mode"]
  total_rounds?: number | null
  current_round?: number | null
  turn_order: string[] | null
  current_turn_index: number | null
  current_revealing_player: number | null
}

type PlayerRow = {
  id: string
  name: string
  is_host: boolean
  has_seen_card: boolean
  voted_for: string | null
}

let roomChannel: ReturnType<typeof supabase.channel> | null = null
let playersChannel: ReturnType<typeof supabase.channel> | null = null
let pollingTimer: ReturnType<typeof setInterval> | null = null

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

const fetchJson = async <T,>(url: string, body: Record<string, unknown>): Promise<T> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const message = await res.text()
    throw new Error(message || `Request failed: ${res.status}`)
  }
  return res.json() as Promise<T>
}

const mapPlayers = (rows: PlayerRow[]): Player[] =>
  rows.map((row) => ({
    id: row.id,
    name: row.name,
    isHost: row.is_host,
    hasSeenCard: row.has_seen_card,
    votedFor: row.voted_for,
  }))

const hydrateRoom = async (
  roomId: string,
  roomCode: string,
  playerId: string,
  setState: (partial: Partial<GameState>) => void,
) => {
  const { data: room, error: roomError } = await supabase
    .from("rooms")
    .select(
      "id, code, status, host_player_id, mode, total_rounds, current_round, turn_order, current_turn_index, current_revealing_player",
    )
    .eq("id", roomId)
    .single()

  if (roomError || !room) {
    throw new Error(roomError?.message || "Room not found")
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id, name, is_host, has_seen_card, voted_for")
    .eq("room_id", roomId)
    .order("created_at")

  if (playersError || !players) {
    throw new Error(playersError?.message || "Players not found")
  }

  setState({
    roomId,
    roomCode: room.code || roomCode,
    playerId,
    status: room.status,
    mode: (room.mode as GameState["mode"]) || "presencial",
    totalRounds: room.total_rounds ?? 1,
    currentRound: room.current_round ?? 1,
    turnOrder: room.turn_order || [],
    currentTurnIndex: room.current_turn_index ?? 0,
    currentRevealingPlayer: room.current_revealing_player ?? 0,
    players: mapPlayers(players as PlayerRow[]),
  })

  roomChannel?.unsubscribe()
  playersChannel?.unsubscribe()

  roomChannel = supabase
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "rooms", filter: `id=eq.${roomId}` },
      (payload) => {
        if (payload.eventType === "DELETE") {
          stopPolling()
          setState(initialState)
          return
        }
        const next = payload.new as RoomRow
        setState({
          status: next.status,
          mode: (next.mode as GameState["mode"]) || "presencial",
          totalRounds: next.total_rounds ?? 1,
          currentRound: next.current_round ?? 1,
          turnOrder: next.turn_order || [],
          currentTurnIndex: next.current_turn_index ?? 0,
          currentRevealingPlayer: next.current_revealing_player ?? 0,
          roomCode: next.code,
        })
      },
    )
    .subscribe()

  playersChannel = supabase
    .channel(`players:${roomId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "players", filter: `room_id=eq.${roomId}` },
      async () => {
        const { data } = await supabase
          .from("players")
          .select("id, name, is_host, has_seen_card, voted_for")
          .eq("room_id", roomId)
          .order("created_at")

        if (data) {
          setState({ players: mapPlayers(data as PlayerRow[]) })
        }
      },
    )
    .subscribe()

  if (!pollingTimer) {
    pollingTimer = setInterval(async () => {
      const { data: refreshedRoom } = await supabase
        .from("rooms")
        .select(
          "id, code, status, host_player_id, mode, total_rounds, current_round, turn_order, current_turn_index, current_revealing_player",
        )
        .eq("id", roomId)
        .single()

      const { data: refreshedPlayers } = await supabase
        .from("players")
        .select("id, name, is_host, has_seen_card, voted_for")
        .eq("room_id", roomId)
        .order("created_at")

      if (refreshedRoom) {
        setState({
          status: refreshedRoom.status,
          mode: (refreshedRoom.mode as GameState["mode"]) || "presencial",
          totalRounds: refreshedRoom.total_rounds ?? 1,
          currentRound: refreshedRoom.current_round ?? 1,
          turnOrder: refreshedRoom.turn_order || [],
          currentTurnIndex: refreshedRoom.current_turn_index ?? 0,
          currentRevealingPlayer: refreshedRoom.current_revealing_player ?? 0,
          roomCode: refreshedRoom.code,
        })
      }

      if (refreshedPlayers) {
        setState({ players: mapPlayers(refreshedPlayers as PlayerRow[]) })
      }
    }, 2000)
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      createRoom: async (hostName: string, mode: GameState["mode"], totalRounds: number) => {
        const data = await fetchJson<{ roomId: string; roomCode: string; playerId: string }>(
          "/api/rooms/create",
          { name: hostName, mode, totalRounds },
        )
        await hydrateRoom(data.roomId, data.roomCode, data.playerId, set)
      },

      joinRoom: async (playerName: string, roomCode: string) => {
        const data = await fetchJson<{ roomId: string; roomCode: string; playerId: string }>(
          "/api/rooms/join",
          { name: playerName, code: roomCode },
        )
        await hydrateRoom(data.roomId, data.roomCode, data.playerId, set)
      },

      resumeSession: async () => {
        const { roomId, roomCode, playerId } = get()
        if (!roomId || !playerId) return
        try {
          await hydrateRoom(roomId, roomCode, playerId, set)
        } catch {
          set(initialState)
        }
      },

      startGame: async () => {
        const { roomId } = get()
        if (!roomId) return
        await fetchJson<{ ok: true }>("/api/game/start", { roomId })
        set({ theme: null, cardRole: null, results: null })
      },

      markCardSeen: async () => {
        const { roomId, playerId } = get()
        if (!roomId || !playerId) return
        await fetchJson<{ ok: true }>("/api/game/ready", { roomId, playerId })
      },

      fetchMyCard: async () => {
        const { roomId, playerId } = get()
        if (!roomId || !playerId) return
        const data = await fetchJson<{ role: CardRole; theme: string | null }>(
          "/api/game/my-card",
          { roomId, playerId },
        )
        set({ cardRole: data.role, theme: data.theme })
      },

      nextTurn: async () => {
        const { roomId, currentTurnIndex, turnOrder, currentRound, totalRounds } = get()
        if (!roomId || turnOrder.length === 0) return
        const isLast = currentTurnIndex >= turnOrder.length - 1
        const updates = isLast
          ? currentRound >= totalRounds
            ? { status: "voting", current_turn_index: 0 }
            : { current_turn_index: 0, current_round: currentRound + 1 }
          : { current_turn_index: currentTurnIndex + 1 }

        await supabase.from("rooms").update(updates).eq("id", roomId)
      },

      castVote: async (votedForId: string) => {
        const { roomId, playerId } = get()
        if (!roomId || !playerId) return
        await fetchJson<{ ok: true }>("/api/game/vote", {
          roomId,
          voterId: playerId,
          votedForId,
        })
      },

      fetchResults: async () => {
        const { roomId } = get()
        if (!roomId) return
        const data = await fetchJson<GameResults>("/api/game/results", { roomId })
        set({ results: data, theme: data.theme })
      },

      resetToLobby: async () => {
        const { roomId } = get()
        if (!roomId) return
        await fetchJson<{ ok: true }>("/api/game/reset", { roomId })
        stopPolling()
        roomChannel?.unsubscribe()
        playersChannel?.unsubscribe()
        roomChannel = null
        playersChannel = null
        set(initialState)
      },

      resetGame: async () => {
        const { roomId, playerId } = get()
        if (roomId && playerId) {
          try {
            await fetchJson<{ ok: true }>("/api/rooms/leave", { roomId, playerId })
          } catch {
            // Ignore errors if room was already deleted.
          }
        }
        stopPolling()
        roomChannel?.unsubscribe()
        playersChannel?.unsubscribe()
        roomChannel = null
        playersChannel = null
        set(initialState)
      },
    }),
    {
      name: "impostor-session",
      partialize: (state) => ({
        roomId: state.roomId,
        roomCode: state.roomCode,
        playerId: state.playerId,
      }),
    },
  ),
)
