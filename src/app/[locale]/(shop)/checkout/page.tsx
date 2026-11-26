import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Breadcrumbs, PageHeader } from "@/components/common/misc";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("title"), robots: { index: false } };
}

export default async function CheckoutPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await requireUser("/checkout");
  const t = await getTranslations("checkout");
  const tc = await getTranslations("cart");
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, label: true, fullName: true, phone: true, governorate: true, wilayat: true, area: true, street: true, building: true, way: true, isDefault: true },
  });

  return (
    <div className="container py-8 lg:py-10">
      <PageHeader title={t("title")}>
        <Breadcrumbs items={[{ href: "/cart", label: tc("title") }, { label: t("title") }]} />
      </PageHeader>
      <CheckoutForm userId={user.id} addresses={addresses} user={{ name: user.name, phone: user.phone }} />
    </div>
  );
}
