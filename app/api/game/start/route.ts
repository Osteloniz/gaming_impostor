import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { shuffleArray } from "@/lib/game/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""

  if (!roomId) {
    return NextResponse.json({ error: "Room id is required" }, { status: 400 })
  }

  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_id", roomId)

  if (playersError || !players || players.length < 3) {
    return NextResponse.json({ error: "Not enough players" }, { status: 400 })
  }

  const { data: themes, error: themesError } = await supabaseAdmin
    .from("themes")
    .select("id")
    .eq("active", true)

  if (themesError || !themes || themes.length === 0) {
    return NextResponse.json({ error: "No themes available" }, { status: 500 })
  }

  const theme = themes[Math.floor(Math.random() * themes.length)]
  const impostor = players[Math.floor(Math.random() * players.length)]
  const turnOrder = shuffleArray(players.map((player) => player.id))

  const { error: roomError } = await supabaseAdmin
    .from("rooms")
    .update({
      status: "revealing",
      current_round: 1,
      turn_order: turnOrder,
      current_turn_index: 0,
      current_revealing_player: 0,
    })
    .eq("id", roomId)

  if (roomError) {
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }

  await supabaseAdmin
    .from("players")
    .update({ has_seen_card: false, voted_for: null })
    .eq("room_id", roomId)

  await supabaseAdmin
    .from("rooms_private")
    .upsert({
      room_id: roomId,
      theme_id: theme.id,
      impostor_player_id: impostor.id,
    })

  return NextResponse.json({ ok: true })
}
