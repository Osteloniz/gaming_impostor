import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""

  if (!roomId) {
    return NextResponse.json({ error: "Room id is required" }, { status: 400 })
  }

  await supabaseAdmin.from("players").delete().eq("room_id", roomId)
  await supabaseAdmin.from("rooms_private").delete().eq("room_id", roomId)
  await supabaseAdmin.from("rooms").delete().eq("id", roomId)

  return NextResponse.json({ ok: true })
}