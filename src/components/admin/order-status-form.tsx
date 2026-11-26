"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { FormAlert, SubmitButton } from "@/components/forms/form-parts";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateOrderStatusAction } from "@/server/admin/actions";
import { ORDER_FLOW, type OrderStatus } from "@/lib/constants";

export function OrderStatusForm({ orderId, status, awaitingCard }: { orderId: string; status: string; awaitingCard: boolean }) {
  const t = useTranslations("admin.orders");
  const ts = useTranslations("orderStatus");
  const tAll = useTranslations();
  const [state, action] = useFormState(updateOrderStatusAction, {});
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      toast.success(tAll(state.message ?? "admin.orders.statusUpdated"));
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router, tAll]);

  if (status === "DELIVERED" || status === "CANCELLED") return <p className="text-sm text-muted-foreground">{t("finalStatus")}</p>;

  const idx = ORDER_FLOW.indexOf(status as OrderStatus);
  const next = awaitingCard ? [] : ORDER_FLOW.slice(idx + 1);

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {state.message && !state.ok && <FormAlert>{tAll(state.message)}</FormAlert>}
      {awaitingCard && <FormAlert tone="info">{tAll("admin.orders.awaitingCard")}</FormAlert>}
      <input type="hidden" name="orderId" value={orderId} />
      <div className="space-y-1.5">
        <Label htmlFor="new-status">{t("newStatus")}</Label>
        <NativeSelect id="new-status" name="status" defaultValue={next[0] ?? "CANCELLED"}>
          {next.map((s) => (
            <option key={s} value={s}>
              {ts(s)}
            </option>
          ))}
          <option value="CANCELLED">{ts("CANCELLED")}</option>
        </NativeSelect>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="status-note">{t("note")}</Label>
        <Textarea id="status-note" name="note" rows={2} maxLength={300} placeholder={t("notePlaceholder")} />
      </div>
      <p className="text-xs text-muted-foreground">{t("notifyHint")}</p>
      <SubmitButton className="w-full" pendingText={t("updating")}>
        {t("updateStatus")}
      </SubmitButton>
    </form>
  );
}
