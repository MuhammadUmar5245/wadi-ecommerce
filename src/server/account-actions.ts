"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { CUSTOMER_CANCELLABLE, type OrderStatus } from "@/lib/constants";
import { addressSchema, fieldErrors, nameSchema, phoneSchema, type ActionState } from "@/lib/validation";
import { cancelOrderTx, refreshProductRating, reviewEligibility } from "./order-ops";
import { NOTE } from "@/lib/system-notes";

const idSchema = z.string().min(1).max(40);

// ── Orders ──────────────────────────────────────────────────────────
export async function cancelOrderAction(orderNumber: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };
  const order = await db.order.findFirst({ where: { orderNumber: String(orderNumber), userId: user.id } });
  if (!order) return { message: "orders.errors.notFound" };
  if (!CUSTOMER_CANCELLABLE.includes(order.status as OrderStatus)) return { message: "orders.errors.notCancellable" };

  await db.$transaction((tx) => cancelOrderTx(tx, order.id, user.id, NOTE.CANCELLED_BY_CUSTOMER));
  revalidatePath("/[locale]/account", "layout");
  return { ok: true, message: "orders.cancelled" };
}

// ── Wishlist ────────────────────────────────────────────────────────
export async function toggleWishlistAction(productId: string): Promise<{ ok: boolean; saved?: boolean; reason?: "login" }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, reason: "login" };
  if (!idSchema.safeParse(productId).success) return { ok: false };
  const existing = await db.wishlistItem.findUnique({ where: { userId_productId: { userId: user.id, productId } } });
  if (existing) {
    await db.wishlistItem.delete({ where: { id: existing.id } });
    return { ok: true, saved: false };
  }
  const product = await db.product.findFirst({ where: { id: productId, isActive: true }, select: { id: true } });
  if (!product) return { ok: false };
  await db.wishlistItem.create({ data: { userId: user.id, productId } });
  return { ok: true, saved: true };
}

// ── Addresses ───────────────────────────────────────────────────────
export async function saveAddressAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const id = formData.get("id")?.toString() || null;
  const makeDefault = formData.get("isDefault") === "on";
  const a = parsed.data;
  const data = {
    label: a.label ?? "Home",
    fullName: a.fullName,
    phone: a.phone,
    governorate: a.governorate,
    wilayat: a.wilayat,
    area: a.area,
    street: a.street,
    building: a.building,
    way: a.way ?? null,
    notes: a.notes ?? null,
  };

  await db.$transaction(async (tx) => {
    const count = await tx.address.count({ where: { userId: user.id } });
    if (makeDefault || count === 0) await tx.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    if (id) {
      const owned = await tx.address.findFirst({ where: { id, userId: user.id } });
      if (!owned) throw new Error("not found");
      await tx.address.update({ where: { id }, data: { ...data, ...(makeDefault ? { isDefault: true } : {}) } });
    } else {
      await tx.address.create({ data: { ...data, userId: user.id, isDefault: makeDefault || count === 0 } });
    }
  });
  revalidatePath("/[locale]/account/addresses", "page");
  return { ok: true, message: "addresses.saved" };
}

export async function deleteAddressAction(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };
  const owned = await db.address.findFirst({ where: { id: String(id), userId: user.id } });
  if (!owned) return { message: "addresses.notFound" };
  await db.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: owned.id } });
    if (owned.isDefault) {
      const next = await tx.address.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });
  revalidatePath("/[locale]/account/addresses", "page");
  return { ok: true, message: "addresses.deleted" };
}

export async function setDefaultAddressAction(id: string): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };
  const owned = await db.address.findFirst({ where: { id: String(id), userId: user.id } });
  if (!owned) return { message: "addresses.notFound" };
  await db.$transaction([
    db.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } }),
    db.address.update({ where: { id: owned.id }, data: { isDefault: true } }),
  ]);
  revalidatePath("/[locale]/account/addresses", "page");
  return { ok: true };
}

// ── Notifications ───────────────────────────────────────────────────
export async function markNotificationReadAction(id: string) {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await db.notification.updateMany({ where: { id: String(id), userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

export async function markAllNotificationsReadAction() {
  const user = await getCurrentUser();
  if (!user) return { ok: false };
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/[locale]", "layout");
  return { ok: true };
}

// ── Profile ─────────────────────────────────────────────────────────
export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };
  const parsed = z.object({ name: nameSchema, phone: phoneSchema }).safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await db.user.update({ where: { id: user.id }, data: parsed.data });
  revalidatePath("/[locale]", "layout");
  return { ok: true, message: "account.profileSaved" };
}

// ── Reviews ─────────────────────────────────────────────────────────
const reviewSchema = z.object({
  productId: idSchema,
  rating: z.coerce.number({ invalid_type_error: "ratingRequired" }).int("ratingRequired").min(1, "ratingRequired").max(5, "ratingRequired"),
  title: z.string().trim().max(80, "tooLong").optional(),
  comment: z.string().trim().min(10, "reviewMin").max(1000, "tooLong"),
});

export async function submitReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { productId, rating, title, comment } = parsed.data;

  const elig = await reviewEligibility(user.id, productId);
  if (!elig.eligible) return { message: elig.reason === "already" ? "reviews.errors.already" : "reviews.errors.notDelivered" };

  const product = await db.$transaction(async (tx) => {
    await tx.review.create({ data: { productId, userId: user.id, orderId: elig.orderId, rating, title: title || null, comment, status: "PUBLISHED" } });
    await refreshProductRating(tx, productId);
    return tx.product.findUniqueOrThrow({ where: { id: productId }, select: { slug: true } });
  });
  revalidatePath(`/[locale]/product/${product.slug}`, "page");
  return { ok: true, message: "reviews.thanks" };
}
