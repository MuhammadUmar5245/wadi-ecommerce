"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "./logo";

export type NavItem = { href: string; label: string };

export function MobileNav({ items, categories }: { items: NavItem[]; categories: NavItem[] }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("header");
  const tc = useTranslations("common");
  const locale = useLocale();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted lg:hidden" aria-label={t("menu")}>
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="start" closeLabel={tc("close")} className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <Logo locale={locale} />
          </SheetTitle>
        </SheetHeader>
        <nav aria-label={t("mainNav")} className="flex flex-col gap-1">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2.5 font-medium hover:bg-muted">
              {item.label}
            </Link>
          ))}
        </nav>
        {categories.length > 0 && (
          <div>
            <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("categories")}</p>
            <nav aria-label={t("categories")} className="flex flex-col gap-1">
              {categories.map((c) => (
                <Link key={c.href} href={c.href} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm hover:bg-muted">
                  {c.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
