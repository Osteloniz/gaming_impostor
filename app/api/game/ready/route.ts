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

  const { error: updateError } = await supabaseAdmin
    .from("players")
    .update({ has_seen_card: true })
    .eq("id", playerId)
    .eq("room_id", roomId)

  if (updateError) {
    return NextResponse.json({ error: "Failed to update player" }, { status: 500 })
  }

  const { data: remaining } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .eq("has_seen_card", false)

  if (remaining && remaining.length === 0) {
    await supabaseAdmin
      .from("rooms")
      .update({ status: "playing", current_turn_index: 0 })
      .eq("id", roomId)
  }

  return NextResponse.json({ ok: true })
}