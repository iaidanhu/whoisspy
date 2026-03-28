import type { WordPair } from "@/domain/types";
import type { RoomMember } from "@prisma/client";

/** 存入 Room.gameState，PLAYING 全程使用 */
export type GamePhaseV2 =
  | "speaking"
  | "voting"
  | "tiebreak_speaking"
  | "tiebreak_voting"
  /** 单局已结算，等待服务端抽下一局词并切回发言 */
  | "between_session_rounds"
  | "session_complete";

export type DescribeMessageV2 = {
  id: string;
  seat: number;
  text: string;
  sentAtMs: number;
  sessionRoundIndex: number;
  pollIndex: number;
  tiebreakDepth: number;
};

export type PlayingStateV2 = {
  v: 2;
  civilianWord: string;
  undercoverWord: string;
  undercoverSeat: number;

  sessionTotalRounds: number;
  completedSessionRounds: number;
  scoresBySeat: Record<string, number>;

  /** 当前局在会话中的序号，从 1 开始 */
  sessionRoundIndex: number;
  /** 该局开局时场上人数（计分用） */
  roundStartPlayerCount: number;

  eliminationOrderThisRound: number[];
  aliveSeats: number[];

  gamePhase: GamePhaseV2;

  /** 当前局内「全员发言+投票」循环序号，从 1 开始 */
  pollIndex: number;
  tiebreakDepth: number;
  /** 平票加赛时的候选人座位（升序）；非加赛为 null */
  tiebreakSeats: number[] | null;

  speakQueue: number[];
  speakQueueIndex: number;
  phaseDeadlineEpochMs: number;

  /** 座位 -> 投票目标或弃票；未出现键表示尚未提交（截止后视为弃票） */
  votes: Record<string, number | "abstain">;

  /** 平票投票时有效目标为该列表的子集（仍不可投自己） */
  voteTargetWhitelist: number[] | null;

  messages: DescribeMessageV2[];

  /** 上一局结果（会话未结束时用于 UI） */
  lastRoundWinner: "civilian" | "undercover" | null;
  /** 终局最高分之一座位（并列取最小座位号） */
  sessionMvpSeat: number | null;

  /** 防刷：上次发言时间 ms */
  lastDescribeAtBySeat: Record<string, number>;
};

export function buildPlayingStateV2(
  pair: WordPair,
  members: Pick<RoomMember, "seat">[],
  opts: {
    sessionTotalRounds: number;
    speakDurationSec: number;
  },
  nowMs: number,
): PlayingStateV2 {
  const seats = members.map((m) => m.seat).sort((a, b) => a - b);
  const undercoverSeat = seats[Math.floor(Math.random() * seats.length)]!;
  const n = seats.length;
  return {
    v: 2,
    civilianWord: pair.civilianWord,
    undercoverWord: pair.undercoverWord,
    undercoverSeat,
    sessionTotalRounds: opts.sessionTotalRounds,
    completedSessionRounds: 0,
    scoresBySeat: {},
    sessionRoundIndex: 1,
    roundStartPlayerCount: n,
    eliminationOrderThisRound: [],
    aliveSeats: [...seats],
    gamePhase: "speaking",
    pollIndex: 1,
    tiebreakDepth: 0,
    tiebreakSeats: null,
    speakQueue: [...seats],
    speakQueueIndex: 0,
    phaseDeadlineEpochMs: nowMs + opts.speakDurationSec * 1000,
    votes: {},
    voteTargetWhitelist: null,
    messages: [],
    lastRoundWinner: null,
    sessionMvpSeat: null,
    lastDescribeAtBySeat: {},
  };
}

export function parsePlayingStateV2(raw: unknown): PlayingStateV2 | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.v !== 2) return null;
  if (typeof o.civilianWord !== "string" || typeof o.undercoverWord !== "string") return null;
  if (typeof o.undercoverSeat !== "number") return null;
  if (typeof o.sessionTotalRounds !== "number" || typeof o.completedSessionRounds !== "number") {
    return null;
  }
  if (typeof o.sessionRoundIndex !== "number" || typeof o.roundStartPlayerCount !== "number") {
    return null;
  }
  if (!Array.isArray(o.eliminationOrderThisRound) || !Array.isArray(o.aliveSeats)) return null;
  if (typeof o.gamePhase !== "string") return null;
  const phases: GamePhaseV2[] = [
    "speaking",
    "voting",
    "tiebreak_speaking",
    "tiebreak_voting",
    "between_session_rounds",
    "session_complete",
  ];
  if (!phases.includes(o.gamePhase as GamePhaseV2)) return null;
  if (typeof o.pollIndex !== "number" || typeof o.tiebreakDepth !== "number") return null;
  if (typeof o.speakQueueIndex !== "number" || !Array.isArray(o.speakQueue)) return null;
  if (typeof o.phaseDeadlineEpochMs !== "number") return null;
  if (typeof o.scoresBySeat !== "object" || o.scoresBySeat === null) return null;
  if (!Array.isArray(o.messages)) return null;
  return o as unknown as PlayingStateV2;
}

export function wordForSeatV2(state: PlayingStateV2, seat: number): {
  role: "civilian" | "undercover";
  word: string;
} {
  if (seat === state.undercoverSeat) {
    return { role: "undercover", word: state.undercoverWord };
  }
  return { role: "civilian", word: state.civilianWord };
}

function newMessageId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

export function applyScoresForCompletedRound(
  state: PlayingStateV2,
  eliminationOrder: number[],
  survivors: number[],
): Record<string, number> {
  const N = state.roundStartPlayerCount;
  const high = N - 1;
  const next = { ...state.scoresBySeat };
  eliminationOrder.forEach((seat, i) => {
    const k = String(seat);
    next[k] = (next[k] ?? 0) + i;
  });
  for (const seat of survivors) {
    const k = String(seat);
    next[k] = (next[k] ?? 0) + high;
  }
  return next;
}

export function startNextSessionRound(
  state: PlayingStateV2,
  pair: WordPair,
  allSeats: number[],
  speakDurationSec: number,
  nowMs: number,
): PlayingStateV2 {
  const seats = [...allSeats].sort((a, b) => a - b);
  const undercoverSeat = seats[Math.floor(Math.random() * seats.length)]!;
  return {
    ...state,
    civilianWord: pair.civilianWord,
    undercoverWord: pair.undercoverWord,
    undercoverSeat,
    sessionRoundIndex: state.sessionRoundIndex + 1,
    roundStartPlayerCount: seats.length,
    eliminationOrderThisRound: [],
    aliveSeats: seats,
    gamePhase: "speaking",
    pollIndex: 1,
    tiebreakDepth: 0,
    tiebreakSeats: null,
    speakQueue: seats,
    speakQueueIndex: 0,
    phaseDeadlineEpochMs: nowMs + speakDurationSec * 1000,
    votes: {},
    voteTargetWhitelist: null,
    lastRoundWinner: null,
  };
}

export function appendDescribeMessage(
  state: PlayingStateV2,
  seat: number,
  text: string,
  nowMs: number,
): PlayingStateV2 {
  const msg: DescribeMessageV2 = {
    id: newMessageId(),
    seat,
    text,
    sentAtMs: nowMs,
    sessionRoundIndex: state.sessionRoundIndex,
    pollIndex: state.pollIndex,
    tiebreakDepth: state.tiebreakDepth,
  };
  return {
    ...state,
    messages: [...state.messages, msg],
    lastDescribeAtBySeat: { ...state.lastDescribeAtBySeat, [String(seat)]: nowMs },
  };
}
