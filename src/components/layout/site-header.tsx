import { Suspense } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Bell, Heart } from "lucide-react";
import { CartButton } from "@/components/cart/cart-drawer";
import { Link } from "@/i18n/navigation";
import { Logo } from "./logo";
import { HeaderSearch } from "./header-search";
import { IconLink } from "./icon-link";
import { MobileNav, type NavItem } from "./mobile-nav";
import { AccountMenu } from "./account-menu";
import { getCurrentUser } from "@/lib/auth-guard";
import { getCategories } from "@/server/catalog";
import { NotificationBell } from "@/components/account/notification-bell";
import { db } from "@/lib/db";

export async function SiteHeader() {
  const t = await getTranslations("header");
  const locale = await getLocale();
  const user = await getCurrentUser();
  const [unread, latest, wishCount] = user
    ? await Promise.all([
        db.notification.count({ where: { userId: user.id, readAt: null } }),
        db.notification.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: "desc" },
          take: 6,
          select: { id: true, titleEn: true, titleAr: true, bodyEn: true, bodyAr: true, link: true, readAt: true, createdAt: true },
        }),
        db.wishlistItem.count({ where: { userId: user.id } }),
      ])
    : [0, [], 0];

  const nav: NavItem[] = [
    { href: "/", label: t("home") },
    { href: "/shop", label: t("shop") },
    { href: "/services", label: t("services") },
    { href: "/about", label: t("about") },
    { href: "/contact", label: t("contact") },
    { href: "/faq", label: t("faq") },
  ];
  const categories: NavItem[] = (await getCategories(locale)).map((c) => ({ href: `/category/${c.slug}`, label: c.name }));

  return (
    <header className="no-print sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/75">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        {t("skipToContent")}
      </a>
      <div className="container flex h-16 items-center gap-2 sm:gap-4">
        <MobileNav items={nav} categories={categories} />
        <Link href="/" aria-label={t("home")} className="shrink-0 rounded-lg">
          <Logo locale={locale} className="hidden sm:block" />
          <Logo locale={locale} compact className="sm:hidden" />
        </Link>
        <Suspense fallback={<div className="h-11 flex-1" />}>
          <HeaderSearch className="mx-auto hidden max-w-xl flex-1 md:block" />
        </Suspense>
        <div className="ms-auto flex items-center gap-0.5 md:ms-0">
          <IconLink href="/account/wishlist" label={t("wishlist")} count={wishCount}>
            <Heart className="h-5 w-5" aria-hidden />
          </IconLink>
          {user ? (
            <NotificationBell unread={unread} items={latest} />
          ) : (
            <IconLink href="/account/notifications" label={t("notifications")}>
              <Bell className="h-5 w-5" aria-hidden />
            </IconLink>
          )}
          <AccountMenu user={user ? { name: user.name, email: user.email, role: user.role } : null} />
          <CartButton />
        </div>
      </div>
      <div className="container pb-3 md:hidden">
        <Suspense fallback={<div className="h-11" />}>
          <HeaderSearch id="site-search-mobile" />
        </Suspense>
      </div>
      <nav aria-label={t("categories")} className="hidden border-t lg:block">
        <div className="container flex h-11 items-center justify-between gap-4 text-sm font-medium">
          <ul className="scrollbar-none flex min-w-0 items-center gap-1 overflow-x-auto">
            <li>
              <Link href="/shop" className="whitespace-nowrap rounded-lg px-3 py-2 font-semibold text-primary hover:bg-muted">
                {t("allProducts")}
              </Link>
            </li>
            {categories.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="whitespace-nowrap rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
