import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.faq");
  return { title: t("title"), description: t("subtitle") };
}

type Group = { title: string; items: { q: string; a: string }[] };

export default async function FaqPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages.faq");
  const groups = t.raw("groups") as Group[];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: groups.flatMap((g) => g.items.map((i) => ({ "@type": "Question", name: i.q, acceptedAnswer: { "@type": "Answer", text: i.a } }))),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="container max-w-4xl space-y-10 py-14">
        {groups.map((g) => (
          <section key={g.title} aria-labelledby={`faq-${g.title}`}>
            <h2 id={`faq-${g.title}`} className="mb-4 text-xl font-bold">
              {g.title}
            </h2>
            <div className="divide-y rounded-2xl border bg-card">
              {g.items.map((item) => (
                <details key={item.q} className="group px-5 [&_summary::-webkit-details-marker]:hidden">
                  <summary className="flex cursor-pointer items-center justify-between gap-4 py-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {item.q}
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
                  </summary>
                  <p className="pb-5 leading-relaxed text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </section>
        ))}
        <div className="flex flex-col items-center gap-3 rounded-3xl bg-secondary/60 p-8 text-center">
          <h2 className="text-xl font-bold">{t("stillTitle")}</h2>
          <p className="text-muted-foreground">{t("stillBody")}</p>
          <Button asChild>
            <Link href="/contact">{t("stillButton")}</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
