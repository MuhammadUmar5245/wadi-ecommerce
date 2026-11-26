import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, CreditCard, MapPin, MessageSquarePlus, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge, OrderTimeline, PaymentStatusBadge } from "@/components/orders/order-status";
import { TotalsTable } from "@/components/cart/order-summary";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { loc } from "@/lib/i18n-utils";
import { CUSTOMER_CANCELLABLE, governorateName, wilayatName, type OrderStatus } from "@/lib/constants";

type Props = { params: { locale: string; orderNumber: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("orders");
  return { title: t("orderTitle", { number: params.orderNumber }) };
}

export default async function OrderDetailPage({ params: { locale, orderNumber } }: Props) {
  setRequestLocale(locale);
  const user = await requireUser(`/account/orders/${orderNumber}`);
  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: {
      items: { include: { product: { select: { slug: true, images: { orderBy: { sortOrder: "asc" }, take: 1 } } } } },
      history: { orderBy: { createdAt: "asc" } },
      payments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const t = await getTranslations("orders");
  const tp = await getTranslations("paymentStatus");
  const format = await getFormatter();
  const reviewed = new Set(
    (await db.review.findMany({ where: { userId: user.id, productId: { in: order.items.map((i) => i.productId) } }, select: { productId: true } })).map((r) => r.productId)
  );
  const canCancel = CUSTOMER_CANCELLABLE.includes(order.status as OrderStatus);
  const canPay = order.paymentMethod === "CARD" && ["PENDING", "FAILED"].includes(order.paymentStatus) && order.status !== "CANCELLED";

  return (
    <div className="space-y-6">
      <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl-flip" aria-hidden />
        {t("backToOrders")}
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            {t("orderLabel")}{" "}
            <span className="font-mono" dir="ltr">
              {order.orderNumber}
            </span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("placedOn", { date: format.dateTime(order.createdAt, { dateStyle: "long", timeStyle: "short" }) })}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <PaymentStatusBadge status={order.paymentStatus} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPay && (
            <Button asChild>
              <Link href={`/checkout/payment/${order.orderNumber}`}>
                <CreditCard aria-hidden />
                {t("payNow")}
              </Link>
            </Button>
          )}
          {canCancel && <CancelOrderButton orderNumber={order.orderNumber} refundNote={order.paymentStatus === "PAID"} />}
        </div>
      </div>

      <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby="tracking">
        <h2 id="tracking" className="mb-6 font-semibold">
          {t("tracking")}
        </h2>
        <OrderTimeline status={order.status} history={order.history} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby="items">
          <h2 id="items" className="mb-4 font-semibold">
            {t("items")}
          </h2>
          <ul className="divide-y">
            {order.items.map((i) => {
              const canReview = order.status === "DELIVERED" && !reviewed.has(i.productId);
              return (
                <li key={i.id} className="flex flex-wrap items-center gap-4 py-3 first:pt-0">
                  <Link href={`/product/${i.product.slug}`} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border bg-muted">
                    <Image src={i.product.images[0]?.url ?? "/images/placeholder.svg"} alt="" fill unoptimized sizes="64px" className="object-cover" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/product/${i.product.slug}`} className="text-sm font-semibold hover:text-primary">
                      {loc(locale, i.nameEn, i.nameAr)}
                    </Link>
                    <p className="tabular text-xs text-muted-foreground">
                      {formatOMR(i.unitPrice, locale)} × {i.quantity}
                    </p>
                    {canReview && (
                      <Link href={`/product/${i.product.slug}#write-review`} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                        <MessageSquarePlus className="h-3.5 w-3.5" aria-hidden />
                        {t("writeReview")}
                      </Link>
                    )}
                    {order.status === "DELIVERED" && reviewed.has(i.productId) && (
                      <p className="mt-1 inline-flex items-center gap-1 text-xs text-success">
                        <Star className="h-3.5 w-3.5" fill="currentColor" strokeWidth={0} aria-hidden />
                        {t("reviewed")}
                      </p>
                    )}
                  </div>
                  <span className="tabular font-semibold">{formatOMR(i.lineTotal, locale)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-4 border-t pt-4">
            <TotalsTable
              totals={{ subtotal: order.subtotal, discount: order.discount, deliveryFee: order.deliveryFee, vat: order.vat, total: order.total }}
              couponCode={order.couponCode}
            />
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-2xl border bg-card p-5" aria-labelledby="ship">
            <h2 id="ship" className="mb-2 flex items-center gap-2 font-semibold">
              <MapPin className="h-4 w-4 text-primary" aria-hidden />
              {t("deliveryAddress")}
            </h2>
            <p className="text-sm">
              <span className="font-medium">{order.shipName}</span> · <span dir="ltr">{order.shipPhone}</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {order.building}, {order.street}
              {order.way ? `, ${t("way")} ${order.way}` : ""}, {order.area}
              <br />
              {wilayatName(order.governorate, order.wilayat, locale)}, {governorateName(order.governorate, locale)}
            </p>
            <p className="mt-2 text-sm">{order.deliveryMethod === "EXPRESS" ? t("express") : t("standard")}</p>
            {order.notes && <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs">{order.notes}</p>}
          </section>

          <section className="rounded-2xl border bg-card p-5" aria-labelledby="pay">
            <h2 id="pay" className="mb-2 flex items-center gap-2 font-semibold">
              <CreditCard className="h-4 w-4 text-primary" aria-hidden />
              {t("payment")}
            </h2>
            <p className="text-sm">{order.paymentMethod === "CARD" ? t("card") : t("cod")}</p>
            <ul className="mt-3 space-y-2 text-xs">
              {order.payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-2.5 py-2">
                  <span>
                    {format.dateTime(p.createdAt, { dateStyle: "short", timeStyle: "short" })}
                    {p.cardLast4 && (
                      <span className="ms-1.5 font-mono" dir="ltr">
                        •••• {p.cardLast4}
                      </span>
                    )}
                  </span>
                  <span className="font-medium">{tp(p.status as "PENDING")}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
