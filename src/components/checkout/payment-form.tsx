"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Lock } from "lucide-react";
import { Field, FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";
import { payAction } from "@/server/checkout-actions";

const groups = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");

export function PaymentForm({ orderNumber, amountLabel }: { orderNumber: string; amountLabel: string }) {
  const t = useTranslations("payment");
  const tAll = useTranslations();
  const err = useErrorText();
  const [state, action] = useFormState(payAction, {});
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <FormAlert>{tAll(state.message)}</FormAlert>}
      <input type="hidden" name="orderNumber" value={orderNumber} />
      <Field
        label={t("cardNumber")}
        name="cardNumber"
        inputMode="numeric"
        autoComplete="cc-number"
        dir="ltr"
        placeholder="4242 4242 4242 4242"
        value={card}
        onChange={(e) => setCard(groups(e.target.value))}
        error={err(state.errors?.cardNumber)}
      />
      <Field label={t("cardHolder")} name="cardHolder" autoComplete="cc-name" dir="ltr" placeholder="AISHA AL BALUSHI" error={err(state.errors?.cardHolder)} />
      <div className="grid grid-cols-2 gap-4">
        <Field
          label={t("expiry")}
          name="expiry"
          inputMode="numeric"
          autoComplete="cc-exp"
          dir="ltr"
          placeholder="MM/YY"
          value={expiry}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(0, 4);
            setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
          }}
          error={err(state.errors?.expiry)}
        />
        <Field label={t("cvc")} name="cvc" inputMode="numeric" autoComplete="cc-csc" dir="ltr" placeholder="123" maxLength={4} error={err(state.errors?.cvc)} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs">
        <span className="text-muted-foreground">{t("fillTest")}</span>
        <button type="button" className="rounded-md border px-2 py-1 font-mono hover:bg-muted" onClick={() => setCard(groups("4242424242424242"))} dir="ltr">
          4242 … 4242 ✓
        </button>
        <button type="button" className="rounded-md border px-2 py-1 font-mono hover:bg-muted" onClick={() => setCard(groups("4000000000000002"))} dir="ltr">
          4000 … 0002 ✗
        </button>
      </div>
      <SubmitButton size="lg" className="w-full" pendingText={t("processing")}>
        <Lock aria-hidden />
        {t("pay", { amount: amountLabel })}
      </SubmitButton>
    </form>
  );
}
