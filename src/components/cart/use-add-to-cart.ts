"use client";

import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useCart } from "@/stores/cart";
import { setServerCartQuantity } from "@/server/cart-actions";

/** Adds to the local cart (capped at stock), mirrors to the DB when signed in, and confirms with a toast. */
export function useAddToCart() {
  const t = useTranslations("cart");
  const add = useCart((s) => s.add);
  const syncedUserId = useCart((s) => s.syncedUserId);
  const setDrawerOpen = useCart((s) => s.setDrawerOpen);

  return (product: { id: string; name: string; stock: number }, quantity: number) => {
    const before = useCart.getState().items.find((i) => i.productId === product.id)?.quantity ?? 0;
    const after = add(product.id, quantity, product.stock);
    if (after === before) {
      toast.warning(t("stockLimit", { count: product.stock }));
      return;
    }
    if (syncedUserId) void setServerCartQuantity(product.id, after);
    if (after < before + quantity) toast.warning(t("stockLimit", { count: product.stock }));
    toast.success(t("added", { name: product.name }), {
      action: { label: t("viewCart"), onClick: () => setDrawerOpen(true) },
    });
  };
}
