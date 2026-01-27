import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""
  const voterId = typeof body?.voterId === "string" ? body.voterId : ""
  const votedForId = typeof body?.votedForId === "string" ? body.votedForId : ""

  if (!roomId || !voterId || !votedForId) {
    return NextResponse.json({ error: "Invalid vote" }, { status: 400 })
  }

  const { error: voteError } = await supabaseAdmin
    .from("players")
    .update({ voted_for: votedForId })
    .eq("id", voterId)
    .eq("room_id", roomId)

  if (voteError) {
    return NextResponse.json({ error: "Failed to cast vote" }, { status: 500 })
  }

  const { data: remaining } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_id", roomId)
    .is("voted_for", null)

  if (remaining && remaining.length === 0) {
    await supabaseAdmin.from("rooms").update({ status: "results" }).eq("id", roomId)
  }

  return NextResponse.json({ ok: true })
}