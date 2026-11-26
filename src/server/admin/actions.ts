"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ORDER_FLOW, ROLES, STOCK_REASONS, type OrderStatus } from "@/lib/constants";
import { statusNotification } from "@/lib/notification-text";
import { emailSchema, fieldErrors, nameSchema, passwordSchema, phoneSchema, type ActionState } from "@/lib/validation";
import { toBaisa } from "@/lib/money";
import { guarded } from "./guard";
import { cancelOrderTx, refreshProductRating } from "../order-ops";
import { paymentReference } from "../checkout";
import { NOTE } from "@/lib/system-notes";

const id = z.string().min(1).max(40);
const revalidateAdmin = () => revalidatePath("/[locale]/admin", "layout");
const omr = (msg = "priceInvalid") =>
  z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,3})?$/, msg)
    .transform((v) => toBaisa(v));
const optionalOmr = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? v : undefined))
  .pipe(z.string().regex(/^\d{1,6}(\.\d{1,3})?$/, "priceInvalid").transform((v) => toBaisa(v)).optional());
const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

// ── Orders ──────────────────────────────────────────────────────────

/** Staff may move an order forward along the flow, or cancel it before delivery. */
export async function updateOrderStatusAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("STAFF", async (user) => {
    const parsed = z
      .object({ orderId: id, status: z.enum(["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]), note: z.string().trim().max(300).optional() })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { orderId, status, note } = parsed.data;
    const order = await db.order.findUnique({ where: { id: orderId } });
    if (!order) return { message: "admin.errors.notFound" };
    if (order.status === status) return { message: "admin.orders.sameStatus" };
    if (order.status === "CANCELLED" || order.status === "DELIVERED") return { message: "admin.orders.finalStatus" };

    if (status === "CANCELLED") {
      await db.$transaction((tx) => cancelOrderTx(tx, order.id, user.id, note || NOTE.CANCELLED_BY_STORE));
    } else {
      const from = ORDER_FLOW.indexOf(order.status as OrderStatus);
      const to = ORDER_FLOW.indexOf(status);
      if (to < from) return { message: "admin.orders.noBackwards" };
      if (order.paymentMethod === "CARD" && order.paymentStatus !== "PAID" && to > ORDER_FLOW.indexOf("PLACED")) {
        return { message: "admin.orders.awaitingCard" };
      }
      await db.$transaction(async (tx) => {
        const delivered = status === "DELIVERED";
        await tx.order.update({
          where: { id: order.id },
          data: { status, ...(delivered ? { deliveredAt: new Date() } : {}), ...(delivered && order.paymentMethod === "COD" ? { paymentStatus: "PAID" } : {}) },
        });
        await tx.orderStatusHistory.create({ data: { orderId: order.id, status, note: note || null, changedById: user.id } });
        // Cash on delivery is collected by the driver at hand-over.
        if (delivered && order.paymentMethod === "COD") {
          const pending = await tx.payment.findFirst({ where: { orderId: order.id, status: "PENDING" } });
          if (pending) await tx.payment.update({ where: { id: pending.id }, data: { status: "SUCCEEDED", createdAt: new Date() } });
          else await tx.payment.create({ data: { orderId: order.id, method: "COD", status: "SUCCEEDED", amount: order.total, reference: paymentReference() } });
        }
        await tx.notification.create({
          data: { userId: order.userId, type: "ORDER", ...statusNotification(status, order.orderNumber), link: `/account/orders/${order.orderNumber}` },
        });
      });
    }
    revalidateAdmin();
    return { ok: true, message: "admin.orders.statusUpdated" };
  });
}

// ── Products ────────────────────────────────────────────────────────
const specRow = z.object({ keyEn: z.string().trim().max(60), keyAr: z.string().trim().max(60), valueEn: z.string().trim().max(120), valueAr: z.string().trim().max(120) });

const productSchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().trim().min(2, "required").max(120, "tooLong"),
  nameAr: z.string().trim().min(2, "required").max(120, "tooLong"),
  descriptionEn: z.string().trim().min(10, "descMin").max(2000, "tooLong"),
  descriptionAr: z.string().trim().min(10, "descMin").max(2000, "tooLong"),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugInvalid").max(80, "tooLong"),
  sku: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{3,30}$/, "skuInvalid"),
  brand: z.string().trim().min(1, "required").max(60, "tooLong"),
  categoryId: id,
  price: omr(),
  compareAtPrice: optionalOmr,
  stock: z.coerce.number({ invalid_type_error: "numberInvalid" }).int("numberInvalid").min(0, "numberInvalid").max(100000, "numberInvalid").optional(),
  lowStockThreshold: z.coerce.number({ invalid_type_error: "numberInvalid" }).int("numberInvalid").min(0, "numberInvalid").max(1000, "numberInvalid"),
  isFeatured: checkbox,
  isActive: checkbox,
  images: z
    .string()
    .transform((v) => v.split(/\r?\n/).map((s) => s.trim()).filter(Boolean))
    .pipe(z.array(z.string().regex(/^(\/[\w\-./%?=&]*|https:\/\/[\w\-./%?=&:]+)$/, "imageInvalid")).min(1, "imageRequired").max(6, "tooLong")),
  specs: z
    .string()
    .transform((v, ctx) => {
      try {
        return JSON.parse(v || "[]");
      } catch {
        ctx.addIssue({ code: "custom", message: "invalid" });
        return z.NEVER;
      }
    })
    .pipe(z.array(specRow).max(20)),
});

export async function saveProductAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("STAFF", async (user) => {
    const parsed = productSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const d = parsed.data;
    if (d.compareAtPrice != null && d.compareAtPrice <= d.price) return { errors: { compareAtPrice: "compareAtInvalid" } };

    const clash = await db.product.findFirst({ where: { OR: [{ slug: d.slug }, { sku: d.sku }], NOT: d.id ? { id: d.id } : undefined }, select: { slug: true } });
    if (clash) return { errors: clash.slug === d.slug ? { slug: "slugTaken" } : { sku: "skuTaken" } };

    const data = {
      nameEn: d.nameEn,
      nameAr: d.nameAr,
      descriptionEn: d.descriptionEn,
      descriptionAr: d.descriptionAr,
      slug: d.slug,
      sku: d.sku,
      brand: d.brand,
      categoryId: d.categoryId,
      price: d.price,
      compareAtPrice: d.compareAtPrice ?? null,
      lowStockThreshold: d.lowStockThreshold,
      isFeatured: d.isFeatured,
      isActive: d.isActive,
      specs: JSON.stringify(d.specs.filter((s) => s.keyEn || s.keyAr)),
    };
    const images = d.images.map((url, i) => ({ url, altEn: `${d.nameEn} — view ${i + 1}`, altAr: `${d.nameAr} — صورة ${i + 1}`, sortOrder: i }));

    let productId = d.id;
    if (d.id) {
      await db.$transaction([
        db.product.update({ where: { id: d.id }, data }),
        db.productImage.deleteMany({ where: { productId: d.id } }),
        db.productImage.createMany({ data: images.map((im) => ({ ...im, productId: d.id! })) }),
      ]);
    } else {
      const stock = d.stock ?? 0;
      const created = await db.product.create({
        data: {
          ...data,
          stock,
          images: { create: images },
          stockMovements: { create: { change: stock, balanceAfter: stock, reason: "INITIAL", note: NOTE.OPENING_STOCK, userId: user.id } },
        },
      });
      productId = created.id;
    }
    revalidatePath("/[locale]", "layout");
    return { ok: true, message: "admin.products.saved", data: { id: productId! } };
  });
}

/** Products that appear on orders are archived (hidden) rather than deleted, to keep order history intact. */
export async function deleteProductAction(productId: string): Promise<ActionState> {
  return guarded("STAFF", async () => {
    const p = await db.product.findUnique({ where: { id: String(productId) }, include: { _count: { select: { orderItems: true } } } });
    if (!p) return { message: "admin.errors.notFound" };
    if (p._count.orderItems > 0) {
      await db.product.update({ where: { id: p.id }, data: { isActive: false } });
      revalidatePath("/[locale]", "layout");
      return { ok: true, message: "admin.products.archivedMsg" };
    }
    await db.product.delete({ where: { id: p.id } });
    revalidatePath("/[locale]", "layout");
    return { ok: true, message: "admin.products.deleted" };
  });
}

// ── Categories ──────────────────────────────────────────────────────
const categorySchema = z.object({
  id: z.string().optional(),
  nameEn: z.string().trim().min(2, "required").max(60, "tooLong"),
  nameAr: z.string().trim().min(2, "required").max(60, "tooLong"),
  descriptionEn: z.string().trim().max(300, "tooLong").default(""),
  descriptionAr: z.string().trim().max(300, "tooLong").default(""),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slugInvalid").max(60, "tooLong"),
  icon: z.string().trim().regex(/^[A-Za-z0-9]{2,40}$/, "invalid").default("Package"),
  sortOrder: z.coerce.number().int().min(0).max(999).default(0),
  isActive: checkbox,
});

export async function saveCategoryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("STAFF", async () => {
    const parsed = categorySchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { id: catId, ...data } = parsed.data;
    const clash = await db.category.findFirst({ where: { slug: data.slug, NOT: catId ? { id: catId } : undefined } });
    if (clash) return { errors: { slug: "slugTaken" } };
    if (catId) await db.category.update({ where: { id: catId }, data });
    else await db.category.create({ data });
    revalidatePath("/[locale]", "layout");
    return { ok: true, message: "admin.categories.saved" };
  });
}

export async function deleteCategoryAction(categoryId: string): Promise<ActionState> {
  return guarded("STAFF", async () => {
    const c = await db.category.findUnique({ where: { id: String(categoryId) }, include: { _count: { select: { products: true } } } });
    if (!c) return { message: "admin.errors.notFound" };
    if (c._count.products > 0) return { message: "admin.categories.hasProducts" };
    await db.category.delete({ where: { id: c.id } });
    revalidatePath("/[locale]", "layout");
    return { ok: true, message: "admin.categories.deleted" };
  });
}

// ── Inventory ───────────────────────────────────────────────────────
export async function adjustStockAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("STAFF", async (user) => {
    const parsed = z
      .object({
        productId: id,
        change: z.coerce.number({ invalid_type_error: "numberInvalid" }).int("numberInvalid").refine((v) => v !== 0, "changeZero").refine((v) => Math.abs(v) <= 100000, "numberInvalid"),
        reason: z.enum(STOCK_REASONS.filter((r) => !["SALE", "CANCELLATION", "INITIAL"].includes(r)) as [string, ...string[]], { errorMap: () => ({ message: "required" }) }),
        note: z.string().trim().max(200, "tooLong").optional(),
      })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { productId, change, reason, note } = parsed.data;

    try {
      await db.$transaction(async (tx) => {
        // Guarded update: never let stock go below zero.
        const res = await tx.product.updateMany({ where: { id: productId, ...(change < 0 ? { stock: { gte: -change } } : {}) }, data: { stock: { increment: change } } });
        if (res.count !== 1) throw new Error("NEGATIVE");
        const { stock } = await tx.product.findUniqueOrThrow({ where: { id: productId }, select: { stock: true } });
        await tx.stockMovement.create({ data: { productId, change, balanceAfter: stock, reason, note: note || null, userId: user.id } });
      });
    } catch (e) {
      if (e instanceof Error && e.message === "NEGATIVE") return { errors: { change: "stockNegative" } };
      throw e;
    }
    revalidatePath("/[locale]", "layout");
    return { ok: true, message: "admin.inventory.adjusted" };
  });
}

// ── Reviews ─────────────────────────────────────────────────────────
export async function setReviewStatusAction(reviewId: string, status: "PUBLISHED" | "HIDDEN"): Promise<ActionState> {
  return guarded("STAFF", async () => {
    if (!["PUBLISHED", "HIDDEN"].includes(status)) return { message: "admin.errors.invalid" };
    const r = await db.review.findUnique({ where: { id: String(reviewId) } });
    if (!r) return { message: "admin.errors.notFound" };
    await db.$transaction(async (tx) => {
      await tx.review.update({ where: { id: r.id }, data: { status } });
      await refreshProductRating(tx, r.productId);
    });
    revalidatePath("/[locale]", "layout");
    return { ok: true, message: status === "HIDDEN" ? "admin.reviews.hiddenMsg" : "admin.reviews.publishedMsg" };
  });
}

export async function deleteReviewAction(reviewId: string): Promise<ActionState> {
  return guarded("STAFF", async () => {
    const r = await db.review.findUnique({ where: { id: String(reviewId) } });
    if (!r) return { message: "admin.errors.notFound" };
    await db.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: r.id } });
      await refreshProductRating(tx, r.productId);
    });
    revalidatePath("/[locale]", "layout");
    return { ok: true, message: "admin.reviews.deletedMsg" };
  });
}

// ── Contact messages ────────────────────────────────────────────────
export async function setMessageStatusAction(messageId: string, status: string): Promise<ActionState> {
  return guarded("STAFF", async () => {
    if (!["NEW", "READ", "REPLIED", "ARCHIVED"].includes(status)) return { message: "admin.errors.invalid" };
    await db.contactMessage.update({ where: { id: String(messageId) }, data: { status } });
    revalidateAdmin();
    return { ok: true };
  });
}

// ── Coupons (ADMIN only) ────────────────────────────────────────────
const dateOrEmpty = z
  .string()
  .optional()
  .transform((v) => (v ? new Date(`${v}T00:00:00+04:00`) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), "dateInvalid");

const couponSchema = z
  .object({
    id: z.string().optional(),
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{3,20}$/, "codeInvalid"),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.string().trim().min(1, "required"),
    minOrder: optionalOmr,
    maxDiscount: optionalOmr,
    usageLimit: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : null))
      .refine((v) => v === null || (Number.isInteger(v) && v > 0), "numberInvalid"),
    startsAt: dateOrEmpty,
    expiresAt: dateOrEmpty,
    descriptionEn: z.string().trim().max(200, "tooLong").default(""),
    descriptionAr: z.string().trim().max(200, "tooLong").default(""),
    isActive: checkbox,
  })
  .superRefine((c, ctx) => {
    if (c.type === "PERCENT" && !/^\d{1,2}$/.test(c.value)) ctx.addIssue({ code: "custom", path: ["value"], message: "percentInvalid" });
    if (c.type === "FIXED" && !/^\d{1,6}(\.\d{1,3})?$/.test(c.value)) ctx.addIssue({ code: "custom", path: ["value"], message: "priceInvalid" });
    if (c.startsAt && c.expiresAt && c.expiresAt <= c.startsAt) ctx.addIssue({ code: "custom", path: ["expiresAt"], message: "dateOrder" });
  });

export async function saveCouponAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("ADMIN", async () => {
    const parsed = couponSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { id: couponId, value, ...c } = parsed.data;
    const data = {
      ...c,
      value: c.type === "PERCENT" ? Number(value) : toBaisa(value),
      minOrder: c.minOrder ?? 0,
      maxDiscount: c.maxDiscount ?? null,
    };
    const clash = await db.coupon.findFirst({ where: { code: data.code, NOT: couponId ? { id: couponId } : undefined } });
    if (clash) return { errors: { code: "codeTaken" } };
    if (couponId) await db.coupon.update({ where: { id: couponId }, data });
    else await db.coupon.create({ data });
    revalidateAdmin();
    return { ok: true, message: "admin.coupons.saved" };
  });
}

export async function toggleCouponAction(couponId: string): Promise<ActionState> {
  return guarded("ADMIN", async () => {
    const c = await db.coupon.findUnique({ where: { id: String(couponId) } });
    if (!c) return { message: "admin.errors.notFound" };
    await db.coupon.update({ where: { id: c.id }, data: { isActive: !c.isActive } });
    revalidateAdmin();
    return { ok: true, message: c.isActive ? "admin.coupons.deactivated" : "admin.coupons.activated" };
  });
}

// ── Users & roles (ADMIN only) ──────────────────────────────────────
export async function setUserRoleAction(userId: string, role: string): Promise<ActionState> {
  return guarded("ADMIN", async (me) => {
    if (!ROLES.includes(role as (typeof ROLES)[number])) return { message: "admin.errors.invalid" };
    if (userId === me.id) return { message: "admin.users.notSelf" };
    await db.user.update({ where: { id: String(userId) }, data: { role } });
    revalidateAdmin();
    return { ok: true, message: "admin.users.roleUpdated" };
  });
}

export async function toggleUserActiveAction(userId: string): Promise<ActionState> {
  return guarded("ADMIN", async (me) => {
    if (userId === me.id) return { message: "admin.users.notSelf" };
    const u = await db.user.findUnique({ where: { id: String(userId) } });
    if (!u) return { message: "admin.errors.notFound" };
    await db.user.update({ where: { id: u.id }, data: { isActive: !u.isActive } });
    revalidateAdmin();
    return { ok: true, message: u.isActive ? "admin.users.deactivated" : "admin.users.activated" };
  });
}

export async function createStaffAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  return guarded("ADMIN", async () => {
    const parsed = z
      .object({ name: nameSchema, email: emailSchema, phone: phoneSchema, password: passwordSchema, role: z.enum(["STAFF", "ADMIN"]) })
      .safeParse(Object.fromEntries(formData));
    if (!parsed.success) return { errors: fieldErrors(parsed.error) };
    const { password, ...d } = parsed.data;
    if (await db.user.findUnique({ where: { email: d.email } })) return { errors: { email: "emailTaken" } };
    await db.user.create({ data: { ...d, passwordHash: await bcrypt.hash(password, 12) } });
    revalidateAdmin();
    return { ok: true, message: "admin.users.created" };
  });
}
