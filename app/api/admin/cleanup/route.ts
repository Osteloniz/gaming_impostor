import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}))
  const days = Number(body?.days)
  const token = typeof body?.token === "string" ? body.token : ""
  const dryRun = Boolean(body?.dryRun)
  const requiredToken = process.env.ADMIN_CLEANUP_TOKEN || ""

  if (!requiredToken) {
    return NextResponse.json({ error: "Cleanup token not configured" }, { status: 500 })
  }

  if (token !== requiredToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (dryRun) {
    return NextResponse.json({ ok: true, verified: true })
  }

  const keepDays = Number.isFinite(days) && days > 0 ? Math.floor(days) : 7
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000).toISOString()

  const { data, error, count } = await supabaseAdmin
    .from("rooms")
    .delete({ count: "exact" })
    .lt("created_at", cutoff)
    .select("id")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, removedRooms: count ?? data?.length ?? 0, cutoff })
}
