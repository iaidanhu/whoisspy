import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createUniqueRoomCode } from "@/lib/room/create-unique-code";
import { toRoomPublic } from "@/lib/room/serialize";

type Body = {
  clientKey?: string;
  displayName?: string;
  avatarSeed?: string;
};

export async function POST(req: Request) {
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

  try {
    const code = await createUniqueRoomCode();
    const room = await prisma.room.create({
      data: {
        code,
        hostClientKey: clientKey,
        members: {
          create: {
            seat: 1,
            clientKey,
            displayName,
            avatarSeed,
            isHost: true,
          },
        },
      },
      include: { members: true },
    });
    return NextResponse.json(toRoomPublic(room, clientKey));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
