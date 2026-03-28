import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roomBusEmitRoomRefresh } from "@/lib/realtime/room-bus";
import { normalizeRoomCodeInput } from "@/lib/room/code";
import { parsePlayingStateV2 } from "@/lib/room/game-state-v2";
import { fetchSyncedRoomByCode } from "@/lib/room/room-view";
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

  const room = await fetchSyncedRoomByCode(code);
  if (!room) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (room.hostClientKey !== clientKey) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (room.phase !== "PLAYING") {
    return NextResponse.json({ error: "not_playing" }, { status: 409 });
  }

  const gs = parsePlayingStateV2(room.gameState);
  if (!gs || gs.gamePhase !== "session_complete") {
    return NextResponse.json({ error: "session_not_complete" }, { status: 409 });
  }

  const updated = await prisma.room.update({
    where: { id: room.id },
    data: {
      phase: "LOBBY",
      gameState: Prisma.DbNull,
    },
    include: { members: { orderBy: { seat: "asc" } } },
  });

  roomBusEmitRoomRefresh(code);
  return NextResponse.json(toRoomPublic(updated, clientKey));
}
