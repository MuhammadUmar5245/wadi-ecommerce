import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Eye, Gem, Handshake, HeartHandshake, Target, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";
import { getStoreStats } from "@/server/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.about");
  return { title: t("title"), description: t("subtitle") };
}

const VALUE_ICONS = [Handshake, HeartHandshake, Zap, Gem];

export default async function AboutPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages.about");
  const stats = await getStoreStats();
  const story = t.raw("story") as string[];
  const values = t.raw("values") as { title: string; body: string }[];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="container grid gap-12 py-14 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="story">
          <h2 id="story" className="text-2xl font-bold">
            {t("storyTitle")}
          </h2>
          {story.map((p, i) => (
            <p key={i} className="mt-4 text-lg leading-relaxed text-muted-foreground">
              {p}
            </p>
          ))}
        </section>
        <dl className="grid grid-cols-3 gap-3 self-start lg:grid-cols-1">
          {[
            { value: "11", label: t("stats.governorates") },
            { value: `${stats.products}+`, label: t("stats.products") },
            { value: "5", label: t("stats.support") },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border bg-card p-5">
              <dd className="tabular text-3xl font-extrabold text-primary">{s.value}</dd>
              <dt className="mt-1 text-sm text-muted-foreground">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>

      <section className="bg-secondary/50 py-14">
        <div className="container grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl bg-primary p-8 text-primary-foreground">
            <Eye className="h-8 w-8 text-accent" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold">{t("visionTitle")}</h2>
            <p className="mt-3 text-lg leading-relaxed text-primary-foreground/90">{t("vision")}</p>
          </div>
          <div className="rounded-3xl border bg-card p-8">
            <Target className="h-8 w-8 text-primary" aria-hidden />
            <h2 className="mt-4 text-2xl font-bold">{t("missionTitle")}</h2>
            <p className="mt-3 text-lg leading-relaxed text-muted-foreground">{t("mission")}</p>
          </div>
        </div>
      </section>

      <section className="container py-14" aria-labelledby="values">
        <h2 id="values" className="text-2xl font-bold">
          {t("valuesTitle")}
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => {
            const Icon = VALUE_ICONS[i % VALUE_ICONS.length];
            return (
              <li key={v.title} className="rounded-2xl border bg-card p-6">
                <Icon className="h-6 w-6 text-accent" aria-hidden />
                <h3 className="mt-3 font-semibold">{v.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.body}</p>
              </li>
            );
          })}
        </ul>
        <div className="mt-12 flex flex-col items-center gap-4 rounded-3xl border bg-card p-8 text-center sm:flex-row sm:justify-between sm:text-start">
          <p className="text-lg font-semibold">{t("cta")}</p>
          <Button asChild size="lg">
            <Link href="/contact">{t("ctaButton")}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
