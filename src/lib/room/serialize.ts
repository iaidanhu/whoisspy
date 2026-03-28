import type { Room, RoomMember } from "@prisma/client";
import { parsePlayingState, wordForSeat } from "./game-state";

export type MemberPublic = {
  seat: number;
  displayName: string;
  avatarSeed: string;
  isHost: boolean;
};

export type RoomPublicResponse = {
  code: string;
  phase: Room["phase"];
  speakDurationSec: number;
  voteDurationSec: number;
  sessionTotalRounds: number;
  members: MemberPublic[];
  you: null | {
    seat: number;
    isHost: boolean;
    role?: "civilian" | "undercover";
    word?: string;
  };
};

export function toRoomPublic(
  room: Room & { members: RoomMember[] },
  viewerClientKey: string | null,
): RoomPublicResponse {
  const members: MemberPublic[] = room.members
    .slice()
    .sort((a, b) => a.seat - b.seat)
    .map((m) => ({
      seat: m.seat,
      displayName: m.displayName,
      avatarSeed: m.avatarSeed,
      isHost: m.isHost,
    }));

  let you: RoomPublicResponse["you"] = null;
  if (viewerClientKey) {
    const me = room.members.find((m) => m.clientKey === viewerClientKey);
    if (me) {
      const isHost = me.isHost;
      if (room.phase === "PLAYING" && room.gameState) {
        const st = parsePlayingState(room.gameState);
        if (st) {
          const { role, word } = wordForSeat(st, me.seat);
          you = { seat: me.seat, isHost, role, word };
        } else {
          you = { seat: me.seat, isHost };
        }
      } else {
        you = { seat: me.seat, isHost };
      }
    }
  }

  return {
    code: room.code,
    phase: room.phase,
    speakDurationSec: room.speakDurationSec,
    voteDurationSec: room.voteDurationSec,
    sessionTotalRounds: room.sessionTotalRounds,
    members,
    you,
  };
}
