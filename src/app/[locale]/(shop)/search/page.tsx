import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs, PageHeader } from "@/components/common/misc";
import { CatalogListing } from "@/components/catalog/listing";
import { parseListingParams } from "@/server/catalog";

type SP = Record<string, string | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const t = await getTranslations("catalog");
  const q = searchParams.q?.trim();
  return { title: q ? t("searchTitleFor", { q }) : t("searchTitle"), robots: { index: false } };
}

export default async function SearchPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("catalog");
  const params = parseListingParams(searchParams);
  return (
    <div className="container py-8 lg:py-10">
      <PageHeader title={params.q ? t("searchTitleFor", { q: params.q }) : t("searchTitle")} subtitle={params.q ? undefined : t("searchHint")}>
        <Breadcrumbs items={[{ label: t("searchTitle") }]} />
      </PageHeader>
      <CatalogListing params={params} rawParams={searchParams} pathname="/search" />
    </div>
  );
}
