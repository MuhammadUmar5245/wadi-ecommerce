import { useTranslations } from "next-intl";
import { Phone, Truck } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { ThemeToggle } from "./theme-toggle";
import { Suspense } from "react";
import { Link } from "@/i18n/navigation";

export function TopBar() {
  const t = useTranslations("topbar");
  const th = useTranslations("header");

  return (
    <div className="bg-primary text-primary-foreground no-print">
      <div className="container flex h-9 items-center justify-between gap-3 text-xs">
        <p className="flex min-w-0 items-center gap-1.5 truncate">
          <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{t("delivery")}</span>
        </p>
        <div className="flex shrink-0 items-center gap-1 sm:gap-3">
          <nav aria-label={th("infoNav")} className="hidden items-center gap-3 lg:flex">
            {(["services", "about", "contact", "faq"] as const).map((k) => (
              <Link key={k} href={`/${k}`} className="hover:underline">
                {th(k)}
              </Link>
            ))}
            <span className="h-3 w-px bg-white/30" aria-hidden />
          </nav>
          <a href="tel:+96824000000" className="hidden items-center gap-1.5 hover:underline sm:inline-flex">
            <Phone className="h-3.5 w-3.5" aria-hidden />
            <span dir="ltr">+968 2400 0000</span>
          </a>
          <Suspense fallback={null}>
            <LanguageSwitcher />
          </Suspense>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}
