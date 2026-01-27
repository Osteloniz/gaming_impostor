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

  const { error: deleteError } = await supabaseAdmin
    .from("players")
    .delete()
    .eq("id", playerId)
    .eq("room_id", roomId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  const { data: remaining } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_id", roomId)

  if (!remaining || remaining.length === 0) {
    await supabaseAdmin.from("rooms_private").delete().eq("room_id", roomId)
    await supabaseAdmin.from("rooms").delete().eq("id", roomId)
  }

  return NextResponse.json({ ok: true })
}