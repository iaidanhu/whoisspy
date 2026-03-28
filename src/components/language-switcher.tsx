"use client";

import { useLocale } from "next-intl";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { WHOISSPY_LOCALE_KEY } from "@/lib/profile/storage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";

const LOCALES = ["zh", "en"] as const;

export function LanguageSwitcher() {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: (typeof LOCALES)[number]) {
    try {
      localStorage.setItem(WHOISSPY_LOCALE_KEY, next);
    } catch {
      /* ignore */
    }
    router.replace(pathname, { locale: next });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-2">
          <Languages className="size-4" aria-hidden />
          {t("language")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => switchTo(loc)}
            className={locale === loc ? "font-semibold" : undefined}
          >
            {loc === "zh" ? "简体中文" : "English"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
