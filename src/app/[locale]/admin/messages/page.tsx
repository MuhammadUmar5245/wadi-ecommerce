import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Archive, CheckCheck, Mail, Reply } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, FilterBar, FilterSelect } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { EmptyState } from "@/components/common/misc";
import { setMessageStatusAction } from "@/server/admin/actions";
import { db } from "@/lib/db";
import { CONTACT_STATUSES } from "@/lib/constants";

type SP = Record<string, string | undefined>;
const VARIANT: Record<string, BadgeProps["variant"]> = { NEW: "accent", READ: "secondary", REPLIED: "success", ARCHIVED: "outline" };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("messages") };
}

export default async function AdminMessages({ params: { locale }, searchParams: sp }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.messages");
  const ta = await getTranslations("admin");
  const format = await getFormatter();
  const status = (CONTACT_STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status : undefined;
  const messages = await db.contactMessage.findMany({
    where: {
      ...(status ? { status } : { status: { not: "ARCHIVED" } }),
      ...(sp.q ? { OR: [{ name: { contains: sp.q } }, { email: { contains: sp.q } }, { subject: { contains: sp.q } }, { message: { contains: sp.q } }] } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <AdminPageHeader title={ta("nav.messages")} subtitle={t("subtitle")} />
      <FilterBar q={sp.q} placeholder={t("searchPlaceholder")}>
        <FilterSelect name="status" label={t("status")} value={sp.status} options={[{ value: "", label: t("inbox") }, ...CONTACT_STATUSES.map((s) => ({ value: s, label: t(`status_${s}`) }))]} />
      </FilterBar>
      {messages.length === 0 ? (
        <EmptyState icon={Mail} title={t("empty")} />
      ) : (
        <ul className="space-y-3">
          {messages.map((m) => (
            <li key={m.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold" dir="auto">
                      {m.subject}
                    </h2>
                    <Badge variant={VARIANT[m.status]}>{t(`status_${m.status}`)}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {m.name} · {m.email}
                    {m.phone && (
                      <>
                        {" · "}
                        <span dir="ltr">{m.phone}</span>
                      </>
                    )}{" "}
                    · {format.dateTime(m.createdAt, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>
                      <Reply aria-hidden />
                      {t("reply")}
                    </a>
                  </Button>
                  {m.status !== "REPLIED" && (
                    <ActionButton size="sm" variant="outline" action={setMessageStatusAction.bind(null, m.id, "REPLIED")}>
                      <CheckCheck aria-hidden />
                      {t("markReplied")}
                    </ActionButton>
                  )}
                  {m.status === "NEW" && (
                    <ActionButton size="sm" variant="ghost" action={setMessageStatusAction.bind(null, m.id, "READ")}>
                      {t("markRead")}
                    </ActionButton>
                  )}
                  {m.status !== "ARCHIVED" && (
                    <ActionButton size="sm" variant="ghost" action={setMessageStatusAction.bind(null, m.id, "ARCHIVED")} aria-label={t("archive")}>
                      <Archive aria-hidden />
                    </ActionButton>
                  )}
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed" dir="auto">
                {m.message}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
