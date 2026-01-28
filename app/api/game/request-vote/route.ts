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

  await supabaseAdmin.from("vote_responses").delete().eq("room_id", roomId)
  await supabaseAdmin.from("vote_requests").delete().eq("room_id", roomId)

  const { data: requestRow, error } = await supabaseAdmin
    .from("vote_requests")
    .insert({ room_id: roomId, requester_player_id: playerId, status: "pending" })
    .select("id")
    .single()

  if (error || !requestRow) {
    return NextResponse.json({ error: error?.message || "Failed to create request" }, { status: 500 })
  }

  return NextResponse.json({ requestId: requestRow.id })
}
