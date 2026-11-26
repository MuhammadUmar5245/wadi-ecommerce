"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { QuantityStepper } from "@/components/product/buy-box";
import { CountBadge } from "@/components/layout/icon-link";
import { cartCount, useCart } from "@/stores/cart";
import { formatOMR } from "@/lib/money";
import { MAX_QTY_PER_LINE } from "@/lib/constants";
import { useCartLines, useCartMutations, useHydrated } from "./cart-hooks";

export function CartButton() {
  const t = useTranslations("header");
  const items = useCart((s) => s.items);
  const setOpen = useCart((s) => s.setDrawerOpen);
  const hydrated = useHydrated();
  const count = hydrated ? cartCount(items) : 0;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted"
      aria-label={count ? `${t("cart")} (${count})` : t("cart")}
      aria-haspopup="dialog"
    >
      <ShoppingBag className="h-5 w-5" aria-hidden />
      <CountBadge count={count} />
    </button>
  );
}

export function CartLinesList({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { lines, loading } = useCartLines();
  const { setQty, remove } = useCartMutations();
  const items = useCart((s) => s.items);

  if (loading && lines.length === 0 && items.length > 0) {
    return (
      <div className="space-y-4">
        {items.map((i) => (
          <div key={i.productId} className="flex gap-3">
            <Skeleton className="h-20 w-20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <ul className="divide-y">
      {lines.map((l) => (
        <li key={l.productId} className="flex gap-3 py-4 first:pt-0">
          <Link href={`/product/${l.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border bg-muted sm:h-24 sm:w-24">
            <Image src={l.image} alt="" fill unoptimized sizes="96px" className="object-cover" />
          </Link>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/product/${l.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-primary">
                {l.name}
              </Link>
              <button
                type="button"
                onClick={() => remove(l.productId)}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-destructive"
                aria-label={t("removeItem", { name: l.name })}
              >
                <Trash2 className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="tabular text-xs text-muted-foreground">{t("each", { price: formatOMR(l.unitPrice, locale) })}</p>
            {l.adjusted && <p className="text-xs font-medium text-warning">{t("adjusted", { count: l.stock })}</p>}
            <div className="mt-auto flex items-center justify-between gap-2">
              <QuantityStepper
                size="sm"
                value={l.quantity}
                max={Math.min(l.stock, MAX_QTY_PER_LINE)}
                onChange={(q) => setQty(l.productId, q, l.stock)}
                label={t("quantityFor", { name: l.name })}
              />
              <span className={`tabular font-semibold ${compact ? "text-sm" : ""}`}>{formatOMR(l.lineTotal, locale)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CartDrawer() {
  const t = useTranslations("cart");
  const tc = useTranslations("common");
  const locale = useLocale();
  const open = useCart((s) => s.drawerOpen);
  const setOpen = useCart((s) => s.setDrawerOpen);
  const items = useCart((s) => s.items);
  const { subtotal } = useCartLines(open);
  const count = cartCount(items);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="end" closeLabel={tc("close")} className="flex flex-col p-0">
        <SheetHeader className="border-b p-5">
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("itemCount", { count })}</SheetDescription>
        </SheetHeader>
        {count === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-primary">
              <ShoppingBag className="h-8 w-8" aria-hidden />
            </span>
            <p className="font-semibold">{t("emptyTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("emptyBody")}</p>
            <Button asChild onClick={() => setOpen(false)}>
              <Link href="/shop">{t("startShopping")}</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-5">{open && <CartLinesList compact />}</div>
            <div className="space-y-3 border-t bg-muted/40 p-5">
              <div className="flex items-center justify-between font-semibold">
                <span>{t("subtotal")}</span>
                <span className="tabular">{formatOMR(subtotal, locale)}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t("drawerNote")}</p>
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" onClick={() => setOpen(false)}>
                  <Link href="/cart">{t("viewCart")}</Link>
                </Button>
                <Button asChild onClick={() => setOpen(false)}>
                  <Link href="/checkout">{t("checkout")}</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
