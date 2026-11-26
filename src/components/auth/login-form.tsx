"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { loginAction } from "@/server/auth-actions";
import { Field, FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";

export function LoginForm({ callbackUrl, demo }: { callbackUrl?: string; demo: boolean }) {
  const [state, action] = useFormState(loginAction, {});
  const t = useTranslations("auth");
  const tAll = useTranslations();
  const err = useErrorText();

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.message && <FormAlert>{tAll(state.message, { minutes: state.data?.minutes ?? "15" })}</FormAlert>}
      <input type="hidden" name="callbackUrl" value={callbackUrl ?? ""} />
      <Field label={t("email")} name="email" type="email" autoComplete="email" required error={err(state.errors?.email)} dir="ltr" />
      <div className="space-y-1.5">
        <Field label={t("password")} name="password" password autoComplete="current-password" required error={err(state.errors?.password)} />
        <div className="text-end">
          <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
            {t("forgotLink")}
          </Link>
        </div>
      </div>
      <SubmitButton className="w-full" size="lg" pendingText={t("signingIn")}>
        {t("signIn")}
      </SubmitButton>
      <p className="text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href={callbackUrl ? `/register?callbackUrl=${encodeURIComponent(callbackUrl)}` : "/register"} className="font-semibold text-primary hover:underline">
          {t("createAccount")}
        </Link>
      </p>
      {demo && (
        <div className="rounded-xl border border-dashed bg-muted/50 p-4 text-xs leading-relaxed">
          <p className="mb-1.5 font-semibold">{t("demoAccounts")}</p>
          <ul className="space-y-0.5 text-muted-foreground" dir="ltr">
            <li>admin@wadialghubaitah.test / Admin@12345</li>
            <li>staff@wadialghubaitah.test / Staff@12345</li>
            <li>customer@wadialghubaitah.test / Customer@12345</li>
          </ul>
        </div>
      )}
    </form>
  );
}
