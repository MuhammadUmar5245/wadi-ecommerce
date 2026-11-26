import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { LegalBody, PageHero } from "@/components/content/page-hero";

const TERMS_DATE = new Date("2026-10-01T08:00:00Z");

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.terms");
  return { title: t("title"), description: t("subtitle") };
}

export default async function TermsPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages");
  const format = await getFormatter();
  return (
    <>
      <PageHero title={t("terms.title")} subtitle={t("terms.subtitle")} />
      <LegalBody
        sections={t.raw("terms.sections") as { heading: string; body: string[] }[]}
        tocLabel={t("terms.title")}
        updated={t("updated", { date: format.dateTime(TERMS_DATE, { dateStyle: "long" }) })}
      />
    </>
  );
}
