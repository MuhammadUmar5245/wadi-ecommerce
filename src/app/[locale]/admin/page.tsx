import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { AlertTriangle, Banknote, Receipt, ShoppingCart, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, KpiCard, Panel } from "@/components/admin/ui";
import { DonutChart, RankedBarChart, SalesTrendChart } from "@/components/admin/charts";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status";
import { getDashboard } from "@/server/admin/dashboard";
import { formatOMR } from "@/lib/money";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("dashboard") };
}

export default async function AdminDashboard({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.dashboard");
  const ts = await getTranslations("orderStatus");
  const format = await getFormatter();
  const d = await getDashboard(locale);
  const change = d.kpis.revenueChange;

  return (
    <>
      <AdminPageHeader title={t("title")} subtitle={t("subtitle")} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label={t("revenue30")}
          value={formatOMR(d.kpis.revenue, locale)}
          icon={Banknote}
          hint={
            change != null && (
              <span className={`inline-flex items-center gap-1 font-medium ${change >= 0 ? "text-success" : "text-destructive"}`}>
                {change >= 0 ? <TrendingUp className="h-3.5 w-3.5" aria-hidden /> : <TrendingDown className="h-3.5 w-3.5" aria-hidden />}
                {t("vsPrevious", { pct: format.number(change, { style: "percent", maximumFractionDigits: 1, signDisplay: "always" }) })}
              </span>
            )
          }
        />
        <KpiCard label={t("orders30")} value={String(d.kpis.orders)} icon={ShoppingCart} hint={t("ordersHint")} />
        <KpiCard label={t("aov")} value={formatOMR(d.kpis.aov, locale)} icon={Receipt} hint={t("aovHint")} />
        <KpiCard label={t("customers")} value={String(d.kpis.customers)} icon={Users} hint={t("newCustomers", { count: d.kpis.newCustomers })} />
        <KpiCard
          label={t("lowStock")}
          value={String(d.kpis.lowStock)}
          icon={AlertTriangle}
          tone="warning"
          hint={
            <Link href="/admin/inventory?stock=low" className="font-medium text-primary hover:underline">
              {t("outOfStock", { count: d.kpis.outOfStock })}
            </Link>
          }
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Panel title={t("salesTrend")} className="xl:col-span-2">
          <SalesTrendChart data={d.daily} />
        </Panel>
        <Panel title={t("byStatus")}>
          <DonutChart data={d.statusCounts.filter((s) => s.count > 0).map((s) => ({ key: s.status, label: ts(s.status), value: s.count }))} />
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Panel title={t("topProducts")} className="xl:col-span-2">
          {d.topProducts.length ? (
            <RankedBarChart data={d.topProducts.map((p) => ({ name: p.name, value: p.revenue }))} />
          ) : (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          )}
        </Panel>
        <Panel
          title={t("recentOrders")}
          className="xl:col-span-3"
          actions={
            <Link href="/admin/orders" className="text-sm font-medium text-primary hover:underline">
              {t("viewAll")}
            </Link>
          }
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("order")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead className="text-end">{t("total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {d.recent.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold text-primary hover:underline" dir="ltr">
                      {o.orderNumber}
                    </Link>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">{format.dateTime(o.createdAt, { dateStyle: "medium" })}</p>
                  </TableCell>
                  <TableCell>{o.shipName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <OrderStatusBadge status={o.status} />
                      <PaymentStatusBadge status={o.paymentStatus} />
                    </div>
                  </TableCell>
                  <TableCell className="tabular whitespace-nowrap text-end font-semibold">{formatOMR(o.total, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
