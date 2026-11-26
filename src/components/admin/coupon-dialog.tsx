"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil, Plus } from "lucide-react";
import { Field, useErrorText } from "@/components/forms/form-parts";
import { NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveCouponAction } from "@/server/admin/actions";
import { FormDialog } from "./form-dialog";

export type CouponValues = {
  id: string;
  code: string;
  type: string;
  value: string;
  minOrder: string;
  maxDiscount: string;
  usageLimit: string;
  startsAt: string;
  expiresAt: string;
  descriptionEn: string;
  descriptionAr: string;
  isActive: boolean;
};

export function CouponDialog({ coupon }: { coupon?: CouponValues }) {
  const t = useTranslations("admin.coupons");
  const err = useErrorText();
  const [type, setType] = useState(coupon?.type ?? "PERCENT");
  return (
    <FormDialog
      title={coupon ? t("edit") : t("add")}
      trigger={
        coupon ? (
          <>
            <Pencil aria-hidden />
            <span className="sr-only">{t("editNamed", { code: coupon.code })}</span>
          </>
        ) : (
          <>
            <Plus aria-hidden />
            {t("add")}
          </>
        )
      }
      triggerProps={coupon ? { variant: "ghost", size: "icon" } : {}}
      action={saveCouponAction}
      submitLabel={t("save")}
      wide
    >
      {(errors) => (
        <>
          {coupon && <input type="hidden" name="id" value={coupon.id} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("code")} name="code" defaultValue={coupon?.code} dir="ltr" className="uppercase" error={err(errors?.code)} />
            <div className="space-y-1.5">
              <Label htmlFor="coupon-type">{t("type")}</Label>
              <NativeSelect id="coupon-type" name="type" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="PERCENT">{t("percent")}</option>
                <option value="FIXED">{t("fixed")}</option>
              </NativeSelect>
            </div>
            <Field label={type === "PERCENT" ? t("valuePercent") : t("valueOmr")} name="value" defaultValue={coupon?.value} dir="ltr" inputMode="decimal" error={err(errors?.value)} />
            <Field label={t("minOrder")} name="minOrder" defaultValue={coupon?.minOrder} dir="ltr" inputMode="decimal" placeholder="0.000" error={err(errors?.minOrder)} />
            <Field label={t("maxDiscount")} name="maxDiscount" defaultValue={coupon?.maxDiscount} dir="ltr" inputMode="decimal" hint={t("optional")} error={err(errors?.maxDiscount)} />
            <Field label={t("usageLimit")} name="usageLimit" type="number" min={1} defaultValue={coupon?.usageLimit} dir="ltr" hint={t("optional")} error={err(errors?.usageLimit)} />
            <Field label={t("startsAt")} name="startsAt" type="date" defaultValue={coupon?.startsAt} dir="ltr" error={err(errors?.startsAt)} />
            <Field label={t("expiresAt")} name="expiresAt" type="date" defaultValue={coupon?.expiresAt} dir="ltr" error={err(errors?.expiresAt)} />
            <Field label={t("descEn")} name="descriptionEn" defaultValue={coupon?.descriptionEn} dir="ltr" error={err(errors?.descriptionEn)} />
            <Field label={t("descAr")} name="descriptionAr" defaultValue={coupon?.descriptionAr} dir="rtl" error={err(errors?.descriptionAr)} />
          </div>
          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" name="isActive" defaultChecked={coupon?.isActive ?? true} className="h-4 w-4 rounded accent-[hsl(var(--primary))]" />
            {t("activeLabel")}
          </label>
        </>
      )}
    </FormDialog>
  );
}
