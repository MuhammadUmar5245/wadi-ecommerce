import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Banknote, ShoppingCart, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, KpiCard, Panel } from "@/components/admin/ui";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { governorateName, wilayatName } from "@/lib/constants";

type Props = { params: { locale: string; id: string } };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("customers") };
}

export default async function AdminCustomer({ params: { locale, id } }: Props) {
  setRequestLocale(locale);
  const user = await db.user.findUnique({
    where: { id },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      orders: { orderBy: { createdAt: "desc" } },
      _count: { select: { reviews: true, wishlist: true } },
    },
  });
  if (!user) notFound();
  const t = await getTranslations("admin.customers");
  const format = await getFormatter();
  const live = user.orders.filter((o) => o.status !== "CANCELLED");
  const spent = live.reduce((s, o) => s + o.total, 0);

  return (
    <>
      <Link href="/admin/customers" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl-flip" aria-hidden />
        {t("back")}
      </Link>
      <AdminPageHeader title={user.name} subtitle={`${user.email} · ${user.phone}`} />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard label={t("orders")} value={String(user.orders.length)} icon={ShoppingCart} />
        <KpiCard label={t("spent")} value={formatOMR(spent, locale)} icon={Banknote} hint={t("aov", { value: formatOMR(live.length ? Math.round(spent / live.length) : 0, locale) })} />
        <KpiCard label={t("reviews")} value={String(user._count.reviews)} icon={Star} hint={t("wishlist", { count: user._count.wishlist })} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title={t("orderHistory")} className="xl:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("order")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-end">{t("total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {user.orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold text-primary hover:underline" dir="ltr">
                      {o.orderNumber}
                    </Link>
                    <p className="text-xs text-muted-foreground">{format.dateTime(o.createdAt, { dateStyle: "medium" })}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-end font-semibold">{formatOMR(o.total, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        <Panel title={t("addresses")}>
          <ul className="space-y-3 text-sm">
            {user.addresses.map((a) => (
              <li key={a.id} className="rounded-xl bg-muted/50 p-3">
                <p className="font-medium">{a.label}</p>
                <p className="text-muted-foreground">
                  {a.building}, {a.street}, {a.area}, {wilayatName(a.governorate, a.wilayat, locale)}, {governorateName(a.governorate, locale)}
                </p>
              </li>
            ))}
            {user.addresses.length === 0 && <li className="text-muted-foreground">—</li>}
          </ul>
        </Panel>
      </div>
    </>
  );
}
