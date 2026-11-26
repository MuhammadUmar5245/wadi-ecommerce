import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs, PageHeader } from "@/components/common/misc";
import { CartView } from "@/components/cart/cart-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("title"), robots: { index: false } };
}

export default async function CartPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("cart");
  return (
    <div className="container py-8 lg:py-10">
      <PageHeader title={t("title")}>
        <Breadcrumbs items={[{ label: t("title") }]} />
      </PageHeader>
      <CartView />
    </div>
  );
}
