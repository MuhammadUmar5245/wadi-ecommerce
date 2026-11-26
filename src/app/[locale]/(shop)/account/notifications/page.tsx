import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NotificationList } from "@/components/account/notification-list";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("notifications") };
}

export default async function NotificationsPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await requireUser("/account/notifications");
  const t = await getTranslations("account");
  const items = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, type: true, titleEn: true, titleAr: true, bodyEn: true, bodyAr: true, link: true, readAt: true, createdAt: true },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("notifications")}</h1>
      <NotificationList items={items} />
    </div>
  );
}
