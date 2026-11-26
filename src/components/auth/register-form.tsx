"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { registerAction } from "@/server/auth-actions";
import { Field, FieldError, FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";

export function RegisterForm({ callbackUrl }: { callbackUrl?: string }) {
  const [state, action] = useFormState(registerAction, {});
  const t = useTranslations("auth");
  const tAll = useTranslations();
  const err = useErrorText();

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <FormAlert>{tAll(state.message, { minutes: state.data?.minutes ?? "15" })}</FormAlert>}
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label={t("fullName")} name="name" autoComplete="name" required error={err(state.errors?.name)} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t("email")} name="email" type="email" autoComplete="email" required dir="ltr" error={err(state.errors?.email)} />
        <Field
          label={t("phone")}
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+968 9123 4567"
          required
          dir="ltr"
          hint={t("phoneHint")}
          error={err(state.errors?.phone)}
        />
      </div>
      <Field
        label={t("password")}
        name="password"
        password
        autoComplete="new-password"
        required
        hint={t("passwordHint")}
        error={err(state.errors?.password)}
      />
      <Field label={t("confirmPassword")} name="confirmPassword" password autoComplete="new-password" required error={err(state.errors?.confirmPassword)} />
      <div className="space-y-1.5">
        <label className="flex items-start gap-2.5 text-sm">
          <input type="checkbox" name="terms" className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]" aria-describedby="terms-error" />
          <span>
            {t.rich("acceptTerms", {
              terms: (chunks) => (
                <Link href="/terms" className="font-medium text-primary underline-offset-2 hover:underline" target="_blank">
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link href="/privacy" className="font-medium text-primary underline-offset-2 hover:underline" target="_blank">
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </label>
        <FieldError id="terms-error" message={err(state.errors?.terms)} />
      </div>
      <SubmitButton className="w-full" size="lg" pendingText={t("creating")}>
        {t("createAccount")}
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
