"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input, NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Category = { slug: string; name: string; count: number };

export type FilterValues = {
  q?: string;
  category?: string;
  min?: string;
  max?: string;
  inStock?: boolean;
  rating?: string;
  sort?: string;
};

/**
 * A plain GET form so filtering works without JavaScript; with JS, select
 * and checkbox changes submit immediately.
 */
export function Filters({
  categories,
  values,
  lockedCategory,
  className,
}: {
  categories: Category[];
  values: FilterValues;
  lockedCategory?: boolean;
  className?: string;
}) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const formRef = useRef<HTMLFormElement>(null);

  const submit = () => {
    const form = formRef.current;
    if (!form) return;
    const qs = new URLSearchParams();
    new FormData(form).forEach((v, k) => {
      if (typeof v === "string" && v.trim()) qs.set(k, v.trim());
    });
    router.push(`${pathname}${qs.toString() ? `?${qs}` : ""}`, { scroll: false });
  };

  return (
    <form
      ref={formRef}
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className={cn("space-y-6", className)}
      aria-label={t("filters")}
    >
      {values.q && <input type="hidden" name="q" value={values.q} />}
      {values.sort && <input type="hidden" name="sort" value={values.sort} />}

      {!lockedCategory && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">{t("category")}</legend>
          <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
            <input type="radio" name="category" value="" defaultChecked={!values.category} onChange={submit} className="h-4 w-4 accent-[hsl(var(--primary))]" />
            {t("allCategories")}
          </label>
          {categories.map((c) => (
            <label key={c.slug} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
              <input
                type="radio"
                name="category"
                value={c.slug}
                defaultChecked={values.category === c.slug}
                onChange={submit}
                className="h-4 w-4 accent-[hsl(var(--primary))]"
              />
              <span className="flex-1">{c.name}</span>
              <span className="tabular text-xs text-muted-foreground">{c.count}</span>
            </label>
          ))}
        </fieldset>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("priceRange")}</legend>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label htmlFor="f-min" className="text-xs text-muted-foreground">
              {t("minPrice")}
            </Label>
            <Input id="f-min" name="min" type="number" inputMode="decimal" min={0} step="0.5" defaultValue={values.min} placeholder="0" dir="ltr" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="f-max" className="text-xs text-muted-foreground">
              {t("maxPrice")}
            </Label>
            <Input id="f-max" name="max" type="number" inputMode="decimal" min={0} step="0.5" defaultValue={values.max} placeholder="500" dir="ltr" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("availability")}</legend>
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
          <input type="checkbox" name="inStock" value="1" defaultChecked={values.inStock} onChange={submit} className="h-4 w-4 rounded accent-[hsl(var(--primary))]" />
          {t("inStockOnly")}
        </label>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{t("rating")}</legend>
        <div className="space-y-1">
          {["", "4", "3", "2"].map((r) => (
            <label key={r || "any"} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted">
              <input type="radio" name="rating" value={r} defaultChecked={(values.rating ?? "") === r} onChange={submit} className="h-4 w-4 accent-[hsl(var(--primary))]" />
              {r ? (
                <span className="flex items-center gap-1">
                  {t("andUp", { n: r })}
                  <Star className="h-3.5 w-3.5 text-accent" fill="currentColor" strokeWidth={0} aria-hidden />
                </span>
              ) : (
                t("anyRating")
              )}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {t("apply")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push(values.q ? `${pathname}?q=${encodeURIComponent(values.q)}` : pathname)}>
          {t("clear")}
        </Button>
      </div>
    </form>
  );
}

export function SortSelect({ value, params }: { value: string; params: Record<string, string | undefined> }) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="sort" className="shrink-0 text-sm text-muted-foreground">
        {t("sortBy")}
      </Label>
      <NativeSelect
        id="sort"
        value={value}
        className="h-9 w-auto"
        onChange={(e) => {
          const qs = new URLSearchParams();
          for (const [k, v] of Object.entries(params)) if (v && k !== "page" && k !== "sort") qs.set(k, v);
          if (e.target.value !== "newest") qs.set("sort", e.target.value);
          router.push(`${pathname}${qs.toString() ? `?${qs}` : ""}`, { scroll: false });
        }}
      >
        <option value="newest">{t("sortNewest")}</option>
        <option value="price-asc">{t("sortPriceAsc")}</option>
        <option value="price-desc">{t("sortPriceDesc")}</option>
        <option value="rating">{t("sortRating")}</option>
      </NativeSelect>
    </div>
  );
}
