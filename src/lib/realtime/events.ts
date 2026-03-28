/**
 * WebSocket（或等价实时通道）事件契约 — 服务端权威。
 * 载荷为建议字段，实现时可扩展，但事件名宜保持稳定。
 */

export const WS_EVENTS = {
  // 连接与房间
  JOIN_ROOM: "join_room",
  LEAVE_ROOM: "leave_room",
  ROOM_STATE: "room_state",
  PLAYER_JOINED: "player_joined",
  PLAYER_LEFT: "player_left",

  // 房主
  HOST_UPDATE_CONFIG: "host_update_config",
  HOST_START_GAME: "host_start_game",
  HOST_RESTART_SESSION: "host_restart_session",

  // 对局
  SPEAK_SUBMIT: "speak_submit",
  SPEAK_BROADCAST: "speak_broadcast",
  VOTE_SUBMIT: "vote_submit",
  PHASE_TICK: "phase_tick",
  ROUND_END: "round_end",
  SESSION_END: "session_end",
  ERROR: "error",
} as const;

export type WsEventName = (typeof WS_EVENTS)[keyof typeof WS_EVENTS];

export type SpeakBroadcastPayload = {
  senderSeat: number;
  displayName: string;
  avatarSeed: string;
  text: string;
  roundIndex: number;
  turnIndex: number;
  sentAt: string;
};

export type VoteSubmitPayload = {
  fromSeat: number;
  targetSeat: number | "abstain";
  roundIndex: number;
};

export type RoomStatePayload = {
  snapshot: unknown;
  serverTime: string;
};
