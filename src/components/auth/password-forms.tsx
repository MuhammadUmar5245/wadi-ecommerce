"use client";

import { useEffect, useRef } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { changePasswordAction, forgotPasswordAction, resetPasswordAction } from "@/server/auth-actions";
import { Field, FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";

export function ForgotPasswordForm() {
  const [state, action] = useFormState(forgotPasswordAction, {});
  const t = useTranslations("auth");
  const tAll = useTranslations();
  const err = useErrorText();

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && (
        <FormAlert tone={state.ok ? "success" : "error"}>
          <p>{tAll(state.message)}</p>
          {state.data?.link && (
            <p className="mt-2 text-xs text-foreground">
              <span className="font-semibold">{t("demoResetLink")}</span>{" "}
              <a href={state.data.link} className="break-all text-primary underline" dir="ltr">
                {state.data.link}
              </a>
            </p>
          )}
        </FormAlert>
      )}
      <Field label={t("email")} name="email" type="email" autoComplete="email" required dir="ltr" error={err(state.errors?.email)} />
      <SubmitButton className="w-full" size="lg" pendingText={t("sending")}>
        {t("sendResetLink")}
      </SubmitButton>
      <p className="text-center text-sm">
        <Link href="/login" className="font-semibold text-primary hover:underline">
          {t("backToLogin")}
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useFormState(resetPasswordAction, {});
  const t = useTranslations("auth");
  const tAll = useTranslations();
  const err = useErrorText();

  if (state.ok) {
    return (
      <div className="space-y-5">
        <FormAlert tone="success">{tAll(state.message ?? "auth.resetDone")}</FormAlert>
        <Link href="/login" className="block text-center font-semibold text-primary hover:underline">
          {t("signIn")}
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      {(state.message || state.errors?.token) && (
        <FormAlert>
          {tAll(state.message ?? "auth.errors.resetInvalid")}{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            {t("requestNewLink")}
          </Link>
        </FormAlert>
      )}
      <input type="hidden" name="token" value={token} />
      <Field label={t("newPassword")} name="password" password autoComplete="new-password" required hint={t("passwordHint")} error={err(state.errors?.password)} />
      <Field label={t("confirmPassword")} name="confirmPassword" password autoComplete="new-password" required error={err(state.errors?.confirmPassword)} />
      <SubmitButton className="w-full" size="lg" pendingText={t("saving")}>
        {t("resetPassword")}
      </SubmitButton>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action] = useFormState(changePasswordAction, {});
  const t = useTranslations("auth");
  const tAll = useTranslations();
  const err = useErrorText();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="space-y-4" noValidate>
      {state.message && <FormAlert tone={state.ok ? "success" : "error"}>{tAll(state.message)}</FormAlert>}
      <Field label={t("currentPassword")} name="currentPassword" password autoComplete="current-password" required error={err(state.errors?.currentPassword)} />
      <Field label={t("newPassword")} name="newPassword" password autoComplete="new-password" required hint={t("passwordHint")} error={err(state.errors?.newPassword)} />
      <Field label={t("confirmPassword")} name="confirmPassword" password autoComplete="new-password" required error={err(state.errors?.confirmPassword)} />
      <SubmitButton pendingText={t("saving")}>{t("updatePassword")}</SubmitButton>
    </form>
  );
}
