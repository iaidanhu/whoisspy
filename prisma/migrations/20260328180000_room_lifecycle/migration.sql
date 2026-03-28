-- 从仅有 Room(id,code,createdAt,updatedAt) 的旧表升级；若本地有脏数据可先 TRUNCATE "Room" CASCADE;
CREATE TYPE "RoomPhase" AS ENUM ('LOBBY', 'PLAYING');

ALTER TABLE "Room" ADD COLUMN "phase" "RoomPhase" NOT NULL DEFAULT 'LOBBY';
ALTER TABLE "Room" ADD COLUMN "speakDurationSec" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Room" ADD COLUMN "voteDurationSec" INTEGER NOT NULL DEFAULT 30;
ALTER TABLE "Room" ADD COLUMN "sessionTotalRounds" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Room" ADD COLUMN "hostClientKey" TEXT NOT NULL DEFAULT 'migrated-placeholder';
ALTER TABLE "Room" ADD COLUMN "gameState" JSONB;

CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "seat" INTEGER NOT NULL,
    "clientKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "avatarSeed" TEXT NOT NULL,
    "isHost" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomMember_roomId_clientKey_key" ON "RoomMember"("roomId", "clientKey");
CREATE UNIQUE INDEX "RoomMember_roomId_seat_key" ON "RoomMember"("roomId", "seat");
CREATE INDEX "RoomMember_roomId_idx" ON "RoomMember"("roomId");

ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;
