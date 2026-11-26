import { useFormatter, useLocale, useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status";
import { formatOMR } from "@/lib/money";

export type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: Date;
  _count: { items: number };
};

export function OrderList({ orders }: { orders: OrderRow[] }) {
  const t = useTranslations("orders");
  const locale = useLocale();
  const format = useFormatter();
  return (
    <ul className="divide-y rounded-2xl border bg-card">
      {orders.map((o) => (
        <li key={o.id}>
          <Link href={`/account/orders/${o.orderNumber}`} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 transition-colors hover:bg-muted/50 sm:p-5">
            <div className="min-w-[8rem] flex-1">
              <p className="font-mono font-semibold" dir="ltr">
                {o.orderNumber}
              </p>
              <p className="text-xs text-muted-foreground">
                {format.dateTime(o.createdAt, { dateStyle: "medium" })} · {t("itemCount", { count: o._count.items })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={o.status} />
              <PaymentStatusBadge status={o.paymentStatus} />
            </div>
            <span className="tabular w-28 text-end font-semibold">{formatOMR(o.total, locale)}</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground rtl-flip" aria-hidden />
          </Link>
        </li>
      ))}
    </ul>
  );
}
