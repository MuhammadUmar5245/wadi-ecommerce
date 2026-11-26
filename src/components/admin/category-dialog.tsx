"use client";

import { useTranslations } from "next-intl";
import { Pencil, Plus } from "lucide-react";
import { Field, useErrorText } from "@/components/forms/form-parts";
import { saveCategoryAction } from "@/server/admin/actions";
import { FormDialog } from "./form-dialog";

export type CategoryValues = { id: string; nameEn: string; nameAr: string; descriptionEn: string; descriptionAr: string; slug: string; icon: string; sortOrder: number; isActive: boolean };

export function CategoryDialog({ category }: { category?: CategoryValues }) {
  const t = useTranslations("admin.categories");
  const err = useErrorText();
  return (
    <FormDialog
      title={category ? t("edit") : t("add")}
      trigger={
        category ? (
          <>
            <Pencil aria-hidden />
            <span className="sr-only">{t("editNamed", { name: category.nameEn })}</span>
          </>
        ) : (
          <>
            <Plus aria-hidden />
            {t("add")}
          </>
        )
      }
      triggerProps={category ? { variant: "ghost", size: "icon" } : {}}
      action={saveCategoryAction}
      submitLabel={t("save")}
      wide
    >
      {(errors) => (
        <>
          {category && <input type="hidden" name="id" value={category.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("nameEn")} name="nameEn" defaultValue={category?.nameEn} dir="ltr" error={err(errors?.nameEn)} />
            <Field label={t("nameAr")} name="nameAr" defaultValue={category?.nameAr} dir="rtl" error={err(errors?.nameAr)} />
            <Field label={t("descEn")} name="descriptionEn" defaultValue={category?.descriptionEn} dir="ltr" error={err(errors?.descriptionEn)} />
            <Field label={t("descAr")} name="descriptionAr" defaultValue={category?.descriptionAr} dir="rtl" error={err(errors?.descriptionAr)} />
            <Field label={t("slug")} name="slug" defaultValue={category?.slug} dir="ltr" error={err(errors?.slug)} />
            <Field label={t("icon")} name="icon" defaultValue={category?.icon ?? "Package"} dir="ltr" hint={t("iconHint")} error={err(errors?.icon)} />
            <Field label={t("sortOrder")} name="sortOrder" type="number" min={0} defaultValue={category?.sortOrder ?? 0} dir="ltr" error={err(errors?.sortOrder)} />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={category?.isActive ?? true} className="h-4 w-4 rounded accent-[hsl(var(--primary))]" />
            {t("activeLabel")}
          </label>
        </>
      )}
    </FormDialog>
  );
}
