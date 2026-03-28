"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import type { WhoisspyProfile } from "@/lib/profile/types";
import {
  WHOISSPY_PROFILE_KEY,
  isProfileComplete,
  parseProfile,
} from "@/lib/profile/storage";
import { getOrCreateClientKey } from "@/lib/client-key";
import { isValidRoomCodeFormat, normalizeRoomCodeInput } from "@/lib/room/code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";

export function StartClient() {
  const t = useTranslations("start");
  const tc = useTranslations("common");
  const router = useRouter();
  const [code, setCode] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [busy, setBusy] = useState<"join" | "create" | null>(null);
  const [remoteError, setRemoteError] = useState<string | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(WHOISSPY_PROFILE_KEY);
    if (!isProfileComplete(parseProfile(raw))) {
      router.replace("/");
      return;
    }
    setHydrated(true);
  }, [router]);

  const join = useCallback(async () => {
    const normalized = normalizeRoomCodeInput(code);
    if (!isValidRoomCodeFormat(normalized)) return;
    const raw = localStorage.getItem(WHOISSPY_PROFILE_KEY);
    const profile = parseProfile(raw);
    if (!isProfileComplete(profile)) return;
    const prof = profile as WhoisspyProfile;
    setRemoteError(null);
    setBusy("join");
    try {
      const ck = getOrCreateClientKey();
      const res = await fetch(`/api/rooms/${encodeURIComponent(normalized)}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientKey: ck,
          displayName: prof.displayName,
          avatarSeed: prof.avatarSeed,
        }),
      });
      if (res.status === 404) {
        setRemoteError("not_found");
        return;
      }
      if (res.status === 409) {
        const j = (await res.json()) as { error?: string };
        setRemoteError(j.error === "room_full" ? "full" : "other");
        return;
      }
      if (!res.ok) {
        setRemoteError("other");
        return;
      }
      router.push(`/r/${normalized}`);
    } finally {
      setBusy(null);
    }
  }, [code, router]);

  const create = useCallback(async () => {
    const raw = localStorage.getItem(WHOISSPY_PROFILE_KEY);
    const profile = parseProfile(raw);
    if (!isProfileComplete(profile)) return;
    const prof = profile as WhoisspyProfile;
    setRemoteError(null);
    setBusy("create");
    try {
      const ck = getOrCreateClientKey();
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientKey: ck,
          displayName: prof.displayName,
          avatarSeed: prof.avatarSeed,
        }),
      });
      if (!res.ok) {
        setRemoteError("other");
        return;
      }
      const data = (await res.json()) as { code: string };
      router.push(`/r/${data.code}`);
    } finally {
      setBusy(null);
    }
  }, [router]);

  if (!hydrated) {
    return (
      <div className="home-paper-bg flex min-h-svh items-center justify-center">
        <span className="text-[var(--home-ink-muted)]">…</span>
      </div>
    );
  }

  const codeOk = isValidRoomCodeFormat(normalizeRoomCodeInput(code));

  return (
    <div className="home-paper-bg flex min-h-svh flex-col items-center justify-center gap-4 p-4">
      <div className="absolute right-4 top-4 flex gap-2">
        <LanguageSwitcher />
      </div>
      <Card className="home-paper-card w-full max-w-md border-4 border-double shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <h1 className="font-serif text-2xl font-semibold tracking-wide text-[var(--home-ink-burgundy)]">
            {t("title")}
          </h1>
          <p className="text-sm text-[var(--home-ink-muted)]">{t("paperIntro")}</p>
        </CardHeader>
        <CardContent className="space-6">
          <div className="space-y-2">
            <Label htmlFor="room" className="text-[var(--home-ink-burgundy)]">
              {tc("roomCode")}
            </Label>
            <p className="text-xs text-[var(--home-ink-muted)]">{t("joinDescription")}</p>
            <Input
              id="room"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder={tc("roomCodePlaceholder")}
              maxLength={8}
              className="home-sign-input border-2 border-[var(--home-ink-burgundy)]/40 bg-white/40 font-mono tracking-widest"
            />
            {remoteError === "not_found" && (
              <p className="text-sm text-red-700">{t("errorRoomNotFound")}</p>
            )}
            {remoteError === "full" && (
              <p className="text-sm text-red-700">{t("errorRoomFull")}</p>
            )}
            {remoteError === "other" && (
              <p className="text-sm text-red-700">{t("errorGeneric")}</p>
            )}
            <Button
              type="button"
              className="w-full"
              disabled={!codeOk || busy !== null}
              onClick={() => void join()}
            >
              {busy === "join" ? "…" : tc("join")}
            </Button>
          </div>
          <div className="relative text-center text-xs text-[var(--home-ink-muted)]">
            <span className="bg-[var(--home-paper)] px-2">—</span>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-xs text-[var(--home-ink-muted)]">{t("createDescription")}</p>
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={busy !== null}
              onClick={() => void create()}
            >
              {busy === "create" ? "…" : tc("createRoom")}
            </Button>
          </div>
          <div className="text-center">
            <Button variant="link" asChild>
              <Link href="/">{tc("backHome")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
