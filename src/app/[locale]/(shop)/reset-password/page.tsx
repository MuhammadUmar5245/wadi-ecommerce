import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-forms";
import { FormAlert } from "@/components/forms/form-parts";
import { Link } from "@/i18n/navigation";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("resetTitle"), robots: { index: false } };
}

export default async function ResetPasswordPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { token?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const token = searchParams.token ?? "";
  const valid = /^[a-f0-9]{64}$/.test(token);

  return (
    <AuthShell title={t("resetTitle")} subtitle={t("resetSubtitle")}>
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <FormAlert>
          {t("errors.resetInvalid")}{" "}
          <Link href="/forgot-password" className="font-semibold underline">
            {t("requestNewLink")}
          </Link>
        </FormAlert>
      )}
    </AuthShell>
  );
}
