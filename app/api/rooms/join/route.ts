import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const name = typeof body?.name === "string" ? body.name.trim() : ""
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : ""

  if (!name || !code) {
    return NextResponse.json({ error: "Name and code are required" }, { status: 400 })
  }

  const { data: room, error: roomError } = await supabaseAdmin
    .from("rooms")
    .select("id, code")
    .eq("code", code)
    .single()

  if (roomError || !room) {
    return NextResponse.json({ error: "Room not found" }, { status: 404 })
  }

  const { data: player, error: playerError } = await supabaseAdmin
    .from("players")
    .insert({ room_id: room.id, name, is_host: false })
    .select("id")
    .single()

  if (playerError || !player) {
    return NextResponse.json({ error: "Failed to join room" }, { status: 500 })
  }

  return NextResponse.json({ roomId: room.id, roomCode: room.code, playerId: player.id })
}