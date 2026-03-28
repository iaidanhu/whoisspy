"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { AvatarBigSmile } from "@/components/avatar-big-smile";
import { LanguageSwitcher } from "@/components/language-switcher";
import { RoomSoundMenu } from "@/components/room-sound-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getOrCreateClientKey } from "@/lib/client-key";
import { MIN_PLAYERS, MIN_SESSION_ROUNDS, MAX_SESSION_ROUNDS } from "@/lib/game/constants";
import type { WhoisspyProfile } from "@/lib/profile/types";
import {
  WHOISSPY_PROFILE_KEY,
  isProfileComplete,
  parseProfile,
} from "@/lib/profile/storage";
import type { RoomPublicResponse } from "@/lib/room/serialize";
import { loadAudioPreferences, saveAudioPreferences, type AudioPreferences } from "@/lib/audio/preferences";
import { sfxVoteConfirm } from "@/lib/audio/sfx";
import { useRoomAmbience } from "@/hooks/use-room-ambience";

type Props = { roomCode: string };

type LoadStatus = "loading" | "ok" | "not_found" | "join_error";

function secondsLeft(deadlineMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
}

function PhaseCountdownRing({
  left,
  total,
  label,
}: {
  left: number;
  total: number;
  label: string;
}) {
  const r = 16;
  const c = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(1, Math.max(0, left / total)) : 0;
  const dash = ratio * c;
  const warn = left <= 3 && left > 0;
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-[52px] shrink-0">
        <svg viewBox="0 0 36 36" className="size-full -rotate-90" aria-hidden>
          <circle cx="18" cy="18" r={r} fill="none" className="stroke-white/15" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r={r}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            className={warn ? "stroke-[var(--warning)]" : "stroke-[var(--accent)]"}
            strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-mono text-sm text-[var(--text-primary)]">
          {left}
        </span>
      </div>
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
    </div>
  );
}

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
  const [describeDraft, setDescribeDraft] = useState("");
  const [describeBusy, setDescribeBusy] = useState(false);
  const [voteBusy, setVoteBusy] = useState(false);
  const [restartBusy, setRestartBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [audioPrefs, setAudioPrefs] = useState<AudioPreferences>(() => loadAudioPreferences());

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

  const streamRefreshRef = useRef(refresh);
  streamRefreshRef.current = refresh;

  const game = room?.game;
  const phaseLeft =
    game != null ? secondsLeft(game.phaseDeadlineEpochMs) : null;
  const speakingLike = Boolean(
    game &&
      (game.gamePhase === "speaking" || game.gamePhase === "tiebreak_speaking"),
  );

  useRoomAmbience(room?.phase ?? null, game?.gamePhase ?? null, audioPrefs, {
    phaseSecondsLeft: phaseLeft,
    currentSpeakerSeat: game?.currentSpeakerSeat ?? null,
    speakingLike,
  });

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
    const ms = room?.phase === "PLAYING" ? 1400 : 2800;
    const id = setInterval(() => void refresh(), ms);
    return () => clearInterval(id);
  }, [status, clientKey, refresh, room?.phase]);

  useEffect(() => {
    if (status !== "ok" || room?.phase !== "PLAYING" || !room.game) return;
    const id = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, [status, room?.phase, room?.game]);

  useEffect(() => {
    saveAudioPreferences(audioPrefs);
  }, [audioPrefs]);

  useEffect(() => {
    if (status !== "ok" || room?.phase !== "PLAYING") return;
    const url = `/api/rooms/${encodeURIComponent(roomCode)}/stream`;
    let es: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;
    let attempt = 0;

    const connect = () => {
      if (cancelled) return;
      es?.close();
      es = new EventSource(url);
      es.onopen = () => {
        attempt = 0;
      };
      es.onmessage = () => {
        void streamRefreshRef.current?.();
      };
      es.onerror = () => {
        es?.close();
        attempt += 1;
        const delay = Math.min(30_000, 800 * 2 ** Math.min(attempt, 5));
        reconnectTimer = setTimeout(connect, delay);
      };
    };

    connect();
    return () => {
      cancelled = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      es?.close();
    };
  }, [status, room?.phase, roomCode]);

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

  const sendDescribe = useCallback(async () => {
    if (!clientKey || !describeDraft.trim()) return;
    setDescribeBusy(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/game/speak`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientKey, text: describeDraft }),
      });
      if (res.ok) {
        setRoom((await res.json()) as RoomPublicResponse);
        setDescribeDraft("");
      }
    } finally {
      setDescribeBusy(false);
    }
  }, [clientKey, describeDraft, roomCode]);

  const sendVote = useCallback(
    async (targetSeat: number | "abstain") => {
      if (!clientKey) return;
      setVoteBusy(true);
      try {
        const body =
          targetSeat === "abstain"
            ? { clientKey, abstain: true }
            : { clientKey, targetSeat };
        const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/game/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setRoom((await res.json()) as RoomPublicResponse);
          if (!audioPrefs.masterMuted && !audioPrefs.sfxMuted) sfxVoteConfirm();
        }
      } finally {
        setVoteBusy(false);
      }
    },
    [clientKey, roomCode, audioPrefs.masterMuted, audioPrefs.sfxMuted],
  );

  const restartSession = useCallback(async () => {
    if (!clientKey) return;
    setRestartBusy(true);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/restart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientKey }),
      });
      if (res.ok) {
        setRoom((await res.json()) as RoomPublicResponse);
      }
    } finally {
      setRestartBusy(false);
    }
  }, [clientKey, roomCode]);

  const startSpeechToText = useCallback(() => {
    if (typeof window === "undefined") return;
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        continuous: boolean;
        interimResults: boolean;
        onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
        start: () => void;
      };
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = "zh-CN";
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (ev) => {
      const text = ev.results[0]?.[0]?.transcript;
      if (text) setDescribeDraft((d) => (d ? `${d}${text}` : text));
    };
    try {
      rec.start();
    } catch {
      /* ignore */
    }
  }, []);

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
  const mySeat = room.you?.seat;

  const sttSupported =
    typeof window !== "undefined" &&
    Boolean(
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown }).SpeechRecognition,
    );

  void tick; // 驱动每秒重渲染以更新倒计时

  const memberCardClass = (m: (typeof room.members)[0]) => {
    const you = room.you?.seat === m.seat;
    const alive = m.isAliveThisRound !== false;
    const current =
      game &&
      game.currentSpeakerSeat === m.seat &&
      (game.gamePhase === "speaking" || game.gamePhase === "tiebreak_speaking");
    let cls =
      "flex items-center gap-3 rounded-lg border px-3 py-2 transition-[box-shadow,opacity] ";
    if (current) {
      cls += "border-[var(--accent)] bg-[var(--accent)]/15 shadow-[0_0_14px_rgba(218,165,32,0.35)] ";
    } else if (you) {
      cls += "border-[var(--accent)] bg-[var(--accent)]/10 ";
    } else {
      cls += "border-white/10 bg-black/20 ";
    }
    if (!alive) cls += "opacity-45 ";
    return cls;
  };

  const renderCenter = () => {
    if (room.phase === "LOBBY") {
      return <p className="text-center text-sm text-[var(--text-muted)]">{t("lobbyHint")}</p>;
    }

    if (room.phase === "PLAYING" && game?.gamePhase === "session_complete") {
      const mvp = game.sessionMvpSeat;
      const mvpName = mvp != null ? room.members.find((x) => x.seat === mvp)?.displayName : null;
      return (
        <div className="w-full max-w-md space-y-4 text-center">
          <p className="text-lg font-medium text-[var(--accent)]">{t("sessionComplete")}</p>
          <ul className="space-y-2 text-left text-sm">
            {room.members
              .slice()
              .sort((a, b) => a.seat - b.seat)
              .map((m) => (
                <li
                  key={m.seat}
                  className="flex justify-between rounded-md border border-white/10 bg-black/30 px-3 py-2"
                >
                  <span className="text-[var(--text-primary)]">
                    #{m.seat} {m.displayName}
                  </span>
                  <span className="font-mono text-[var(--accent)]">
                    {game.scoresBySeat[String(m.seat)] ?? 0}
                  </span>
                </li>
              ))}
          </ul>
          {mvpName != null && (
            <p className="text-sm text-[var(--text-muted)]">
              {t("mvpLabel")}: <span className="text-[var(--text-primary)]">{mvpName}</span>
            </p>
          )}
          {isHost && (
            <Button
              type="button"
              className="bg-[var(--accent)] text-[#1a1010]"
              disabled={restartBusy}
              onClick={() => void restartSession()}
            >
              {t("restartSession")}
            </Button>
          )}
        </div>
      );
    }

    if (room.phase === "PLAYING" && game) {
      const left = secondsLeft(game.phaseDeadlineEpochMs);
      const phaseLabel: Record<string, string> = {
        speaking: t("phase_speaking"),
        voting: t("phase_voting"),
        tiebreak_speaking: t("phase_tiebreak_speaking"),
        tiebreak_voting: t("phase_tiebreak_voting"),
        between_session_rounds: t("phase_between_session_rounds"),
        session_complete: t("phase_session_complete"),
      };
      const phaseText = phaseLabel[game.gamePhase] ?? game.gamePhase;

      const messages = game.messages.filter(
        (msg) => msg.sessionRoundIndex === game.sessionRoundIndex,
      );

      const speaking =
        game.gamePhase === "speaking" || game.gamePhase === "tiebreak_speaking";
      const voting = game.gamePhase === "voting" || game.gamePhase === "tiebreak_voting";
      const between = game.gamePhase === "between_session_rounds";

      const currentSpeaker =
        game.currentSpeakerSeat != null
          ? room.members.find((m) => m.seat === game.currentSpeakerSeat)
          : null;

      const voteTargets = room.members.filter((m) => {
        if (!game.aliveSeats.includes(m.seat)) return false;
        if (m.seat === mySeat) return false;
        if (game.voteTargetWhitelist && !game.voteTargetWhitelist.includes(m.seat)) return false;
        return true;
      });

      const tbDepth = game.tiebreakDepth;
      const currentDescribe = currentSpeaker
        ? [...messages]
            .reverse()
            .find(
              (m) =>
                m.seat === currentSpeaker.seat &&
                m.sessionRoundIndex === game.sessionRoundIndex &&
                m.pollIndex === game.pollIndex &&
                m.tiebreakDepth === tbDepth,
            )
        : undefined;

      return (
        <div className="flex w-full max-w-lg flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm lg:hidden">
            <span className="text-[var(--text-muted)]">
              {t("roundProgress", {
                current: game.sessionRoundIndex,
                total: game.sessionTotalRounds,
              })}
            </span>
            <span className="font-mono text-[var(--accent)]">
              {phaseText} · {t("secondsLeft", { n: left })}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
            <span>{t("cumulativeScores")}</span>
            {room.members.map((m) => (
              <span key={m.seat} className="font-mono text-[var(--text-primary)]">
                #{m.seat}:{game.scoresBySeat[String(m.seat)] ?? 0}
              </span>
            ))}
          </div>

          {between && (
            <p className="text-center text-sm text-[var(--text-muted)]">{t("betweenRounds")}</p>
          )}

          {room.you?.word != null && room.you.role != null && (
            <div className="rounded-lg border border-white/10 bg-black/30 p-3 text-center text-sm">
              <p className="text-[var(--text-muted)]">{t("yourWord")}</p>
              <p className="font-serif text-xl text-[var(--accent)]">{room.you.word}</p>
            </div>
          )}

          <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/30 p-3 text-left text-sm">
            {messages.length === 0 ? (
              <p className="text-[var(--text-muted)]">{t("noMessagesYet")}</p>
            ) : (
              messages.map((msg) => {
                const who = room.members.find((m) => m.seat === msg.seat);
                return (
                  <p key={msg.id} className="text-[var(--text-primary)]">
                    <span className="text-[var(--accent)]">#{msg.seat}</span>{" "}
                    {who?.displayName ?? ""}: {msg.text}
                  </p>
                );
              })
            )}
          </div>

          {speaking && currentSpeaker && (
            <div className="space-y-4">
              {mySeat === currentSpeaker.seat ? (
                <>
                  <div className="flex flex-col items-center gap-2">
                    <AvatarBigSmile seed={currentSpeaker.avatarSeed} size={120} />
                    <p className="text-sm text-[var(--text-muted)]">{t("yourTurnDescribe")}</p>
                  </div>
                  <Textarea
                    value={describeDraft}
                    onChange={(e) => setDescribeDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void sendDescribe();
                      }
                    }}
                    placeholder={t("describePlaceholder")}
                    aria-label={t("describeAria")}
                    className="min-h-[120px] max-h-48 overflow-y-auto rounded-2xl border border-[var(--accent)]/35 bg-black/40 text-[var(--text-primary)]"
                    disabled={describeBusy}
                  />
                  <div className="flex flex-wrap items-center gap-2">
                    {sttSupported && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 border-white/20"
                        aria-label={t("micStt")}
                        onClick={() => startSpeechToText()}
                      >
                        <Mic className="size-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      className="bg-[var(--accent)] text-[#1a1010]"
                      disabled={describeBusy || !describeDraft.trim()}
                      onClick={() => void sendDescribe()}
                    >
                      {t("sendDescribe")}
                    </Button>
                    <PhaseCountdownRing
                      left={left}
                      total={room.speakDurationSec}
                      label={t("speakingCountdown")}
                    />
                  </div>
                </>
              ) : (
                <div className="flex w-full flex-col items-center gap-4">
                  <AvatarBigSmile seed={currentSpeaker.avatarSeed} size={168} />
                  <PhaseCountdownRing
                    left={left}
                    total={room.speakDurationSec}
                    label={t("speakingCountdown")}
                  />
                  <div className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 backdrop-blur-sm">
                    {currentDescribe ? (
                      <p className="text-base leading-relaxed text-[var(--text-primary)]">
                        {currentDescribe.text}
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">
                        {t("speakerThinking", { seat: currentSpeaker.seat })}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {voting && mySeat != null && game.aliveSeats.includes(mySeat) && (
            <div className="space-y-3">
              <PhaseCountdownRing
                left={left}
                total={room.voteDurationSec}
                label={t("voteCountdown")}
              />
              <p className="text-sm text-[var(--text-muted)]">{t("votePrompt")}</p>
              <div className="flex flex-wrap gap-2">
                {voteTargets.map((m) => (
                  <Button
                    key={m.seat}
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={voteBusy}
                    onClick={() => void sendVote(m.seat)}
                  >
                    #{m.seat} {m.displayName}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={voteBusy}
                  onClick={() => void sendVote("abstain")}
                >
                  {t("voteAbstain")}
                </Button>
              </div>
            </div>
          )}

          {game.lastRoundWinner && game.gamePhase !== "session_complete" && (
            <p className="text-center text-xs text-[var(--text-muted)]">
              {game.lastRoundWinner === "civilian" ? t("lastRoundCivilian") : t("lastRoundUndercover")}
            </p>
          )}
        </div>
      );
    }

    if (room.phase === "PLAYING" && room.you?.word != null && room.you.role != null) {
      return (
        <div className="space-y-4 text-center">
          <p className="text-sm text-[var(--text-muted)]">{t("yourWord")}</p>
          <p className="font-serif text-3xl text-[var(--accent)]">{room.you.word}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {room.you.role === "undercover" ? t("roleUndercover") : t("roleCivilian")}
          </p>
          <p className="text-sm text-[var(--text-muted)]">{t("dealHintLegacy")}</p>
        </div>
      );
    }

    return <p className="text-center text-sm text-[var(--text-muted)]">{t("lobbyHint")}</p>;
  };

  const topBarGame =
    game && room.phase === "PLAYING" && game.gamePhase !== "session_complete";

  const phasePillText =
    game &&
    ({
      speaking: t("phase_speaking"),
      voting: t("phase_voting"),
      tiebreak_speaking: t("phase_tiebreak_speaking"),
      tiebreak_voting: t("phase_tiebreak_voting"),
      between_session_rounds: t("phase_between_session_rounds"),
      session_complete: t("phase_session_complete"),
    }[game.gamePhase] ?? game.gamePhase);

  return (
    <div className="room-shell flex min-h-svh flex-col">
      <header className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <span className="shrink-0 font-serif text-lg tracking-wide text-[var(--accent)]">
          Who Is Spy
        </span>
        {topBarGame && (
          <div className="order-last flex w-full flex-wrap items-center justify-center gap-2 text-xs sm:order-none sm:w-auto sm:flex-1 sm:justify-center">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[var(--text-primary)]">
              {t("roundProgress", {
                current: game.sessionRoundIndex,
                total: game.sessionTotalRounds,
              })}
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-[var(--text-muted)]">
              {t("topBarAlive", {
                alive: game.aliveSeats.length,
                total: room.members.length,
              })}
            </span>
            <span className="rounded-full border border-[var(--accent)]/35 bg-[var(--accent)]/10 px-3 py-1 font-medium text-[var(--accent)]">
              {phasePillText}
            </span>
            {room.you?.role && (
              <span className="rounded-full border border-white/10 px-3 py-1 text-[var(--text-muted)]">
                {room.you.role === "undercover" ? t("roleUndercoverShort") : t("roleCivilianShort")}
              </span>
            )}
          </div>
        )}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:shrink-0">
          <RoomSoundMenu
            prefs={audioPrefs}
            onChange={setAudioPrefs}
            onOpenAttempt={() => {
              try {
                const Ctor =
                  window.AudioContext ??
                  (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
                if (Ctor) void new Ctor().resume();
              } catch {
                /* ignore */
              }
            }}
          />
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

      <main className="flex flex-1 flex-col gap-6 p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] lg:flex-row lg:justify-center">
        <section className="flex min-w-0 flex-1 flex-col gap-4 lg:max-w-md">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium text-[var(--text-muted)]">{t("codeLabel")}</h2>
            <span className="font-mono text-lg tracking-widest text-[var(--accent)]">
              {room.code}
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            {t("playersCount", { count: room.members.length })}
          </p>
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:space-y-2 lg:overflow-visible lg:pb-0">
            {room.members.map((m) => (
              <li key={m.seat} className={`min-w-[220px] shrink-0 lg:min-w-0 ${memberCardClass(m)}`}>
                <AvatarBigSmile seed={m.avatarSeed} size={40} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-1 truncate font-medium text-[var(--text-primary)]">
                    <span className="truncate">{m.displayName}</span>
                    {room.you?.seat === m.seat && (
                      <span className="shrink-0 rounded border border-[var(--accent)] px-1 text-[10px] uppercase tracking-wide text-[var(--accent)]">
                        {t("youBadge")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    #{m.seat}
                    {m.isHost ? ` · ${t("host")}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/25 p-6 lg:max-w-lg">
          {renderCenter()}
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
