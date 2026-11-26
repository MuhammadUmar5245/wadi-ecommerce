"use client";

import { useTransition } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Bell, CheckCheck, CreditCard, Package, Info } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/misc";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/account-actions";
import { cn } from "@/lib/utils";
import type { BellItem } from "./notification-bell";

const ICON: Record<string, React.ComponentType<{ className?: string }>> = { ORDER: Package, PAYMENT: CreditCard, SYSTEM: Info, REVIEW: Bell };

export function NotificationList({ items }: { items: (BellItem & { type: string })[] }) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const [pending, start] = useTransition();
  const unread = items.filter((n) => !n.readAt).length;

  if (items.length === 0) return <EmptyState icon={Bell} title={t("empty")} body={t("emptyBody")} />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{t("unreadCount", { count: unread })}</p>
        <Button
          variant="outline"
          size="sm"
          disabled={!unread || pending}
          onClick={() =>
            start(async () => {
              await markAllNotificationsReadAction();
              router.refresh();
            })
          }
        >
          <CheckCheck aria-hidden />
          {t("markAllRead")}
        </Button>
      </div>
      <ul className="divide-y rounded-2xl border bg-card">
        {items.map((n) => {
          const Icon = ICON[n.type] ?? Bell;
          return (
            <li key={n.id} className={cn("flex gap-4 p-4 sm:p-5", !n.readAt && "bg-secondary/40")}>
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", n.readAt ? "bg-muted text-muted-foreground" : "bg-primary text-primary-foreground")}>
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <p className={cn("text-sm", !n.readAt && "font-semibold")}>
                    {!n.readAt && <span className="sr-only">{t("unread")}: </span>}
                    {locale === "ar" ? n.titleAr : n.titleEn}
                  </p>
                  <time className="text-xs text-muted-foreground" dateTime={n.createdAt.toISOString()}>
                    {format.dateTime(n.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{locale === "ar" ? n.bodyAr : n.bodyEn}</p>
                <div className="mt-2 flex flex-wrap gap-3 text-xs font-medium">
                  {n.link && (
                    <Link href={n.link} className="text-primary hover:underline" onClick={() => !n.readAt && start(() => markNotificationReadAction(n.id).then(() => undefined))}>
                      {t("open")}
                    </Link>
                  )}
                  {!n.readAt && (
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground hover:underline"
                      disabled={pending}
                      onClick={() =>
                        start(async () => {
                          await markNotificationReadAction(n.id);
                          router.refresh();
                        })
                      }
                    >
                      {t("markRead")}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
