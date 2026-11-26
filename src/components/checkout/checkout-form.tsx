"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { Banknote, CreditCard, Lock, MapPin, Plus, Tag, Truck, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";
import { TotalsTable } from "@/components/cart/order-summary";
import { EmptyState } from "@/components/common/misc";
import { useCart } from "@/stores/cart";
import { placeOrderAction, quoteAction } from "@/server/checkout-actions";
import type { Quote } from "@/server/checkout";
import { formatOMR } from "@/lib/money";
import { governorateName, wilayatName, EXPRESS_DELIVERY_FEE, STANDARD_DELIVERY_FEE, FREE_DELIVERY_THRESHOLD } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { AddressFields } from "./address-fields";

type SavedAddress = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  governorate: string;
  wilayat: string;
  area: string;
  street: string;
  building: string;
  way: string | null;
  isDefault: boolean;
};

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-card p-5 sm:p-6" aria-labelledby={`step-${n}`}>
      <h2 id={`step-${n}`} className="mb-5 flex items-center gap-3 text-lg font-semibold">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm text-primary-foreground">{n}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function OptionCard({
  name,
  value,
  checked,
  onChange,
  icon: Icon,
  title,
  body,
  aside,
}: {
  name: string;
  value: string;
  checked: boolean;
  onChange: (v: string) => void;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        checked ? "border-primary bg-secondary/50" : "border-border hover:border-primary/40"
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={() => onChange(value)} className="sr-only" />
      <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", checked ? "text-primary" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        {body && <span className="mt-0.5 block text-xs text-muted-foreground">{body}</span>}
      </span>
      {aside && <span className="tabular shrink-0 text-sm font-semibold">{aside}</span>}
    </label>
  );
}

export function CheckoutForm({ userId, addresses, user }: { userId: string; addresses: SavedAddress[]; user: { name: string; phone: string } }) {
  const t = useTranslations("checkout");
  const tAll = useTranslations();
  const err = useErrorText();
  const locale = useLocale();
  const syncedUserId = useCart((s) => s.syncedUserId);
  const [state, action] = useFormState(placeOrderAction, {});

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<string>(defaultAddress?.id ?? "new");
  const [delivery, setDelivery] = useState<"STANDARD" | "EXPRESS">("STANDARD");
  const [payment, setPayment] = useState<"CARD" | "COD">("CARD");
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string>("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, startQuote] = useTransition();

  const refresh = useCallback(
    (code: string) => {
      startQuote(async () => {
        const q = await quoteAction({ deliveryMethod: delivery, couponCode: code || undefined });
        setQuote(q);
      });
    },
    [delivery]
  );

  // Wait until the guest cart has been merged into the DB cart, then quote.
  const ready = syncedUserId === userId;
  useEffect(() => {
    if (ready) refresh(coupon);
  }, [ready, refresh, coupon]);
  useEffect(() => {
    if (state.message === "checkout.errors.stockChanged") refresh(coupon);
  }, [state, refresh, coupon]);

  if (!ready || (!quote && quoting) || !quote) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_400px]" aria-busy="true">
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (quote.lines.length === 0) {
    return (
      <EmptyState
        title={t("emptyTitle")}
        body={t("emptyBody")}
        action={
          <Button asChild>
            <Link href="/shop">{t("continueShopping")}</Link>
          </Button>
        }
      />
    );
  }

  const couponMsg =
    quote.coupon && !quote.coupon.ok
      ? quote.coupon.error === "MIN_ORDER"
        ? t("couponErrors.MIN_ORDER", { amount: formatOMR(quote.coupon.minOrder ?? 0, locale) })
        : t(`couponErrors.${quote.coupon.error}`)
      : null;
  const standardFree = quote.totals.subtotal - quote.totals.discount >= FREE_DELIVERY_THRESHOLD;

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-[1fr_400px]" noValidate>
      <div className="space-y-6">
        {state.message && <FormAlert>{tAll(state.message)}</FormAlert>}

        <Step n={1} title={t("addressStep")}>
          {addresses.length > 0 && (
            <div className="mb-5 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("savedAddresses")}>
              {addresses.map((a) => (
                <OptionCard
                  key={a.id}
                  name="addressChoice"
                  value={a.id}
                  checked={addressId === a.id}
                  onChange={setAddressId}
                  icon={MapPin}
                  title={`${a.label} — ${a.fullName}`}
                  body={`${a.building}, ${a.street}, ${a.area}, ${wilayatName(a.governorate, a.wilayat, locale)}, ${governorateName(a.governorate, locale)}`}
                />
              ))}
              <OptionCard name="addressChoice" value="new" checked={addressId === "new"} onChange={setAddressId} icon={Plus} title={t("newAddress")} />
            </div>
          )}
          {addressId !== "new" && <input type="hidden" name="addressId" value={addressId} />}
          {addressId === "new" ? (
            <>
              <AddressFields errors={state.errors} defaults={{ fullName: user.name, phone: user.phone }} />
              <label className="mt-4 flex items-center gap-2.5 text-sm">
                <input type="checkbox" name="saveAddress" defaultChecked className="h-4 w-4 rounded accent-[hsl(var(--primary))]" />
                {t("saveAddress")}
              </label>
            </>
          ) : (
            <div className="space-y-1.5">
              <label htmlFor="notes" className="text-sm font-medium">
                {t("deliveryNotes")}
              </label>
              <textarea id="notes" name="notes" rows={2} maxLength={300} className="w-full rounded-lg border border-input bg-card px-3 py-2 text-sm" placeholder={t("deliveryNotesPlaceholder")} />
            </div>
          )}
        </Step>

        <Step n={2} title={t("deliveryStep")}>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("deliveryStep")}>
            <OptionCard
              name="deliveryMethod"
              value="STANDARD"
              checked={delivery === "STANDARD"}
              onChange={(v) => setDelivery(v as "STANDARD")}
              icon={Truck}
              title={t("standard")}
              body={t("standardBody")}
              aside={standardFree ? t("free") : formatOMR(STANDARD_DELIVERY_FEE, locale)}
            />
            <OptionCard
              name="deliveryMethod"
              value="EXPRESS"
              checked={delivery === "EXPRESS"}
              onChange={(v) => setDelivery(v as "EXPRESS")}
              icon={Zap}
              title={t("express")}
              body={t("expressBody")}
              aside={formatOMR(EXPRESS_DELIVERY_FEE, locale)}
            />
          </div>
        </Step>

        <Step n={3} title={t("paymentStep")}>
          <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("paymentStep")}>
            <OptionCard name="paymentMethod" value="CARD" checked={payment === "CARD"} onChange={(v) => setPayment(v as "CARD")} icon={CreditCard} title={t("card")} body={t("cardBody")} />
            <OptionCard name="paymentMethod" value="COD" checked={payment === "COD"} onChange={(v) => setPayment(v as "COD")} icon={Banknote} title={t("cod")} body={t("codBody")} />
          </div>
          {state.errors?.paymentMethod && <p className="mt-2 text-xs text-destructive">{err(state.errors.paymentMethod)}</p>}
        </Step>
      </div>

      <aside className="h-fit space-y-5 rounded-2xl border bg-card p-5 sm:p-6 lg:sticky lg:top-32">
        <h2 className="text-lg font-semibold">{t("summary")}</h2>
        <ul className="max-h-72 space-y-3 overflow-y-auto">
          {quote.lines.map((l) => (
            <li key={l.productId} className="flex items-center gap-3">
              <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border bg-muted">
                <Image src={l.image} alt="" fill unoptimized sizes="56px" className="object-cover" />
                <span className="absolute -end-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                  {l.quantity}
                </span>
              </span>
              <span className="line-clamp-2 flex-1 text-sm">{l.name}</span>
              <span className="tabular text-sm font-medium">{formatOMR(l.lineTotal, locale)}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t pt-4">
          <label htmlFor="coupon" className="flex items-center gap-1.5 text-sm font-medium">
            <Tag className="h-4 w-4" aria-hidden />
            {t("coupon")}
          </label>
          <div className="flex gap-2">
            <Input
              id="coupon"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="WELCOME10"
              dir="ltr"
              className="uppercase"
              aria-describedby="coupon-msg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  setCoupon(couponInput.trim());
                }
              }}
            />
            {coupon && quote.coupon?.ok ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setCoupon("");
                  setCouponInput("");
                }}
              >
                {t("removeCoupon")}
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={() => setCoupon(couponInput.trim())} disabled={!couponInput.trim() || quoting}>
                {t("applyCoupon")}
              </Button>
            )}
          </div>
          <p id="coupon-msg" aria-live="polite" className="text-xs">
            {quote.coupon?.ok && <span className="font-medium text-success">{t("couponApplied", { code: quote.coupon.code })}</span>}
            {couponMsg && <span className="font-medium text-destructive">{couponMsg}</span>}
          </p>
          {quote.coupon?.ok && <input type="hidden" name="couponCode" value={quote.coupon.code} />}
        </div>

        <div className={cn("border-t pt-4", quoting && "opacity-60 transition-opacity")} aria-busy={quoting}>
          <TotalsTable totals={quote.totals} couponCode={quote.coupon?.ok ? quote.coupon.code : null} />
        </div>

        <SubmitButton size="lg" className="w-full" pendingText={t("placing")} disabled={quoting}>
          <Lock aria-hidden />
          {payment === "CARD" ? t("continueToPayment") : t("placeOrder")}
        </SubmitButton>
        <p className="text-center text-xs text-muted-foreground">
          {t.rich("agree", { terms: (c) => <Link href="/terms" className="underline">{c}</Link> })}
        </p>
      </aside>
    </form>
  );
}
