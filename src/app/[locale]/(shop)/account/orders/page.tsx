import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Package } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/misc";
import { Pagination } from "@/components/common/pagination";
import { OrderList } from "@/components/account/order-list";
import { requireUser } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

const FILTERS = ["all", "active", "delivered", "cancelled"] as const;
type Filter = (typeof FILTERS)[number];
const PER_PAGE = 10;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("orders") };
}

export default async function OrdersPage({ params: { locale }, searchParams }: { params: { locale: string }; searchParams: { filter?: string; page?: string } }) {
  setRequestLocale(locale);
  const user = await requireUser("/account/orders");
  const t = await getTranslations("orders");
  const ta = await getTranslations("account");
  const filter: Filter = FILTERS.includes(searchParams.filter as Filter) ? (searchParams.filter as Filter) : "all";
  const page = Math.max(1, Number(searchParams.page) || 1);

  const where: Prisma.OrderWhereInput = { userId: user.id };
  if (filter === "active") where.status = { in: ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY"] };
  if (filter === "delivered") where.status = "DELIVERED";
  if (filter === "cancelled") where.status = "CANCELLED";

  const [total, orders] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: { id: true, orderNumber: true, status: true, paymentStatus: true, total: true, createdAt: true, _count: { select: { items: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold sm:text-3xl">{ta("orders")}</h1>
      <nav aria-label={t("filterLabel")} className="scrollbar-none flex gap-2 overflow-x-auto">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/account/orders" : `/account/orders?filter=${f}`}
            aria-current={filter === f ? "page" : undefined}
            className={cn(
              "whitespace-nowrap rounded-full border px-4 py-1.5 text-sm font-medium",
              filter === f ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
            )}
          >
            {t(`filter.${f}`)}
          </Link>
        ))}
      </nav>
      {orders.length ? (
        <>
          <OrderList orders={orders} />
          <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} pathname="/account/orders" searchParams={{ filter: filter === "all" ? undefined : filter }} />
        </>
      ) : (
        <EmptyState
          icon={Package}
          title={t("emptyTitle")}
          body={t("emptyBody")}
          action={
            <Button asChild>
              <Link href="/shop">{ta("startShopping")}</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
