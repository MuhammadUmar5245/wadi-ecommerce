import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { safeCallbackUrl } from "@/lib/rbac";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("registerTitle") };
}

export default async function RegisterPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { callbackUrl?: string };
}) {
  setRequestLocale(locale);
  const t = await getTranslations("auth");
  const callbackUrl = safeCallbackUrl(searchParams.callbackUrl, "");

  return (
    <AuthShell title={t("registerTitle")} subtitle={t("registerSubtitle")}>
      <RegisterForm callbackUrl={callbackUrl || undefined} />
    </AuthShell>
  );
}
