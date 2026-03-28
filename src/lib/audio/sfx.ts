/**
 * 轻量短音效（无外部资源）；音量较低，失败时静默。
 */
export function playTone(
  opts: { frequency?: number; durationSec?: number; volume?: number } = {},
): void {
  if (typeof window === "undefined") return;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  const frequency = opts.frequency ?? 660;
  const durationSec = opts.durationSec ?? 0.07;
  const volume = opts.volume ?? 0.05;
  try {
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + durationSec);
    osc.onended = () => void ctx.close();
  } catch {
    /* ignore */
  }
}

export function sfxVoteConfirm(): void {
  playTone({ frequency: 520, durationSec: 0.06, volume: 0.055 });
}

export function sfxWarning(): void {
  playTone({ frequency: 880, durationSec: 0.09, volume: 0.045 });
}

export function sfxSpeakerCue(): void {
  playTone({ frequency: 440, durationSec: 0.1, volume: 0.05 });
}

/** 开局 / 单局终 / 会话终 — 资源未就绪时用短音占位 */
export function sfxGameHook(kind: "start" | "round_end" | "session_end"): void {
  const map = {
    start: { frequency: 330, durationSec: 0.12 },
    round_end: { frequency: 220, durationSec: 0.15 },
    session_end: { frequency: 180, durationSec: 0.2 },
  } as const;
  const x = map[kind];
  playTone({ ...x, volume: 0.06 });
}
