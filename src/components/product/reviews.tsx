import { useFormatter, useTranslations } from "next-intl";
import { RatingStars } from "./rating-stars";

type Summary = { total: number; avg: number; breakdown: { star: number; count: number }[] };
type Review = { id: string; rating: number; title: string | null; comment: string; createdAt: Date; user: { name: string } };

export function ReviewSummary({ summary }: { summary: Summary }) {
  const t = useTranslations("product");
  return (
    <div className="rounded-2xl border bg-card p-6">
      <div className="flex items-end gap-3">
        <span className="tabular text-5xl font-bold">{summary.avg.toFixed(1)}</span>
        <div className="pb-1.5">
          <RatingStars value={summary.avg} size="md" />
          <p className="mt-1 text-xs text-muted-foreground">{t("basedOn", { count: summary.total })}</p>
        </div>
      </div>
      <ul className="mt-6 space-y-2" aria-label={t("ratingBreakdown")}>
        {summary.breakdown.map((b) => {
          const pct = summary.total ? Math.round((b.count / summary.total) * 100) : 0;
          return (
            <li key={b.star} className="flex items-center gap-3 text-sm">
              <span className="tabular w-12 shrink-0">{t("stars", { count: b.star })}</span>
              <div
                className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t("starShare", { count: b.star, percent: pct })}
              >
                <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
              </div>
              <span className="tabular w-8 shrink-0 text-end text-muted-foreground">{b.count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReviewList({ reviews }: { reviews: Review[] }) {
  const t = useTranslations("product");
  const format = useFormatter();
  if (reviews.length === 0) return <p className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("noReviewsBody")}</p>;
  return (
    <ul className="space-y-4">
      {reviews.map((r) => (
        <li key={r.id} className="rounded-2xl border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <RatingStars value={r.rating} />
            <time className="text-xs text-muted-foreground" dateTime={r.createdAt.toISOString()}>
              {format.dateTime(r.createdAt, { dateStyle: "medium" })}
            </time>
          </div>
          {r.title && <h3 className="mt-2 font-semibold">{r.title}</h3>}
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground" dir="auto">
            {r.comment}
          </p>
          <p className="mt-3 text-xs font-medium">
            {r.user.name.split(" ")[0]} {r.user.name.split(" ").slice(-1)[0]?.[0]}. · <span className="text-success">{t("verifiedPurchase")}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
