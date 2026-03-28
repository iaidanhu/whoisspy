import type { WordPair } from "@/domain/types";
import type { RoomMember } from "@prisma/client";

/** 存入 Room.gameState（PLAYING 发词后） */
export type PlayingStateV1 = {
  v: 1;
  civilianWord: string;
  undercoverWord: string;
  undercoverSeat: number;
};

export function buildPlayingState(
  pair: WordPair,
  members: Pick<RoomMember, "seat">[],
): PlayingStateV1 {
  const seats = members.map((m) => m.seat).sort((a, b) => a - b);
  const undercoverSeat = seats[Math.floor(Math.random() * seats.length)]!;
  return {
    v: 1,
    civilianWord: pair.civilianWord,
    undercoverWord: pair.undercoverWord,
    undercoverSeat,
  };
}

export function parsePlayingState(raw: unknown): PlayingStateV1 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 1) return null;
  if (
    typeof o.civilianWord !== "string" ||
    typeof o.undercoverWord !== "string" ||
    typeof o.undercoverSeat !== "number"
  ) {
    return null;
  }
  return o as unknown as PlayingStateV1;
}

export function wordForSeat(state: PlayingStateV1, seat: number): {
  role: "civilian" | "undercover";
  word: string;
} {
  if (seat === state.undercoverSeat) {
    return { role: "undercover", word: state.undercoverWord };
  }
  return { role: "civilian", word: state.civilianWord };
}
