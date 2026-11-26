import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BASE_CLIENT_NAMESPACES, pickMessages } from "@/components/scoped-messages";
import { routing, isRtl, type Locale } from "@/i18n/routing";
import { fontVariables } from "@/lib/fonts";
import { Providers } from "@/components/providers";


export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params: { locale } }: { params: { locale: string } }): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
    title: { default: t("title"), template: `%s | ${t("brand")}` },
    description: t("description"),
    icons: { icon: "/icon.svg" },
    alternates: { languages: { en: "/en", ar: "/ar" } },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0F5F5A" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1514" },
  ],
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale as Locale)) notFound();
  setRequestLocale(locale);
  // Only the namespaces every storefront page needs; routes that need more
  // (account, checkout, auth, admin) wrap their subtree in <ScopedMessages>.
  const messages = await pickMessages(BASE_CLIENT_NAMESPACES);
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} className={fontVariables} suppressHydrationWarning>
      <body className="min-h-screen font-sans">
        <NextIntlClientProvider messages={messages}>
          <Providers dir={dir}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
