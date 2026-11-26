"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Field, FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileAction } from "@/server/account-actions";

export function ProfileForm({ name, phone, email }: { name: string; phone: string; email: string }) {
  const t = useTranslations("auth");
  const ta = useTranslations("account");
  const tAll = useTranslations();
  const err = useErrorText();
  const [state, action] = useFormState(updateProfileAction, {});

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <FormAlert tone={state.ok ? "success" : "error"}>{tAll(state.message)}</FormAlert>}
      <div className="space-y-1.5">
        <Label htmlFor="email-ro">{t("email")}</Label>
        <Input id="email-ro" value={email} readOnly disabled dir="ltr" aria-describedby="email-ro-hint" />
        <p id="email-ro-hint" className="text-xs text-muted-foreground">
          {ta("emailLocked")}
        </p>
      </div>
      <Field label={t("fullName")} name="name" defaultValue={name} autoComplete="name" required error={err(state.errors?.name)} />
      <Field label={t("phone")} name="phone" defaultValue={phone} type="tel" dir="ltr" autoComplete="tel" required hint={t("phoneHint")} error={err(state.errors?.phone)} />
      <SubmitButton pendingText={t("saving")}>{ta("saveProfile")}</SubmitButton>
    </form>
  );
}
