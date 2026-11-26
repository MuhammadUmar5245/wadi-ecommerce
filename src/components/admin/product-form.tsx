"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Plus, Sparkles, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError, FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";
import { saveProductAction } from "@/server/admin/actions";
import type { Spec } from "@/lib/i18n-utils";

export type ProductFormValues = {
  id?: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  slug: string;
  sku: string;
  brand: string;
  categoryId: string;
  price: string;
  compareAtPrice: string;
  stock: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
  specs: Spec[];
};

const PRESETS = [
  { key: "teal", c: "0F5F5A-2BB3A3" },
  { key: "gold", c: "A16207-E0B565" },
  { key: "navy", c: "1E3A5F-3B82F6" },
  { key: "clay", c: "7C4A2D-C8963E" },
  { key: "aqua", c: "0E7490-22D3EE" },
  { key: "rose", c: "9F1239-FB7185" },
];

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

export function ProductForm({ values, categories }: { values: ProductFormValues; categories: { id: string; name: string }[] }) {
  const t = useTranslations("admin.products");
  const tAll = useTranslations();
  const tc = useTranslations("common");
  const err = useErrorText();
  const router = useRouter();
  const [state, action] = useFormState(saveProductAction, {});
  const [specs, setSpecs] = useState<Spec[]>(values.specs.length ? values.specs : [{ keyEn: "", keyAr: "", valueEn: "", valueAr: "" }]);
  const [images, setImages] = useState(values.images.join("\n"));
  const [slug, setSlug] = useState(values.slug);
  const [icon, setIcon] = useState("Package");
  const [preset, setPreset] = useState(PRESETS[0].c);
  const isNew = !values.id;

  useEffect(() => {
    if (state.ok) {
      toast.success(tAll(state.message ?? "admin.products.saved"));
      if (isNew && state.data?.id) router.push(`/admin/products/${state.data.id}`);
      else router.refresh();
    }
  }, [state, isNew, router, tAll]);

  const setSpec = (i: number, k: keyof Spec, v: string) => setSpecs((s) => s.map((row, j) => (j === i ? { ...row, [k]: v } : row)));

  return (
    <form action={action} className="grid gap-6 xl:grid-cols-3" noValidate>
      {values.id && <input type="hidden" name="id" value={values.id} />}
      <input type="hidden" name="specs" value={JSON.stringify(specs)} />

      <div className="min-w-0 space-y-6 xl:col-span-2">
        {state.message && !state.ok && <FormAlert>{tAll(state.message)}</FormAlert>}
        <fieldset className="min-w-0 space-y-4 rounded-2xl border bg-card p-5">
          <legend className="px-1 font-semibold">{t("details")}</legend>
          <div className="grid gap-4 md:grid-cols-2">
            <Field
              label={t("nameEn")}
              name="nameEn"
              defaultValue={values.nameEn}
              dir="ltr"
              lang="en"
              required
              error={err(state.errors?.nameEn)}
              onBlur={(e) => !slug && setSlug(slugify(e.target.value))}
            />
            <Field label={t("nameAr")} name="nameAr" defaultValue={values.nameAr} dir="rtl" lang="ar" required error={err(state.errors?.nameAr)} />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="descEn">{t("descEn")}</Label>
              <Textarea id="descEn" name="descriptionEn" defaultValue={values.descriptionEn} rows={5} dir="ltr" lang="en" aria-invalid={!!state.errors?.descriptionEn} />
              <FieldError id="descEn-err" message={err(state.errors?.descriptionEn)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descAr">{t("descAr")}</Label>
              <Textarea id="descAr" name="descriptionAr" defaultValue={values.descriptionAr} rows={5} dir="rtl" lang="ar" aria-invalid={!!state.errors?.descriptionAr} />
              <FieldError id="descAr-err" message={err(state.errors?.descriptionAr)} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <Field label={t("slug")} name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} dir="ltr" required hint={t("slugHint")} error={err(state.errors?.slug)} />
            <Field label={tc("sku")} name="sku" defaultValue={values.sku} dir="ltr" required error={err(state.errors?.sku)} />
            <Field label={t("brand")} name="brand" defaultValue={values.brand} required error={err(state.errors?.brand)} />
          </div>
        </fieldset>

        <fieldset className="min-w-0 space-y-3 rounded-2xl border bg-card p-5">
          <legend className="px-1 font-semibold">{t("specs")}</legend>
          <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-muted-foreground md:grid">
            <span>{t("specKeyEn")}</span>
            <span>{t("specKeyAr")}</span>
            <span>{t("specValueEn")}</span>
            <span>{t("specValueAr")}</span>
            <span className="w-9" />
          </div>
          {specs.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border p-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto] md:border-0 md:p-0">
              {(["keyEn", "keyAr", "valueEn", "valueAr"] as const).map((k) => (
                <input
                  key={k}
                  value={s[k]}
                  onChange={(e) => setSpec(i, k, e.target.value)}
                  dir={k.endsWith("Ar") ? "rtl" : "ltr"}
                  aria-label={`${t(k === "keyEn" ? "specKeyEn" : k === "keyAr" ? "specKeyAr" : k === "valueEn" ? "specValueEn" : "specValueAr")} ${i + 1}`}
                  className="h-9 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              ))}
              <Button type="button" size="icon" variant="ghost" className="h-9 w-9 text-destructive" onClick={() => setSpecs((x) => x.filter((_, j) => j !== i))} aria-label={t("removeSpec")}>
                <Trash2 aria-hidden />
              </Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => setSpecs((x) => [...x, { keyEn: "", keyAr: "", valueEn: "", valueAr: "" }])}>
            <Plus aria-hidden />
            {t("addSpec")}
          </Button>
        </fieldset>

        <fieldset className="min-w-0 space-y-3 rounded-2xl border bg-card p-5">
          <legend className="px-1 font-semibold">{t("images")}</legend>
          <div className="space-y-1.5">
            <Label htmlFor="images">{t("imageUrls")}</Label>
            <Textarea id="images" name="images" value={images} onChange={(e) => setImages(e.target.value)} rows={4} dir="ltr" className="font-mono text-xs" aria-invalid={!!state.errors?.images} />
            <p className="text-xs text-muted-foreground">{t("imagesHint")}</p>
            <FieldError id="images-err" message={err(state.errors?.images)} />
          </div>
          <div className="flex flex-wrap items-end gap-2 rounded-xl bg-muted/50 p-3">
            <div className="space-y-1">
              <Label htmlFor="art-icon" className="text-xs">
                {t("artIcon")}
              </Label>
              <input id="art-icon" value={icon} onChange={(e) => setIcon(e.target.value.replace(/[^A-Za-z0-9]/g, ""))} list="icon-suggestions" dir="ltr" className="h-9 w-40 rounded-lg border border-input bg-background px-2.5 text-sm" />
              <datalist id="icon-suggestions">
                {["Package", "Refrigerator", "WashingMachine", "Fan", "Lightbulb", "Drill", "Hammer", "Wrench", "PaintRoller", "BrickWall", "ShowerHead", "Droplets", "CookingPot", "Coffee", "Heater", "Cable"].map((n) => (
                  <option key={n} value={n} />
                ))}
              </datalist>
            </div>
            <div className="space-y-1">
              <Label htmlFor="art-preset" className="text-xs">
                {t("artColours")}
              </Label>
              <NativeSelect id="art-preset" value={preset} onChange={(e) => setPreset(e.target.value)} className="h-9 w-36">
                {PRESETS.map((p) => (
                  <option key={p.c} value={p.c}>
                    {t(`preset.${p.key}`)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setImages([1, 2, 3].map((v) => `/api/art/${icon || "Package"}/${v}?c=${preset}`).join("\n"))}>
              <Sparkles aria-hidden />
              {t("generateArt")}
            </Button>
          </div>
          {images.trim() && (
            <div className="flex flex-wrap gap-2">
              {images
                .split(/\r?\n/)
                .filter(Boolean)
                .slice(0, 6)
                .map((u) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={u} src={u} alt="" className="h-16 w-16 rounded-lg border object-cover" />
                ))}
            </div>
          )}
        </fieldset>
      </div>

      <div className="min-w-0 space-y-6">
        <fieldset className="min-w-0 space-y-4 rounded-2xl border bg-card p-5">
          <legend className="px-1 font-semibold">{t("pricing")}</legend>
          <Field label={t("priceOmr")} name="price" defaultValue={values.price} inputMode="decimal" dir="ltr" placeholder="12.500" required error={err(state.errors?.price)} />
          <Field
            label={t("compareAt")}
            name="compareAtPrice"
            defaultValue={values.compareAtPrice}
            inputMode="decimal"
            dir="ltr"
            placeholder="15.000"
            hint={t("compareAtHint")}
            error={err(state.errors?.compareAtPrice)}
          />
        </fieldset>
        <fieldset className="min-w-0 space-y-4 rounded-2xl border bg-card p-5">
          <legend className="px-1 font-semibold">{t("organisation")}</legend>
          <div className="space-y-1.5">
            <Label htmlFor="categoryId">{t("category")}</Label>
            <NativeSelect id="categoryId" name="categoryId" defaultValue={values.categoryId} aria-invalid={!!state.errors?.categoryId}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </NativeSelect>
          </div>
          {isNew ? (
            <Field label={t("openingStock")} name="stock" type="number" min={0} defaultValue={values.stock} dir="ltr" error={err(state.errors?.stock)} />
          ) : (
            <p className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">{t("stockViaInventory", { stock: values.stock })}</p>
          )}
          <Field label={t("lowStockThreshold")} name="lowStockThreshold" type="number" min={0} defaultValue={values.lowStockThreshold} dir="ltr" error={err(state.errors?.lowStockThreshold)} />
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={values.isActive} className="h-4 w-4 rounded accent-[hsl(var(--primary))]" />
            {t("activeLabel")}
          </label>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="isFeatured" defaultChecked={values.isFeatured} className="h-4 w-4 rounded accent-[hsl(var(--primary))]" />
            {t("featuredLabel")}
          </label>
        </fieldset>
        <SubmitButton size="lg" className="w-full" pendingText={t("saving")}>
          {isNew ? t("create") : t("save")}
        </SubmitButton>
      </div>
    </form>
  );
}
