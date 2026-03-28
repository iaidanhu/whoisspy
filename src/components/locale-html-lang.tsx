"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** 同步 <html lang> 与当前 locale（根 layout 无法直接拿到动态 locale） */
export function LocaleHtmlLang() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale === "zh" ? "zh-CN" : "en";
  }, [locale]);
  return null;
}
