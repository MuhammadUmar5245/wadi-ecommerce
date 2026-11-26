import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Heart } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/misc";
import { ProductCard } from "@/components/product/product-card";
import { ProductCardActions } from "@/components/product/product-card-actions";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { toCard } from "@/server/catalog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("wishlist") };
}

export default async function WishlistPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await requireUser("/account/wishlist");
  const t = await getTranslations("wishlist");
  const ta = await getTranslations("account");
  const items = await db.wishlistItem.findMany({
    where: { userId: user.id, product: { isActive: true } },
    orderBy: { createdAt: "desc" },
    include: {
      product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 }, category: { select: { slug: true, nameEn: true, nameAr: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{ta("wishlist")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("count", { count: items.length })}</p>
      </div>
      {items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
          {items.map((w) => {
            const card = toCard(w.product, locale);
            return <ProductCard key={w.id} product={card} actions={<ProductCardActions product={card} />} />;
          })}
        </div>
      ) : (
        <EmptyState
          icon={Heart}
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={
            <Button asChild>
              <Link href="/shop">{ta("startShopping")}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
