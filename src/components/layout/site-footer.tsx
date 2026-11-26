import { getLocale, getTranslations } from "next-intl/server";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const th = await getTranslations("header");
  const locale = await getLocale();
  const year = new Date().getFullYear();

  const quick = [
    { href: "/shop", label: th("shop") },
    { href: "/about", label: th("about") },
    { href: "/services", label: th("services") },
    { href: "/contact", label: th("contact") },
  ];
  const service = [
    { href: "/account/orders", label: t("trackOrder") },
    { href: "/faq", label: th("faq") },
    { href: "/privacy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
  ];

  return (
    <footer className="no-print mt-16 border-t bg-card">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo locale={locale} />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t("about")}</p>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t("quickLinks")}</h2>
          <ul className="space-y-2 text-sm">
            {quick.map((l) => (
              <li key={l.href}>
                <Link href={l.href} prefetch={l.href.startsWith("/account") ? false : undefined} className="text-muted-foreground hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t("customerService")}</h2>
          <ul className="space-y-2 text-sm">
            {service.map((l) => (
              <li key={l.href}>
                <Link href={l.href} prefetch={l.href.startsWith("/account") ? false : undefined} className="text-muted-foreground hover:text-primary">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-3 text-sm font-semibold">{t("contactUs")}</h2>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("address")}
            </li>
            <li className="flex gap-2">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <a href="tel:+96824000000" dir="ltr" className="hover:text-primary">+968 2400 0000</a>
            </li>
            <li className="flex gap-2">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              <a href="mailto:info@wadialghubaitah.test" className="break-all hover:text-primary">info@wadialghubaitah.test</a>
            </li>
            <li className="flex gap-2">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
              {t("hours")}
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="container flex flex-col items-center justify-between gap-3 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>{t("copyright", { year })}</p>
          <ul className="flex flex-wrap items-center gap-2" aria-label={t("paymentMethods")}>
            {[t("payCard"), t("payCod"), t("payDemo")].map((m) => (
              <li key={m} className="rounded-md border bg-background px-2 py-1 font-medium">
                {m}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
