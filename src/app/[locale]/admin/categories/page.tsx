import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { CategoryDialog } from "@/components/admin/category-dialog";
import { deleteCategoryAction } from "@/server/admin/actions";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("categories") };
}

export default async function AdminCategories({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.categories");
  const ta = await getTranslations("admin");
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });

  return (
    <>
      <AdminPageHeader title={ta("nav.categories")} subtitle={t("subtitle")} actions={<CategoryDialog />} />
      <div className="rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("nameEn")}</TableHead>
              <TableHead>{t("nameAr")}</TableHead>
              <TableHead>{t("slug")}</TableHead>
              <TableHead className="text-end">{t("products")}</TableHead>
              <TableHead>{t("state")}</TableHead>
              <TableHead className="text-end">
                <span className="sr-only">{ta("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium" dir="ltr">
                  {c.nameEn}
                </TableCell>
                <TableCell dir="rtl" lang="ar">
                  {c.nameAr}
                </TableCell>
                <TableCell className="font-mono text-xs" dir="ltr">
                  {c.slug}
                </TableCell>
                <TableCell className="tabular text-end">{c._count.products}</TableCell>
                <TableCell>{c.isActive ? <Badge variant="success">{t("active")}</Badge> : <Badge variant="outline">{t("hidden")}</Badge>}</TableCell>
                <TableCell className="text-end">
                  <div className="flex justify-end gap-1">
                    <CategoryDialog category={c} />
                    <ActionButton
                      size="icon"
                      variant="ghost"
                      className="text-destructive hover:bg-destructive/10"
                      aria-label={t("deleteNamed", { name: c.nameEn })}
                      confirm={t("confirmDelete")}
                      disabled={c._count.products > 0}
                      title={c._count.products > 0 ? t("hasProductsHint") : undefined}
                      action={deleteCategoryAction.bind(null, c.id)}
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
    </>
  );
}
