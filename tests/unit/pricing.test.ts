import { describe, expect, it } from "vitest";
import { computeTotals, deliveryFeeFor, evaluateCoupon, subtotalOf, vatOn, type CouponLike } from "@/lib/pricing";
import { EXPRESS_DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE } from "@/lib/constants";

const coupon = (over: Partial<CouponLike> = {}): CouponLike => ({
  code: "WELCOME10",
  type: "PERCENT",
  value: 10,
  minOrder: 10_000,
  maxDiscount: 25_000,
  startsAt: new Date("2026-01-01T00:00:00Z"),
  expiresAt: new Date("2027-01-01T00:00:00Z"),
  usageLimit: 500,
  usedCount: 0,
  isActive: true,
  ...over,
});
const NOW = new Date("2026-10-20T08:00:00Z");

describe("subtotal", () => {
  it("multiplies unit prices by quantity, in baisa", () => {
    expect(subtotalOf([{ unitPrice: 7_800, quantity: 3 }, { unitPrice: 7_900, quantity: 1 }])).toBe(31_300);
  });
  it("is zero for an empty cart", () => {
    expect(subtotalOf([])).toBe(0);
  });
});

describe("VAT (5%)", () => {
  it("rounds to the nearest baisa", () => {
    expect(vatOn(1_000)).toBe(50);
    expect(vatOn(1_010)).toBe(51); // 50.5 → 51
    expect(vatOn(33)).toBe(2); // 1.65 → 2
    expect(vatOn(0)).toBe(0);
  });
});

describe("delivery fee", () => {
  it("charges OMR 1.500 for standard delivery below the threshold", () => {
    expect(deliveryFeeFor("STANDARD", FREE_DELIVERY_THRESHOLD - 1)).toBe(STANDARD_DELIVERY_FEE);
  });
  it("makes standard delivery free at OMR 20.000 and above", () => {
    expect(deliveryFeeFor("STANDARD", FREE_DELIVERY_THRESHOLD)).toBe(0);
  });
  it("always charges OMR 3.500 for express", () => {
    expect(deliveryFeeFor("EXPRESS", 1_000_000)).toBe(EXPRESS_DELIVERY_FEE);
  });
});

describe("coupons", () => {
  it("applies a percentage discount", () => {
    expect(evaluateCoupon(coupon(), 31_300, NOW)).toEqual({ ok: true, discount: 3_130 });
  });
  it("caps a percentage discount at maxDiscount", () => {
    expect(evaluateCoupon(coupon(), 500_000, NOW)).toEqual({ ok: true, discount: 25_000 });
  });
  it("applies a fixed discount but never more than the subtotal", () => {
    const oman5 = coupon({ code: "OMAN5", type: "FIXED", value: 5_000, minOrder: 0, maxDiscount: null });
    expect(evaluateCoupon(oman5, 40_000, NOW)).toEqual({ ok: true, discount: 5_000 });
    expect(evaluateCoupon(oman5, 3_000, NOW)).toEqual({ ok: true, discount: 3_000 });
  });
  it("enforces the minimum order", () => {
    expect(evaluateCoupon(coupon(), 9_999, NOW)).toEqual({ ok: false, error: "MIN_ORDER", minOrder: 10_000 });
  });
  it.each([
    ["missing", null, "NOT_FOUND"],
    ["inactive", coupon({ isActive: false }), "INACTIVE"],
    ["not started", coupon({ startsAt: new Date("2026-12-01T00:00:00Z") }), "NOT_STARTED"],
    ["expired", coupon({ expiresAt: new Date("2026-10-01T00:00:00Z") }), "EXPIRED"],
    ["used up", coupon({ usageLimit: 3, usedCount: 3 }), "USAGE_LIMIT"],
  ] as const)("rejects a %s coupon", (_label, c, error) => {
    expect(evaluateCoupon(c as CouponLike | null, 50_000, NOW)).toMatchObject({ ok: false, error });
  });
});

describe("order totals", () => {
  it("matches a hand-worked example (coupon, free delivery, VAT)", () => {
    // 3 × 7.800 + 7.900 = 31.300; 10% off = 3.130 → 28.170 (free delivery);
    // VAT 5% of 28.170 = 1.4085 → 1.409; total 29.579
    expect(computeTotals({ subtotal: 31_300, discount: 3_130, deliveryMethod: "STANDARD" })).toEqual({
      subtotal: 31_300,
      discount: 3_130,
      deliveryFee: 0,
      vat: 1_409,
      total: 29_579,
    });
  });
  it("charges VAT on the delivery fee too", () => {
    // 12.000 + 3.500 express = 15.500; VAT 0.775; total 16.275
    expect(computeTotals({ subtotal: 12_000, deliveryMethod: "EXPRESS" })).toEqual({ subtotal: 12_000, discount: 0, deliveryFee: 3_500, vat: 775, total: 16_275 });
  });
  it("decides free delivery after the discount is applied", () => {
    const t = computeTotals({ subtotal: 21_000, discount: 2_100, deliveryMethod: "STANDARD" });
    expect(t.deliveryFee).toBe(STANDARD_DELIVERY_FEE);
  });
  it("never lets the discount exceed the subtotal", () => {
    const t = computeTotals({ subtotal: 2_000, discount: 5_000, deliveryMethod: "STANDARD" });
    expect(t.discount).toBe(2_000);
    expect(t.total).toBe(t.deliveryFee + t.vat);
  });
  it("is zero for an empty cart", () => {
    expect(computeTotals({ subtotal: 0, deliveryMethod: "EXPRESS" })).toEqual({ subtotal: 0, discount: 0, deliveryFee: 0, vat: 0, total: 0 });
  });
  it("always adds up: subtotal − discount + delivery + VAT = total", () => {
    for (const subtotal of [1, 999, 19_999, 20_000, 123_456]) {
      for (const deliveryMethod of ["STANDARD", "EXPRESS"] as const) {
        const t = computeTotals({ subtotal, discount: Math.floor(subtotal / 7), deliveryMethod });
        expect(t.total).toBe(t.subtotal - t.discount + t.deliveryFee + t.vat);
        expect(Number.isInteger(t.vat)).toBe(true);
      }
    }
  });
});
