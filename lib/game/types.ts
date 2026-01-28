export type GameStatus =
  | "lobby"
  | "revealing"
  | "playing"
  | "voting"
  | "results"

export type CardRole = "impostor" | "crew"

export interface Player {
  id: string
  name: string
  isHost: boolean
  hasSeenCard: boolean
  votedFor: string | null
}

export interface GameResults {
  impostorId: string
  impostorName: string
  theme: string
  votes: Record<string, number>
  impostorCaught: boolean
}

export interface GameState {
  roomId: string
  roomCode: string
  playerId: string
  status: GameStatus
  mode: "presencial" | "online"
  totalRounds: number
  currentRound: number
  players: Player[]
  theme: string | null
  cardRole: CardRole | null
  turnOrder: string[]
  currentTurnIndex: number
  currentRevealingPlayer: number
  results: GameResults | null
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 4; i += 1) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
