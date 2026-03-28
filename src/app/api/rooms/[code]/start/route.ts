import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCodeInput } from "@/lib/room/code";
import { MIN_PLAYERS } from "@/lib/game/constants";
import { pickRandomWordPair } from "@/lib/word-pairs";
import { buildPlayingState } from "@/lib/room/game-state";
import { toRoomPublic } from "@/lib/room/serialize";

type Body = { clientKey?: string };

type Ctx = { params: Promise<{ code: string }> };

export async function POST(req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = normalizeRoomCodeInput(raw);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const clientKey = typeof body.clientKey === "string" ? body.clientKey.trim() : "";
  if (!clientKey) {
    return NextResponse.json({ error: "invalid_client_key" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({
    where: { code },
    include: { members: { orderBy: { seat: "asc" } } },
  });
  if (!room) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (room.hostClientKey !== clientKey) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (room.phase !== "LOBBY") {
    return NextResponse.json({ error: "already_started" }, { status: 409 });
  }
  if (room.members.length < MIN_PLAYERS) {
    return NextResponse.json({ error: "not_enough_players" }, { status: 409 });
  }

  const pair = pickRandomWordPair();
  const gameState = buildPlayingState(pair, room.members);

  const updated = await prisma.room.update({
    where: { code },
    data: {
      phase: "PLAYING",
      gameState: gameState as object,
    },
    include: { members: { orderBy: { seat: "asc" } } },
  });

  return NextResponse.json(toRoomPublic(updated, clientKey));
}
