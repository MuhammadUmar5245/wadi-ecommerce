import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { LegalBody, PageHero } from "@/components/content/page-hero";

const POLICY_DATE = new Date("2026-10-01T08:00:00Z");

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.privacy");
  return { title: t("title"), description: t("subtitle") };
}

export default async function PrivacyPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const format = await getFormatter();
  return (
    <>
      <PageHero title={t("privacy.title")} subtitle={t("privacy.subtitle")} />
      <LegalBody
        sections={t.raw("privacy.sections") as { heading: string; body: string[] }[]}
        tocLabel={t("privacy.title")}
        updated={t("updated", { date: format.dateTime(POLICY_DATE, { dateStyle: "long" }) })}
      />
    </>
  );
}
