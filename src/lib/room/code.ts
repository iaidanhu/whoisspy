import { ROOM_CODE_PREFIX, ROOM_CODE_RANDOM_LEN } from "@/lib/game/constants";

const ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** 生成 W + 7 位随机码（客户端占位；服务端须校验活跃唯一） */
export function generateRoomCode(): string {
  let tail = "";
  const len = ALPHANUM.length;
  for (let i = 0; i < ROOM_CODE_RANDOM_LEN; i++) {
    tail += ALPHANUM[Math.floor(Math.random() * len)]!;
  }
  return `${ROOM_CODE_PREFIX}${tail}`;
}

export function normalizeRoomCodeInput(input: string): string {
  return input.trim().toUpperCase();
}

export function isValidRoomCodeFormat(code: string): boolean {
  const c = normalizeRoomCodeInput(code);
  if (c.length !== 8 || c[0] !== ROOM_CODE_PREFIX) return false;
  for (let i = 1; i < 8; i++) {
    const ch = c[i]!;
    if (!/[A-Z0-9]/.test(ch)) return false;
  }
  return true;
}
