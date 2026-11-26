"use client";

import { useTransition } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Bell, CheckCheck } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CountBadge } from "@/components/layout/icon-link";
import { markAllNotificationsReadAction, markNotificationReadAction } from "@/server/account-actions";
import { cn } from "@/lib/utils";

export type BellItem = { id: string; titleEn: string; titleAr: string; bodyEn: string; bodyAr: string; link: string | null; readAt: Date | null; createdAt: Date };

export function NotificationBell({ unread, items }: { unread: number; items: BellItem[] }) {
  const t = useTranslations("notifications");
  const locale = useLocale();
  const format = useFormatter();
  const router = useRouter();
  const [, start] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted data-[state=open]:bg-muted"
        aria-label={unread ? t("bellUnread", { count: unread }) : t("bell")}
      >
        <Bell className="h-5 w-5" aria-hidden />
        <CountBadge count={unread} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-semibold">{t("title")}</p>
          {unread > 0 && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              onClick={() => start(async () => {
                await markAllNotificationsReadAction();
                router.refresh();
              })}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              {t("markAllRead")}
            </button>
          )}
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="max-h-96 overflow-y-auto p-1">
            {items.map((n) => (
              <DropdownMenuItem
                key={n.id}
                className="flex-col items-start gap-0.5 whitespace-normal px-3 py-2.5"
                onSelect={() =>
                  start(async () => {
                    if (!n.readAt) await markNotificationReadAction(n.id);
                    router.push(n.link ?? "/account/notifications");
                    router.refresh();
                  })
                }
              >
                <span className="flex w-full items-center gap-2">
                  {!n.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label={t("unread")} />}
                  <span className={cn("flex-1 text-sm", !n.readAt && "font-semibold")}>{locale === "ar" ? n.titleAr : n.titleEn}</span>
                </span>
                <span className="line-clamp-2 text-xs text-muted-foreground">{locale === "ar" ? n.bodyAr : n.bodyEn}</span>
                <span className="text-[11px] text-muted-foreground">{format.relativeTime(n.createdAt)}</span>
              </DropdownMenuItem>
            ))}
          </div>
        )}
        <DropdownMenuSeparator className="m-0" />
        <Link href="/account/notifications" className="block px-4 py-3 text-center text-sm font-medium text-primary hover:bg-muted">
          {t("viewAll")}
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
