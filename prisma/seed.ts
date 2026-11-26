/* eslint-disable no-console */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { categories, customers, products, reviewTexts } from "./seed-data";
import { categorySvg, productSvg } from "../src/lib/product-art";
import { computeTotals, evaluateCoupon, subtotalOf } from "../src/lib/pricing";
import { ORDER_FLOW, type OrderStatus } from "../src/lib/constants";

const prisma = new PrismaClient();

// Deterministic PRNG so every seed produces the same demo data.
let s = 20260520;
const rand = () => {
  s |= 0;
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const now = new Date();
const daysAgo = (d: number, h = 0) => new Date(now.getTime() - d * DAY - h * HOUR);
const txnRef = (d: Date) => `TXN-${d.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(rand() * 1e6).toString().padStart(6, "0")}`;

const arabicReviews = [
  { rating: 5, title: "منتج ممتاز", text: "جودة عالية ووصل الطلب إلى صحار خلال يومين. أنصح به بشدة." },
  { rating: 4, title: "جيد جداً", text: "المنتج مطابق للوصف، والتوصيل كان سريعاً والسائق متعاون." },
  { rating: 5, title: "خدمة رائعة", text: "تعامل راقٍ من فريق خدمة العملاء، وسعر مناسب جداً." },
];

async function wipe() {
  // Children first so foreign keys are never violated.
  await prisma.notification.deleteMany();
  await prisma.review.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderStatusHistory.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.wishlistItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.address.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.loginAttempt.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.newsletterSubscriber.deleteMany();
  await prisma.user.deleteMany();
}

function writeImages() {
  const pdir = join(process.cwd(), "public", "images", "products");
  const cdir = join(process.cwd(), "public", "images", "categories");
  mkdirSync(pdir, { recursive: true });
  mkdirSync(cdir, { recursive: true });
  for (const c of categories) writeFileSync(join(cdir, `${c.slug}.svg`), categorySvg(c.icon, c.colors));
  for (const p of products) {
    const colors = categories.find((c) => c.slug === p.category)!.colors;
    ([0, 1, 2] as const).forEach((v) => writeFileSync(join(pdir, `${p.slug}-${v + 1}.svg`), productSvg(p.icon, colors, v)));
  }
}

import { statusNotification } from "../src/lib/notification-text";
import { NOTE } from "../src/lib/system-notes";

async function main() {
  console.log("Seeding Wadi Al Ghubaitah demo data…");
  await wipe();
  writeImages();

  // ── Users ──────────────────────────────────────────────────────────
  const [adminHash, staffHash, customerHash] = await Promise.all([
    bcrypt.hash("Admin@12345", 10),
    bcrypt.hash("Staff@12345", 10),
    bcrypt.hash("Customer@12345", 10),
  ]);
  await prisma.user.create({
    data: { name: "Ahmed Al Ghubaiti", email: "admin@wadialghubaitah.test", phone: "+96824000001", passwordHash: adminHash, role: "ADMIN", createdAt: daysAgo(180) },
  });
  const staff = await prisma.user.create({
    data: { name: "Rashid Al Saadi", email: "staff@wadialghubaitah.test", phone: "+96824000002", passwordHash: staffHash, role: "STAFF", createdAt: daysAgo(170) },
  });

  const customerUsers = [];
  for (const [i, c] of customers.entries()) {
    const u = await prisma.user.create({
      data: {
        name: c.name,
        email: c.email,
        phone: c.phone,
        passwordHash: customerHash, // every demo customer shares the demo password
        role: "CUSTOMER",
        createdAt: daysAgo(i === 0 ? 90 : int(62, 150)),
        addresses: {
          create: {
            label: "Home",
            fullName: c.name,
            phone: c.phone,
            governorate: c.gov,
            wilayat: c.wilayat,
            area: c.area,
            street: `Street ${int(10, 99)}`,
            building: `Villa ${int(1, 250)}`,
            way: String(int(100, 999)),
            isDefault: true,
          },
        },
      },
      include: { addresses: true },
    });
    customerUsers.push(u);
  }
  const demoCustomer = customerUsers[0];
  await prisma.address.create({
    data: {
      userId: demoCustomer.id, label: "Office", fullName: demoCustomer.name, phone: demoCustomer.phone,
      governorate: "muscat", wilayat: "Al Seeb", area: "Al Khoudh", street: "Sultan Qaboos University Street",
      building: "Building 12, Floor 2", way: "4512",
    },
  });

  // ── Catalogue ──────────────────────────────────────────────────────
  const catIds: Record<string, string> = {};
  for (const [i, c] of categories.entries()) {
    const cat = await prisma.category.create({
      data: { slug: c.slug, nameEn: c.nameEn, nameAr: c.nameAr, descriptionEn: c.descriptionEn, descriptionAr: c.descriptionAr, icon: c.icon, sortOrder: i },
    });
    catIds[c.slug] = cat.id;
  }

  const productRows = [];
  for (const [i, p] of products.entries()) {
    const specs = [
      { keyEn: "Brand", keyAr: "العلامة التجارية", valueEn: p.brand, valueAr: p.brand },
      ...p.specs.map(([keyEn, keyAr, valueEn, valueAr]) => ({ keyEn, keyAr, valueEn, valueAr })),
      p.warranty
        ? { keyEn: "Warranty", keyAr: "الضمان", valueEn: `${p.warranty} year${p.warranty > 1 ? "s" : ""}`, valueAr: p.warranty === 1 ? "سنة واحدة" : p.warranty === 2 ? "سنتان" : `${p.warranty} سنوات` }
        : null,
    ].filter(Boolean);
    const row = await prisma.product.create({
      data: {
        slug: p.slug,
        sku: `WG-${p.category.slice(0, 3).toUpperCase()}-${String(1001 + i)}`,
        nameEn: p.nameEn,
        nameAr: p.nameAr,
        descriptionEn: p.descEn,
        descriptionAr: p.descAr,
        brand: p.brand,
        price: p.price,
        compareAtPrice: p.compareAt ?? null,
        stock: p.stock,
        lowStockThreshold: 5,
        specs: JSON.stringify(specs),
        categoryId: catIds[p.category],
        isFeatured: !!p.featured,
        // Spread creation dates so "newest" sorting and "new arrivals" are meaningful.
        createdAt: daysAgo(i % 7 === 6 ? int(61, 64) : int(65, 140)),
        images: {
          create: [1, 2, 3].map((n) => ({
            url: `/images/products/${p.slug}-${n}.svg`,
            altEn: `${p.nameEn} — view ${n}`,
            altAr: `${p.nameAr} — صورة ${n}`,
            sortOrder: n - 1,
          })),
        },
      },
    });
    productRows.push(row);
  }

  // ── Coupons ────────────────────────────────────────────────────────
  const welcome = await prisma.coupon.create({
    data: {
      code: "WELCOME10", type: "PERCENT", value: 10, minOrder: 10_000, maxDiscount: 25_000,
      descriptionEn: "10% off your order (minimum OMR 10.000, up to OMR 25.000 off)",
      descriptionAr: "خصم 10% على طلبك (حد أدنى 10.000 ر.ع. وبحد أقصى 25.000 ر.ع.)",
      startsAt: daysAgo(120), expiresAt: new Date(now.getTime() + 365 * DAY), usageLimit: 500,
    },
  });
  const oman5 = await prisma.coupon.create({
    data: {
      code: "OMAN5", type: "FIXED", value: 5_000, minOrder: 30_000,
      descriptionEn: "OMR 5.000 off orders of OMR 30.000 or more",
      descriptionAr: "خصم 5.000 ر.ع. على الطلبات بقيمة 30.000 ر.ع. أو أكثر",
      startsAt: daysAgo(120), expiresAt: new Date(now.getTime() + 180 * DAY), usageLimit: 200,
    },
  });
  const couponUse: Record<string, number> = { [welcome.id]: 0, [oman5.id]: 0 };

  // ── Orders (46 over the last 60 days) ──────────────────────────────
  const ORDER_COUNT = 46;
  const ages = Array.from({ length: ORDER_COUNT }, (_, i) => (i < 15 ? rand() * 6 : 6 + rand() * 53.5)).sort((a, b) => a - b);
  // Newest orders are still in progress; older ones are delivered or cancelled.
  const inProgress: OrderStatus[] = ["PLACED", "PLACED", "PLACED", "CONFIRMED", "CONFIRMED", "CONFIRMED", "PROCESSING", "PROCESSING", "PROCESSING", "SHIPPED", "SHIPPED", "SHIPPED", "OUT_FOR_DELIVERY", "OUT_FOR_DELIVERY", "OUT_FOR_DELIVERY"];
  const cancelledIdx = new Set([18, 25, 33, 41]);
  // Demo customer: placed, shipped, two delivered and one cancelled order.
  const demoIdx = new Set([1, 10, 20, 25, 30]);

  type Ledger = { at: Date; change: number; reason: string; orderId?: string; note?: string };
  const ledger: Record<string, Ledger[]> = Object.fromEntries(productRows.map((p) => [p.id, []]));
  const sold: Record<string, number> = {};
  const inStock = productRows.filter((p) => p.stock > 0);

  // Insert oldest first so order numbers increase with time.
  const plan = ages.map((age, i) => ({ age, i })).reverse();
  let seq = 10001;
  const reviewCandidates: { userId: string; productId: string; orderId: string; at: Date }[] = [];

  for (const { age, i } of plan) {
    const status: OrderStatus = i < inProgress.length ? inProgress[i] : cancelledIdx.has(i) ? "CANCELLED" : "DELIVERED";
    const user = demoIdx.has(i) ? demoCustomer : pick(customerUsers.slice(1));
    const address = user.addresses[0];
    const createdAt = new Date(now.getTime() - age * DAY);

    const lineCount = int(1, 4);
    const chosen = new Map<string, { p: (typeof productRows)[number]; qty: number }>();
    while (chosen.size < lineCount) {
      const p = pick(inStock);
      const bulky = p.price < 3_000;
      chosen.set(p.id, { p, qty: bulky ? int(2, 10) : int(1, 2) });
    }
    const lines = [...chosen.values()].map(({ p, qty }) => ({ p, qty, unitPrice: p.price }));
    const subtotal = subtotalOf(lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.qty })));

    let coupon: typeof welcome | null = null;
    if (rand() < 0.2) coupon = subtotal >= 30_000 && rand() < 0.5 ? oman5 : welcome;
    const evalRes = coupon ? evaluateCoupon(coupon, subtotal, createdAt) : null;
    if (coupon && !evalRes?.ok) coupon = null;
    const discount = evalRes?.ok ? evalRes.discount : 0;
    const deliveryMethod = rand() < 0.25 ? "EXPRESS" : "STANDARD";
    const totals = computeTotals({ subtotal, discount, deliveryMethod });
    if (coupon) couponUse[coupon.id]++;

    const paymentMethod = rand() < 0.6 ? "CARD" : "COD";
    const flowIndex = status === "CANCELLED" ? int(0, 1) : ORDER_FLOW.indexOf(status);
    const steps: { status: OrderStatus; at: Date }[] = [];
    let t = createdAt.getTime();
    for (let k = 0; k <= flowIndex; k++) {
      steps.push({ status: ORDER_FLOW[k], at: new Date(t) });
      t += (k === 0 ? int(1, 5) : int(8, 30)) * HOUR;
      if (t > now.getTime()) t = now.getTime() - (flowIndex - k) * 60_000;
    }
    if (status === "CANCELLED") steps.push({ status: "CANCELLED", at: new Date(Math.min(t, now.getTime())) });
    const last = steps[steps.length - 1];

    // Payment transactions.
    const payments: { method: string; status: string; amount: number; cardLast4?: string; cardHolder?: string; failureReason?: string; createdAt: Date }[] = [];
    let paymentStatus = "PENDING";
    const forceFailed = status === "PLACED" && i === 2; // one recent card order with a declined card
    if (paymentMethod === "CARD") {
      const card = { cardLast4: "4242", cardHolder: user.name.toUpperCase() };
      if (forceFailed || rand() < 0.12) {
        payments.push({ method: "CARD", status: "FAILED", amount: totals.total, cardLast4: "0002", cardHolder: card.cardHolder, failureReason: "card_declined", createdAt: new Date(createdAt.getTime() + 2 * 60_000) });
      }
      if (forceFailed) {
        paymentStatus = "FAILED";
      } else if (status === "PLACED") {
        // A successful card payment confirms the order, so PLACED card orders are still awaiting payment.
        paymentStatus = "PENDING";
      } else {
        payments.push({ method: "CARD", status: "SUCCEEDED", amount: totals.total, ...card, createdAt: new Date(createdAt.getTime() + 5 * 60_000) });
        paymentStatus = "PAID";
        if (status === "CANCELLED") {
          payments.push({ method: "CARD", status: "REFUNDED", amount: totals.total, ...card, createdAt: last.at });
          paymentStatus = "REFUNDED";
        }
      }
    } else {
      if (status === "DELIVERED") {
        payments.push({ method: "COD", status: "SUCCEEDED", amount: totals.total, createdAt: last.at });
        paymentStatus = "PAID";
      } else if (status === "CANCELLED") {
        payments.push({ method: "COD", status: "VOID", amount: totals.total, createdAt: last.at });
        paymentStatus = "VOID";
      } else {
        payments.push({ method: "COD", status: "PENDING", amount: totals.total, createdAt });
      }
    }

    // Status "PLACED" with a failed card stays PLACED; successful card payments confirm the order.
    const orderNumber = `WG-${seq++}`;
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status,
        paymentMethod,
        paymentStatus,
        deliveryMethod,
        ...totals,
        couponId: coupon?.id ?? null,
        couponCode: coupon?.code ?? null,
        shipName: address.fullName,
        shipPhone: address.phone,
        governorate: address.governorate,
        wilayat: address.wilayat,
        area: address.area,
        street: address.street,
        building: address.building,
        way: address.way,
        deliveredAt: status === "DELIVERED" ? last.at : null,
        cancelledAt: status === "CANCELLED" ? last.at : null,
        createdAt,
        updatedAt: last.at,
        items: {
          create: lines.map((l) => ({
            productId: l.p.id, nameEn: l.p.nameEn, nameAr: l.p.nameAr, sku: l.p.sku,
            unitPrice: l.unitPrice, quantity: l.qty, lineTotal: l.unitPrice * l.qty,
          })),
        },
        history: {
          create: steps.map((st, k) => ({
            status: st.status,
            createdAt: st.at,
            changedById: k === 0 ? null : staff.id,
            note: st.status === "CANCELLED" ? NOTE.CANCELLED_BY_CUSTOMER : null,
          })),
        },
        payments: {
          create: payments.map((p) => ({ ...p, reference: txnRef(p.createdAt) })),
        },
      },
    });

    for (const l of lines) {
      ledger[l.p.id].push({ at: createdAt, change: -l.qty, reason: "SALE", orderId: order.id });
      if (status === "CANCELLED") ledger[l.p.id].push({ at: last.at, change: l.qty, reason: "CANCELLATION", orderId: order.id });
      else sold[l.p.id] = (sold[l.p.id] ?? 0) + l.qty;
      if (status === "DELIVERED") reviewCandidates.push({ userId: user.id, productId: l.p.id, orderId: order.id, at: new Date(last.at.getTime() + int(1, 4) * DAY) });
    }

    // Notifications: every status change notifies the customer.
    const notes = steps.map((st) => ({
      userId: user.id,
      type: "ORDER",
      ...statusNotification(st.status, orderNumber),
      link: `/account/orders/${orderNumber}`,
      createdAt: st.at,
      readAt: now.getTime() - st.at.getTime() > 2 * DAY ? new Date(st.at.getTime() + HOUR) : null,
    }));
    if (paymentStatus === "FAILED") {
      notes.push({
        userId: user.id, type: "PAYMENT",
        titleEn: "Payment unsuccessful", titleAr: "تعذّرت عملية الدفع",
        bodyEn: `The card payment for order ${orderNumber} was declined. You can retry or choose cash on delivery.`,
        bodyAr: `رُفضت عملية الدفع بالبطاقة للطلب ${orderNumber}. يمكنك إعادة المحاولة أو اختيار الدفع عند الاستلام.`,
        link: `/checkout/payment/${orderNumber}`, createdAt: new Date(createdAt.getTime() + 2 * 60_000), readAt: null,
      });
    }
    await prisma.notification.createMany({ data: notes });
  }

  // ── Stock ledger: INITIAL + optional RESTOCK, then sales/cancellations ──
  for (const p of productRows) {
    const net = sold[p.id] ?? 0;
    const restock = p.stock >= 20 && rand() < 0.5 ? 20 : 0;
    const initial = p.stock + net - restock;
    const events: Ledger[] = [
      { at: p.createdAt, change: initial, reason: "INITIAL", note: NOTE.OPENING_STOCK },
      ...(restock ? [{ at: daysAgo(int(20, 40)), change: restock, reason: "RESTOCK", note: NOTE.SUPPLIER_DELIVERY }] : []),
      ...ledger[p.id],
    ].sort((a, b) => a.at.getTime() - b.at.getTime());
    let balance = 0;
    const rows = events.map((e) => {
      balance += e.change;
      return { productId: p.id, change: e.change, balanceAfter: balance, reason: e.reason, orderId: e.orderId ?? null, note: e.note ?? null, createdAt: e.at, userId: e.reason === "RESTOCK" ? staff.id : null };
    });
    await prisma.stockMovement.createMany({ data: rows });
    if (balance !== p.stock) throw new Error(`Stock ledger mismatch for ${p.slug}: ${balance} != ${p.stock}`);
    await prisma.product.update({ where: { id: p.id }, data: { soldCount: net } });
  }

  // ── Reviews (only for delivered purchases, one per user/product) ───
  const seen = new Set<string>();
  // Keep one delivered product unreviewed for the demo customer so reviewing can be tried.
  const demoCandidates = reviewCandidates.filter((r) => r.userId === demoCustomer.id);
  const keepOpen = demoCandidates[0] ? `${demoCandidates[0].userId}:${demoCandidates[0].productId}` : "";
  for (const r of reviewCandidates) {
    const key = `${r.userId}:${r.productId}`;
    if (seen.has(key) || key === keepOpen || rand() < 0.3) continue;
    seen.add(key);
    const useArabic = rand() < 0.3;
    const src = useArabic ? pick(arabicReviews) : pick(reviewTexts);
    await prisma.review.create({
      data: {
        productId: r.productId, userId: r.userId, orderId: r.orderId,
        rating: src.rating,
        title: "title" in src ? src.title : src.titleEn,
        comment: "text" in src ? src.text : src.en,
        status: src.rating <= 2 && rand() < 0.5 ? "HIDDEN" : "PUBLISHED",
        createdAt: r.at > now ? now : r.at,
      },
    });
  }
  for (const p of productRows) {
    const agg = await prisma.review.aggregate({ where: { productId: p.id, status: "PUBLISHED" }, _avg: { rating: true }, _count: true });
    await prisma.product.update({ where: { id: p.id }, data: { ratingAvg: agg._avg.rating ?? 0, ratingCount: agg._count } });
  }

  for (const [id, used] of Object.entries(couponUse)) await prisma.coupon.update({ where: { id }, data: { usedCount: used } });

  // ── Wishlist, welcome notification, contact messages, newsletter ───
  for (const slug of ["falaj-split-ac-1-5-ton", "arabic-coffee-maker-dallah", "rain-shower-set"]) {
    const p = productRows.find((x) => x.slug === slug)!;
    await prisma.wishlistItem.create({ data: { userId: demoCustomer.id, productId: p.id } });
  }
  await prisma.notification.create({
    data: {
      userId: demoCustomer.id, type: "SYSTEM",
      titleEn: "Welcome to Wadi Al Ghubaitah", titleAr: "أهلاً بك في وادي الغبيطة",
      bodyEn: "Use code WELCOME10 for 10% off your next order.", bodyAr: "استخدم الرمز WELCOME10 للحصول على خصم 10% على طلبك القادم.",
      link: "/shop", createdAt: daysAgo(89), readAt: daysAgo(88),
    },
  });
  await prisma.contactMessage.createMany({
    data: [
      { name: "Badr Al Hosni", email: "badr.hosni@example.test", phone: "+96890011223", subject: "Bulk order for a villa project", message: "We are building four villas in Al Amerat and need quotations for cement, blocks and tiles. Could your sales team contact me?", status: "NEW", createdAt: daysAgo(1) },
      { name: "Sara Al Farsi", email: "sara.farsi@example.test", subject: "Delivery to Duqm", message: "Do you deliver large appliances to Duqm, and how long does it usually take?", status: "READ", createdAt: daysAgo(4) },
      { name: "منى البلوشية", email: "muna.b@example.test", phone: "+96899887766", subject: "استفسار عن الضمان", message: "اشتريت مكيفاً من متجركم، وأود معرفة طريقة تفعيل الضمان وخدمة الصيانة.", status: "REPLIED", createdAt: daysAgo(9) },
      { name: "Tariq Al Wahaibi", email: "tariq.w@example.test", subject: "Installation service", message: "Do you offer installation for the split air conditioners?", status: "NEW", createdAt: daysAgo(0, 5) },
      { name: "Ruqaiya Al Jabri", email: "ruqaiya.j@example.test", subject: "Invoice copy", message: "Please send me a VAT invoice for my last order.", status: "ARCHIVED", createdAt: daysAgo(30) },
    ],
  });
  await prisma.newsletterSubscriber.createMany({
    data: ["newsletter1@example.test", "newsletter2@example.test", "fatma.rawahi@example.test"].map((email) => ({ email })),
  });

  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    orders: await prisma.order.count(),
    payments: await prisma.payment.count(),
    reviews: await prisma.review.count(),
    notifications: await prisma.notification.count(),
    coupons: await prisma.coupon.count(),
    lowStock: await prisma.product.count({ where: { stock: { gt: 0, lte: 5 } } }),
    outOfStock: await prisma.product.count({ where: { stock: 0 } }),
  };
  const byStatus = await prisma.order.groupBy({ by: ["status"], _count: true });
  console.table(counts);
  console.log("Orders by status:", Object.fromEntries(byStatus.map((r) => [r.status, r._count])));
  console.log("\nDemo accounts:");
  console.table([
    { role: "ADMIN", email: "admin@wadialghubaitah.test", password: "Admin@12345" },
    { role: "STAFF", email: "staff@wadialghubaitah.test", password: "Staff@12345" },
    { role: "CUSTOMER", email: "customer@wadialghubaitah.test", password: "Customer@12345" },
  ]);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
