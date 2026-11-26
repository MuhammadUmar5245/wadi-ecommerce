import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

function pageList(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: (number | "…")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

/** Link-based pagination that preserves the current query string. */
export function Pagination({
  page,
  pages,
  pathname,
  searchParams,
}: {
  page: number;
  pages: number;
  pathname: string;
  searchParams: Record<string, string | undefined>;
}) {
  const t = useTranslations("common");
  if (pages <= 1) return null;

  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) if (v && k !== "page") qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return `${pathname}${s ? `?${s}` : ""}`;
  };
  const base = "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium";

  return (
    <nav aria-label={t("pagination")} className="mt-10 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={href(page - 1)} className={cn(base, "gap-1 hover:bg-muted")} rel="prev">
          <ChevronLeft className="h-4 w-4 rtl-flip" aria-hidden />
          {t("previous")}
        </Link>
      ) : (
        <span className={cn(base, "gap-1 opacity-40")} aria-disabled>
          <ChevronLeft className="h-4 w-4 rtl-flip" aria-hidden />
          {t("previous")}
        </span>
      )}
      {pageList(page, pages).map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            aria-current={p === page ? "page" : undefined}
            aria-label={t("pageN", { n: p })}
            className={cn(base, p === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
          >
            {p}
          </Link>
        )
      )}
      {page < pages ? (
        <Link href={href(page + 1)} className={cn(base, "gap-1 hover:bg-muted")} rel="next">
          {t("next")}
          <ChevronRight className="h-4 w-4 rtl-flip" aria-hidden />
        </Link>
      ) : (
        <span className={cn(base, "gap-1 opacity-40")} aria-disabled>
          {t("next")}
          <ChevronRight className="h-4 w-4 rtl-flip" aria-hidden />
        </span>
      )}
    </nav>
  );
}
