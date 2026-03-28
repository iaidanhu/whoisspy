import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { JotaiProvider } from "@/components/jotai-provider";
import { LocaleHtmlLang } from "@/components/locale-html-lang";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as "zh" | "en")) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlLang />
      <JotaiProvider>{children}</JotaiProvider>
    </NextIntlClientProvider>
  );
}
