"use client";

import { create } from "zustand";

/** Wishlist ids for the signed-in user; seeded from the server by <WishlistInit>. */
type WishlistState = {
  ids: Set<string>;
  signedIn: boolean;
  init: (ids: string[], signedIn: boolean) => void;
  set: (id: string, saved: boolean) => void;
};

export const useWishlist = create<WishlistState>()((set, get) => ({
  ids: new Set(),
  signedIn: false,
  init: (ids, signedIn) => set({ ids: new Set(ids), signedIn }),
  set: (id, saved) => {
    const next = new Set(get().ids);
    if (saved) next.add(id);
    else next.delete(id);
    set({ ids: next });
  },
}));
