import { NextResponse } from "next/server";
import { DESCRIBE_MAX_LENGTH } from "@/lib/game/constants";
import { roomBusEmitRoomRefresh } from "@/lib/realtime/room-bus";
import { submitSpeak } from "@/lib/room/game-engine";
import { parsePlayingStateV2 } from "@/lib/room/game-state-v2";
import { normalizeRoomCodeInput } from "@/lib/room/code";
import { evolvePlayingState } from "@/lib/room/playing-sync";
import { fetchSyncedRoomByCode } from "@/lib/room/room-view";
import { toRoomPublic } from "@/lib/room/serialize";
import { prisma } from "@/lib/prisma";

type Body = { clientKey?: string; text?: string };

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
  const text = typeof body.text === "string" ? body.text : "";
  if (!clientKey) {
    return NextResponse.json({ error: "invalid_client_key" }, { status: 400 });
  }

  const room = await fetchSyncedRoomByCode(code);
  if (!room) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (room.phase !== "PLAYING") {
    return NextResponse.json({ error: "not_playing" }, { status: 409 });
  }

  const me = room.members.find((m) => m.clientKey === clientKey);
  if (!me) {
    return NextResponse.json({ error: "not_member" }, { status: 403 });
  }

  const gs = parsePlayingStateV2(room.gameState);
  if (!gs) {
    return NextResponse.json({ error: "stale_state" }, { status: 409 });
  }

  const now = Date.now();
  const result = submitSpeak(
    gs,
    me.seat,
    text,
    DESCRIBE_MAX_LENGTH,
    now,
    room.speakDurationSec,
    room.voteDurationSec,
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.code }, { status: 400 });
  }

  const evolved = evolvePlayingState(
    result.state,
    room.members,
    room.speakDurationSec,
    room.voteDurationSec,
  );

  const updated = await prisma.room.update({
    where: { id: room.id },
    data: { gameState: evolved as object },
    include: { members: { orderBy: { seat: "asc" } } },
  });

  roomBusEmitRoomRefresh(code);
  return NextResponse.json(toRoomPublic(updated, clientKey));
}
