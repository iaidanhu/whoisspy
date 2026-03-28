"use client";

import { useTranslations } from "next-intl";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AudioPreferences } from "@/lib/audio/preferences";

type Props = {
  prefs: AudioPreferences;
  onChange: (p: AudioPreferences) => void;
  onOpenAttempt: () => void;
};

export function RoomSoundMenu({ prefs, onChange, onOpenAttempt }: Props) {
  const t = useTranslations("room");

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (open) onOpenAttempt();
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-white/15 bg-black/20"
          aria-label={t("soundMenuAria")}
        >
          {prefs.masterMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel>{t("soundSettings")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={prefs.masterMuted}
          onCheckedChange={(v) => onChange({ ...prefs, masterMuted: Boolean(v) })}
        >
          {t("muteAll")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={prefs.bgmMuted}
          onCheckedChange={(v) => onChange({ ...prefs, bgmMuted: Boolean(v) })}
          disabled={prefs.masterMuted}
        >
          {t("muteBgm")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={prefs.sfxMuted}
          onCheckedChange={(v) => onChange({ ...prefs, sfxMuted: Boolean(v) })}
          disabled={prefs.masterMuted}
        >
          {t("muteSfx")}
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
