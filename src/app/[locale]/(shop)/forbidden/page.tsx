import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldAlert } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("errors");
  return { title: t("forbiddenTitle"), robots: { index: false } };
}

export default async function ForbiddenPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("errors");
  return (
    <div className="container flex max-w-xl flex-col items-center py-24 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="h-8 w-8" aria-hidden />
      </div>
      <p className="mt-6 text-sm font-semibold text-destructive">403</p>
      <h1 className="mt-1 text-3xl font-bold">{t("forbiddenTitle")}</h1>
      <p className="mt-3 text-muted-foreground">{t("forbiddenBody")}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/account">{t("goAccount")}</Link>
        </Button>
      </div>
    </div>
  );
}
