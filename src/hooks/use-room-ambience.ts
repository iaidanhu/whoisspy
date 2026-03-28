"use client";

import { useCallback, useEffect, useRef } from "react";
import type { AudioPreferences } from "@/lib/audio/preferences";
import { sfxGameHook, sfxSpeakerCue, sfxWarning } from "@/lib/audio/sfx";

const BGM_PATH = "/audio/day.mp3";

type Phase = "LOBBY" | "PLAYING" | null;

type GamePhase =
  | "speaking"
  | "voting"
  | "tiebreak_speaking"
  | "tiebreak_voting"
  | "between_session_rounds"
  | "session_complete"
  | null;

/**
 * 等待大厅 BGM；对局中停止。短音效：换发言人、倒计时进预警、开局/终局占位音。
 */
export function useRoomAmbience(
  roomPhase: Phase,
  gamePhase: GamePhase,
  prefs: AudioPreferences,
  opts: {
    phaseSecondsLeft: number | null;
    currentSpeakerSeat: number | null;
    speakingLike: boolean;
  },
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevSpeakerRef = useRef<number | null>(null);
  const prevWarnRef = useRef(false);
  const prevRoomPhaseRef = useRef<Phase | null>(null);
  const prevGamePhaseRef = useRef<GamePhase | null>(null);

  const muted = prefs.masterMuted || prefs.bgmMuted;
  const sfxOff = prefs.masterMuted || prefs.sfxMuted;

  const ensureBgm = useCallback(() => {
    if (audioRef.current) return audioRef.current;
    const a = new Audio(BGM_PATH);
    a.loop = true;
    a.preload = "auto";
    a.volume = 0.35;
    a.addEventListener("error", () => {
      /* 未放置 day.mp3 时静默 */
    });
    audioRef.current = a;
    return a;
  }, []);

  useEffect(() => {
    const a = ensureBgm();
    const wantBgm = roomPhase === "LOBBY" && !muted;
    if (wantBgm) {
      void a.play().catch(() => {
        /* 待用户手势 */
      });
    } else {
      a.pause();
      if (roomPhase === "PLAYING") {
        try {
          a.currentTime = 0;
        } catch {
          /* ignore */
        }
      }
    }
  }, [roomPhase, muted, ensureBgm]);

  useEffect(() => {
    const prev = prevRoomPhaseRef.current;
    prevRoomPhaseRef.current = roomPhase;
    if (
      prev === "LOBBY" &&
      roomPhase === "PLAYING" &&
      gamePhase &&
      gamePhase !== "session_complete" &&
      !sfxOff
    ) {
      sfxGameHook("start");
    }
  }, [roomPhase, gamePhase, sfxOff]);

  useEffect(() => {
    const prev = prevGamePhaseRef.current;
    prevGamePhaseRef.current = gamePhase;
    if (
      gamePhase === "session_complete" &&
      prev != null &&
      prev !== "session_complete" &&
      !sfxOff
    ) {
      sfxGameHook("session_end");
    }
  }, [gamePhase, sfxOff]);

  useEffect(() => {
    if (sfxOff || roomPhase !== "PLAYING" || !gamePhase) return;
    const sp = opts.currentSpeakerSeat;
    if (opts.speakingLike && sp != null) {
      if (prevSpeakerRef.current != null && sp !== prevSpeakerRef.current) {
        sfxSpeakerCue();
      }
      prevSpeakerRef.current = sp;
    } else {
      prevSpeakerRef.current = null;
    }
  }, [sfxOff, roomPhase, gamePhase, opts.currentSpeakerSeat, opts.speakingLike]);

  useEffect(() => {
    if (sfxOff || roomPhase !== "PLAYING") return;
    const left = opts.phaseSecondsLeft;
    if (left == null) return;
    const warn = left <= 3 && left > 0;
    if (warn && !prevWarnRef.current) {
      sfxWarning();
    }
    prevWarnRef.current = warn;
    if (left > 3) prevWarnRef.current = false;
  }, [sfxOff, roomPhase, opts.phaseSecondsLeft]);

  return { ensureBgm };
}
