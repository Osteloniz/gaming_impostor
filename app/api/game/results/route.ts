import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""

  if (!roomId) {
    return NextResponse.json({ error: "Room id is required" }, { status: 400 })
  }

  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id, name, voted_for")
    .eq("room_id", roomId)

  if (!players) {
    return NextResponse.json({ error: "Players not found" }, { status: 404 })
  }

  const { data: roomPrivate } = await supabaseAdmin
    .from("rooms_private")
    .select("theme_id, impostor_player_id")
    .eq("room_id", roomId)
    .single()

  if (!roomPrivate) {
    return NextResponse.json({ error: "Room not ready" }, { status: 400 })
  }

  const votes: Record<string, number> = {}
  players.forEach((player) => {
    if (player.voted_for) {
      votes[player.voted_for] = (votes[player.voted_for] || 0) + 1
    }
  })

  let maxVotes = 0
  let mostVotedId = ""
  Object.entries(votes).forEach(([playerId, count]) => {
    if (count > maxVotes) {
      maxVotes = count
      mostVotedId = playerId
    }
  })

  const impostorName = players.find((p) => p.id === roomPrivate.impostor_player_id)?.name || "Unknown"

  const { data: theme } = await supabaseAdmin
    .from("themes")
    .select("text")
    .eq("id", roomPrivate.theme_id)
    .single()

  return NextResponse.json({
    impostorId: roomPrivate.impostor_player_id,
    impostorName,
    theme: theme?.text || "Unknown",
    votes,
    impostorCaught: mostVotedId === roomPrivate.impostor_player_id,
  })
}