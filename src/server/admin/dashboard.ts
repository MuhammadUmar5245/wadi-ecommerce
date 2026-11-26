import "server-only";
import { db } from "@/lib/db";
import { addDays, dayKeys, muscatDayKey, muscatDayStart } from "@/lib/dates";
import { loc } from "@/lib/i18n-utils";
import { ORDER_STATUSES } from "@/lib/constants";

/** Revenue counts every non-cancelled order (card paid or COD due), net of discount, incl. delivery and VAT. */
export async function getDashboard(locale: string) {
  const today = muscatDayKey(new Date());
  const fromKey = addDays(today, -29);
  const since = muscatDayStart(fromKey);
  const prevSince = muscatDayStart(addDays(fromKey, -30));

  const [orders, prevOrders, customers, newCustomers, lowStock, outOfStock, recent, items] = await Promise.all([
    db.order.findMany({ where: { createdAt: { gte: since } }, select: { total: true, status: true, createdAt: true } }),
    db.order.findMany({ where: { createdAt: { gte: prevSince, lt: since }, status: { not: "CANCELLED" } }, select: { total: true } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.user.count({ where: { role: "CUSTOMER", createdAt: { gte: since } } }),
    db.product.count({ where: { isActive: true, stock: { gt: 0 }, AND: { stock: { lte: db.product.fields.lowStockThreshold } } } }),
    db.product.count({ where: { isActive: true, stock: 0 } }),
    db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, paymentMethod: true, total: true, createdAt: true, shipName: true },
    }),
    db.orderItem.groupBy({
      by: ["productId"],
      where: { order: { createdAt: { gte: since }, status: { not: "CANCELLED" } } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: "desc" } },
      take: 5,
    }),
  ]);

  const live = orders.filter((o) => o.status !== "CANCELLED");
  const revenue = live.reduce((s, o) => s + o.total, 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);

  const byDay = new Map(dayKeys(fromKey, today).map((k) => [k, { revenue: 0, orders: 0 }]));
  for (const o of live) {
    const d = byDay.get(muscatDayKey(o.createdAt));
    if (d) {
      d.revenue += o.total;
      d.orders += 1;
    }
  }

  const statusCounts = ORDER_STATUSES.map((s) => ({ status: s, count: orders.filter((o) => o.status === s).length }));

  const products = await db.product.findMany({ where: { id: { in: items.map((i) => i.productId) } }, select: { id: true, nameEn: true, nameAr: true } });
  const topProducts = items.map((i) => {
    const p = products.find((x) => x.id === i.productId);
    return { name: p ? loc(locale, p.nameEn, p.nameAr) : "—", revenue: i._sum.lineTotal ?? 0, quantity: i._sum.quantity ?? 0 };
  });

  return {
    kpis: {
      revenue,
      revenueChange: prevRevenue ? (revenue - prevRevenue) / prevRevenue : null,
      orders: orders.length,
      aov: live.length ? Math.round(revenue / live.length) : 0,
      customers,
      newCustomers,
      lowStock,
      outOfStock,
    },
    daily: [...byDay.entries()].map(([day, v]) => ({ day, ...v })),
    statusCounts,
    topProducts,
    recent,
  };
}
