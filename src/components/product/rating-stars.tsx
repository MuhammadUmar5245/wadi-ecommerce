import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

// One 5-star row as a single SVG (each star in a 24-unit cell), so a rating
// costs two small SVGs instead of ten icons.
const STAR = "M12 2.5l2.94 5.96 6.56.95-4.75 4.63 1.12 6.54L12 17.5l-5.87 3.08 1.12-6.54L2.5 9.41l6.56-.95z";
function StarRow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 24" className={className} fill="currentColor" aria-hidden focusable="false">
      {[0, 24, 48, 72, 96].map((x) => (
        <path key={x} d={STAR} transform={`translate(${x} 0)`} />
      ))}
    </svg>
  );
}

export function RatingStars({
  value,
  count,
  size = "sm",
  showValue = false,
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  className?: string;
}) {
  const t = useTranslations("product");
  const h = size === "lg" ? "h-5" : size === "md" ? "h-4" : "h-3.5";
  const rounded = Math.round(value * 10) / 10;
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className={cn("relative aspect-[5/1]", h)} role="img" aria-label={t("ratingLabel", { value: rounded.toFixed(1) })}>
        <StarRow className="absolute inset-0 h-full w-full text-muted-foreground/30" />
        {/* Filled portion grows from the inline start, so it mirrors in RTL. */}
        <div className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${pct}%` }}>
          <StarRow className={cn("h-full text-accent", h === "h-5" ? "w-[6.25rem]" : h === "h-4" ? "w-20" : "w-[4.375rem]")} />
        </div>
      </div>
      {showValue && <span className="tabular text-sm font-semibold">{rounded.toFixed(1)}</span>}
      {count != null && <span className="tabular text-xs text-muted-foreground">({t("reviewCount", { count })})</span>}
    </div>
  );
}
