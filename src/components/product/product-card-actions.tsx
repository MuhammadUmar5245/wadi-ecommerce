"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag } from "lucide-react";
import { useAddToCart } from "@/components/cart/use-add-to-cart";
import { WishlistButton } from "@/components/account/wishlist-button";
import type { ProductCardData } from "@/server/catalog";

export function ProductCardActions({ product }: { product: Pick<ProductCardData, "id" | "name" | "stock"> }) {
  const t = useTranslations("product");
  const addToCart = useAddToCart();
  const out = product.stock <= 0;

  return (
    <div className="flex items-center gap-1.5">
      <WishlistButton productId={product.id} name={product.name} />
      <button
        type="button"
        disabled={out}
        onClick={() => addToCart(product, 1)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
        aria-label={out ? t("outOfStock") : t("addToCartNamed", { name: product.name })}
      >
        <ShoppingBag className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
