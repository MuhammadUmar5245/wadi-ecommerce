import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { LogOut, Store } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { AdminMobileNav, AdminSidebar } from "@/components/admin/admin-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { logoutAction } from "@/server/auth-actions";

export const metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await requireRole("STAFF", "/admin");
  const t = await getTranslations("admin");
  const newMessages = await db.contactMessage.count({ where: { status: "NEW" } });
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
    <div className="min-h-screen bg-muted/40">
      <a href="#admin-main" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground">
        {t("skip")}
      </a>
      <AdminSidebar role={user.role} newMessages={newMessages} />
      <div className="lg:ps-64 print:ps-0">
        <header className="no-print sticky top-0 z-20 flex h-16 items-center gap-2 border-b bg-card/90 px-4 backdrop-blur sm:px-6">
          <AdminMobileNav role={user.role} newMessages={newMessages} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="mt-0.5">
              {t(`roles.${user.role}`)}
            </Badge>
          </div>
          <Link href="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted sm:inline-flex">
            <Store className="h-4 w-4" aria-hidden />
            {t("viewStore")}
          </Link>
          <Suspense fallback={null}>
            <LanguageSwitcher className="hover:bg-muted" />
          </Suspense>
          <ThemeToggle className="hover:bg-muted" />
          <form action={logoutAction}>
            <button type="submit" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10" aria-label={t("logout")}>
              <LogOut className="h-4 w-4" aria-hidden />
            </button>
          </form>
        </header>
        <main id="admin-main" className="p-4 sm:p-6 lg:p-8 print:p-0">
          {children}
        </main>
      </div>
    </div>
    </NextIntlClientProvider>
  );
}
