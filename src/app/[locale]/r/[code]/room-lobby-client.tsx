"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { AvatarBigSmile } from "@/components/avatar-big-smile";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getOrCreateClientKey } from "@/lib/client-key";
import { MIN_PLAYERS, MIN_SESSION_ROUNDS, MAX_SESSION_ROUNDS } from "@/lib/game/constants";
import type { WhoisspyProfile } from "@/lib/profile/types";
import {
  WHOISSPY_PROFILE_KEY,
  isProfileComplete,
  parseProfile,
} from "@/lib/profile/storage";
import type { RoomPublicResponse } from "@/lib/room/serialize";

type Props = { roomCode: string };

type LoadStatus = "loading" | "ok" | "not_found" | "join_error";

export function RoomLobbyClient({ roomCode }: Props) {
  const t = useTranslations("room");
  const tc = useTranslations("common");
  const router = useRouter();
  const [status, setStatus] = useState<LoadStatus>("loading");
  const [joinKind, setJoinKind] = useState<"full" | "other" | null>(null);
  const [room, setRoom] = useState<RoomPublicResponse | null>(null);
  const [clientKey, setClientKey] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [starting, setStarting] = useState(false);
  const [speak, setSpeak] = useState(30);
  const [vote, setVote] = useState(30);
  const [rounds, setRounds] = useState(5);

  const refresh = useCallback(async () => {
    if (!clientKey) return;
    const res = await fetch(
      `/api/rooms/${encodeURIComponent(roomCode)}?clientKey=${encodeURIComponent(clientKey)}`,
    );
    if (res.ok) {
      const data = (await res.json()) as RoomPublicResponse;
      setRoom(data);
      setSpeak(data.speakDurationSec);
      setVote(data.voteDurationSec);
      setRounds(data.sessionTotalRounds);
    }
  }, [roomCode, clientKey]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const ck = getOrCreateClientKey();
      if (cancelled) return;
      setClientKey(ck);

      const raw = localStorage.getItem(WHOISSPY_PROFILE_KEY);
      const profile = parseProfile(raw);
      if (!isProfileComplete(profile)) {
        router.replace("/");
        return;
      }
      const prof = profile as WhoisspyProfile;

      let res = await fetch(
        `/api/rooms/${encodeURIComponent(roomCode)}?clientKey=${encodeURIComponent(ck)}`,
      );
      if (cancelled) return;
      if (res.status === 404) {
        setStatus("not_found");
        return;
      }
      let data = (await res.json()) as RoomPublicResponse;

      if (!data.you) {
        const jr = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/join`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientKey: ck,
            displayName: prof.displayName,
            avatarSeed: prof.avatarSeed,
          }),
        });
        if (cancelled) return;
        if (!jr.ok) {
          if (jr.status === 404) {
            setStatus("not_found");
            return;
          }
          if (jr.status === 409) {
            const err = (await jr.json()) as { error?: string };
            setJoinKind(err.error === "room_full" ? "full" : "other");
            setStatus("join_error");
            return;
          }
          setJoinKind("other");
          setStatus("join_error");
          return;
        }
        data = (await jr.json()) as RoomPublicResponse;
      }

      setRoom(data);
      setSpeak(data.speakDurationSec);
      setVote(data.voteDurationSec);
      setRounds(data.sessionTotalRounds);
      setStatus("ok");
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [roomCode, router]);

  useEffect(() => {
    if (status !== "ok" || !clientKey) return;
    const id = setInterval(() => void refresh(), 2800);
    return () => clearInterval(id);
  }, [status, clientKey, refresh]);

  const saveSettings = useCallback(async () => {
    if (!clientKey || !room?.you?.isHost) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientKey,
          speakDurationSec: speak,
          voteDurationSec: vote,
          sessionTotalRounds: rounds,
        }),
      });
      if (res.ok) {
        setRoom((await res.json()) as RoomPublicResponse);
      }
    } finally {
      setSaving(false);
    }
  }, [clientKey, room?.you?.isHost, roomCode, speak, vote, rounds]);

  const startGame = useCallback(async () => {
    if (!clientKey || !room?.you?.isHost) return;
    setStarting(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientKey }),
      });
      if (res.ok) {
        setRoom((await res.json()) as RoomPublicResponse);
      }
    } finally {
      setStarting(false);
    }
  }, [clientKey, room?.you?.isHost, roomCode]);

  if (status === "loading") {
    return (
      <div className="room-shell flex min-h-svh items-center justify-center">
        <span className="text-[var(--text-muted)]">…</span>
      </div>
    );
  }

  if (status === "not_found") {
    return (
      <div className="room-shell flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <p className="text-[var(--text-primary)]">{t("notFound")}</p>
        <Button asChild variant="outline">
          <Link href="/start">{tc("backHome")}</Link>
        </Button>
      </div>
    );
  }

  if (status === "join_error") {
    return (
      <div className="room-shell flex min-h-svh flex-col items-center justify-center gap-4 p-6">
        <p className="text-center text-[var(--text-primary)]">
          {joinKind === "full" ? t("roomFull") : t("joinFailed")}
        </p>
        <Button asChild variant="outline">
          <Link href="/start">{tc("backHome")}</Link>
        </Button>
      </div>
    );
  }

  if (!room) return null;

  const canStart = room.members.length >= MIN_PLAYERS;
  const isHost = room.you?.isHost ?? false;

  return (
    <div className="room-shell flex min-h-svh flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <span className="font-serif text-lg tracking-wide text-[var(--accent)]">
          Who Is Spy
        </span>
        <div className="flex items-center gap-2">
          {isHost && room.phase === "LOBBY" && (
            <>
              <details className="relative">
                <summary className="cursor-pointer list-none rounded-md border border-white/15 px-3 py-1.5 text-sm text-[var(--text-primary)] hover:bg-white/5">
                  {t("gameSettings")}
                </summary>
                <div className="absolute right-0 z-10 mt-2 w-72 space-y-3 rounded-xl border border-white/10 bg-[#2a2020] p-4 shadow-xl">
                  <div className="space-y-1">
                    <Label className="text-[var(--text-muted)]">{t("speakSeconds")}</Label>
                    <Input
                      type="number"
                      min={5}
                      max={300}
                      value={speak}
                      onChange={(e) => setSpeak(Number(e.target.value))}
                      className="border-white/20 bg-black/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[var(--text-muted)]">{t("voteSeconds")}</Label>
                    <Input
                      type="number"
                      min={5}
                      max={300}
                      value={vote}
                      onChange={(e) => setVote(Number(e.target.value))}
                      className="border-white/20 bg-black/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[var(--text-muted)]">{t("sessionRounds")}</Label>
                    <Input
                      type="number"
                      min={MIN_SESSION_ROUNDS}
                      max={MAX_SESSION_ROUNDS}
                      value={rounds}
                      onChange={(e) => setRounds(Number(e.target.value))}
                      className="border-white/20 bg-black/20"
                    />
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    disabled={saving}
                    onClick={() => void saveSettings()}
                  >
                    {t("saveSettings")}
                  </Button>
                </div>
              </details>
              <Button
                type="button"
                disabled={!canStart || starting}
                onClick={() => void startGame()}
                className="bg-[var(--accent)] text-[#1a1010] hover:bg-[var(--accent)]/90"
              >
                {t("startGame")}
              </Button>
            </>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 p-6 lg:flex-row lg:justify-center">
        <section className="flex flex-1 flex-col gap-4 lg:max-w-md">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-[var(--text-muted)]">{t("codeLabel")}</h2>
            <span className="font-mono text-lg tracking-widest text-[var(--accent)]">
              {room.code}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {t("playersCount", { count: room.members.length })}
          </p>
          <ul className="space-y-2">
            {room.members.map((m) => (
              <li
                key={m.seat}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2 ${
                  room.you?.seat === m.seat
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
                <AvatarBigSmile seed={m.avatarSeed} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[var(--text-primary)]">
                    {m.displayName}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    #{m.seat}
                    {m.isHost ? ` · ${t("host")}` : ""}
                    {room.you?.seat === m.seat ? ` · ${t("you")}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/25 p-6 lg:max-w-lg">
          {room.phase === "PLAYING" && room.you?.word != null && room.you.role != null ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-[var(--text-muted)]">{t("yourWord")}</p>
              <p className="font-serif text-3xl text-[var(--accent)]">{room.you.word}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {room.you.role === "undercover" ? t("roleUndercover") : t("roleCivilian")}
              </p>
              <p className="text-sm text-[var(--text-muted)]">{t("dealHint")}</p>
            </div>
          ) : (
            <p className="text-center text-sm text-[var(--text-muted)]">{t("lobbyHint")}</p>
          )}
        </section>
      </main>

      <footer className="border-t border-white/10 p-4 text-center">
        <Button variant="ghost" asChild>
          <Link href="/start">{tc("backHome")}</Link>
        </Button>
      </footer>
    </div>
  );
}
