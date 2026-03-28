"use client";

import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import {
  WHOISSPY_PROFILE_KEY,
  isProfileComplete,
  parseProfile,
} from "@/lib/profile/storage";
import { generateRoomCode, isValidRoomCodeFormat, normalizeRoomCodeInput } from "@/lib/room/code";
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

  useEffect(() => {
    const raw = localStorage.getItem(WHOISSPY_PROFILE_KEY);
    if (!isProfileComplete(parseProfile(raw))) {
      router.replace("/");
      return;
    }
    setHydrated(true);
  }, [router]);

  const join = useCallback(() => {
    const normalized = normalizeRoomCodeInput(code);
    if (!isValidRoomCodeFormat(normalized)) return;
    router.push(`/r/${normalized}`);
  }, [code, router]);

  const create = useCallback(() => {
    const newCode = generateRoomCode();
    router.push(`/r/${newCode}`);
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
            <Button
              type="button"
              className="w-full"
              disabled={!codeOk}
              onClick={join}
            >
              {tc("join")}
            </Button>
          </div>
          <div className="relative text-center text-xs text-[var(--home-ink-muted)]">
            <span className="bg-[var(--home-paper)] px-2">—</span>
          </div>
          <div className="space-y-2 text-center">
            <p className="text-xs text-[var(--home-ink-muted)]">{t("createDescription")}</p>
            <Button type="button" variant="secondary" className="w-full" onClick={create}>
              {tc("createRoom")}
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
