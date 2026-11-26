"use client";

import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/common/misc";
import { useCart } from "@/stores/cart";
import { computeTotals } from "@/lib/pricing";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import { formatOMR } from "@/lib/money";

import { CartLinesList } from "./cart-drawer";
import { useCartLines, useHydrated } from "./cart-hooks";
import { TotalsTable } from "./order-summary";

export function CartView() {
  const t = useTranslations("cart");
  const locale = useLocale();
  const hydrated = useHydrated();
  const items = useCart((s) => s.items);
  const { subtotal, loading } = useCartLines();

  if (!hydrated) return <Skeleton className="h-64 rounded-2xl" />;
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ShoppingBag}
        title={t("emptyTitle")}
        body={t("emptyBody")}
        action={
          <Button asChild>
            <Link href="/shop">{t("startShopping")}</Link>
          </Button>
        }
      />
    );
  }

  const totals = computeTotals({ subtotal, deliveryMethod: "STANDARD" });
  const remaining = FREE_DELIVERY_THRESHOLD - subtotal;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-label={t("title")}>
        <CartLinesList />
      </section>
      <aside className="h-fit space-y-4 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-32">
        <h2 className="text-lg font-semibold">{t("summary")}</h2>
        {remaining > 0 ? (
          <p className="rounded-xl bg-secondary px-3 py-2.5 text-sm text-secondary-foreground">
            {t("freeDeliveryHint", { amount: formatOMR(remaining, locale) })}
          </p>
        ) : (
          <p className="rounded-xl bg-success/10 px-3 py-2.5 text-sm font-medium text-success">{t("freeDeliveryUnlocked")}</p>
        )}
        <div className={loading ? "opacity-60 transition-opacity" : undefined}>
          <TotalsTable totals={totals} estimate />
        </div>
        <p className="text-xs text-muted-foreground">{t("couponAtCheckout")}</p>
        <Button asChild size="lg" className="w-full">
          <Link href="/checkout">
            {t("checkout")}
            <ArrowRight className="rtl-flip" aria-hidden />
          </Link>
        </Button>
        <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
          {t("secureNote")}
        </p>
      </aside>
    </div>
  );
}
