"use client";

import { useTranslations } from "next-intl";
import { ArrowUpDown } from "lucide-react";
import { Field, FieldError, useErrorText } from "@/components/forms/form-parts";
import { NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adjustStockAction } from "@/server/admin/actions";
import { FormDialog } from "./form-dialog";

export function StockDialog({ productId, name, stock }: { productId: string; name: string; stock: number }) {
  const t = useTranslations("admin.inventory");
  const tr = useTranslations("stockReason");
  const err = useErrorText();
  return (
    <FormDialog
      title={t("adjustTitle")}
      description={t("adjustBody", { name, stock })}
      trigger={
        <>
          <ArrowUpDown aria-hidden />
          {t("adjust")}
        </>
      }
      triggerProps={{ variant: "outline", size: "sm" }}
      action={adjustStockAction}
      submitLabel={t("saveAdjustment")}
    >
      {(errors) => (
        <>
          <input type="hidden" name="productId" value={productId} />
          <Field label={t("change")} name="change" type="number" dir="ltr" placeholder="+20 / -3" hint={t("changeHint")} error={err(errors?.change)} />
          <div className="space-y-1.5">
            <Label htmlFor="reason">{t("reason")}</Label>
            <NativeSelect id="reason" name="reason" defaultValue="RESTOCK" aria-invalid={!!errors?.reason}>
              {(["RESTOCK", "ADJUSTMENT", "DAMAGE", "RETURN"] as const).map((r) => (
                <option key={r} value={r}>
                  {tr(r)}
                </option>
              ))}
            </NativeSelect>
            <FieldError id="reason-err" message={err(errors?.reason)} />
          </div>
          <Field label={t("note")} name="note" placeholder={t("notePlaceholder")} error={err(errors?.note)} />
        </>
      )}
    </FormDialog>
  );
}
