import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { safeCallbackUrl } from "@/lib/rbac";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return { title: t("loginTitle"), robots: { index: false } };
}

export default async function LoginPage({
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
    <AuthShell title={t("loginTitle")} subtitle={t("loginSubtitle")}>
      <LoginForm callbackUrl={callbackUrl || undefined} demo={process.env.DEMO_MODE === "true"} />
    </AuthShell>
  );
}
