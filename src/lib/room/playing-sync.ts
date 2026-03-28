import type { Room, RoomMember } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  advanceGameClock,
  dealNextSessionRound,
  tryResolveVotesIfComplete,
} from "@/lib/room/game-engine";
import { parsePlayingStateV2, type PlayingStateV2 } from "@/lib/room/game-state-v2";
import { pickRandomWordPair } from "@/lib/word-pairs";

function stableStringify(obj: unknown): string {
  return JSON.stringify(obj);
}

/**
 * 单步演化：提前结票、倒计时推进、局间抽词，直到稳定或达到步数上限。
 */
export function evolvePlayingState(
  initial: PlayingStateV2,
  members: Pick<RoomMember, "seat">[],
  speakSec: number,
  voteSec: number,
): PlayingStateV2 {
  const seats = members.map((m) => m.seat);
  let s = initial;
  for (let i = 0; i < 40; i++) {
    const now = Date.now();
    let n = tryResolveVotesIfComplete(s, now, speakSec);
    n = advanceGameClock(n, now, speakSec, voteSec);
    if (n.gamePhase === "between_session_rounds") {
      n = dealNextSessionRound(n, pickRandomWordPair(), seats, speakSec, now);
    }
    if (stableStringify(n) === stableStringify(s)) return n;
    s = n;
  }
  return s;
}

/**
 * 推进倒计时、局间自动抽词；若状态有变则写回 DB。
 */
export async function syncPlayingRoom(
  room: Room & { members: RoomMember[] },
): Promise<Room & { members: RoomMember[] }> {
  if (room.phase !== "PLAYING" || room.gameState == null) {
    return room;
  }

  const gs0 = parsePlayingStateV2(room.gameState);
  if (!gs0) {
    return room;
  }

  const s = evolvePlayingState(gs0, room.members, room.speakDurationSec, room.voteDurationSec);

  if (stableStringify(s) === stableStringify(gs0)) {
    return room;
  }

  return prisma.room.update({
    where: { id: room.id },
    data: { gameState: s as object },
    include: { members: { orderBy: { seat: "asc" } } },
  });
}
