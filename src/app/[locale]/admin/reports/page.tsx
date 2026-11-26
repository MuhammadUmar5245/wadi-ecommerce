import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BarChart3, Boxes, CreditCard, Lock, Truck, Users } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { AdminPageHeader } from "@/components/admin/ui";
import { requireRole } from "@/lib/auth-guard";
import { hasRole } from "@/lib/rbac";
import { REPORTS, REPORT_MIN_ROLE } from "@/server/reports";

const ICONS = { sales: BarChart3, inventory: Boxes, "customer-orders": Users, payments: CreditCard, delivery: Truck } as const;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("reports") };
}

export default async function ReportsIndex({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await requireRole("STAFF", "/admin/reports");
  const t = await getTranslations("reports");

  return (
    <>
      <AdminPageHeader title={t("indexTitle")} subtitle={t("indexSubtitle")} />
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map((key, i) => {
          const Icon = ICONS[key];
          const allowed = hasRole(user.role, REPORT_MIN_ROLE[key]);
          const body = (
            <>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="h-5 w-5" aria-hidden />
                </span>
                {REPORT_MIN_ROLE[key] === "ADMIN" && (
                  <Badge variant={allowed ? "secondary" : "outline"}>
                    <Lock className="h-3 w-3" aria-hidden />
                    {t("adminOnly")}
                  </Badge>
                )}
              </div>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("reportN", { n: i + 1 })}</p>
              <h2 className="mt-1 text-lg font-semibold">{t(`${key}.title`)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(`${key}.description`)}</p>
            </>
          );
          return (
            <li key={key}>
              {allowed ? (
                <Link href={`/admin/reports/${key}`} className="block h-full rounded-2xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
                  {body}
                </Link>
              ) : (
                <div className="h-full rounded-2xl border border-dashed bg-card/60 p-5 opacity-70" aria-disabled>
                  {body}
                  <p className="mt-3 text-xs font-medium text-muted-foreground">{t("restricted")}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
