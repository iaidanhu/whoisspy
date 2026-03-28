import type { Room, RoomMember } from "@prisma/client";
import { parsePlayingState, wordForSeat } from "./game-state";
import type { DescribeMessageV2, GamePhaseV2, PlayingStateV2 } from "./game-state-v2";
import { parsePlayingStateV2, wordForSeatV2 } from "./game-state-v2";

export type MemberPublic = {
  seat: number;
  displayName: string;
  avatarSeed: string;
  isHost: boolean;
  /** 当前局是否仍存活（仅 v2 对局有值） */
  isAliveThisRound?: boolean;
};

export type GamePublicV2 = {
  gamePhase: GamePhaseV2;
  sessionRoundIndex: number;
  completedSessionRounds: number;
  sessionTotalRounds: number;
  pollIndex: number;
  phaseDeadlineEpochMs: number;
  aliveSeats: number[];
  eliminationOrderThisRound: number[];
  messages: DescribeMessageV2[];
  votes: Record<string, number | "abstain">;
  scoresBySeat: Record<string, number>;
  lastRoundWinner: "civilian" | "undercover" | null;
  sessionMvpSeat: number | null;
  tiebreakSeats: number[] | null;
  currentSpeakerSeat: number | null;
  voteTargetWhitelist: number[] | null;
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
  /** v2 对局公开快照；大厅或旧存档为 null */
  game: GamePublicV2 | null;
};

function toGamePublic(gs: PlayingStateV2): GamePublicV2 {
  let currentSpeakerSeat: number | null = null;
  if (
    (gs.gamePhase === "speaking" || gs.gamePhase === "tiebreak_speaking") &&
    gs.speakQueueIndex < gs.speakQueue.length
  ) {
    currentSpeakerSeat = gs.speakQueue[gs.speakQueueIndex]!;
  }
  return {
    gamePhase: gs.gamePhase,
    sessionRoundIndex: gs.sessionRoundIndex,
    completedSessionRounds: gs.completedSessionRounds,
    sessionTotalRounds: gs.sessionTotalRounds,
    pollIndex: gs.pollIndex,
    phaseDeadlineEpochMs: gs.phaseDeadlineEpochMs,
    aliveSeats: [...gs.aliveSeats],
    eliminationOrderThisRound: [...gs.eliminationOrderThisRound],
    messages: gs.messages.map((m) => ({ ...m })),
    votes: { ...gs.votes },
    scoresBySeat: { ...gs.scoresBySeat },
    lastRoundWinner: gs.lastRoundWinner,
    sessionMvpSeat: gs.sessionMvpSeat,
    tiebreakSeats: gs.tiebreakSeats ? [...gs.tiebreakSeats] : null,
    currentSpeakerSeat,
    voteTargetWhitelist: gs.voteTargetWhitelist ? [...gs.voteTargetWhitelist] : null,
  };
}

export function toRoomPublic(
  room: Room & { members: RoomMember[] },
  viewerClientKey: string | null,
): RoomPublicResponse {
  const aliveSet = new Set<number>();
  const gs2 = parsePlayingStateV2(room.gameState);
  if (gs2) {
    for (const s of gs2.aliveSeats) aliveSet.add(s);
  }

  const members: MemberPublic[] = room.members
    .slice()
    .sort((a, b) => a.seat - b.seat)
    .map((m) => ({
      seat: m.seat,
      displayName: m.displayName,
      avatarSeed: m.avatarSeed,
      isHost: m.isHost,
      ...(gs2 ? { isAliveThisRound: aliveSet.has(m.seat) } : {}),
    }));

  let you: RoomPublicResponse["you"] = null;
  let game: GamePublicV2 | null = null;

  if (viewerClientKey) {
    const me = room.members.find((m) => m.clientKey === viewerClientKey);
    if (me) {
      const isHost = me.isHost;
      if (room.phase === "PLAYING" && room.gameState) {
        if (gs2) {
          const { role, word } = wordForSeatV2(gs2, me.seat);
          you = { seat: me.seat, isHost, role, word };
          game = toGamePublic(gs2);
        } else {
          const st = parsePlayingState(room.gameState);
          if (st) {
            const { role, word } = wordForSeat(st, me.seat);
            you = { seat: me.seat, isHost, role, word };
          } else {
            you = { seat: me.seat, isHost };
          }
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
    game,
  };
}
