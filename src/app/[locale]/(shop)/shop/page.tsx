import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs, PageHeader } from "@/components/common/misc";
import { CatalogListing } from "@/components/catalog/listing";
import { parseListingParams } from "@/server/catalog";

type SP = Record<string, string | undefined>;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("catalog");
  return { title: t("shopTitle"), description: t("shopSubtitle") };
}

export default async function ShopPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  return (
    <div className="container py-8 lg:py-10">
      <PageHeader title={t("shopTitle")} subtitle={t("shopSubtitle")}>
        <Breadcrumbs items={[{ label: t("shopTitle") }]} />
      </PageHeader>
      <CatalogListing params={parseListingParams(searchParams)} rawParams={searchParams} pathname="/shop" />
    </div>
  );
}
