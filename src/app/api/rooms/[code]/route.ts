import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCodeInput } from "@/lib/room/code";
import { MAX_SESSION_ROUNDS, MIN_SESSION_ROUNDS } from "@/lib/game/constants";
import { toRoomPublic } from "@/lib/room/serialize";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = normalizeRoomCodeInput(raw);
  const url = new URL(req.url);
  const viewerClientKey = url.searchParams.get("clientKey")?.trim() || null;

  const room = await prisma.room.findUnique({
    where: { code },
    include: { members: { orderBy: { seat: "asc" } } },
  });
  if (!room) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(toRoomPublic(room, viewerClientKey));
}

type PatchBody = {
  clientKey?: string;
  speakDurationSec?: number;
  voteDurationSec?: number;
  sessionTotalRounds?: number;
};

export async function PATCH(req: Request, ctx: Ctx) {
  const { code: raw } = await ctx.params;
  const code = normalizeRoomCodeInput(raw);

  let body: PatchBody;
  try {
    body = (await req.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const clientKey = typeof body.clientKey === "string" ? body.clientKey.trim() : "";
  if (!clientKey) {
    return NextResponse.json({ error: "invalid_client_key" }, { status: 400 });
  }

  const room = await prisma.room.findUnique({
    where: { code },
    include: { members: true },
  });
  if (!room) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (room.hostClientKey !== clientKey) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (room.phase !== "LOBBY") {
    return NextResponse.json({ error: "not_in_lobby" }, { status: 409 });
  }

  const speak =
    typeof body.speakDurationSec === "number"
      ? Math.round(body.speakDurationSec)
      : room.speakDurationSec;
  const vote =
    typeof body.voteDurationSec === "number"
      ? Math.round(body.voteDurationSec)
      : room.voteDurationSec;
  const rounds =
    typeof body.sessionTotalRounds === "number"
      ? Math.round(body.sessionTotalRounds)
      : room.sessionTotalRounds;

  if (speak < 5 || speak > 300 || vote < 5 || vote > 300) {
    return NextResponse.json({ error: "invalid_duration" }, { status: 400 });
  }
  if (rounds < MIN_SESSION_ROUNDS || rounds > MAX_SESSION_ROUNDS) {
    return NextResponse.json({ error: "invalid_rounds" }, { status: 400 });
  }

  const updated = await prisma.room.update({
    where: { code },
    data: {
      speakDurationSec: speak,
      voteDurationSec: vote,
      sessionTotalRounds: rounds,
    },
    include: { members: { orderBy: { seat: "asc" } } },
  });
  return NextResponse.json(toRoomPublic(updated, clientKey));
}
