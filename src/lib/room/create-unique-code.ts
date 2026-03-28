import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/room/code";

/** 生成数据库内不重复的 W####### */
export async function createUniqueRoomCode(): Promise<string> {
  for (let i = 0; i < 40; i++) {
    const code = generateRoomCode();
    const exists = await prisma.room.findUnique({
      where: { code },
      select: { id: true },
    });
    if (!exists) return code;
  }
  throw new Error("ROOM_CODE_COLLISION");
}
