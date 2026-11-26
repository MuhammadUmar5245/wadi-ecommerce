import "server-only";
import { getTranslations } from "next-intl/server";
import { db } from "@/lib/db";
import { dayKeys, muscatDayKey, parseRange } from "@/lib/dates";
import { loc } from "@/lib/i18n-utils";
import { governorateName, wilayatName, GOVERNORATES, ORDER_STATUSES, TXN_STATUSES, type Role } from "@/lib/constants";

export const REPORTS = ["sales", "inventory", "customer-orders", "payments", "delivery"] as const;
export type ReportKey = (typeof REPORTS)[number];

/** Financial reports are restricted to administrators. */
export const REPORT_MIN_ROLE: Record<ReportKey, Role> = {
  sales: "ADMIN",
  inventory: "STAFF",
  "customer-orders": "STAFF",
  payments: "ADMIN",
  delivery: "STAFF",
};

export const isReportKey = (v: string): v is ReportKey => (REPORTS as readonly string[]).includes(v);

export type CellType = "text" | "money" | "int" | "date" | "datetime" | "pct" | "orderStatus" | "txnStatus" | "code";
export type Column = { key: string; label: string; type: CellType; align?: "end" };
export type Row = Record<string, string | number | Date | null>;
export type Summary = { label: string; value: number; type: "money" | "int" | "pct" | "hours"; hint?: string };
export type Chart =
  | { kind: "column"; title: string; data: Record<string, string | number>[]; series: { key: string; label: string }[]; money: boolean; stacked?: boolean }
  | { kind: "ranked"; title: string; data: { name: string; value: number }[]; money: boolean }
  | { kind: "donut"; title: string; data: { key: string; label: string; value: number }[]; money: boolean };

export type Report = {
  key: ReportKey;
  title: string;
  description: string;
  from: string;
  to: string;
  summary: Summary[];
  charts: Chart[];
  columns: Column[];
  rows: Row[];
  totals?: Row;
};

const shortDay = (key: string, locale: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString(locale === "ar" ? "ar-OM-u-nu-latn" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

export async function buildReport(key: ReportKey, locale: string, fromParam?: string, toParam?: string): Promise<Report> {
  const range = parseRange(fromParam, toParam, 30);
  const t = await getTranslations({ locale, namespace: "reports" });
  const ts = await getTranslations({ locale, namespace: "orderStatus" });
  const tp = await getTranslations({ locale, namespace: "paymentStatus" });
  const base = { key, title: t(`${key}.title`), description: t(`${key}.description`), from: range.from, to: range.to };
  const inRange = { gte: range.gte, lt: range.lt };

  // ── 1. Sales ─────────────────────────────────────────────────────────
  if (key === "sales") {
    const orders = await db.order.findMany({
      where: { createdAt: inRange, status: { not: "CANCELLED" } },
      select: { createdAt: true, subtotal: true, discount: true, deliveryFee: true, vat: true, total: true, items: { select: { quantity: true, lineTotal: true, product: { select: { category: true } } } } },
    });
    const cancelled = await db.order.count({ where: { createdAt: inRange, status: "CANCELLED" } });
    const sum = (k: "subtotal" | "discount" | "deliveryFee" | "vat" | "total") => orders.reduce((s, o) => s + o[k], 0);
    const days = new Map(dayKeys(range.from, range.to).map((d) => [d, { orders: 0, units: 0, subtotal: 0, discount: 0, deliveryFee: 0, vat: 0, total: 0 }]));
    const byCategory = new Map<string, number>();
    for (const o of orders) {
      const d = days.get(muscatDayKey(o.createdAt))!;
      d.orders++;
      d.subtotal += o.subtotal;
      d.discount += o.discount;
      d.deliveryFee += o.deliveryFee;
      d.vat += o.vat;
      d.total += o.total;
      for (const i of o.items) {
        d.units += i.quantity;
        const name = loc(locale, i.product.category.nameEn, i.product.category.nameAr);
        byCategory.set(name, (byCategory.get(name) ?? 0) + i.lineTotal);
      }
    }
    const rows: Row[] = [...days.entries()].map(([day, v]) => ({ day, ...v }));
    const total = sum("total");
    return {
      ...base,
      summary: [
        { label: t("sales.net"), value: total, type: "money", hint: t("sales.netHint") },
        { label: t("sales.gross"), value: sum("subtotal"), type: "money" },
        { label: t("sales.discounts"), value: sum("discount"), type: "money" },
        { label: t("sales.vat"), value: sum("vat"), type: "money" },
        { label: t("sales.orders"), value: orders.length, type: "int", hint: t("sales.cancelledHint", { count: cancelled }) },
        { label: t("sales.aov"), value: orders.length ? Math.round(total / orders.length) : 0, type: "money" },
      ],
      charts: [
        { kind: "column", title: t("sales.chartDaily"), money: true, data: rows.map((r) => ({ label: shortDay(String(r.day), locale), total: Number(r.total) })), series: [{ key: "total", label: t("cols.total") }] },
        { kind: "ranked", title: t("sales.chartCategory"), money: true, data: [...byCategory.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })) },
      ],
      columns: [
        { key: "day", label: t("cols.date"), type: "date" },
        { key: "orders", label: t("cols.orders"), type: "int", align: "end" },
        { key: "units", label: t("cols.units"), type: "int", align: "end" },
        { key: "subtotal", label: t("cols.gross"), type: "money", align: "end" },
        { key: "discount", label: t("cols.discount"), type: "money", align: "end" },
        { key: "deliveryFee", label: t("cols.delivery"), type: "money", align: "end" },
        { key: "vat", label: t("cols.vat"), type: "money", align: "end" },
        { key: "total", label: t("cols.total"), type: "money", align: "end" },
      ],
      rows,
      totals: {
        day: t("cols.totalRow"),
        orders: orders.length,
        units: rows.reduce((s, r) => s + Number(r.units), 0),
        subtotal: sum("subtotal"),
        discount: sum("discount"),
        deliveryFee: sum("deliveryFee"),
        vat: sum("vat"),
        total,
      },
    };
  }

  // ── 2. Product inventory ─────────────────────────────────────────────
  if (key === "inventory") {
    const products = await db.product.findMany({ where: { isActive: true }, include: { category: true }, orderBy: [{ category: { sortOrder: "asc" } }, { nameEn: "asc" }] });
    const moves = await db.stockMovement.groupBy({ by: ["productId", "reason"], where: { createdAt: inRange }, _sum: { change: true } });
    const moved = (id: string, reason: string) => moves.find((m) => m.productId === id && m.reason === reason)?._sum.change ?? 0;
    const rows: Row[] = products.map((p) => {
      const status = p.stock === 0 ? t("inventory.out") : p.stock <= p.lowStockThreshold ? t("inventory.low") : t("inventory.ok");
      return {
        product: loc(locale, p.nameEn, p.nameAr),
        sku: p.sku,
        category: loc(locale, p.category.nameEn, p.category.nameAr),
        stock: p.stock,
        threshold: p.lowStockThreshold,
        status,
        sold: -(moved(p.id, "SALE") + moved(p.id, "CANCELLATION")),
        restocked: moved(p.id, "RESTOCK") + moved(p.id, "RETURN"),
        price: p.price,
        value: p.stock * p.price,
      };
    });
    const catValue = new Map<string, { onHand: number; sold: number }>();
    for (const r of rows) {
      const c = catValue.get(String(r.category)) ?? { onHand: 0, sold: 0 };
      c.onHand += Number(r.stock);
      c.sold += Number(r.sold);
      catValue.set(String(r.category), c);
    }
    return {
      ...base,
      summary: [
        { label: t("inventory.skus"), value: products.length, type: "int" },
        { label: t("inventory.units"), value: rows.reduce((s, r) => s + Number(r.stock), 0), type: "int" },
        { label: t("inventory.value"), value: rows.reduce((s, r) => s + Number(r.value), 0), type: "money", hint: t("inventory.valueHint") },
        { label: t("inventory.sold"), value: rows.reduce((s, r) => s + Number(r.sold), 0), type: "int", hint: t("inventory.soldHint") },
        { label: t("inventory.lowCount"), value: products.filter((p) => p.stock > 0 && p.stock <= p.lowStockThreshold).length, type: "int" },
        { label: t("inventory.outCount"), value: products.filter((p) => p.stock === 0).length, type: "int" },
      ],
      charts: [
        {
          kind: "column",
          title: t("inventory.chartCategory"),
          money: false,
          data: [...catValue.entries()].map(([label, v]) => ({ label, onHand: v.onHand, sold: v.sold })),
          series: [
            { key: "onHand", label: t("cols.onHand") },
            { key: "sold", label: t("cols.sold") },
          ],
        },
      ],
      columns: [
        { key: "product", label: t("cols.product"), type: "text" },
        { key: "sku", label: t("cols.sku"), type: "code" },
        { key: "category", label: t("cols.category"), type: "text" },
        { key: "stock", label: t("cols.onHand"), type: "int", align: "end" },
        { key: "threshold", label: t("cols.threshold"), type: "int", align: "end" },
        { key: "status", label: t("cols.status"), type: "text" },
        { key: "sold", label: t("cols.sold"), type: "int", align: "end" },
        { key: "restocked", label: t("cols.restocked"), type: "int", align: "end" },
        { key: "price", label: t("cols.price"), type: "money", align: "end" },
        { key: "value", label: t("cols.value"), type: "money", align: "end" },
      ],
      rows,
    };
  }

  // ── 3. Customer orders ───────────────────────────────────────────────
  if (key === "customer-orders") {
    const orders = await db.order.findMany({
      where: { createdAt: inRange },
      select: { userId: true, status: true, total: true, createdAt: true, governorate: true, user: { select: { name: true, email: true, createdAt: true } } },
    });
    const byUser = new Map<string, { name: string; email: string; governorate: string; orders: number; cancelled: number; spent: number; last: Date; isNew: boolean }>();
    for (const o of orders) {
      const u = byUser.get(o.userId) ?? { name: o.user.name, email: o.user.email, governorate: o.governorate, orders: 0, cancelled: 0, spent: 0, last: o.createdAt, isNew: o.user.createdAt >= range.gte };
      u.orders++;
      if (o.status === "CANCELLED") u.cancelled++;
      else u.spent += o.total;
      if (o.createdAt > u.last) {
        u.last = o.createdAt;
        u.governorate = o.governorate;
      }
      byUser.set(o.userId, u);
    }
    const list = [...byUser.values()].sort((a, b) => b.spent - a.spent);
    const spent = list.reduce((s, u) => s + u.spent, 0);
    const live = orders.filter((o) => o.status !== "CANCELLED").length;
    return {
      ...base,
      summary: [
        { label: t("customer-orders.customers"), value: list.length, type: "int" },
        { label: t("customer-orders.orders"), value: orders.length, type: "int" },
        { label: t("customer-orders.repeat"), value: list.filter((u) => u.orders > 1).length, type: "int", hint: t("customer-orders.repeatHint") },
        { label: t("customer-orders.new"), value: list.filter((u) => u.isNew).length, type: "int" },
        { label: t("customer-orders.spent"), value: spent, type: "money" },
        { label: t("customer-orders.perCustomer"), value: list.length ? Math.round(spent / list.length) : 0, type: "money" },
      ],
      charts: [
        { kind: "ranked", title: t("customer-orders.chartTop"), money: true, data: list.slice(0, 10).map((u) => ({ name: u.name, value: u.spent })) },
        {
          kind: "column",
          title: t("customer-orders.chartGovernorate"),
          money: false,
          data: GOVERNORATES.map((g) => ({ label: locale === "ar" ? g.ar : g.en, orders: orders.filter((o) => o.governorate === g.code).length })).filter((d) => d.orders > 0),
          series: [{ key: "orders", label: t("cols.orders") }],
        },
      ],
      columns: [
        { key: "name", label: t("cols.customer"), type: "text" },
        { key: "email", label: t("cols.email"), type: "text" },
        { key: "governorate", label: t("cols.governorate"), type: "text" },
        { key: "orders", label: t("cols.orders"), type: "int", align: "end" },
        { key: "cancelled", label: t("cols.cancelled"), type: "int", align: "end" },
        { key: "spent", label: t("cols.spent"), type: "money", align: "end" },
        { key: "avg", label: t("cols.avgOrder"), type: "money", align: "end" },
        { key: "last", label: t("cols.lastOrder"), type: "datetime" },
      ],
      rows: list.map((u) => ({
        name: u.name,
        email: u.email,
        governorate: governorateName(u.governorate, locale),
        orders: u.orders,
        cancelled: u.cancelled,
        spent: u.spent,
        avg: u.orders - u.cancelled > 0 ? Math.round(u.spent / (u.orders - u.cancelled)) : 0,
        last: u.last,
      })),
      totals: { name: t("cols.totalRow"), email: "", governorate: "", orders: orders.length, cancelled: orders.length - live, spent, avg: live ? Math.round(spent / live) : 0, last: null },
    };
  }

  // ── 4. Payment transactions ──────────────────────────────────────────
  if (key === "payments") {
    const txns = await db.payment.findMany({ where: { createdAt: inRange }, orderBy: { createdAt: "desc" }, include: { order: { select: { orderNumber: true, shipName: true } } } });
    const amount = (s: string, m?: string) => txns.filter((p) => p.status === s && (!m || p.method === m)).reduce((a, p) => a + p.amount, 0);
    const count = (s: string) => txns.filter((p) => p.status === s).length;
    const cardAttempts = txns.filter((p) => p.method === "CARD" && (p.status === "SUCCEEDED" || p.status === "FAILED")).length;
    const cardOk = txns.filter((p) => p.method === "CARD" && p.status === "SUCCEEDED").length;
    return {
      ...base,
      summary: [
        { label: t("payments.collected"), value: amount("SUCCEEDED"), type: "money", hint: t("payments.collectedHint", { count: count("SUCCEEDED") }) },
        { label: t("payments.card"), value: amount("SUCCEEDED", "CARD"), type: "money" },
        { label: t("payments.cod"), value: amount("SUCCEEDED", "COD"), type: "money" },
        { label: t("payments.pending"), value: amount("PENDING"), type: "money", hint: t("payments.pendingHint", { count: count("PENDING") }) },
        { label: t("payments.refunded"), value: amount("REFUNDED"), type: "money", hint: t("payments.refundedHint", { count: count("REFUNDED") }) },
        { label: t("payments.successRate"), value: cardAttempts ? cardOk / cardAttempts : 0, type: "pct", hint: t("payments.failedHint", { count: count("FAILED") }) },
      ],
      charts: [
        { kind: "donut", title: t("payments.chartStatus"), money: false, data: TXN_STATUSES.map((s) => ({ key: s, label: tp(s), value: count(s) })).filter((d) => d.value > 0) },
        {
          kind: "column",
          title: t("payments.chartMethod"),
          money: true,
          stacked: true,
          data: [
            { label: t("payments.methodCard"), succeeded: amount("SUCCEEDED", "CARD"), pending: amount("PENDING", "CARD"), refunded: amount("REFUNDED", "CARD") },
            { label: t("payments.methodCod"), succeeded: amount("SUCCEEDED", "COD"), pending: amount("PENDING", "COD"), refunded: amount("REFUNDED", "COD") },
          ],
          series: [
            { key: "succeeded", label: tp("SUCCEEDED") },
            { key: "pending", label: tp("PENDING") },
            { key: "refunded", label: tp("REFUNDED") },
          ],
        },
      ],
      columns: [
        { key: "createdAt", label: t("cols.date"), type: "datetime" },
        { key: "reference", label: t("cols.reference"), type: "code" },
        { key: "orderNumber", label: t("cols.order"), type: "code" },
        { key: "customer", label: t("cols.customer"), type: "text" },
        { key: "method", label: t("cols.method"), type: "text" },
        { key: "card", label: t("cols.card"), type: "code" },
        { key: "status", label: t("cols.status"), type: "txnStatus" },
        { key: "failure", label: t("cols.failure"), type: "text" },
        { key: "amount", label: t("cols.amount"), type: "money", align: "end" },
      ],
      rows: txns.map((p) => ({
        createdAt: p.createdAt,
        reference: p.reference,
        orderNumber: p.order.orderNumber,
        customer: p.order.shipName,
        method: p.method === "CARD" ? t("payments.methodCard") : t("payments.methodCod"),
        card: p.cardLast4 ? `•••• ${p.cardLast4}` : "",
        status: p.status,
        failure: p.failureReason ? t(`payments.failure_${p.failureReason}` as "payments.failure_card_declined") : "",
        amount: p.amount,
      })),
    };
  }

  // ── 5. Delivery status ───────────────────────────────────────────────
  const orders = await db.order.findMany({
    where: { createdAt: inRange },
    orderBy: { createdAt: "desc" },
    select: { orderNumber: true, shipName: true, governorate: true, wilayat: true, deliveryMethod: true, status: true, createdAt: true, deliveredAt: true },
  });
  const delivered = orders.filter((o) => o.status === "DELIVERED" && o.deliveredAt);
  const hours = delivered.map((o) => (o.deliveredAt!.getTime() - o.createdAt.getTime()) / 3_600_000);
  const avgHours = hours.length ? hours.reduce((a, b) => a + b, 0) / hours.length : 0;
  // Promise: Express within 48 h, Standard within 4 working days (~96 h).
  const onTime = delivered.filter((o) => (o.deliveredAt!.getTime() - o.createdAt.getTime()) / 3_600_000 <= (o.deliveryMethod === "EXPRESS" ? 48 : 96)).length;
  const groups = { pending: ["PLACED", "CONFIRMED", "PROCESSING"], transit: ["SHIPPED", "OUT_FOR_DELIVERY"], delivered: ["DELIVERED"], cancelled: ["CANCELLED"] };
  const inGroup = (s: string, g: keyof typeof groups) => groups[g].includes(s);
  const govData = GOVERNORATES.map((g) => {
    const os = orders.filter((o) => o.governorate === g.code);
    return {
      label: locale === "ar" ? g.ar : g.en,
      delivered: os.filter((o) => inGroup(o.status, "delivered")).length,
      transit: os.filter((o) => inGroup(o.status, "transit")).length,
      pending: os.filter((o) => inGroup(o.status, "pending")).length,
      cancelled: os.filter((o) => inGroup(o.status, "cancelled")).length,
    };
  }).filter((d) => d.delivered + d.transit + d.pending + d.cancelled > 0);

  return {
    ...base,
    summary: [
      { label: t("delivery.total"), value: orders.length, type: "int" },
      { label: t("delivery.delivered"), value: orders.filter((o) => inGroup(o.status, "delivered")).length, type: "int" },
      { label: t("delivery.transit"), value: orders.filter((o) => inGroup(o.status, "transit")).length, type: "int", hint: t("delivery.transitHint") },
      { label: t("delivery.pending"), value: orders.filter((o) => inGroup(o.status, "pending")).length, type: "int", hint: t("delivery.pendingHint") },
      { label: t("delivery.avgTime"), value: avgHours, type: "hours" },
      { label: t("delivery.onTime"), value: delivered.length ? onTime / delivered.length : 0, type: "pct", hint: t("delivery.onTimeHint") },
    ],
    charts: [
      { kind: "donut", title: t("delivery.chartStatus"), money: false, data: ORDER_STATUSES.map((s) => ({ key: s, label: ts(s), value: orders.filter((o) => o.status === s).length })).filter((d) => d.value > 0) },
      {
        kind: "column",
        title: t("delivery.chartGovernorate"),
        money: false,
        stacked: true,
        data: govData,
        series: [
          { key: "delivered", label: t("delivery.delivered") },
          { key: "transit", label: t("delivery.transit") },
          { key: "pending", label: t("delivery.pending") },
          { key: "cancelled", label: ts("CANCELLED") },
        ],
      },
    ],
    columns: [
      { key: "orderNumber", label: t("cols.order"), type: "code" },
      { key: "customer", label: t("cols.customer"), type: "text" },
      { key: "governorate", label: t("cols.governorate"), type: "text" },
      { key: "wilayat", label: t("cols.wilayat"), type: "text" },
      { key: "method", label: t("cols.deliveryMethod"), type: "text" },
      { key: "status", label: t("cols.status"), type: "orderStatus" },
      { key: "placed", label: t("cols.placed"), type: "datetime" },
      { key: "deliveredAt", label: t("cols.deliveredAt"), type: "datetime" },
      { key: "days", label: t("cols.days"), type: "text", align: "end" },
    ],
    rows: orders.map((o) => ({
      orderNumber: o.orderNumber,
      customer: o.shipName,
      governorate: governorateName(o.governorate, locale),
      wilayat: wilayatName(o.governorate, o.wilayat, locale),
      method: o.deliveryMethod === "EXPRESS" ? t("delivery.express") : t("delivery.standard"),
      status: o.status,
      placed: o.createdAt,
      deliveredAt: o.deliveredAt,
      days: o.deliveredAt ? ((o.deliveredAt.getTime() - o.createdAt.getTime()) / 86_400_000).toFixed(1) : "",
    })),
  };
}
