import { describe, expect, it } from "vitest";
import {
  advanceGameClock,
  submitSpeak,
  submitVote,
  tryResolveVotesIfComplete,
} from "./game-engine";
import { buildPlayingStateV2 } from "./game-state-v2";

const pair = { civilianWord: "苹果", undercoverWord: "梨" };

function seats3() {
  return [{ seat: 1 }, { seat: 2 }, { seat: 3 }] as const;
}

describe("submitVote", () => {
  it("rejects voting for self", () => {
    const s0 = buildPlayingStateV2(pair, [...seats3()], { sessionTotalRounds: 1, speakDurationSec: 30 }, 0);
    const s: typeof s0 = {
      ...s0,
      gamePhase: "voting",
      speakQueue: [1, 2, 3],
      speakQueueIndex: 3,
      votes: {},
      phaseDeadlineEpochMs: Date.now() + 30_000,
      voteTargetWhitelist: null,
    };
    const r = submitVote(s, 2, 2);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("cannot_vote_self");
  });
});

describe("submitSpeak", () => {
  it("rejects when not current speaker", () => {
    const s0 = buildPlayingStateV2(pair, [...seats3()], { sessionTotalRounds: 1, speakDurationSec: 30 }, 0);
    const r = submitSpeak(s0, 2, "hello", 500, Date.now(), 30, 30);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.code).toBe("not_your_turn");
  });
});

describe("all abstain", () => {
  it("advances poll without elimination when everyone abstains", () => {
    let s = buildPlayingStateV2(pair, [...seats3()], { sessionTotalRounds: 1, speakDurationSec: 30 }, 1_000_000);
    const speakSec = 30;
    const voteSec = 30;
    for (let i = 0; i < 20; i++) {
      s = advanceGameClock(s, s.phaseDeadlineEpochMs + 1, speakSec, voteSec);
      if (s.gamePhase === "voting") break;
    }
    expect(s.gamePhase).toBe("voting");
    const pollBefore = s.pollIndex;
    s = advanceGameClock(s, s.phaseDeadlineEpochMs + 1, speakSec, voteSec);
    expect(s.pollIndex).toBe(pollBefore + 1);
    expect(s.gamePhase).toBe("speaking");
    expect(s.aliveSeats.length).toBe(3);
  });
});

describe("tryResolveVotesIfComplete", () => {
  it("resolves when all alive have cast", () => {
    let s = buildPlayingStateV2(pair, [...seats3()], { sessionTotalRounds: 1, speakDurationSec: 30 }, 1_000_000);
    const speakSec = 30;
    const voteSec = 30;
    for (let i = 0; i < 20; i++) {
      s = advanceGameClock(s, s.phaseDeadlineEpochMs + 1, speakSec, voteSec);
      if (s.gamePhase === "voting") break;
    }
    expect(s.gamePhase).toBe("voting");
    s = {
      ...s,
      votes: { "1": "abstain", "2": "abstain", "3": "abstain" },
    };
    const next = tryResolveVotesIfComplete(s, Date.now(), speakSec);
    expect(next.pollIndex).toBe(s.pollIndex + 1);
    expect(next.gamePhase).toBe("speaking");
  });
});

describe("undercover win (two alive)", () => {
  it("ends round when two remain including undercover", () => {
    let s = buildPlayingStateV2(pair, [...seats3()], { sessionTotalRounds: 1, speakDurationSec: 30 }, 1_000_000);
    const uc = s.undercoverSeat;
    const speakSec = 30;
    const voteSec = 30;
    for (let i = 0; i < 20; i++) {
      s = advanceGameClock(s, s.phaseDeadlineEpochMs + 1, speakSec, voteSec);
      if (s.gamePhase === "voting") break;
    }
    const victim = s.aliveSeats.find((x) => x !== uc);
    expect(victim).toBeDefined();
    const votes: Record<string, number | "abstain"> = {};
    for (const v of s.aliveSeats) {
      votes[String(v)] = v === victim ? "abstain" : victim!;
    }
    s = { ...s, votes };
    s = tryResolveVotesIfComplete(s, Date.now(), speakSec);
    s = advanceGameClock(s, Date.now(), speakSec, voteSec);
    expect(s.lastRoundWinner).toBe("undercover");
  });
});

describe("civilian win", () => {
  it("ends round when undercover is eliminated", () => {
    let s = buildPlayingStateV2(pair, [...seats3()], { sessionTotalRounds: 1, speakDurationSec: 30 }, 1_000_000);
    const uc = s.undercoverSeat;
    const speakSec = 30;
    const voteSec = 30;
    for (let i = 0; i < 20; i++) {
      s = advanceGameClock(s, s.phaseDeadlineEpochMs + 1, speakSec, voteSec);
      if (s.gamePhase === "voting") break;
    }
    const voters = s.aliveSeats.filter((x) => x !== uc);
    const votes: Record<string, number | "abstain"> = {};
    for (const v of s.aliveSeats) {
      votes[String(v)] = v === uc ? "abstain" : uc;
    }
    for (const v of voters) {
      const sub = submitVote({ ...s, votes: { ...votes } }, v, uc);
      expect(sub.ok).toBe(true);
      if (sub.ok) s = sub.state;
    }
    s = tryResolveVotesIfComplete(s, Date.now(), speakSec);
    s = advanceGameClock(s, Date.now(), speakSec, voteSec);
    expect(s.lastRoundWinner).toBe("civilian");
    expect(s.gamePhase === "session_complete" || s.gamePhase === "between_session_rounds").toBe(true);
  });
});
