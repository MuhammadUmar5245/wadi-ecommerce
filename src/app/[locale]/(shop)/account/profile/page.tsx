import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { requireUser } from "@/lib/auth-guard";
import { ChangePasswordForm } from "@/components/auth/password-forms";
import { ProfileForm } from "@/components/account/profile-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("profile") };
}

export default async function ProfilePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await requireUser("/account/profile");
  const t = await getTranslations("account");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("profile")}</h1>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("personalDetails")}</CardTitle>
            <CardDescription>{t("personalDetailsHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm name={user.name} phone={user.phone} email={user.email} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("changePassword")}</CardTitle>
            <CardDescription>{t("changePasswordHint")}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
