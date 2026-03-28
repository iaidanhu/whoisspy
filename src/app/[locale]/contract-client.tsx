"use client";

import { useTranslations } from "next-intl";
import { Fingerprint } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  WHOISSPY_PROFILE_KEY,
  isProfileComplete,
  parseProfile,
} from "@/lib/profile/storage";
import type { WhoisspyProfile } from "@/lib/profile/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AvatarBigSmile } from "@/components/avatar-big-smile";
import { LanguageSwitcher } from "@/components/language-switcher";

const PRESET_SEEDS = [
  "whoisspy-a",
  "whoisspy-b",
  "whoisspy-c",
  "whoisspy-d",
  "whoisspy-e",
  "whoisspy-f",
];

export function ContractClient() {
  const t = useTranslations("home");
  const tc = useTranslations("common");
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
  const [touchedAvatar, setTouchedAvatar] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(WHOISSPY_PROFILE_KEY);
    const p = parseProfile(raw);
    if (isProfileComplete(p)) {
      router.replace("/start");
      return;
    }
    if (p) {
      setDisplayName(p.displayName);
      setAvatarSeed(p.avatarSeed);
      setTouchedAvatar(true);
    }
    setHydrated(true);
  }, [router]);

  const effectiveSeed = useMemo(() => {
    if (avatarSeed) return avatarSeed;
    return PRESET_SEEDS[0]!;
  }, [avatarSeed]);

  const onNext = useCallback(() => {
    const seed =
      touchedAvatar && avatarSeed
        ? avatarSeed
        : crypto.randomUUID?.() ??
          `seed-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const profile: WhoisspyProfile = {
      displayName: displayName.trim(),
      avatarSeed: seed,
    };
    localStorage.setItem(WHOISSPY_PROFILE_KEY, JSON.stringify(profile));
    router.push("/start");
  }, [displayName, touchedAvatar, avatarSeed, router]);

  const canNext = displayName.trim().length >= 1;

  if (!hydrated) {
    return (
      <div className="home-paper-bg flex min-h-svh items-center justify-center p-4">
        <div className="text-[var(--home-ink-muted)]">…</div>
      </div>
    );
  }

  return (
    <div className="home-paper-bg flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher />
      </div>
      <Card className="home-paper-card w-full max-w-md border-4 border-double shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <p className="font-serif text-xs tracking-[0.35em] text-[var(--home-ink-burgundy)]">
            {t("subtitle")}
          </p>
          <h1 className="font-serif text-2xl font-semibold tracking-[0.2em] text-[var(--home-ink-burgundy)]">
            Who Is Spy
          </h1>
          <p className="text-sm text-[var(--home-ink-muted)]">{t("intro")}</p>
        </CardHeader>
        <CardContent className="space-6">
          <div className="space-y-2">
            <Label htmlFor="displayName" className="text-[var(--home-ink-burgundy)]">
              {t("signLabel")}
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("signPlaceholder")}
              maxLength={16}
              className="home-sign-input border-0 border-b-2 border-[var(--home-ink-burgundy)] bg-transparent px-0 text-center font-serif text-lg shadow-none focus-visible:ring-0"
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-[var(--home-ink-burgundy)]">{t("avatarLabel")}</p>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {PRESET_SEEDS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => {
                    setTouchedAvatar(true);
                    setAvatarSeed(seed);
                  }}
                  className={`shrink-0 rounded-full p-0.5 ring-2 transition ${
                    (touchedAvatar ? avatarSeed : PRESET_SEEDS[0]) === seed
                      ? "ring-[var(--home-ink-burgundy)]"
                      : "ring-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <AvatarBigSmile seed={seed} size={56} />
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-xs text-[var(--home-ink-muted)]">
            {t("dicebearCredit")}
          </p>
        </CardContent>
        <CardFooter className="flex justify-center pb-8 pt-2">
          <Button
            type="button"
            size="icon"
            disabled={!canNext}
            onClick={onNext}
            className="home-seal-btn size-20 rounded-full shadow-md"
            aria-label={tc("next")}
          >
            <Fingerprint className="size-10 text-[var(--home-seal-inner)]" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
