import { useLocale, useTranslations } from "next-intl";
import { formatOMR } from "@/lib/money";
import { cn } from "@/lib/utils";

export function Price({
  amount,
  compareAt,
  size = "md",
  className,
}: {
  amount: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("product");
  const onSale = compareAt != null && compareAt > amount;
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5", className)}>
      <span
        className={cn(
          "tabular whitespace-nowrap font-bold text-foreground",
          size === "sm" && "text-sm",
          size === "md" && "text-base",
          size === "lg" && "text-3xl"
        )}
      >
        {formatOMR(amount, locale)}
      </span>
      {onSale && (
        <>
          <span className="sr-only">{t("wasPrice")}</span>
          <s className={cn("tabular text-muted-foreground", size === "lg" ? "text-base" : "text-xs")}>{formatOMR(compareAt, locale)}</s>
        </>
      )}
    </div>
  );
}

export function discountPercent(price: number, compareAt: number | null | undefined) {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}
