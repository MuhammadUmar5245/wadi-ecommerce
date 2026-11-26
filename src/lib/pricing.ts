/**
 * Pure order-total calculations, shared by checkout, the seed script and tests.
 * Everything is integer baisa. Prices are VAT-exclusive; 5 % VAT is charged on
 * merchandise after discount plus the delivery fee, rounded to the nearest baisa.
 */
import {
  EXPRESS_DELIVERY_FEE,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
  VAT_RATE_PERCENT,
  type DeliveryMethod,
} from "./constants";

export type CouponLike = {
  code: string;
  type: string; // PERCENT | FIXED
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
};

export type CouponError = "NOT_FOUND" | "INACTIVE" | "NOT_STARTED" | "EXPIRED" | "USAGE_LIMIT" | "MIN_ORDER";

export type CouponResult = { ok: true; discount: number } | { ok: false; error: CouponError; minOrder?: number };

export function lineTotal(unitPrice: number, quantity: number) {
  return unitPrice * quantity;
}

export function subtotalOf(lines: { unitPrice: number; quantity: number }[]) {
  return lines.reduce((sum, l) => sum + lineTotal(l.unitPrice, l.quantity), 0);
}

export function evaluateCoupon(coupon: CouponLike | null | undefined, subtotal: number, now = new Date()): CouponResult {
  if (!coupon) return { ok: false, error: "NOT_FOUND" };
  if (!coupon.isActive) return { ok: false, error: "INACTIVE" };
  if (coupon.startsAt && coupon.startsAt > now) return { ok: false, error: "NOT_STARTED" };
  if (coupon.expiresAt && coupon.expiresAt < now) return { ok: false, error: "EXPIRED" };
  if (coupon.usageLimit != null && coupon.usedCount >= coupon.usageLimit) return { ok: false, error: "USAGE_LIMIT" };
  if (subtotal < coupon.minOrder) return { ok: false, error: "MIN_ORDER", minOrder: coupon.minOrder };

  let discount = coupon.type === "PERCENT" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount != null) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.max(0, Math.min(discount, subtotal));
  return { ok: true, discount };
}

export function deliveryFeeFor(method: DeliveryMethod, merchandiseAfterDiscount: number) {
  if (method === "EXPRESS") return EXPRESS_DELIVERY_FEE;
  return merchandiseAfterDiscount >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
}

export function vatOn(taxable: number) {
  return Math.round((taxable * VAT_RATE_PERCENT) / 100);
}

export type Totals = { subtotal: number; discount: number; deliveryFee: number; vat: number; total: number };

export function computeTotals(input: { subtotal: number; discount?: number; deliveryMethod: DeliveryMethod }): Totals {
  const subtotal = input.subtotal;
  const discount = Math.max(0, Math.min(input.discount ?? 0, subtotal));
  const merchandise = subtotal - discount;
  const deliveryFee = subtotal === 0 ? 0 : deliveryFeeFor(input.deliveryMethod, merchandise);
  const vat = vatOn(merchandise + deliveryFee);
  return { subtotal, discount, deliveryFee, vat, total: merchandise + deliveryFee + vat };
}
