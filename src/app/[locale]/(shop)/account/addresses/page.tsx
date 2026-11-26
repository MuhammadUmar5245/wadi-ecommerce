import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AddressManager } from "@/components/account/address-manager";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("addresses") };
}

export default async function AddressesPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await requireUser("/account/addresses");
  const t = await getTranslations("account");
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: { id: true, label: true, fullName: true, phone: true, governorate: true, wilayat: true, area: true, street: true, building: true, way: true, notes: true, isDefault: true },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{t("addresses")}</h1>
      <AddressManager addresses={addresses} />
    </div>
  );
}
