import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""

  if (!roomId) {
    return NextResponse.json({ error: "Room id is required" }, { status: 400 })
  }

  await supabaseAdmin
    .from("rooms")
    .update({
      status: "lobby",
      turn_order: null,
      current_turn_index: 0,
      current_revealing_player: 0,
    })
    .eq("id", roomId)

  await supabaseAdmin
    .from("players")
    .update({ has_seen_card: false, voted_for: null })
    .eq("room_id", roomId)

  await supabaseAdmin.from("rooms_private").delete().eq("room_id", roomId)

  return NextResponse.json({ ok: true })
}