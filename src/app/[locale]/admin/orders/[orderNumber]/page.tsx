import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Printer } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { OrderStatusBadge, OrderTimeline, PaymentStatusBadge } from "@/components/orders/order-status";
import { TotalsTable } from "@/components/cart/order-summary";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { loc } from "@/lib/i18n-utils";
import { governorateName, wilayatName } from "@/lib/constants";
import { noteText } from "@/lib/system-notes";

type Props = { params: { locale: string; orderNumber: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: params.orderNumber };
}

export default async function AdminOrderDetail({ params: { locale, orderNumber } }: Props) {
  setRequestLocale(locale);
  const order = await db.order.findUnique({
    where: { orderNumber },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true } },
      items: true,
      payments: { orderBy: { createdAt: "asc" } },
      history: { orderBy: { createdAt: "asc" }, include: { changedBy: { select: { name: true, role: true } } } },
    },
  });
  if (!order) notFound();
  const t = await getTranslations("admin.orders");
  const ts = await getTranslations("orderStatus");
  const tp = await getTranslations("paymentStatus");
  const tc = await getTranslations("common");
  const tn = await getTranslations("systemNotes");
  const format = await getFormatter();
  const awaitingCard = order.paymentMethod === "CARD" && order.paymentStatus !== "PAID" && order.status === "PLACED";

  return (
    <>
      <Link href="/admin/orders" className="no-print mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl-flip" aria-hidden />
        {t("back")}
      </Link>
      <AdminPageHeader
        title={`${t("order")} ${order.orderNumber}`}
        subtitle={format.dateTime(order.createdAt, { dateStyle: "full", timeStyle: "short" })}
        actions={
          <Button asChild variant="outline">
            <Link href={`/admin/orders/${order.orderNumber}/invoice`}>
              <Printer aria-hidden />
              {t("invoice")}
            </Link>
          </Button>
        }
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Panel title={t("progress")}>
            <OrderTimeline status={order.status} history={order.history} />
          </Panel>
          <Panel title={t("items")}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("product")}</TableHead>
                  <TableHead>{tc("sku")}</TableHead>
                  <TableHead className="text-end">{t("unitPrice")}</TableHead>
                  <TableHead className="text-end">{t("qty")}</TableHead>
                  <TableHead className="text-end">{t("lineTotal")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{loc(locale, i.nameEn, i.nameAr)}</TableCell>
                    <TableCell className="font-mono text-xs" dir="ltr">
                      {i.sku}
                    </TableCell>
                    <TableCell className="tabular text-end">{formatOMR(i.unitPrice, locale)}</TableCell>
                    <TableCell className="tabular text-end">{i.quantity}</TableCell>
                    <TableCell className="tabular text-end font-semibold">{formatOMR(i.lineTotal, locale)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="ms-auto mt-4 max-w-sm border-t pt-4">
              <TotalsTable totals={{ subtotal: order.subtotal, discount: order.discount, deliveryFee: order.deliveryFee, vat: order.vat, total: order.total }} couponCode={order.couponCode} />
            </div>
          </Panel>
          <Panel title={t("history")}>
            <ol className="space-y-3 text-sm">
              {order.history.map((h) => (
                <li key={h.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 border-s-2 border-primary/40 ps-3">
                  <span className="font-semibold">{ts(h.status as "PLACED")}</span>
                  <time className="text-xs text-muted-foreground">{format.dateTime(h.createdAt, { dateStyle: "medium", timeStyle: "short" })}</time>
                  <span className="text-xs text-muted-foreground">{h.changedBy ? `${t("by")} ${h.changedBy.name}` : t("bySystem")}</span>
                  {h.note && <p className="w-full text-xs">{noteText(h.note, tn)}</p>}
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title={t("updateStatus")}>
            <OrderStatusForm orderId={order.id} status={order.status} awaitingCard={awaitingCard} />
          </Panel>
          <Panel title={t("customer")}>
            <Link href={`/admin/customers/${order.user.id}`} className="font-semibold text-primary hover:underline">
              {order.user.name}
            </Link>
            <p className="text-sm text-muted-foreground">{order.user.email}</p>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {order.user.phone}
            </p>
          </Panel>
          <Panel title={t("shipping")}>
            <p className="font-medium">{order.shipName}</p>
            <p className="text-sm" dir="ltr">
              {order.shipPhone}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.building}, {order.street}
              {order.way ? ` · ${order.way}` : ""}, {order.area}, {wilayatName(order.governorate, order.wilayat, locale)}, {governorateName(order.governorate, locale)}
            </p>
            <p className="mt-2 text-sm">{order.deliveryMethod === "EXPRESS" ? t("express") : t("standard")}</p>
            {order.notes && <p className="mt-2 rounded-lg bg-muted p-2 text-xs">{order.notes}</p>}
          </Panel>
          <Panel title={t("payments")}>
            <p className="mb-2 text-sm">{order.paymentMethod === "CARD" ? t("card") : t("cod")}</p>
            <ul className="space-y-2 text-xs">
              {order.payments.map((p) => (
                <li key={p.id} className="rounded-lg bg-muted/60 p-2.5">
                  <div className="flex justify-between gap-2">
                    <span className="font-mono" dir="ltr">
                      {p.reference}
                    </span>
                    <span className="font-semibold">{tp(p.status as "PENDING")}</span>
                  </div>
                  <div className="mt-1 flex justify-between gap-2 text-muted-foreground">
                    <span>
                      {format.dateTime(p.createdAt, { dateStyle: "short", timeStyle: "short" })}
                      {p.cardLast4 ? ` · •••• ${p.cardLast4}` : ""}
                    </span>
                    <span className="tabular">{formatOMR(p.amount, locale)}</span>
                  </div>
                  {p.failureReason && <p className="mt-1 text-destructive">{t(`failure.${p.failureReason}` as "failure.card_declined")}</p>}
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>
    </>
  );
}
