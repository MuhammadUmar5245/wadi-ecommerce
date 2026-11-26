import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/admin/ui";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { db } from "@/lib/db";
import { loc, parseSpecs } from "@/lib/i18n-utils";
import { baisaToOmrString } from "@/lib/money";

type Props = { params: { locale: string; id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("admin.products");
  return { title: params.id === "new" ? t("add") : t("edit") };
}

const plain = (b: number) => baisaToOmrString(b).replace(/,/g, "");

export default async function AdminProductEdit({ params: { locale, id } }: Props) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.products");
  const categories = (await db.category.findMany({ orderBy: { sortOrder: "asc" } })).map((c) => ({ id: c.id, name: loc(locale, c.nameEn, c.nameAr) }));

  let values: ProductFormValues;
  let slug: string | null = null;
  if (id === "new") {
    values = {
      nameEn: "", nameAr: "", descriptionEn: "", descriptionAr: "", slug: "", sku: "", brand: "",
      categoryId: categories[0]?.id ?? "", price: "", compareAtPrice: "", stock: 0, lowStockThreshold: 5,
      isFeatured: false, isActive: true, images: [], specs: [],
    };
  } else {
    const p = await db.product.findUnique({ where: { id }, include: { images: { orderBy: { sortOrder: "asc" } } } });
    if (!p) notFound();
    slug = p.slug;
    values = {
      id: p.id, nameEn: p.nameEn, nameAr: p.nameAr, descriptionEn: p.descriptionEn, descriptionAr: p.descriptionAr,
      slug: p.slug, sku: p.sku, brand: p.brand, categoryId: p.categoryId, price: plain(p.price),
      compareAtPrice: p.compareAtPrice ? plain(p.compareAtPrice) : "", stock: p.stock, lowStockThreshold: p.lowStockThreshold,
      isFeatured: p.isFeatured, isActive: p.isActive, images: p.images.map((i) => i.url), specs: parseSpecs(p.specs),
    };
  }

  return (
    <>
      <Link href="/admin/products" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl-flip" aria-hidden />
        {t("back")}
      </Link>
      <AdminPageHeader
        title={id === "new" ? t("add") : values.nameEn}
        actions={
          slug && (
            <Button asChild variant="outline">
              <Link href={`/product/${slug}`} target="_blank">
                <ExternalLink aria-hidden />
                {t("viewInStore")}
              </Link>
            </Button>
          )
        }
      />
      <ProductForm values={values} categories={categories} />
    </>
  );
}
