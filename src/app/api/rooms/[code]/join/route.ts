import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRoomCodeInput } from "@/lib/room/code";
import { MAX_PLAYERS } from "@/lib/game/constants";
import { toRoomPublic } from "@/lib/room/serialize";

type Body = {
  clientKey?: string;
  displayName?: string;
  avatarSeed?: string;
};

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
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const avatarSeed = typeof body.avatarSeed === "string" ? body.avatarSeed.trim() : "";

  if (!clientKey || clientKey.length < 8) {
    return NextResponse.json({ error: "invalid_client_key" }, { status: 400 });
  }
  if (!displayName || displayName.length > 16) {
    return NextResponse.json({ error: "invalid_display_name" }, { status: 400 });
  }
  if (!avatarSeed || avatarSeed.length > 128) {
    return NextResponse.json({ error: "invalid_avatar_seed" }, { status: 400 });
  }

  const existing = await prisma.room.findUnique({
    where: { code },
    include: { members: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (existing.phase !== "LOBBY") {
    return NextResponse.json({ error: "already_started" }, { status: 409 });
  }

  const already = existing.members.find((m) => m.clientKey === clientKey);
  if (already) {
    const fresh = await prisma.room.findUnique({
      where: { code },
      include: { members: { orderBy: { seat: "asc" } } },
    });
    return NextResponse.json(toRoomPublic(fresh!, clientKey));
  }

  if (existing.members.length >= MAX_PLAYERS) {
    return NextResponse.json({ error: "room_full" }, { status: 409 });
  }

  const maxSeat = Math.max(0, ...existing.members.map((m) => m.seat));
  const nextSeat = maxSeat + 1;

  await prisma.roomMember.create({
    data: {
      roomId: existing.id,
      seat: nextSeat,
      clientKey,
      displayName,
      avatarSeed,
      isHost: false,
    },
  });

  const room = await prisma.room.findUnique({
    where: { code },
    include: { members: { orderBy: { seat: "asc" } } },
  });
  return NextResponse.json(toRoomPublic(room!, clientKey));
}
