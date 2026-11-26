import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Clock } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TotalsTable } from "@/components/cart/order-summary";
import { ClearCart } from "@/components/checkout/clear-cart";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { loc } from "@/lib/i18n-utils";
import { governorateName, wilayatName } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("confirmation");
  return { title: t("title"), robots: { index: false } };
}

export default async function ConfirmationPage({ params: { locale, orderNumber } }: { params: { locale: string; orderNumber: string } }) {
  setRequestLocale(locale);
  const user = await requireUser(`/checkout/confirmation/${orderNumber}`);
  const order = await db.order.findFirst({ where: { orderNumber, userId: user.id }, include: { items: true } });
  if (!order) notFound();

  const t = await getTranslations("confirmation");
  const paid = order.paymentStatus === "PAID";
  const awaitingCard = order.paymentMethod === "CARD" && !paid;

  return (
    <div className="container max-w-3xl py-10 lg:py-14">
      <ClearCart />
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/15 text-success">
          <CheckCircle2 className="h-9 w-9" aria-hidden />
        </span>
        <h1 className="mt-5 text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle", { name: user.name.split(" ")[0] })}</p>
        <p className="mt-4 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm">
          {t("orderNumber")}
          <span className="font-mono text-base font-bold" dir="ltr" data-testid="order-number">
            {order.orderNumber}
          </span>
        </p>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("payment")}</h2>
          <p className="mt-1 font-semibold">{order.paymentMethod === "CARD" ? t("card") : t("cod")}</p>
          <p className={`mt-1 inline-flex items-center gap-1.5 text-sm ${paid ? "text-success" : "text-warning"}`}>
            {!paid && <Clock className="h-3.5 w-3.5" aria-hidden />}
            {paid ? t("paid") : order.paymentMethod === "COD" ? t("payOnDelivery", { amount: formatOMR(order.total, locale) }) : t("awaitingPayment")}
          </p>
          {awaitingCard && (
            <Button asChild size="sm" className="mt-3">
              <Link href={`/checkout/payment/${order.orderNumber}`}>{t("completePayment")}</Link>
            </Button>
          )}
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="text-sm font-semibold text-muted-foreground">{t("deliverTo")}</h2>
          <p className="mt-1 font-semibold">{order.shipName}</p>
          <p className="text-sm text-muted-foreground">
            {order.building}, {order.street}, {order.area}
            <br />
            {wilayatName(order.governorate, order.wilayat, locale)}, {governorateName(order.governorate, locale)}
          </p>
          <p className="mt-2 text-sm">{order.deliveryMethod === "EXPRESS" ? t("etaExpress") : t("etaStandard")}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border bg-card p-5">
        <h2 className="mb-4 font-semibold">{t("items")}</h2>
        <ul className="mb-4 divide-y text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4 py-2.5">
              <span>
                {loc(locale, i.nameEn, i.nameAr)} <span className="text-muted-foreground">× {i.quantity}</span>
              </span>
              <span className="tabular font-medium">{formatOMR(i.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>
        <TotalsTable totals={{ subtotal: order.subtotal, discount: order.discount, deliveryFee: order.deliveryFee, vat: order.vat, total: order.total }} couponCode={order.couponCode} />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button asChild size="lg">
          <Link href={`/account/orders/${order.orderNumber}`}>{t("track")}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/shop">{t("continue")}</Link>
        </Button>
      </div>
    </div>
  );
}
