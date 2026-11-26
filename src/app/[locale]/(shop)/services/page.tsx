import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Boxes, CreditCard, Headphones, HardHat, PackageCheck, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { PageHero } from "@/components/content/page-hero";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.services");
  return { title: t("title"), description: t("subtitle") };
}

const ICONS = [Boxes, HardHat, Truck, Headphones, CreditCard, PackageCheck];

export default async function ServicesPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages.services");
  const items = t.raw("items") as { title: string; body: string }[];
  const steps = t.raw("process") as { title: string; body: string }[];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <section className="container py-14">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((s, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <li key={s.title} className="rounded-2xl border bg-card p-7 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h2 className="mt-5 text-lg font-semibold">{s.title}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{s.body}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="bg-secondary/50 py-14" aria-labelledby="process">
        <div className="container">
          <h2 id="process" className="text-2xl font-bold">
            {t("processTitle")}
          </h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="relative rounded-2xl bg-card p-6">
                <span className="tabular flex h-9 w-9 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">{i + 1}</span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container py-14">
        <div className="flex flex-col gap-6 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t("quoteTitle")}</h2>
            <p className="mt-2 max-w-xl text-primary-foreground/95">{t("quoteBody")}</p>
          </div>
          <Button asChild variant="accent" size="lg">
            <Link href="/contact">{t("quoteButton")}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
