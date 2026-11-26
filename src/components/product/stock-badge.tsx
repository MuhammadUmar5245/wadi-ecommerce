import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";

export type StockLevel = "in" | "low" | "out";

export function stockLevel(stock: number, threshold = 5): StockLevel {
  if (stock <= 0) return "out";
  if (stock <= threshold) return "low";
  return "in";
}

export function StockBadge({ stock, threshold = 5, className }: { stock: number; threshold?: number; className?: string }) {
  const t = useTranslations("product");
  const level = stockLevel(stock, threshold);
  if (level === "out")
    return (
      <Badge variant="destructive" className={className}>
        {t("outOfStock")}
      </Badge>
    );
  if (level === "low")
    return (
      <Badge variant="warning" className={className}>
        {t("lowStock", { count: stock })}
      </Badge>
    );
  return (
    <Badge variant="success" className={className}>
      {t("inStock")}
    </Badge>
  );
}
