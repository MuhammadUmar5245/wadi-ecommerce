import type { Metadata } from "next";
import Image from "next/image";
import type { Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar, FilterSelect } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/misc";
import { StockBadge } from "@/components/product/stock-badge";
import { deleteProductAction } from "@/server/admin/actions";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { loc } from "@/lib/i18n-utils";

type SP = Record<string, string | undefined>;
const PER_PAGE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("products") };
}

export default async function AdminProducts({ params: { locale }, searchParams: sp }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");
  const ta = await getTranslations("admin");
  const page = Math.max(1, Number(sp.page) || 1);
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });

  const where: Prisma.ProductWhereInput = {};
  if (sp.q) where.OR = [{ nameEn: { contains: sp.q } }, { nameAr: { contains: sp.q } }, { sku: { contains: sp.q.toUpperCase() } }, { brand: { contains: sp.q } }];
  if (sp.category) where.categoryId = sp.category;
  if (sp.state === "active") where.isActive = true;
  if (sp.state === "archived") where.isActive = false;
  if (sp.state === "featured") where.isFeatured = true;

  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: true },
    }),
  ]);

  return (
    <>
      <AdminPageHeader
        title={ta("nav.products")}
        subtitle={t("count", { count: total })}
        actions={
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus aria-hidden />
              {t("add")}
            </Link>
          </Button>
        }
      />
      <FilterBar q={sp.q} placeholder={t("searchPlaceholder")}>
        <FilterSelect name="category" label={t("category")} value={sp.category} options={[{ value: "", label: ta("all") }, ...categories.map((c) => ({ value: c.id, label: loc(locale, c.nameEn, c.nameAr) }))]} />
        <FilterSelect
          name="state"
          label={t("state")}
          value={sp.state}
          options={[
            { value: "", label: ta("all") },
            { value: "active", label: t("active") },
            { value: "archived", label: t("archived") },
            { value: "featured", label: t("featured") },
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
                <TableHead className="text-end">{t("price")}</TableHead>
                <TableHead>{t("stock")}</TableHead>
                <TableHead>{t("state")}</TableHead>
                <TableHead className="text-end">
                  <span className="sr-only">{ta("actions")}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex min-w-[14rem] items-center gap-3">
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border bg-muted">
                        <Image src={p.images[0]?.url ?? "/icon.svg"} alt="" fill unoptimized sizes="44px" className="object-cover" />
                      </span>
                      <div className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="line-clamp-1 font-medium hover:text-primary">
                          {loc(locale, p.nameEn, p.nameAr)}
                        </Link>
                        <p className="font-mono text-xs text-muted-foreground" dir="ltr">
                          {p.sku}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{loc(locale, p.category.nameEn, p.category.nameAr)}</TableCell>
                  <TableCell className="tabular whitespace-nowrap text-end">{formatOMR(p.price, locale)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="tabular font-semibold">{p.stock}</span>
                      <StockBadge stock={p.stock} threshold={p.lowStockThreshold} />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.isActive ? <Badge variant="success">{t("active")}</Badge> : <Badge variant="outline">{t("archived")}</Badge>}
                      {p.isFeatured && <Badge variant="accent">{t("featured")}</Badge>}
                    </div>
                  </TableCell>
                  <TableCell className="text-end">
                    <div className="flex justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" aria-label={t("editNamed", { name: p.nameEn })}>
                        <Link href={`/admin/products/${p.id}`}>
                          <Pencil aria-hidden />
                        </Link>
                      </Button>
                      <ActionButton
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        aria-label={t("deleteNamed", { name: p.nameEn })}
                        confirm={t("confirmDelete")}
                        action={deleteProductAction.bind(null, p.id)}
                      >
                        <Trash2 aria-hidden />
                      </ActionButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} pathname="/admin/products" searchParams={sp} />
    </>
  );
}
