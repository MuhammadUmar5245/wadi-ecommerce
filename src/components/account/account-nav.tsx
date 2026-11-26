"use client";

import { useTranslations } from "next-intl";
import { Bell, Heart, LayoutDashboard, LogOut, MapPin, Package, UserCog } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { logoutAction } from "@/server/auth-actions";
import { cn } from "@/lib/utils";

export function AccountNav({ unread }: { unread: number }) {
  const t = useTranslations("account");
  const pathname = usePathname();
  const items = [
    { href: "/account", label: t("dashboard"), icon: LayoutDashboard, exact: true },
    { href: "/account/orders", label: t("orders"), icon: Package },
    { href: "/account/wishlist", label: t("wishlist"), icon: Heart },
    { href: "/account/addresses", label: t("addresses"), icon: MapPin },
    { href: "/account/notifications", label: t("notifications"), icon: Bell, badge: unread },
    { href: "/account/profile", label: t("profile"), icon: UserCog },
  ];

  return (
    <nav aria-label={t("navLabel")} className="min-w-0 lg:sticky lg:top-32">
      <ul className="scrollbar-none -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:rounded-2xl lg:border lg:bg-card lg:p-2">
        {items.map(({ href, label, icon: Icon, exact, badge }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href} className="shrink-0">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "border bg-card hover:bg-muted lg:border-0"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
                <span className="flex-1">{label}</span>
                {!!badge && (
                  <span className={cn("rounded-full px-1.5 text-xs font-bold", active ? "bg-white/20" : "bg-accent text-accent-foreground")}>{badge}</span>
                )}
              </Link>
            </li>
          );
        })}
        <li className="shrink-0 lg:mt-1 lg:border-t lg:pt-1">
          <form action={logoutAction}>
            <button type="submit" className="flex w-full items-center gap-2.5 whitespace-nowrap rounded-xl border bg-card px-3.5 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 lg:border-0">
              <LogOut className="h-4 w-4" aria-hidden />
              {t("logout")}
            </button>
          </form>
        </li>
      </ul>
    </nav>
  );
}
