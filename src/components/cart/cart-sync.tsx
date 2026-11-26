"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/stores/cart";
import { mergeGuestCart } from "@/server/cart-actions";

/**
 * Keeps the local cart and the DB cart together:
 * - after sign-in, merges the guest cart into the user's DB cart once;
 * - after sign-out, clears the local copy so the next visitor doesn't see it.
 */
export function CartSync({ userId }: { userId: string | null }) {
  const running = useRef(false);

  useEffect(() => {
    const run = async () => {
      if (!useCart.persist.hasHydrated()) await new Promise<void>((r) => useCart.persist.onFinishHydration(() => r()));
      const { items, syncedUserId, replace } = useCart.getState();
      if (userId && syncedUserId !== userId && !running.current) {
        running.current = true;
        try {
          const merged = await mergeGuestCart(syncedUserId ? [] : items);
          if (merged) replace(merged, userId);
        } finally {
          running.current = false;
        }
      } else if (!userId && syncedUserId) {
        replace([], null);
      }
    };
    void run();
  }, [userId]);

  return null;
}
