import type { Metadata } from "next";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Power } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { CouponDialog } from "@/components/admin/coupon-dialog";
import { toggleCouponAction } from "@/server/admin/actions";
import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { baisaToOmrString, formatOMR } from "@/lib/money";
import { muscatDayKey } from "@/lib/dates";
import { loc } from "@/lib/i18n-utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("coupons") };
}

const plain = (b: number | null) => (b == null ? "" : baisaToOmrString(b).replace(/,/g, ""));

export default async function AdminCoupons({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  await requireRole("ADMIN", "/admin/coupons");
  const t = await getTranslations("admin.coupons");
  const ta = await getTranslations("admin");
  const format = await getFormatter();
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { orders: true } } } });
  const now = new Date();

  return (
    <>
      <AdminPageHeader title={ta("nav.coupons")} subtitle={t("subtitle")} actions={<CouponDialog />} />
      <div className="rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("code")}</TableHead>
              <TableHead>{t("discount")}</TableHead>
              <TableHead>{t("conditions")}</TableHead>
              <TableHead>{t("validity")}</TableHead>
              <TableHead className="text-end">{t("used")}</TableHead>
              <TableHead>{t("state")}</TableHead>
              <TableHead className="text-end">
                <span className="sr-only">{ta("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((c) => {
              const expired = c.expiresAt && c.expiresAt < now;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <p className="font-mono font-bold" dir="ltr">
                      {c.code}
                    </p>
                    <p className="max-w-xs text-xs text-muted-foreground">{loc(locale, c.descriptionEn, c.descriptionAr)}</p>
                  </TableCell>
                  <TableCell className="whitespace-nowrap font-semibold">{c.type === "PERCENT" ? `${c.value}%` : formatOMR(c.value, locale)}</TableCell>
                  <TableCell className="text-sm">
                    {t("minShort", { amount: formatOMR(c.minOrder, locale) })}
                    {c.maxDiscount != null && <p className="text-xs text-muted-foreground">{t("maxShort", { amount: formatOMR(c.maxDiscount, locale) })}</p>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {c.startsAt ? format.dateTime(c.startsAt, { dateStyle: "medium" }) : "—"} → {c.expiresAt ? format.dateTime(c.expiresAt, { dateStyle: "medium" }) : "∞"}
                  </TableCell>
                  <TableCell className="tabular text-end">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                  </TableCell>
                  <TableCell>
                    {expired ? <Badge variant="outline">{t("expired")}</Badge> : c.isActive ? <Badge variant="success">{t("active")}</Badge> : <Badge variant="secondary">{t("inactive")}</Badge>}
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <CouponDialog
                        coupon={{
                          id: c.id,
                          code: c.code,
                          type: c.type,
                          value: c.type === "PERCENT" ? String(c.value) : plain(c.value),
                          minOrder: plain(c.minOrder),
                          maxDiscount: plain(c.maxDiscount),
                          usageLimit: c.usageLimit ? String(c.usageLimit) : "",
                          startsAt: c.startsAt ? muscatDayKey(c.startsAt) : "",
                          expiresAt: c.expiresAt ? muscatDayKey(c.expiresAt) : "",
                          descriptionEn: c.descriptionEn,
                          descriptionAr: c.descriptionAr,
                          isActive: c.isActive,
                        }}
                      />
                      <ActionButton size="icon" variant="ghost" aria-label={c.isActive ? t("deactivate") : t("activate")} title={c.isActive ? t("deactivate") : t("activate")} action={toggleCouponAction.bind(null, c.id)}>
                        <Power aria-hidden />
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
