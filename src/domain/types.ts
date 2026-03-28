/**
 * 领域类型（Who Is Spy / whoisspy）— 与 OpenSpec `private-room-lifecycle`、`undercover-game-loop` 对齐。
 */

export type LocaleCode = "zh" | "en";

export type SeatNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type PlayerRole = "civilian" | "undercover";

/** 会话内玩家（无登录账号） */
export type RoomPlayer = {
  seat: SeatNumber;
  displayName: string;
  avatarSeed: string;
  isHost: boolean;
  eliminatedRound: number | null;
};

export type GamePhase =
  | "lobby"
  | "deal_words"
  | "speaking"
  | "voting"
  | "tiebreak_speaking"
  | "tiebreak_voting"
  | "round_result"
  | "session_scoreboard";

export type WordPair = {
  civilianWord: string;
  undercoverWord: string;
};

/** 单局游戏（一轮从发词到胜负） */
export type RoundState = {
  roundIndex: number;
  phase: GamePhase;
  currentSpeakerSeat: SeatNumber | null;
  votesThisPoll: Record<SeatNumber, SeatNumber | "abstain" | null>;
};

/** 本会话多局与计分 */
export type SessionState = {
  maxRounds: number;
  completedRounds: number;
  scoresBySeat: Partial<Record<SeatNumber, number>>;
};

export type RoomConfig = {
  speakDurationSec: number;
  voteDurationSec: number;
  sessionTotalRounds: number;
};

export type RoomSnapshot = {
  code: string;
  config: RoomConfig;
  players: RoomPlayer[];
  round: RoundState | null;
  session: SessionState | null;
};
