import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, Panel } from "@/components/admin/ui";
import { StockDialog } from "@/components/admin/stock-dialog";
import { StockBadge } from "@/components/product/stock-badge";
import { db } from "@/lib/db";
import { loc } from "@/lib/i18n-utils";
import { noteText } from "@/lib/system-notes";

type Props = { params: { locale: string; id: string } };

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.inventory");
  return { title: t("movementHistory") };
}

export default async function StockHistory({ params: { locale, id } }: Props) {
  setRequestLocale(locale);
  const product = await db.product.findUnique({
    where: { id },
    include: {
      stockMovements: { orderBy: { createdAt: "desc" }, take: 200, include: { user: { select: { name: true } }, order: { select: { orderNumber: true } } } },
    },
  });
  if (!product) notFound();
  const t = await getTranslations("admin.inventory");
  const tr = await getTranslations("stockReason");
  const tn = await getTranslations("systemNotes");
  const format = await getFormatter();
  const name = loc(locale, product.nameEn, product.nameAr);

  return (
    <>
      <Link href="/admin/inventory" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl-flip" aria-hidden />
        {t("back")}
      </Link>
      <AdminPageHeader title={name} subtitle={t("movementHistory")} actions={<StockDialog productId={product.id} name={name} stock={product.stock} />} />
      <div className="mb-6 flex flex-wrap items-center gap-3 text-sm">
        <span>
          {t("onHand")}: <strong className="tabular text-lg">{product.stock}</strong>
        </span>
        <StockBadge stock={product.stock} threshold={product.lowStockThreshold} />
      </div>
      <Panel>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("date")}</TableHead>
              <TableHead>{t("reason")}</TableHead>
              <TableHead className="text-end">{t("change")}</TableHead>
              <TableHead className="text-end">{t("balance")}</TableHead>
              <TableHead>{t("reference")}</TableHead>
              <TableHead>{t("by")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {product.stockMovements.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="whitespace-nowrap text-sm">{format.dateTime(m.createdAt, { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                <TableCell>
                  <Badge variant={m.change > 0 ? "success" : "secondary"}>{tr(m.reason as "SALE")}</Badge>
                </TableCell>
                <TableCell className={`tabular text-end font-semibold ${m.change > 0 ? "text-success" : "text-destructive"}`} dir="ltr">
                  {m.change > 0 ? `+${m.change}` : m.change}
                </TableCell>
                <TableCell className="tabular text-end">{m.balanceAfter}</TableCell>
                <TableCell className="text-sm">
                  {m.order ? (
                    <Link href={`/admin/orders/${m.order.orderNumber}`} className="font-mono text-primary hover:underline" dir="ltr">
                      {m.order.orderNumber}
                    </Link>
                  ) : (
                    noteText(m.note, tn) ?? "—"
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.user?.name ?? t("system")}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </>
  );
}
