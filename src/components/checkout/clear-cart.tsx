"use client";

import { useEffect } from "react";
import { useCart } from "@/stores/cart";

/** The DB cart is emptied inside the order transaction; this clears the local copy to match. */
export function ClearCart() {
  useEffect(() => {
    const clear = () => useCart.getState().clear();
    if (useCart.persist.hasHydrated()) clear();
    else return useCart.persist.onFinishHydration(clear);
  }, []);
  return null;
}
