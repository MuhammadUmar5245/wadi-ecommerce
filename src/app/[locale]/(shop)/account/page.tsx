import type { Metadata } from "next";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Bell, Heart, Package, PartyPopper, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/misc";
import { OrderList } from "@/components/account/order-list";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { governorateName, wilayatName } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("dashboard") };
}

export default async function AccountDashboard({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { welcome?: string } }) {
  setRequestLocale(locale);
  const user = await requireUser("/account");
  const t = await getTranslations("account");
  const loc = await getLocale();

  const [orderCount, active, wishlist, unread, recent, address] = await Promise.all([
    db.order.count({ where: { userId: user.id } }),
    db.order.count({ where: { userId: user.id, status: { in: ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"] } } }),
    db.wishlistItem.count({ where: { userId: user.id } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.order.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true, createdAt: true, _count: { select: { items: true } } },
    }),
    db.address.findFirst({ where: { userId: user.id }, orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] }),
  ]);

  const stats = [
    { href: "/account/orders", icon: Package, value: orderCount, label: t("statOrders") },
    { href: "/account/orders?filter=active", icon: Truck, value: active, label: t("statActive") },
    { href: "/account/wishlist", icon: Heart, value: wishlist, label: t("statWishlist") },
    { href: "/account/notifications", icon: Bell, value: unread, label: t("statUnread") },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("dashboard")}</h1>
      {searchParams.welcome && (
        <div className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 p-4 text-success" role="status">
          <PartyPopper className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t("welcomeTitle")}</p>
            <p className="text-sm text-foreground/80">{t("welcomeBody")}</p>
          </div>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map(({ href, icon: Icon, value, label }) => (
          <li key={label}>
            <Link href={href} className="block rounded-2xl border bg-card p-5 transition-shadow hover:shadow-md">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <p className="tabular mt-3 text-3xl font-bold">{value}</p>
              <p className="text-sm text-muted-foreground">{label}</p>
            </Link>
          </li>
        ))}
      </ul>

      <section aria-labelledby="recent-orders">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="recent-orders" className="text-lg font-semibold">
            {t("recentOrders")}
          </h2>
          {orderCount > 0 && (
            <Link href="/account/orders" className="text-sm font-medium text-primary hover:underline">
              {t("viewAllOrders")}
            </Link>
          )}
        </div>
        {recent.length ? (
          <OrderList orders={recent} />
        ) : (
          <EmptyState
            icon={Package}
            title={t("noOrdersTitle")}
            body={t("noOrdersBody")}
            action={
              <Button asChild>
                <Link href="/shop">{t("startShopping")}</Link>
              </Button>
            }
          />
        )}
      </section>

      <section aria-labelledby="default-address" className="rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 id="default-address" className="font-semibold">
            {t("defaultAddress")}
          </h2>
          <Link href="/account/addresses" className="text-sm font-medium text-primary hover:underline">
            {t("manage")}
          </Link>
        </div>
        {address ? (
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{address.fullName}</span> · <span dir="ltr">{address.phone}</span>
            <br />
            {address.building}, {address.street}, {address.area}, {wilayatName(address.governorate, address.wilayat, loc)}, {governorateName(address.governorate, loc)}
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("noAddress")}</p>
        )}
      </section>
    </div>
  );
}
