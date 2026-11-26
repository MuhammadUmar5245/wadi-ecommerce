import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Banknote, FlaskConical, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaymentForm } from "@/components/checkout/payment-form";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { switchToCodAction } from "@/server/checkout-actions";
import { ClearCart } from "@/components/checkout/clear-cart";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("payment");
  return { title: t("title"), robots: { index: false } };
}

export default async function PaymentPage({ params: { locale, orderNumber } }: { params: { locale: string; orderNumber: string } }) {
  setRequestLocale(locale);
  const user = await requireUser(`/checkout/payment/${orderNumber}`);
  const order = await db.order.findFirst({
    where: { orderNumber, userId: user.id },
    include: { payments: { where: { status: "FAILED" }, orderBy: { createdAt: "desc" }, take: 1 } },
  });
  if (!order) notFound();
  if (order.paymentMethod !== "CARD" || order.paymentStatus === "PAID" || order.status === "CANCELLED") {
    redirect(`/${locale}/checkout/confirmation/${orderNumber}`);
  }

  const t = await getTranslations("payment");
  const amount = formatOMR(order.total, locale);

  return (
    <div className="container max-w-xl py-8 lg:py-12">
      <ClearCart />
      <div className="mb-6 flex items-start gap-3 rounded-2xl border-2 border-dashed border-warning/60 bg-warning/10 p-4" role="note">
        <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-warning" aria-hidden />
        <div>
          <p className="font-bold text-warning">{t("demoBanner")}</p>
          <p className="mt-0.5 text-sm text-foreground/80">{t("demoBody")}</p>
        </div>
      </div>

      <div className="rounded-3xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-muted/60 p-4 text-sm">
          <div>
            <dt className="text-muted-foreground">{t("order")}</dt>
            <dd className="font-mono font-semibold" dir="ltr">
              {order.orderNumber}
            </dd>
          </div>
          <div className="text-end">
            <dt className="text-muted-foreground">{t("amountDue")}</dt>
            <dd className="tabular text-lg font-bold">{amount}</dd>
          </div>
        </dl>

        {order.paymentStatus === "FAILED" && order.payments[0] && (
          <p className="mt-4 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive" role="status">
            {t("previousFailed", { last4: order.payments[0].cardLast4 ?? "••••" })}
          </p>
        )}

        <div className="mt-6">
          <PaymentForm orderNumber={order.orderNumber} amountLabel={amount} />
        </div>

        <div className="mt-6 rounded-xl border p-4 text-xs leading-relaxed text-muted-foreground">
          <p className="mb-1 font-semibold text-foreground">{t("testCards")}</p>
          <p dir="ltr" className="font-mono">4242 4242 4242 4242 — {t("succeeds")}</p>
          <p dir="ltr" className="font-mono">4000 0000 0000 0002 — {t("declined")}</p>
          <p className="mt-1">{t("anyExpiry")}</p>
        </div>

        <form action={switchToCodAction} className="mt-6 border-t pt-6 text-center">
          <input type="hidden" name="orderNumber" value={order.orderNumber} />
          <p className="mb-3 text-sm text-muted-foreground">{t("preferCod")}</p>
          <Button type="submit" variant="outline">
            <Banknote aria-hidden />
            {t("switchCod")}
          </Button>
        </form>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t("privacyNote")}
        </p>
      </div>
    </div>
  );
}
