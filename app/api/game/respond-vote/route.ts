import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""
  const playerId = typeof body?.playerId === "string" ? body.playerId : ""
  const requestId = typeof body?.requestId === "string" ? body.requestId : ""
  const approved = Boolean(body?.approved)

  if (!roomId || !playerId || !requestId) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { data: requestRow } = await supabaseAdmin
    .from("vote_requests")
    .select("id, requester_player_id, status")
    .eq("id", requestId)
    .eq("room_id", roomId)
    .single()

  if (!requestRow || requestRow.status !== "pending") {
    return NextResponse.json({ error: "Request not pending" }, { status: 400 })
  }

  await supabaseAdmin
    .from("vote_responses")
    .upsert({ room_id: roomId, request_id: requestId, player_id: playerId, approved })

  const { data: responses } = await supabaseAdmin
    .from("vote_responses")
    .select("approved, player_id")
    .eq("request_id", requestId)

  if (!responses) {
    return NextResponse.json({ ok: true })
  }

  if (responses.some((response) => response.approved === false)) {
    await supabaseAdmin.from("vote_requests").update({ status: "denied" }).eq("id", requestId)
    return NextResponse.json({ status: "denied" })
  }

  const { data: players } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_id", roomId)

  const requiredApprovals = Math.max((players?.length || 0) - 1, 0)

  if (responses.length >= requiredApprovals) {
    await supabaseAdmin.from("vote_requests").update({ status: "approved" }).eq("id", requestId)
    await supabaseAdmin.from("rooms").update({ status: "voting" }).eq("id", roomId)
    return NextResponse.json({ status: "approved" })
  }

  return NextResponse.json({ status: "pending" })
}
