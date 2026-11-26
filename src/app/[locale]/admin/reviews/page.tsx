import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Eye, EyeOff, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader, FilterBar, FilterSelect } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/misc";
import { RatingStars } from "@/components/product/rating-stars";
import { deleteReviewAction, setReviewStatusAction } from "@/server/admin/actions";
import { db } from "@/lib/db";
import { loc } from "@/lib/i18n-utils";

type SP = Record<string, string | undefined>;
const PER_PAGE = 15;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("reviews") };
}

export default async function AdminReviews({ params: { locale }, searchParams: sp }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.reviews");
  const ta = await getTranslations("admin");
  const format = await getFormatter();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.ReviewWhereInput = {};
  if (sp.status === "PUBLISHED" || sp.status === "HIDDEN") where.status = sp.status;
  if (sp.rating && /^[1-5]$/.test(sp.rating)) where.rating = Number(sp.rating);
  if (sp.q) where.OR = [{ comment: { contains: sp.q } }, { title: { contains: sp.q } }, { product: { nameEn: { contains: sp.q } } }, { user: { name: { contains: sp.q } } }];

  const [total, reviews] = await Promise.all([
    db.review.count({ where }),
    db.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { user: { select: { name: true, email: true } }, product: { select: { slug: true, nameEn: true, nameAr: true } } },
    }),
  ]);

  return (
    <>
      <AdminPageHeader title={ta("nav.reviews")} subtitle={t("count", { count: total })} />
      <FilterBar q={sp.q} placeholder={t("searchPlaceholder")}>
        <FilterSelect
          name="status"
          label={t("status")}
          value={sp.status}
          options={[
            { value: "", label: ta("all") },
            { value: "PUBLISHED", label: t("published") },
            { value: "HIDDEN", label: t("hidden") },
          ]}
        />
        <FilterSelect name="rating" label={t("rating")} value={sp.rating} options={[{ value: "", label: ta("all") }, ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: "★".repeat(n) }))]} />
      </FilterBar>
      {reviews.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <RatingStars value={r.rating} />
                    {r.status === "PUBLISHED" ? <Badge variant="success">{t("published")}</Badge> : <Badge variant="outline">{t("hidden")}</Badge>}
                  </div>
                  <Link href={`/product/${r.product.slug}`} target="_blank" className="mt-1 block text-sm font-semibold text-primary hover:underline">
                    {loc(locale, r.product.nameEn, r.product.nameAr)}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {r.user.name} · {r.user.email} · {format.dateTime(r.createdAt, { dateStyle: "medium" })}
                  </p>
                </div>
                <div className="flex gap-2">
                  {r.status === "PUBLISHED" ? (
                    <ActionButton size="sm" variant="outline" action={setReviewStatusAction.bind(null, r.id, "HIDDEN")}>
                      <EyeOff aria-hidden />
                      {t("hide")}
                    </ActionButton>
                  ) : (
                    <ActionButton size="sm" variant="outline" action={setReviewStatusAction.bind(null, r.id, "PUBLISHED")}>
                      <Eye aria-hidden />
                      {t("publish")}
                    </ActionButton>
                  )}
                  <ActionButton size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10" confirm={t("confirmDelete")} action={deleteReviewAction.bind(null, r.id)}>
                    <Trash2 aria-hidden />
                    {t("delete")}
                  </ActionButton>
                </div>
              </div>
              {r.title && (
                <p className="mt-3 font-medium" dir="auto">
                  {r.title}
                </p>
              )}
              <p className="mt-1 text-sm text-muted-foreground" dir="auto">
                {r.comment}
              </p>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} pathname="/admin/reviews" searchParams={sp} />
    </>
  );
}
