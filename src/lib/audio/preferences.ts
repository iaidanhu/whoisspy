const KEY = "whoisspy_audio_v1";

export type AudioPreferences = {
  masterMuted: boolean;
  bgmMuted: boolean;
  sfxMuted: boolean;
};

const defaultPrefs: AudioPreferences = {
  masterMuted: false,
  bgmMuted: false,
  sfxMuted: false,
};

export function loadAudioPreferences(): AudioPreferences {
  if (typeof window === "undefined") return { ...defaultPrefs };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultPrefs };
    const o = JSON.parse(raw) as Partial<AudioPreferences>;
    return {
      masterMuted: Boolean(o.masterMuted),
      bgmMuted: Boolean(o.bgmMuted),
      sfxMuted: Boolean(o.sfxMuted),
    };
  } catch {
    return { ...defaultPrefs };
  }
}

export function saveAudioPreferences(p: AudioPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
}
