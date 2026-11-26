import { setRequestLocale } from "next-intl/server";
import { TopBar } from "@/components/layout/top-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CartSync } from "@/components/cart/cart-sync";
import { getCurrentUser } from "@/lib/auth-guard";
import { WishlistInit } from "@/components/account/wishlist-button";
import { db } from "@/lib/db";

export default async function ShopLayout({ children, params: { locale } }: { children: React.ReactNode; params: { locale: string } }) {
  setRequestLocale(locale);
  const user = await getCurrentUser();
  const wishIds = user ? (await db.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })).map((w) => w.productId) : [];
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <CartDrawer />
      <CartSync userId={user?.id ?? null} />
      <WishlistInit ids={wishIds} signedIn={!!user} />
    </div>
  );
}
