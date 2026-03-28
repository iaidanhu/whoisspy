import type { WhoisspyProfile } from "./types";

export const WHOISSPY_PROFILE_KEY = "whoisspy_profile_v1";
export const WHOISSPY_LOCALE_KEY = "whoisspy_locale_v1";

export function parseProfile(raw: string | null): WhoisspyProfile | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    if (
      v &&
      typeof v === "object" &&
      "displayName" in v &&
      "avatarSeed" in v &&
      typeof (v as WhoisspyProfile).displayName === "string" &&
      typeof (v as WhoisspyProfile).avatarSeed === "string"
    ) {
      return v as WhoisspyProfile;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function isProfileComplete(p: WhoisspyProfile | null): boolean {
  return !!p && p.displayName.trim().length >= 1;
}
