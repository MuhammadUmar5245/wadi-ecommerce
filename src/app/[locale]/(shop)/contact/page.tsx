import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/content/page-hero";
import { ContactForm } from "@/components/content/contact-form";
import { ScopedMessages } from "@/components/scoped-messages";
import { getCurrentUser } from "@/lib/auth-guard";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pages.contact");
  return { title: t("title"), description: t("subtitle") };
}

export default async function ContactPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("pages.contact");
  const user = await getCurrentUser();

  const details = [
    { icon: MapPin, label: t("visit"), value: t("address") },
    { icon: Phone, label: t("call"), value: "+968 2400 0000", href: "tel:+96824000000", ltr: true },
    { icon: Mail, label: t("email"), value: "info@wadialghubaitah.test", href: "mailto:info@wadialghubaitah.test", ltr: true },
    { icon: Clock, label: t("hours"), value: t("hoursValue") },
  ];

  return (
    <>
      <PageHero title={t("title")} subtitle={t("subtitle")} />
      <div className="container grid gap-8 py-14 lg:grid-cols-[1fr_1.6fr]">
        <ul className="space-y-4">
          {details.map(({ icon: Icon, label, value, href, ltr }) => (
            <li key={label} className="flex gap-4 rounded-2xl border bg-card p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                {href ? (
                  <a href={href} className="break-words font-semibold hover:text-primary" dir={ltr ? "ltr" : undefined}>
                    {value}
                  </a>
                ) : (
                  <p className="font-semibold">{value}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8" aria-labelledby="contact-form-title">
          <h2 id="contact-form-title" className="mb-6 text-xl font-bold">
            {t("formTitle")}
          </h2>
          <ScopedMessages namespaces={["pages.contact"]}>
            <ContactForm defaults={user ? { name: user.name, email: user.email, phone: user.phone } : undefined} />
          </ScopedMessages>
        </section>
      </div>
    </>
  );
}
