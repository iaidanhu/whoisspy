import type { WordPair } from "@/domain/types";
import {
  appendDescribeMessage,
  applyScoresForCompletedRound,
  type PlayingStateV2,
  startNextSessionRound,
} from "./game-state-v2";

const MIN_SPEAK_INTERVAL_MS = 2000;

export type SpeakErrorCode =
  | "not_your_turn"
  | "wrong_phase"
  | "not_alive"
  | "text_too_long"
  | "rate_limited";

export type VoteErrorCode =
  | "cannot_vote_self"
  | "wrong_phase"
  | "not_alive"
  | "invalid_target";

/** 投票阶段全员已提交时立即结算（不必等倒计时结束） */
export function tryResolveVotesIfComplete(
  state: PlayingStateV2,
  nowMs: number,
  speakDurationSec: number,
): PlayingStateV2 {
  if (state.gamePhase !== "voting" && state.gamePhase !== "tiebreak_voting") return state;
  for (const seat of state.aliveSeats) {
    if (state.votes[String(seat)] === undefined) return state;
  }
  return resolveVoting(state, nowMs, speakDurationSec);
}

export function advanceGameClock(
  state: PlayingStateV2,
  nowMs: number,
  speakDurationSec: number,
  voteDurationSec: number,
): PlayingStateV2 {
  let s = state;
  for (let i = 0; i < 48; i++) {
    const next = tickOnce(s, nowMs, speakDurationSec, voteDurationSec);
    if (next === s) break;
    s = next;
  }
  return s;
}

function tickOnce(
  state: PlayingStateV2,
  nowMs: number,
  speakDurationSec: number,
  voteDurationSec: number,
): PlayingStateV2 {
  if (state.gamePhase === "session_complete" || state.gamePhase === "between_session_rounds") {
    return state;
  }
  if (nowMs < state.phaseDeadlineEpochMs) return state;

  if (state.gamePhase === "speaking" || state.gamePhase === "tiebreak_speaking") {
    return advanceSpeakerOrEnterVote(state, nowMs, speakDurationSec, voteDurationSec);
  }

  if (state.gamePhase === "voting" || state.gamePhase === "tiebreak_voting") {
    return resolveVoting(state, nowMs, speakDurationSec);
  }

  return state;
}

function advanceSpeakerOrEnterVote(
  state: PlayingStateV2,
  nowMs: number,
  speakDurationSec: number,
  voteDurationSec: number,
): PlayingStateV2 {
  const speakQueueIndex = state.speakQueueIndex + 1;
  const speakQueue = state.speakQueue;
  if (speakQueueIndex >= speakQueue.length) {
    return enterVotingPhase(state, nowMs, voteDurationSec);
  }
  return {
    ...state,
    speakQueueIndex,
    phaseDeadlineEpochMs: nowMs + speakDurationSec * 1000,
  };
}

function enterVotingPhase(state: PlayingStateV2, nowMs: number, voteDurationSec: number): PlayingStateV2 {
  const isTiebreak = state.tiebreakDepth > 0 && state.tiebreakSeats != null;
  return {
    ...state,
    gamePhase: isTiebreak ? "tiebreak_voting" : "voting",
    votes: {},
    phaseDeadlineEpochMs: nowMs + voteDurationSec * 1000,
    voteTargetWhitelist: isTiebreak ? state.tiebreakSeats : null,
  };
}

function aliveSet(state: PlayingStateV2): Set<number> {
  return new Set(state.aliveSeats);
}

function effectiveVotes(state: PlayingStateV2): Map<number, number | "abstain"> {
  const alive = state.aliveSeats;
  const m = new Map<number, number | "abstain">();
  for (const seat of alive) {
    const v = state.votes[String(seat)];
    m.set(seat, v === undefined ? "abstain" : v);
  }
  return m;
}

function isValidVoteTarget(
  state: PlayingStateV2,
  voterSeat: number,
  target: number | "abstain",
): boolean {
  if (target === "abstain") return true;
  if (target === voterSeat) return false;
  if (!aliveSet(state).has(target)) return false;
  const wl = state.voteTargetWhitelist;
  if (wl != null && !wl.includes(target)) return false;
  return true;
}

function resolveVoting(
  state: PlayingStateV2,
  nowMs: number,
  speakDurationSec: number,
): PlayingStateV2 {
  const eff = effectiveVotes(state);
  let allAbstain = true;
  for (const seat of state.aliveSeats) {
    const v = eff.get(seat)!;
    if (v !== "abstain" && typeof v === "number") {
      allAbstain = false;
      break;
    }
  }
  if (allAbstain) {
    return beginNextPollSameRound(state, nowMs, speakDurationSec);
  }

  const tally = new Map<number, number>();
  for (const seat of state.aliveSeats) {
    const v = eff.get(seat)!;
    if (v === "abstain") continue;
    if (!isValidVoteTarget(state, seat, v)) continue;
    tally.set(v, (tally.get(v) ?? 0) + 1);
  }

  if (tally.size === 0) {
    return beginNextPollSameRound(state, nowMs, speakDurationSec);
  }

  let max = 0;
  for (const c of tally.values()) max = Math.max(max, c);
  const top = [...tally.entries()].filter(([, c]) => c === max).map(([s]) => s);
  top.sort((a, b) => a - b);

  if (top.length >= 2) {
    return {
      ...state,
      gamePhase: "tiebreak_speaking",
      tiebreakDepth: state.tiebreakDepth + 1,
      tiebreakSeats: top,
      speakQueue: [...top],
      speakQueueIndex: 0,
      votes: {},
      voteTargetWhitelist: top,
      phaseDeadlineEpochMs: nowMs + speakDurationSec * 1000,
    };
  }

  const eliminated = top[0]!;
    return eliminateSeat(state, eliminated, nowMs, speakDurationSec);
}

function beginNextPollSameRound(state: PlayingStateV2, nowMs: number, speakDurationSec: number): PlayingStateV2 {
  const alive = [...state.aliveSeats].sort((a, b) => a - b);
  return {
    ...state,
    pollIndex: state.pollIndex + 1,
    tiebreakDepth: 0,
    tiebreakSeats: null,
    speakQueue: alive,
    speakQueueIndex: 0,
    gamePhase: "speaking",
    votes: {},
    voteTargetWhitelist: null,
    phaseDeadlineEpochMs: nowMs + speakDurationSec * 1000,
  };
}

function eliminateSeat(
  state: PlayingStateV2,
  eliminated: number,
  nowMs: number,
  speakDurationSec: number,
): PlayingStateV2 {
  const order = [...state.eliminationOrderThisRound, eliminated];
  const alive = state.aliveSeats.filter((s) => s !== eliminated).sort((a, b) => a - b);

  if (eliminated === state.undercoverSeat) {
    return endCurrentRound(
      {
        ...state,
        aliveSeats: alive,
        eliminationOrderThisRound: order,
        tiebreakDepth: 0,
        tiebreakSeats: null,
        votes: {},
        voteTargetWhitelist: null,
      },
      "civilian",
      nowMs,
    );
  }

  let next: PlayingStateV2 = {
    ...state,
    aliveSeats: alive,
    eliminationOrderThisRound: order,
    tiebreakDepth: 0,
    tiebreakSeats: null,
    votes: {},
    voteTargetWhitelist: null,
  };

  if (alive.length === 2 && alive.includes(state.undercoverSeat)) {
    return endCurrentRound(next, "undercover", nowMs);
  }

  next = {
    ...next,
    pollIndex: next.pollIndex + 1,
    speakQueue: alive,
    speakQueueIndex: 0,
    gamePhase: "speaking",
    phaseDeadlineEpochMs: nowMs + speakDurationSec * 1000,
  };
  return next;
}

function endCurrentRound(
  state: PlayingStateV2,
  winner: "civilian" | "undercover",
  nowMs: number,
): PlayingStateV2 {
  const eliminationOrder = [...state.eliminationOrderThisRound];
  const survivors = [...state.aliveSeats];

  const scoresBySeat = applyScoresForCompletedRound(
    { ...state, eliminationOrderThisRound: eliminationOrder },
    eliminationOrder,
    survivors,
  );
  const completedSessionRounds = state.completedSessionRounds + 1;

  let next: PlayingStateV2 = {
    ...state,
    aliveSeats: survivors,
    scoresBySeat,
    completedSessionRounds,
    lastRoundWinner: winner,
    tiebreakDepth: 0,
    tiebreakSeats: null,
    votes: {},
    voteTargetWhitelist: null,
  };

  if (completedSessionRounds >= state.sessionTotalRounds) {
    const mvp = computeMvpSeat(scoresBySeat);
    return {
      ...next,
      gamePhase: "session_complete",
      sessionMvpSeat: mvp,
      phaseDeadlineEpochMs: nowMs,
    };
  }

  return {
    ...next,
    gamePhase: "between_session_rounds",
    phaseDeadlineEpochMs: nowMs,
  };
}

function computeMvpSeat(scores: Record<string, number>): number | null {
  const entries = Object.entries(scores);
  if (entries.length === 0) return null;
  let best = -1;
  let seat: number | null = null;
  for (const [k, v] of entries) {
    if (v > best) {
      best = v;
      seat = Number(k);
    } else if (v === best && seat != null) {
      const n = Number(k);
      if (n < seat) seat = n;
    }
  }
  return seat;
}

/** 局间：抽新词并进入下一局发言 */
export function dealNextSessionRound(
  state: PlayingStateV2,
  pair: WordPair,
  allSeats: number[],
  speakDurationSec: number,
  nowMs: number,
): PlayingStateV2 {
  if (state.gamePhase !== "between_session_rounds") return state;
  return startNextSessionRound(state, pair, allSeats, speakDurationSec, nowMs);
}

export function submitSpeak(
  state: PlayingStateV2,
  seat: number,
  text: string,
  maxLen: number,
  nowMs: number,
  speakDurationSec: number,
  voteDurationSec: number,
): { ok: true; state: PlayingStateV2 } | { ok: false; code: SpeakErrorCode } {
  if (state.gamePhase !== "speaking" && state.gamePhase !== "tiebreak_speaking") {
    return { ok: false, code: "wrong_phase" };
  }
  if (!aliveSet(state).has(seat)) {
    return { ok: false, code: "not_alive" };
  }
  const trimmed = text.trim();
  if (trimmed.length > maxLen) {
    return { ok: false, code: "text_too_long" };
  }
  if (trimmed.length === 0) {
    return { ok: false, code: "text_too_long" };
  }

  const current = state.speakQueue[state.speakQueueIndex];
  if (current !== seat) {
    return { ok: false, code: "not_your_turn" };
  }

  const last = state.lastDescribeAtBySeat[String(seat)];
  if (last != null && nowMs - last < MIN_SPEAK_INTERVAL_MS) {
    return { ok: false, code: "rate_limited" };
  }

  let next = appendDescribeMessage(state, seat, trimmed, nowMs);
  let idx = next.speakQueueIndex + 1;
  if (idx >= next.speakQueue.length) {
    next = enterVotingPhase(next, nowMs, voteDurationSec);
    return { ok: true, state: next };
  }
  next = {
    ...next,
    speakQueueIndex: idx,
    phaseDeadlineEpochMs: nowMs + speakDurationSec * 1000,
  };
  return { ok: true, state: next };
}

export function submitVote(
  state: PlayingStateV2,
  seat: number,
  target: number | "abstain",
): { ok: true; state: PlayingStateV2 } | { ok: false; code: VoteErrorCode } {
  if (state.gamePhase !== "voting" && state.gamePhase !== "tiebreak_voting") {
    return { ok: false, code: "wrong_phase" };
  }
  if (!aliveSet(state).has(seat)) {
    return { ok: false, code: "not_alive" };
  }
  if (target !== "abstain") {
    if (target === seat) return { ok: false, code: "cannot_vote_self" };
    if (!isValidVoteTarget(state, seat, target)) {
      return { ok: false, code: "invalid_target" };
    }
  }

  const next: PlayingStateV2 = {
    ...state,
    votes: { ...state.votes, [String(seat)]: target },
  };
  return { ok: true, state: next };
}

/** 发言提交后进入投票阶段时需用房间的 voteDurationSec，修复 submitSpeak 里写死的 30 */
