import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""
  const playerId = typeof body?.playerId === "string" ? body.playerId : ""

  if (!roomId || !playerId) {
    return NextResponse.json({ error: "Room and player are required" }, { status: 400 })
  }

  const { data: player } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("id", playerId)
    .eq("room_id", roomId)
    .single()

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 })
  }

  const { data: roomPrivate } = await supabaseAdmin
    .from("rooms_private")
    .select("theme_id, impostor_player_id")
    .eq("room_id", roomId)
    .single()

  if (!roomPrivate) {
    return NextResponse.json({ error: "Room not ready" }, { status: 400 })
  }

  if (roomPrivate.impostor_player_id === playerId) {
    return NextResponse.json({ role: "impostor", theme: null })
  }

  const { data: theme } = await supabaseAdmin
    .from("themes")
    .select("text")
    .eq("id", roomPrivate.theme_id)
    .single()

  return NextResponse.json({ role: "crew", theme: theme?.text || null })
}