import { useFormatter, useTranslations } from "next-intl";
import { Ban, Check, CheckCircle2, ClipboardCheck, Home, Package, PackageCheck, Truck } from "lucide-react";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { ORDER_FLOW, type OrderStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STATUS_VARIANT: Record<string, BadgeProps["variant"]> = {
  PLACED: "info",
  CONFIRMED: "secondary",
  PROCESSING: "warning",
  SHIPPED: "info",
  OUT_FOR_DELIVERY: "accent",
  DELIVERED: "success",
  CANCELLED: "destructive",
};

export function OrderStatusBadge({ status }: { status: string }) {
  const t = useTranslations("orderStatus");
  return <Badge variant={STATUS_VARIANT[status] ?? "outline"}>{t(status as OrderStatus)}</Badge>;
}

const PAY_VARIANT: Record<string, BadgeProps["variant"]> = {
  PENDING: "warning",
  PAID: "success",
  SUCCEEDED: "success",
  FAILED: "destructive",
  REFUNDED: "info",
  VOID: "outline",
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const t = useTranslations("paymentStatus");
  return <Badge variant={PAY_VARIANT[status] ?? "outline"}>{t(status as "PENDING")}</Badge>;
}

const ICONS = [ClipboardCheck, CheckCircle2, Package, Truck, PackageCheck, Home];

/** Visual tracking timeline: Placed → Confirmed → Processing → Shipped → Out for delivery → Delivered (+ Cancelled). */
export function OrderTimeline({ status, history }: { status: string; history: { status: string; createdAt: Date; note?: string | null }[] }) {
  const t = useTranslations("orderStatus");
  const format = useFormatter();
  const cancelled = status === "CANCELLED";
  const reached = new Map(history.map((h) => [h.status, h.createdAt]));
  const currentIdx = cancelled ? Math.max(...ORDER_FLOW.map((s, i) => (reached.has(s) ? i : -1))) : ORDER_FLOW.indexOf(status as OrderStatus);
  const cancelledAt = history.find((h) => h.status === "CANCELLED");

  return (
    <div>
      <ol className="relative grid gap-0 sm:grid-cols-6" aria-label={t("timeline")}>
        {ORDER_FLOW.map((s, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx && !cancelled;
          const at = reached.get(s);
          const Icon = ICONS[i];
          return (
            <li key={s} className="relative flex gap-3 pb-6 sm:flex-col sm:items-center sm:pb-0 sm:text-center" aria-current={isCurrent ? "step" : undefined}>
              {/* connector */}
              {i < ORDER_FLOW.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute start-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5 sm:start-[calc(50%+18px)] sm:top-[17px] sm:h-0.5 sm:w-[calc(100%-36px)]",
                    i < currentIdx ? "bg-primary" : "bg-border"
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
                  done ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground",
                  isCurrent && "ring-4 ring-primary/20"
                )}
              >
                {done && !isCurrent ? <Check className="h-4 w-4" aria-hidden /> : <Icon className="h-4 w-4" aria-hidden />}
              </span>
              <div className="sm:mt-2">
                <p className={cn("text-sm font-semibold", !done && "text-muted-foreground")}>{t(s)}</p>
                {at && (
                  <time className="text-xs text-muted-foreground" dateTime={at.toISOString()}>
                    {format.dateTime(at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}
                  </time>
                )}
                <span className="sr-only">{done ? t("done") : t("pending")}</span>
              </div>
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-destructive" role="status">
          <Ban className="h-5 w-5 shrink-0" aria-hidden />
          <div>
            <p className="font-semibold">{t("CANCELLED")}</p>
            {cancelledAt && <p className="text-xs">{format.dateTime(cancelledAt.createdAt, { dateStyle: "medium", timeStyle: "short" })}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
