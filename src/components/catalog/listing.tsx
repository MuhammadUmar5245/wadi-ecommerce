import { getLocale, getTranslations } from "next-intl/server";
import { SlidersHorizontal, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/misc";
import { Pagination } from "@/components/common/pagination";
import { ProductCard, ProductGrid } from "@/components/product/product-card";
import { ProductCardActions } from "@/components/product/product-card-actions";
import { getCategories, listProducts, type ListingParams } from "@/server/catalog";
import { Filters, SortSelect } from "./filters";

/** Shared results view for Shop, Category and Search pages. */
export async function CatalogListing({
  params,
  rawParams,
  pathname,
  lockedCategory,
}: {
  params: ListingParams;
  rawParams: Record<string, string | undefined>;
  pathname: string;
  lockedCategory?: string;
}) {
  const locale = await getLocale();
  const t = await getTranslations("catalog");
  const [categories, result] = await Promise.all([
    getCategories(locale),
    listProducts({ ...params, category: lockedCategory ?? params.category }, locale),
  ]);

  const values = {
    q: params.q,
    category: params.category,
    min: rawParams.min,
    max: rawParams.max,
    inStock: params.inStock,
    rating: params.rating ? String(params.rating) : undefined,
    sort: params.sort !== "newest" ? params.sort : undefined,
  };

  // Chips for each active filter, with a link that removes just that filter.
  const without = (key: string) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(rawParams)) if (v && k !== key && k !== "page") qs.set(k, v);
    return `${pathname}${qs.toString() ? `?${qs}` : ""}`;
  };
  const chips: { key: string; label: string }[] = [];
  if (params.category && !lockedCategory) chips.push({ key: "category", label: categories.find((c) => c.slug === params.category)?.name ?? params.category });
  if (rawParams.min) chips.push({ key: "min", label: t("chipMin", { value: rawParams.min }) });
  if (rawParams.max) chips.push({ key: "max", label: t("chipMax", { value: rawParams.max }) });
  if (params.inStock) chips.push({ key: "inStock", label: t("inStockOnly") });
  if (params.rating) chips.push({ key: "rating", label: t("andUp", { n: params.rating }) + " ★" });

  const filterProps = { categories: categories.map((c) => ({ slug: c.slug, name: c.name, count: c.count })), values, lockedCategory: !!lockedCategory };

  return (
    <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-32 rounded-2xl border bg-card p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {t("filters")}
          </h2>
          <Filters {...filterProps} />
        </div>
      </aside>

      <div className="min-w-0">
        <details className="mb-4 rounded-2xl border bg-card lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 p-4 font-semibold">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {t("filters")}
            {chips.length > 0 && <span className="rounded-full bg-primary px-2 text-xs text-primary-foreground">{chips.length}</span>}
          </summary>
          <div className="border-t p-4">
            <Filters {...filterProps} />
          </div>
        </details>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {t("resultCount", { count: result.total })}
          </p>
          <SortSelect value={params.sort ?? "newest"} params={rawParams} />
        </div>

        {chips.length > 0 && (
          <ul className="mb-5 flex flex-wrap gap-2" aria-label={t("activeFilters")}>
            {chips.map((c) => (
              <li key={c.key}>
                <Link
                  href={without(c.key)}
                  className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs font-medium hover:bg-muted"
                  aria-label={t("removeFilter", { name: c.label })}
                >
                  {c.label}
                  <X className="h-3 w-3" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}

        {result.items.length === 0 ? (
          <EmptyState
            title={t("emptyTitle")}
            body={params.q ? t("emptySearchBody", { q: params.q }) : t("emptyBody")}
            action={
              <Button asChild variant="outline">
                <Link href="/shop">{t("viewAll")}</Link>
              </Button>
            }
          />
        ) : (
          <ProductGrid className="lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} actions={<ProductCardActions product={p} />} />
            ))}
          </ProductGrid>
        )}

        <Pagination page={result.page} pages={result.pages} pathname={pathname} searchParams={rawParams} />
      </div>
    </div>
  );
}
