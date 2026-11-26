"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

/**
 * Client cart. Only product ids and quantities are stored; names, prices and
 * stock always come from the server, so a tampered localStorage can't change
 * what is charged. For signed-in users every change is mirrored to the DB cart.
 */
export type CartItem = { productId: string; quantity: number };

type CartState = {
  items: CartItem[];
  /** user whose DB cart this copy mirrors (null = guest cart) */
  syncedUserId: string | null;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  add: (productId: string, quantity: number, maxStock: number) => number;
  setQuantity: (productId: string, quantity: number, maxStock?: number) => void;
  remove: (productId: string) => void;
  replace: (items: CartItem[], syncedUserId: string | null) => void;
  clear: () => void;
};

const cap = (qty: number, maxStock = MAX_QTY_PER_LINE) => Math.max(0, Math.min(qty, maxStock, MAX_QTY_PER_LINE));

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      syncedUserId: null,
      drawerOpen: false,
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      add: (productId, quantity, maxStock) => {
        const existing = get().items.find((i) => i.productId === productId);
        const next = cap((existing?.quantity ?? 0) + quantity, maxStock);
        if (next <= 0) return existing?.quantity ?? 0;
        set({
          items: existing
            ? get().items.map((i) => (i.productId === productId ? { ...i, quantity: next } : i))
            : [...get().items, { productId, quantity: next }],
        });
        return next;
      },
      setQuantity: (productId, quantity, maxStock) => {
        const q = cap(quantity, maxStock);
        set({
          items: q <= 0 ? get().items.filter((i) => i.productId !== productId) : get().items.map((i) => (i.productId === productId ? { ...i, quantity: q } : i)),
        });
      },
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      replace: (items, syncedUserId) => set({ items, syncedUserId }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "wadi-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ items: s.items, syncedUserId: s.syncedUserId }),
    }
  )
);

export const cartCount = (items: CartItem[]) => items.reduce((n, i) => n + i.quantity, 0);
