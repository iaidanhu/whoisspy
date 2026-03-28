import { prisma } from "@/lib/prisma";
import { normalizeRoomCodeInput } from "@/lib/room/code";
import { syncPlayingRoom } from "@/lib/room/playing-sync";
import { toRoomPublic, type RoomPublicResponse } from "@/lib/room/serialize";
import type { Room, RoomMember } from "@prisma/client";

export async function fetchSyncedRoomByCode(
  rawCode: string,
): Promise<(Room & { members: RoomMember[] }) | null> {
  const code = normalizeRoomCodeInput(rawCode);
  const room = await prisma.room.findUnique({
    where: { code },
    include: { members: { orderBy: { seat: "asc" } } },
  });
  if (!room) return null;
  return syncPlayingRoom(room);
}

export async function roomPublicJson(
  rawCode: string,
  viewerClientKey: string | null,
): Promise<RoomPublicResponse | null> {
  const room = await fetchSyncedRoomByCode(rawCode);
  if (!room) return null;
  return toRoomPublic(room, viewerClientKey);
}
