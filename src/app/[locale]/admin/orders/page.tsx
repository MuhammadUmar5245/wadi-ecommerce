import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar, FilterDate, FilterSelect } from "@/components/admin/ui";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/misc";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { ORDER_STATUSES, PAYMENT_STATUSES, governorateName } from "@/lib/constants";
import { muscatDayStart, addDays } from "@/lib/dates";

type SP = Record<string, string | undefined>;
const PER_PAGE = 20;
const KEY = /^\d{4}-\d{2}-\d{2}$/;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("orders") };
}

export default async function AdminOrders({ params: { locale }, searchParams: sp }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.orders");
  const ta = await getTranslations("admin");
  const ts = await getTranslations("orderStatus");
  const tp = await getTranslations("paymentStatus");
  const format = await getFormatter();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.OrderWhereInput = {};
  if (sp.q) {
    const q = sp.q.trim();
    where.OR = [{ orderNumber: { contains: q.toUpperCase() } }, { shipName: { contains: q } }, { shipPhone: { contains: q } }, { user: { email: { contains: q.toLowerCase() } } }];
  }
  if (sp.status && (ORDER_STATUSES as readonly string[]).includes(sp.status)) where.status = sp.status;
  if (sp.payment && (PAYMENT_STATUSES as readonly string[]).includes(sp.payment)) where.paymentStatus = sp.payment;
  if (sp.method === "CARD" || sp.method === "COD") where.paymentMethod = sp.method;
  const created: Prisma.DateTimeFilter = {};
  if (sp.from && KEY.test(sp.from)) created.gte = muscatDayStart(sp.from);
  if (sp.to && KEY.test(sp.to)) created.lt = muscatDayStart(addDays(sp.to, 1));
  if (created.gte || created.lt) where.createdAt = created;

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { email: true } }, _count: { select: { items: true } } },
    }),
  ]);

  return (
    <>
      <AdminPageHeader title={ta("nav.orders")} subtitle={t("count", { count: total })} />
      <FilterBar q={sp.q} placeholder={t("searchPlaceholder")}>
        <FilterSelect name="status" label={t("status")} value={sp.status} options={[{ value: "", label: ta("all") }, ...ORDER_STATUSES.map((s) => ({ value: s, label: ts(s) }))]} />
        <FilterSelect name="payment" label={t("payment")} value={sp.payment} options={[{ value: "", label: ta("all") }, ...PAYMENT_STATUSES.map((s) => ({ value: s, label: tp(s) }))]} />
        <FilterSelect
          name="method"
          label={t("method")}
          value={sp.method}
          options={[
            { value: "", label: ta("all") },
            { value: "CARD", label: t("card") },
            { value: "COD", label: t("cod") },
          ]}
        />
        <FilterDate name="from" label={ta("from")} value={sp.from} />
        <FilterDate name="to" label={ta("to")} value={sp.to} />
      </FilterBar>

      {orders.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("order")}</TableHead>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("destination")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("payment")}</TableHead>
                <TableHead className="text-end">{t("total")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <Link href={`/admin/orders/${o.orderNumber}`} className="font-mono font-semibold text-primary hover:underline" dir="ltr">
                      {o.orderNumber}
                    </Link>
                    <p className="whitespace-nowrap text-xs text-muted-foreground">{format.dateTime(o.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{o.shipName}</p>
                    <p className="text-xs text-muted-foreground">{o.user.email}</p>
                  </TableCell>
                  <TableCell className="text-sm">{governorateName(o.governorate, locale)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <PaymentStatusBadge status={o.paymentStatus} />
                      <span className="text-xs text-muted-foreground">{o.paymentMethod === "CARD" ? t("card") : t("cod")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="tabular whitespace-nowrap text-end font-semibold">{formatOMR(o.total, locale)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} pathname="/admin/orders" searchParams={sp} />
    </>
  );
}
