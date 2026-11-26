"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { loc } from "@/lib/i18n-utils";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

const itemsSchema = z
  .array(z.object({ productId: z.string().min(1).max(40), quantity: z.number().int().min(0).max(1000) }))
  .max(100);

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
  /** the requested quantity had to be reduced to what is in stock */
  adjusted: boolean;
};

const clamp = (q: number, stock: number) => Math.max(0, Math.min(q, stock, MAX_QTY_PER_LINE));

/** Resolve a client cart against live prices and stock. Unknown/inactive products are dropped. */
export async function getCartDetails(rawItems: unknown, locale: string): Promise<{ lines: CartLine[]; subtotal: number }> {
  const parsed = itemsSchema.safeParse(rawItems);
  if (!parsed.success || parsed.data.length === 0) return { lines: [], subtotal: 0 };
  const products = await db.product.findMany({
    where: { id: { in: parsed.data.map((i) => i.productId) }, isActive: true },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
  });
  const lines: CartLine[] = [];
  for (const item of parsed.data) {
    const p = products.find((x) => x.id === item.productId);
    if (!p) continue;
    const quantity = clamp(item.quantity, p.stock);
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: loc(locale, p.nameEn, p.nameAr),
      brand: p.brand,
      image: p.images[0]?.url ?? "/images/placeholder.svg",
      unitPrice: p.price,
      quantity,
      stock: p.stock,
      lineTotal: p.price * quantity,
      adjusted: quantity !== item.quantity,
    });
  }
  return { lines, subtotal: lines.reduce((s, l) => s + l.lineTotal, 0) };
}

async function dbCartItems(userId: string) {
  const cart = await db.cart.findUnique({ where: { userId }, include: { items: { orderBy: { createdAt: "asc" } } } });
  return (cart?.items ?? []).map((i) => ({ productId: i.productId, quantity: i.quantity }));
}

/**
 * Called once after sign-in: merges the guest cart into the user's DB cart
 * (taking the larger quantity per product, capped at stock) and returns the result.
 */
export async function mergeGuestCart(rawItems: unknown): Promise<{ productId: string; quantity: number }[] | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const parsed = itemsSchema.safeParse(rawItems);
  const guest = parsed.success ? parsed.data : [];

  const cart = await db.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {}, include: { items: true } });
  const ids = [...new Set([...guest.map((g) => g.productId), ...cart.items.map((i) => i.productId)])];
  const products = await db.product.findMany({ where: { id: { in: ids }, isActive: true }, select: { id: true, stock: true } });

  await db.$transaction(async (tx) => {
    for (const p of products) {
      const g = guest.find((x) => x.productId === p.id)?.quantity ?? 0;
      const d = cart.items.find((x) => x.productId === p.id)?.quantity ?? 0;
      const q = clamp(Math.max(g, d), p.stock);
      if (q <= 0) await tx.cartItem.deleteMany({ where: { cartId: cart.id, productId: p.id } });
      else
        await tx.cartItem.upsert({
          where: { cartId_productId: { cartId: cart.id, productId: p.id } },
          create: { cartId: cart.id, productId: p.id, quantity: q },
          update: { quantity: q },
        });
    }
    // Drop lines for products that no longer exist or are inactive.
    await tx.cartItem.deleteMany({ where: { cartId: cart.id, productId: { notIn: products.map((p) => p.id) } } });
  });
  return dbCartItems(user.id);
}

/** Mirror a single line change to the signed-in user's DB cart. */
export async function setServerCartQuantity(productId: string, quantity: number): Promise<{ ok: boolean; quantity: number }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, quantity: 0 };
  const parsed = z.object({ productId: z.string().min(1).max(40), quantity: z.number().int().min(0).max(1000) }).safeParse({ productId, quantity });
  if (!parsed.success) return { ok: false, quantity: 0 };

  const product = await db.product.findFirst({ where: { id: productId, isActive: true }, select: { stock: true } });
  const cart = await db.cart.upsert({ where: { userId: user.id }, create: { userId: user.id }, update: {} });
  const q = product ? clamp(parsed.data.quantity, product.stock) : 0;
  if (q <= 0) {
    await db.cartItem.deleteMany({ where: { cartId: cart.id, productId } });
  } else {
    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity: q },
      update: { quantity: q },
    });
  }
  return { ok: true, quantity: q };
}

export async function clearServerCart() {
  const user = await getCurrentUser();
  if (!user) return;
  await db.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
}
