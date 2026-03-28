import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/i18n/navigation";
import { normalizeRoomCodeInput } from "@/lib/room/code";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ locale: string; code: string }> };

export default async function RoomPage({ params }: Props) {
  const { code } = await params;
  const roomCode = normalizeRoomCodeInput(code);
  const t = await getTranslations("room");
  const tc = await getTranslations("common");

  return (
    <div className="room-shell flex min-h-svh flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="font-serif text-lg tracking-wide text-[var(--accent)]">
          Who Is Spy
        </span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
        <p className="text-[var(--text-primary)]">
          {t("codeLabel")}:{" "}
          <span className="font-mono tracking-widest text-[var(--accent)]">{roomCode}</span>
        </p>
        <p className="max-w-md text-center text-sm text-[var(--text-muted)]">
          {t("lobbyHint")}
        </p>
        <Button variant="outline" asChild>
          <Link href="/start">{tc("backHome")}</Link>
        </Button>
      </main>
    </div>
  );
}
