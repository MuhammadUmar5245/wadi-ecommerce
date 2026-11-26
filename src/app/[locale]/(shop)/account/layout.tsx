import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { AccountNav } from "@/components/account/account-nav";
import { ScopedMessages } from "@/components/scoped-messages";

export default async function AccountLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await requireUser("/account");
  const t = await getTranslations("account");
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <ScopedMessages namespaces={["account", "orders", "addresses", "address", "auth", "reviews"]}>
    <div className="container py-8 lg:py-10">
      <div className="mb-6 flex items-center gap-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-bold text-primary-foreground" aria-hidden>
          {user.name
            .split(" ")
            .map((p) => p[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </span>
        <div>
          <p className="text-sm text-muted-foreground">{t("greeting", { name: user.name.split(" ")[0] })}</p>
          <p className="text-lg font-semibold">{user.email}</p>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        <AccountNav unread={unread} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
    </ScopedMessages>
  );
}
