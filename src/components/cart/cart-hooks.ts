"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useCart } from "@/stores/cart";
import { getCartDetails, setServerCartQuantity, type CartLine } from "@/server/cart-actions";

/** True after the first client render — avoids hydration mismatches with localStorage data. */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

/** Resolves the local cart against live server prices/stock and reconciles any differences. */
export function useCartLines(enabled = true) {
  const items = useCart((s) => s.items);
  const locale = useLocale();
  const [state, setState] = useState<{ lines: CartLine[]; subtotal: number; loading: boolean }>({ lines: [], subtotal: 0, loading: true });
  const key = JSON.stringify(items);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState((s) => ({ ...s, loading: true }));
    getCartDetails(JSON.parse(key), locale)
      .then((d) => {
        if (cancelled) return;
        setState({ ...d, loading: false });
        // Bring the local cart in line with the server (stock changes, removed products).
        const store = useCart.getState();
        for (const item of store.items) {
          const line = d.lines.find((l) => l.productId === item.productId);
          if (!line) store.remove(item.productId);
          else if (line.quantity !== item.quantity) store.setQuantity(item.productId, line.quantity);
        }
      })
      .catch(() => !cancelled && setState((s) => ({ ...s, loading: false })));
    return () => {
      cancelled = true;
    };
  }, [key, locale, enabled]);

  return state;
}

export function useCartMutations() {
  const setQuantity = useCart((s) => s.setQuantity);
  const remove = useCart((s) => s.remove);
  return {
    setQty(productId: string, quantity: number, stock: number) {
      setQuantity(productId, quantity, stock);
      if (useCart.getState().syncedUserId) void setServerCartQuantity(productId, Math.min(quantity, stock));
    },
    remove(productId: string) {
      remove(productId);
      if (useCart.getState().syncedUserId) void setServerCartQuantity(productId, 0);
    },
  };
}
