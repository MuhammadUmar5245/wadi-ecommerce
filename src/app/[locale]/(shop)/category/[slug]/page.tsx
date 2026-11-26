import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs } from "@/components/common/misc";
import { Suspense } from "react";
import { CatalogListing } from "@/components/catalog/listing";
import { ProductGridSkeleton } from "@/components/product/product-card";
import { getCategoryBySlug, parseListingParams } from "@/server/catalog";
import { loc } from "@/lib/i18n-utils";

type Props = { params: { locale: string; slug: string }; searchParams: Record<string, string | undefined> };

export async function generateMetadata({ params: { locale, slug } }: Props): Promise<Metadata> {
  const c = await getCategoryBySlug(slug);
  if (!c) notFound();
  return { title: loc(locale, c.nameEn, c.nameAr), description: loc(locale, c.descriptionEn, c.descriptionAr) };
}

export default async function CategoryPage({ params: { locale, slug }, searchParams }: Props) {
  setRequestLocale(locale);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const t = await getTranslations("catalog");
  const name = loc(locale, category.nameEn, category.nameAr);

  return (
    <div className="container py-8 lg:py-10">
      <Breadcrumbs items={[{ href: "/shop", label: t("shopTitle") }, { label: name }]} />
      <header className="relative mb-8 mt-4 overflow-hidden rounded-3xl bg-primary text-primary-foreground">
        <Image src={`/images/categories/${slug}.svg`} alt="" fill unoptimized priority className="object-cover opacity-90" />
        <div className="relative bg-gradient-to-r rtl:bg-gradient-to-l from-black/45 via-black/20 to-transparent p-8 sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-wider text-sand">{t("category")}</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{name}</h1>
          <p className="mt-3 max-w-xl text-white/90">{loc(locale, category.descriptionEn, category.descriptionAr)}</p>
        </div>
      </header>
      <Suspense key={JSON.stringify(searchParams)} fallback={<ProductGridSkeleton count={8} />}>
        <CatalogListing params={parseListingParams(searchParams)} rawParams={searchParams} pathname={`/category/${slug}`} lockedCategory={slug} />
      </Suspense>
    </div>
  );
}
