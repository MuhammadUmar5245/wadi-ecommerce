"use server";

import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { addressSchema, cardSchema, checkoutSchema, fieldErrors, type ActionState } from "@/lib/validation";
import { paymentNotification, statusNotification } from "@/lib/notification-text";
import { buildQuote, nextOrderNumber, paymentReference, simulateCharge, type Quote } from "./checkout";
import { NOTE } from "@/lib/system-notes";

class CheckoutError extends Error {
  constructor(public key: string, public data?: Record<string, string>) {
    super(key);
  }
}

export async function quoteAction(input: { deliveryMethod: string; couponCode?: string }): Promise<Quote | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const parsed = z
    .object({ deliveryMethod: z.enum(["STANDARD", "EXPRESS"]), couponCode: z.string().trim().max(30).optional() })
    .safeParse(input);
  if (!parsed.success) return null;
  return buildQuote(user.id, parsed.data.deliveryMethod, parsed.data.couponCode, await getLocale());
}

/**
 * Places the order in ONE database transaction: re-prices the cart, validates
 * stock and coupon, creates the order/items/history/payment, decrements stock
 * (guarded against races), records stock movements, clears the cart and
 * notifies the customer.
 */
export async function placeOrderAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };
  const locale = await getLocale();

  const raw = Object.fromEntries(formData);
  const parsed = checkoutSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const input = parsed.data;

  // Resolve the delivery address: a saved one (must belong to this user) or the form fields.
  let address: z.infer<typeof addressSchema>;
  if (input.addressId) {
    const saved = await db.address.findFirst({ where: { id: input.addressId, userId: user.id } });
    if (!saved) return { errors: { addressId: "invalid" } };
    address = {
      label: saved.label,
      fullName: saved.fullName,
      phone: saved.phone,
      governorate: saved.governorate as z.infer<typeof addressSchema>["governorate"],
      wilayat: saved.wilayat,
      area: saved.area,
      street: saved.street,
      building: saved.building,
      way: saved.way ?? undefined,
      notes: (raw.notes as string)?.trim() || saved.notes || undefined,
    };
  } else {
    const a = addressSchema.safeParse(raw);
    if (!a.success) return { errors: fieldErrors(a.error) };
    address = a.data;
  }

  let orderNumber: string;
  try {
    orderNumber = await db.$transaction(async (tx) => {
      const quote = await buildQuote(user.id, input.deliveryMethod, input.couponCode, locale, tx);
      if (quote.lines.length === 0) throw new CheckoutError("checkout.errors.emptyCart");
      if (quote.adjusted) throw new CheckoutError("checkout.errors.stockChanged");
      if (input.couponCode && quote.coupon && !quote.coupon.ok) throw new CheckoutError("checkout.errors.couponInvalid");

      const number = await nextOrderNumber(tx);
      const coupon = quote.coupon?.ok ? await tx.coupon.findUnique({ where: { code: quote.coupon.code } }) : null;

      const order = await tx.order.create({
        data: {
          orderNumber: number,
          userId: user.id,
          status: "PLACED",
          paymentMethod: input.paymentMethod,
          paymentStatus: "PENDING",
          deliveryMethod: input.deliveryMethod,
          ...quote.totals,
          couponId: coupon?.id ?? null,
          couponCode: coupon?.code ?? null,
          shipName: address.fullName,
          shipPhone: address.phone,
          governorate: address.governorate,
          wilayat: address.wilayat,
          area: address.area,
          street: address.street,
          building: address.building,
          way: address.way ?? null,
          notes: address.notes ?? null,
          items: {
            create: await Promise.all(
              quote.lines.map(async (l) => {
                const p = await tx.product.findUniqueOrThrow({ where: { id: l.productId }, select: { nameEn: true, nameAr: true, sku: true } });
                return { productId: l.productId, nameEn: p.nameEn, nameAr: p.nameAr, sku: p.sku, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal };
              })
            ),
          },
          history: { create: { status: "PLACED", changedById: user.id } },
          payments:
            input.paymentMethod === "COD"
              ? { create: { method: "COD", status: "PENDING", amount: quote.totals.total, reference: paymentReference() } }
              : undefined,
        },
      });

      for (const l of quote.lines) {
        // Conditional decrement: fails if another order took the stock in the meantime.
        const res = await tx.product.updateMany({
          where: { id: l.productId, stock: { gte: l.quantity } },
          data: { stock: { decrement: l.quantity }, soldCount: { increment: l.quantity } },
        });
        if (res.count !== 1) throw new CheckoutError("checkout.errors.stockChanged");
        const { stock } = await tx.product.findUniqueOrThrow({ where: { id: l.productId }, select: { stock: true } });
        await tx.stockMovement.create({
          data: { productId: l.productId, change: -l.quantity, balanceAfter: stock, reason: "SALE", orderId: order.id, userId: user.id },
        });
      }

      if (coupon) await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
      await tx.cartItem.deleteMany({ where: { cart: { userId: user.id } } });
      await tx.notification.create({
        data: { userId: user.id, type: "ORDER", ...statusNotification("PLACED", number), link: `/account/orders/${number}` },
      });

      if (input.saveAddress === "on" && !input.addressId) {
        const count = await tx.address.count({ where: { userId: user.id } });
        await tx.address.create({
          data: {
            userId: user.id,
            label: address.label ?? "Home",
            fullName: address.fullName,
            phone: address.phone,
            governorate: address.governorate,
            wilayat: address.wilayat,
            area: address.area,
            street: address.street,
            building: address.building,
            way: address.way ?? null,
            isDefault: count === 0,
          },
        });
      }
      return number;
    });
  } catch (e) {
    if (e instanceof CheckoutError) return { message: e.key, data: e.data };
    console.error("[checkout] order placement failed", e);
    return { message: "checkout.errors.generic" };
  }

  redirect(`/${locale}/checkout/${input.paymentMethod === "CARD" ? "payment" : "confirmation"}/${orderNumber}`);
}

async function payableOrder(orderNumber: string, userId: string) {
  const order = await db.order.findFirst({ where: { orderNumber, userId } });
  if (!order) return null;
  if (order.paymentMethod !== "CARD" || order.status === "CANCELLED" || !["PENDING", "FAILED"].includes(order.paymentStatus)) return null;
  return order;
}

/** Simulated card payment. Only the last four digits are ever stored. */
export async function payAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };
  const locale = await getLocale();

  const parsed = cardSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { orderNumber, cardNumber, cardHolder } = parsed.data;

  const order = await payableOrder(orderNumber, user.id);
  if (!order) return { message: "payment.errors.notPayable" };

  const result = simulateCharge(cardNumber);
  const last4 = cardNumber.slice(-4);

  await db.$transaction(async (tx) => {
    await tx.payment.create({
      data: {
        orderId: order.id,
        method: "CARD",
        status: result.approved ? "SUCCEEDED" : "FAILED",
        amount: order.total,
        reference: paymentReference(),
        cardLast4: last4,
        cardHolder: cardHolder.toUpperCase(),
        failureReason: result.approved ? null : result.reason,
      },
    });
    if (result.approved) {
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "PAID", status: "CONFIRMED" } });
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CONFIRMED", note: NOTE.PAYMENT_RECEIVED, changedById: user.id } });
      await tx.notification.createMany({
        data: [
          { userId: user.id, type: "PAYMENT", ...paymentNotification("SUCCEEDED", order.orderNumber), link: `/account/orders/${order.orderNumber}` },
          { userId: user.id, type: "ORDER", ...statusNotification("CONFIRMED", order.orderNumber), link: `/account/orders/${order.orderNumber}` },
        ],
      });
    } else {
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
      await tx.notification.create({
        data: { userId: user.id, type: "PAYMENT", ...paymentNotification("FAILED", order.orderNumber), link: `/checkout/payment/${order.orderNumber}` },
      });
    }
  });

  if (!result.approved) {
    return { message: result.reason === "card_declined" ? "payment.errors.declined" : "payment.errors.unsupportedCard" };
  }
  redirect(`/${locale}/checkout/confirmation/${order.orderNumber}`);
}

/** Lets a customer whose card failed (or who changed their mind) pay on delivery instead. */
export async function switchToCodAction(formData: FormData) {
  const user = await getCurrentUser();
  const locale = await getLocale();
  if (!user) redirect(`/${locale}/login`);
  const orderNumber = String(formData.get("orderNumber") ?? "");
  const order = await payableOrder(orderNumber, user.id);
  if (!order) redirect(`/${locale}/account/orders`);

  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { paymentMethod: "COD", paymentStatus: "PENDING" } }),
    db.payment.create({ data: { orderId: order.id, method: "COD", status: "PENDING", amount: order.total, reference: paymentReference() } }),
  ]);
  redirect(`/${locale}/checkout/confirmation/${order.orderNumber}`);
}
