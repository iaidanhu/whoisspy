import { RoomLobbyClient } from "./room-lobby-client";
import { normalizeRoomCodeInput } from "@/lib/room/code";

type Props = { params: Promise<{ locale: string; code: string }> };

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const roomCode = normalizeRoomCodeInput(code);
  return <RoomLobbyClient roomCode={roomCode} />;
}
