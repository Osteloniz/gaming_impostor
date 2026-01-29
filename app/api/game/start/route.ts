import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase/server"
import { shuffleArray } from "@/lib/game/types"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const body = await request.json()
  const roomId = typeof body?.roomId === "string" ? body.roomId : ""

  if (!roomId) {
    return NextResponse.json({ error: "Room id is required" }, { status: 400 })
  }

  const { data: players, error: playersError } = await supabaseAdmin
    .from("players")
    .select("id")
    .eq("room_id", roomId)

  if (playersError || !players || players.length < 3) {
    return NextResponse.json({ error: "Not enough players" }, { status: 400 })
  }

  const { data: history } = await supabaseAdmin
    .from("room_rounds")
    .select("theme_id, impostor_player_id, created_at")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(10)

  const { data: themes, error: themesError } = await supabaseAdmin
    .from("themes")
    .select("id")
    .eq("active", true)

  if (themesError || !themes || themes.length === 0) {
    return NextResponse.json({ error: "No themes available" }, { status: 500 })
  }

  const recentThemeIds = new Set((history || []).map((entry) => entry.theme_id).filter(Boolean))
  const availableThemes = themes.filter((theme) => !recentThemeIds.has(theme.id))
  const themePool = availableThemes.length > 0 ? availableThemes : themes
  const theme = themePool[Math.floor(Math.random() * themePool.length)]

  const impostorCounts = new Map<string, number>()
  for (const entry of history || []) {
    if (entry.impostor_player_id) {
      impostorCounts.set(
        entry.impostor_player_id,
        (impostorCounts.get(entry.impostor_player_id) ?? 0) + 1,
      )
    }
  }
  const lastImpostorId = history?.[0]?.impostor_player_id ?? null
  const playersWithCounts = players.map((player) => ({
    ...player,
    count: impostorCounts.get(player.id) ?? 0,
  }))
  const minCount = Math.min(...playersWithCounts.map((player) => player.count))
  const leastChosen = playersWithCounts.filter((player) => player.count === minCount)
  const impostorPool =
    lastImpostorId && leastChosen.length > 1
      ? leastChosen.filter((player) => player.id !== lastImpostorId)
      : leastChosen
  const impostor = impostorPool[Math.floor(Math.random() * impostorPool.length)]
  const turnOrder = shuffleArray(players.map((player) => player.id))

  const { error: roomError } = await supabaseAdmin
    .from("rooms")
    .update({
      status: "revealing",
      current_round: 1,
      turn_order: turnOrder,
      current_turn_index: 0,
      current_revealing_player: 0,
    })
    .eq("id", roomId)

  if (roomError) {
    return NextResponse.json({ error: "Failed to start game" }, { status: 500 })
  }

  await supabaseAdmin
    .from("players")
    .update({ has_seen_card: false, voted_for: null })
    .eq("room_id", roomId)

  await supabaseAdmin
    .from("rooms_private")
    .upsert({
      room_id: roomId,
      theme_id: theme.id,
      impostor_player_id: impostor.id,
    })

  await supabaseAdmin.from("room_rounds").insert({
    room_id: roomId,
    theme_id: theme.id,
    impostor_player_id: impostor.id,
  })

  return NextResponse.json({ ok: true })
}
