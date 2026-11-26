"use client";

import { useLocale, useTranslations } from "next-intl";
import { formatOMR } from "@/lib/money";
import type { Totals } from "@/lib/pricing";
import { VAT_RATE_PERCENT } from "@/lib/constants";

export function TotalsTable({ totals, couponCode, estimate = false }: { totals: Totals; couponCode?: string | null; estimate?: boolean }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const row = "flex items-center justify-between gap-4";
  return (
    <dl className="space-y-2.5 text-sm">
      <div className={row}>
        <dt className="text-muted-foreground">{t("subtotal")}</dt>
        <dd className="tabular font-medium">{formatOMR(totals.subtotal, locale)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className={row}>
          <dt className="text-success">{couponCode ? t("discountCode", { code: couponCode }) : t("discount")}</dt>
          <dd className="tabular font-medium text-success">−{formatOMR(totals.discount, locale)}</dd>
        </div>
      )}
      <div className={row}>
        <dt className="text-muted-foreground">{estimate ? t("deliveryEstimate") : t("delivery")}</dt>
        <dd className="tabular font-medium">{totals.deliveryFee === 0 ? t("free") : formatOMR(totals.deliveryFee, locale)}</dd>
      </div>
      <div className={row}>
        <dt className="text-muted-foreground">{t("vat", { rate: VAT_RATE_PERCENT })}</dt>
        <dd className="tabular font-medium">{formatOMR(totals.vat, locale)}</dd>
      </div>
      <div className={`${row} border-t pt-3 text-base`}>
        <dt className="font-semibold">{estimate ? t("estimatedTotal") : t("total")}</dt>
        <dd className="tabular text-lg font-bold">{formatOMR(totals.total, locale)}</dd>
      </div>
    </dl>
  );
}
