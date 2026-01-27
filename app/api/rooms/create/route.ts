import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { generateRoomCode } from "@/lib/game/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const name = typeof body?.name === "string" ? body.name.trim() : ""

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 })
  }

  let room: { id: string; code: string } | null = null

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateRoomCode()
    const { data, error } = await supabaseAdmin
      .from("rooms")
      .insert({ code, status: "lobby" })
      .select("id, code")
      .single()

    if (!error && data) {
      room = data
      break
    }
  }

  if (!room) {
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }

  const { data: player, error: playerError } = await supabaseAdmin
    .from("players")
    .insert({ room_id: room.id, name, is_host: true })
    .select("id")
    .single()

  if (playerError || !player) {
    return NextResponse.json({ error: "Failed to create player" }, { status: 500 })
  }

  await supabaseAdmin.from("rooms").update({ host_player_id: player.id }).eq("id", room.id)

  return NextResponse.json({ roomId: room.id, roomCode: room.code, playerId: player.id })
}