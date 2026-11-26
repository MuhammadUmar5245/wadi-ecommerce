import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { loc } from "@/lib/i18n-utils";
import { computeTotals, evaluateCoupon, type CouponError, type Totals } from "@/lib/pricing";
import { MAX_QTY_PER_LINE, type DeliveryMethod } from "@/lib/constants";

export type QuoteLine = {
  productId: string;
  slug: string;
  name: string;
  image: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  lineTotal: number;
};

export type Quote = {
  lines: QuoteLine[];
  totals: Totals;
  coupon: { code: string; ok: true; discount: number } | { code: string; ok: false; error: CouponError; minOrder?: number } | null;
  /** at least one line was reduced or removed because of stock */
  adjusted: boolean;
};

type Tx = Prisma.TransactionClient | typeof db;

/** Builds a server-side quote from the user's DB cart. Never trusts client prices. */
export async function buildQuote(
  userId: string,
  deliveryMethod: DeliveryMethod,
  couponCode: string | null | undefined,
  locale: string,
  tx: Tx = db
): Promise<Quote> {
  const cart = await tx.cart.findUnique({
    where: { userId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: { product: { include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } } } },
      },
    },
  });

  let adjusted = false;
  const lines: QuoteLine[] = [];
  for (const item of cart?.items ?? []) {
    const p = item.product;
    if (!p.isActive || p.stock <= 0) {
      adjusted = true;
      continue;
    }
    const quantity = Math.min(item.quantity, p.stock, MAX_QTY_PER_LINE);
    if (quantity !== item.quantity) adjusted = true;
    lines.push({
      productId: p.id,
      slug: p.slug,
      name: loc(locale, p.nameEn, p.nameAr),
      image: p.images[0]?.url ?? "/images/placeholder.svg",
      unitPrice: p.price,
      quantity,
      stock: p.stock,
      lineTotal: p.price * quantity,
    });
  }

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  let coupon: Quote["coupon"] = null;
  let discount = 0;
  const code = couponCode?.trim().toUpperCase();
  if (code) {
    const row = await tx.coupon.findUnique({ where: { code } });
    const res = evaluateCoupon(row, subtotal);
    if (res.ok) {
      discount = res.discount;
      coupon = { code, ok: true, discount };
    } else {
      coupon = { code, ok: false, error: res.error, minOrder: res.minOrder };
    }
  }

  return { lines, totals: computeTotals({ subtotal, discount, deliveryMethod }), coupon, adjusted };
}

/** Next sequential order number in the WG-XXXXX format. Call inside the order transaction. */
export async function nextOrderNumber(tx: Tx): Promise<string> {
  const last = await tx.order.findFirst({ orderBy: { orderNumber: "desc" }, select: { orderNumber: true } });
  const n = last ? Number(last.orderNumber.replace(/\D/g, "")) + 1 : 10001;
  return `WG-${String(n).padStart(5, "0")}`;
}

export function paymentReference(date = new Date()) {
  const rand = Math.floor(Math.random() * 1e6).toString().padStart(6, "0");
  return `TXN-${date.toISOString().slice(0, 10).replace(/-/g, "")}-${rand}`;
}

/** Simulated gateway: only these two card numbers are recognised in demo mode. */
export const TEST_CARD_SUCCESS = "4242424242424242";
export const TEST_CARD_DECLINE = "4000000000000002";

export function luhnValid(num: string) {
  let sum = 0;
  let double = false;
  for (let i = num.length - 1; i >= 0; i--) {
    let d = Number(num[i]);
    if (double) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    double = !double;
  }
  return num.length >= 12 && sum % 10 === 0;
}

export type GatewayResult = { approved: true } | { approved: false; reason: "card_declined" | "unsupported_test_card" };

export function simulateCharge(cardNumber: string): GatewayResult {
  if (cardNumber === TEST_CARD_SUCCESS) return { approved: true };
  if (cardNumber === TEST_CARD_DECLINE) return { approved: false, reason: "card_declined" };
  return { approved: false, reason: "unsupported_test_card" };
}
