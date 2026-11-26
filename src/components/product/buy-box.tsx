"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAddToCart } from "@/components/cart/use-add-to-cart";
import { MAX_QTY_PER_LINE } from "@/lib/constants";

export function QuantityStepper({
  value,
  max,
  onChange,
  label,
  size = "md",
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const t = useTranslations("cart");
  const h = size === "sm" ? "h-8" : "h-11";
  return (
    <div className={`inline-flex items-center rounded-lg border bg-card ${h}`} role="group" aria-label={label}>
      <button
        type="button"
        className="flex h-full w-9 items-center justify-center rounded-s-lg hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label={t("decrease")}
      >
        <Minus className="h-3.5 w-3.5" aria-hidden />
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value}
        min={1}
        max={max}
        onChange={(e) => {
          const v = Math.floor(Number(e.target.value));
          if (Number.isFinite(v)) onChange(Math.max(1, Math.min(max, v)));
        }}
        className="tabular h-full w-11 border-x bg-transparent text-center text-sm font-semibold [appearance:textfield] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-inner-spin-button]:appearance-none"
        aria-label={t("quantity")}
      />
      <button
        type="button"
        className="flex h-full w-9 items-center justify-center rounded-e-lg hover:bg-muted disabled:opacity-40"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={t("increase")}
      >
        <Plus className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}

export function BuyBox({ product, extra }: { product: { id: string; name: string; stock: number }; extra?: React.ReactNode }) {
  const t = useTranslations("product");
  const [qty, setQty] = useState(1);
  const addToCart = useAddToCart();
  const max = Math.max(1, Math.min(product.stock, MAX_QTY_PER_LINE));
  const out = product.stock <= 0;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {!out && <QuantityStepper value={qty} max={max} onChange={setQty} label={t("quantityFor", { name: product.name })} />}
      <Button size="lg" className="min-w-[12rem] flex-1 sm:flex-none" disabled={out} onClick={() => addToCart(product, qty)}>
        <ShoppingBag aria-hidden />
        {out ? t("outOfStock") : t("addToCart")}
      </Button>
      {extra}
    </div>
  );
}
