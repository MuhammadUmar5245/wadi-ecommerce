import "server-only";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { statusNotification } from "@/lib/notification-text";
import { paymentReference } from "./checkout";

/**
 * Cancels an order inside an existing transaction: restocks items, records
 * stock movements, refunds or voids payments, frees the coupon use and
 * notifies the customer. Shared by customer cancellation and the admin panel.
 */
export async function cancelOrderTx(tx: Prisma.TransactionClient, orderId: string, actorId: string, note: string) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId }, include: { items: true, payments: true } });

  for (const item of order.items) {
    const p = await tx.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity }, soldCount: { decrement: item.quantity } },
      select: { stock: true },
    });
    await tx.stockMovement.create({
      data: { productId: item.productId, change: item.quantity, balanceAfter: p.stock, reason: "CANCELLATION", orderId, userId: actorId, note },
    });
  }

  let paymentStatus = "VOID";
  const succeeded = order.payments.find((p) => p.status === "SUCCEEDED");
  if (succeeded && order.paymentMethod === "CARD") {
    await tx.payment.create({
      data: { orderId, method: "CARD", status: "REFUNDED", amount: succeeded.amount, reference: paymentReference(), cardLast4: succeeded.cardLast4, cardHolder: succeeded.cardHolder },
    });
    paymentStatus = "REFUNDED";
  } else {
    await tx.payment.updateMany({ where: { orderId, status: "PENDING" }, data: { status: "VOID" } });
  }

  await tx.order.update({ where: { id: orderId }, data: { status: "CANCELLED", cancelledAt: new Date(), paymentStatus } });
  await tx.orderStatusHistory.create({ data: { orderId, status: "CANCELLED", note, changedById: actorId } });
  if (order.couponId) await tx.coupon.update({ where: { id: order.couponId }, data: { usedCount: { decrement: 1 } } });
  await tx.notification.create({
    data: { userId: order.userId, type: "ORDER", ...statusNotification("CANCELLED", order.orderNumber), link: `/account/orders/${order.orderNumber}` },
  });
}

/** Recalculate a product's cached rating from its published reviews. */
export async function refreshProductRating(tx: Prisma.TransactionClient, productId: string) {
  const agg = await tx.review.aggregate({ where: { productId, status: "PUBLISHED" }, _avg: { rating: true }, _count: true });
  await tx.product.update({ where: { id: productId }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count } });
}

/** A customer may review a product once, and only after an order containing it was delivered. */
export async function reviewEligibility(userId: string, productId: string) {
  const [existing, delivered] = await Promise.all([
    db.review.findUnique({ where: { userId_productId: { userId, productId } }, select: { id: true } }),
    db.order.findFirst({
      where: { userId, status: "DELIVERED", items: { some: { productId } } },
      orderBy: { deliveredAt: "desc" },
      select: { id: true },
    }),
  ]);
  if (existing) return { eligible: false as const, reason: "already" as const };
  if (!delivered) return { eligible: false as const, reason: "notDelivered" as const };
  return { eligible: true as const, orderId: delivered.id };
}

