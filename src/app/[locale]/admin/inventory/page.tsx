import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { History } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar, FilterSelect, KpiCard } from "@/components/admin/ui";
import { StockDialog } from "@/components/admin/stock-dialog";
import { StockBadge, stockLevel } from "@/components/product/stock-badge";
import { EmptyState } from "@/components/common/misc";
import { db } from "@/lib/db";
import { loc } from "@/lib/i18n-utils";
import { formatOMR } from "@/lib/money";
import { AlertTriangle, Boxes, PackageX, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

type SP = Record<string, string | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("inventory") };
}

export default async function AdminInventory({ params: { locale }, searchParams: sp }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.inventory");
  const ta = await getTranslations("admin");
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });

  const where: Prisma.ProductWhereInput = { isActive: true };
  if (sp.q) where.OR = [{ nameEn: { contains: sp.q } }, { nameAr: { contains: sp.q } }, { sku: { contains: sp.q.toUpperCase() } }];
  if (sp.category) where.categoryId = sp.category;
  if (sp.stock === "out") where.stock = 0;
  if (sp.stock === "low") where.AND = [{ stock: { gt: 0 } }, { stock: { lte: db.product.fields.lowStockThreshold } }];

  const [products, all] = await Promise.all([
    db.product.findMany({ where, orderBy: [{ stock: "asc" }, { nameEn: "asc" }], include: { category: true } }),
    db.product.findMany({ where: { isActive: true }, select: { stock: true, lowStockThreshold: true, price: true } }),
  ]);
  const units = all.reduce((s, p) => s + p.stock, 0);
  const value = all.reduce((s, p) => s + p.stock * p.price, 0);
  const low = all.filter((p) => stockLevel(p.stock, p.lowStockThreshold) === "low").length;
  const out = all.filter((p) => p.stock === 0).length;

  return (
    <>
      <AdminPageHeader title={ta("nav.inventory")} subtitle={t("subtitle")} />
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label={t("units")} value={units.toLocaleString("en")} icon={Boxes} />
        <KpiCard label={t("value")} value={formatOMR(value, locale)} icon={Wallet} hint={t("valueHint")} />
        <KpiCard label={t("lowCount")} value={String(low)} icon={AlertTriangle} tone="warning" />
        <KpiCard label={t("outCount")} value={String(out)} icon={PackageX} tone="warning" />
      </div>
      <FilterBar q={sp.q} placeholder={t("searchPlaceholder")}>
        <FilterSelect name="category" label={t("category")} value={sp.category} options={[{ value: "", label: ta("all") }, ...categories.map((c) => ({ value: c.id, label: loc(locale, c.nameEn, c.nameAr) }))]} />
        <FilterSelect
          name="stock"
          label={t("level")}
          value={sp.stock}
          options={[
            { value: "", label: ta("all") },
            { value: "low", label: t("lowOnly") },
            { value: "out", label: t("outOnly") },
          ]}
        />
      </FilterBar>
      {products.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("product")}</TableHead>
                <TableHead>{t("category")}</TableHead>
                <TableHead className="text-end">{t("onHand")}</TableHead>
                <TableHead className="text-end">{t("threshold")}</TableHead>
                <TableHead>{t("level")}</TableHead>
                <TableHead className="text-end">
                  <span className="sr-only">{ta("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => {
                const level = stockLevel(p.stock, p.lowStockThreshold);
                return (
                  <TableRow key={p.id} className={cn(level === "out" && "bg-destructive/5", level === "low" && "bg-warning/5")}>
                    <TableCell>
                      <p className="font-medium">{loc(locale, p.nameEn, p.nameAr)}</p>
                      <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                        {p.sku}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{loc(locale, p.category.nameEn, p.category.nameAr)}</TableCell>
                    <TableCell className={cn("tabular text-end text-base font-bold", level !== "in" && "text-destructive")}>{p.stock}</TableCell>
                    <TableCell className="tabular text-end text-muted-foreground">{p.lowStockThreshold}</TableCell>
                    <TableCell>
                      <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex justify-end gap-2">
                        <StockDialog productId={p.id} name={loc(locale, p.nameEn, p.nameAr)} stock={p.stock} />
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/admin/inventory/${p.id}`}>
                            <History aria-hidden />
                            {t("history")}
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
