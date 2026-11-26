"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  BarChart3,
  Boxes,
  FolderTree,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquareText,
  Package,
  ShoppingCart,
  TicketPercent,
  UserCog,
  Users,
} from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Logo } from "@/components/layout/logo";
import { cn } from "@/lib/utils";

type Item = { href: string; key: string; icon: React.ComponentType<{ className?: string }>; adminOnly?: boolean; badge?: number };

function NavList({ role, newMessages, onNavigate }: { role: string; newMessages: number; onNavigate?: () => void }) {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const groups: { label: string; items: Item[] }[] = [
    {
      label: t("overview"),
      items: [
        { href: "/admin", key: "dashboard", icon: LayoutDashboard },
        { href: "/admin/reports", key: "reports", icon: BarChart3 },
      ],
    },
    {
      label: t("sales"),
      items: [
        { href: "/admin/orders", key: "orders", icon: ShoppingCart },
        { href: "/admin/customers", key: "customers", icon: Users },
        { href: "/admin/coupons", key: "coupons", icon: TicketPercent, adminOnly: true },
      ],
    },
    {
      label: t("catalogue"),
      items: [
        { href: "/admin/products", key: "products", icon: Package },
        { href: "/admin/categories", key: "categories", icon: FolderTree },
        { href: "/admin/inventory", key: "inventory", icon: Boxes },
      ],
    },
    {
      label: t("engagement"),
      items: [
        { href: "/admin/reviews", key: "reviews", icon: MessageSquareText },
        { href: "/admin/messages", key: "messages", icon: Mail, badge: newMessages },
        { href: "/admin/users", key: "users", icon: UserCog, adminOnly: true },
      ],
    },
  ];

  return (
    <nav aria-label={t("label")} className="space-y-5">
      {groups.map((g) => {
        const items = g.items.filter((i) => !i.adminOnly || role === "ADMIN");
        if (!items.length) return null;
        return (
          <div key={g.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{g.label}</p>
            <ul className="space-y-0.5">
              {items.map(({ href, key, icon: Icon, badge }) => {
                const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={onNavigate}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                      <span className="flex-1">{t(key)}</span>
                      {!!badge && <span className="rounded-full bg-accent px-1.5 text-xs font-bold text-accent-foreground">{badge}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminSidebar(props: { role: string; newMessages: number }) {
  const locale = useLocale();
  const t = useTranslations("admin.nav");
  return (
    <aside className="no-print fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e bg-card lg:flex">
      <div className="flex h-16 items-center border-b px-5">
        <Link href="/admin" aria-label={t("dashboard")}>
          <Logo locale={locale} className="h-9" />
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <NavList {...props} />
      </div>
    </aside>
  );
}

export function AdminMobileNav(props: { role: string; newMessages: number }) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("admin.nav");
  const tc = useTranslations("common");
  const locale = useLocale();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-lg hover:bg-muted lg:hidden" aria-label={t("open")}>
          <Menu className="h-5 w-5" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="start" closeLabel={tc("close")} className="overflow-y-auto p-4">
        <SheetHeader>
          <SheetTitle>
            <Logo locale={locale} className="h-9" />
          </SheetTitle>
        </SheetHeader>
        <NavList {...props} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
