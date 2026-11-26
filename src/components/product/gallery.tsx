"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function ProductGallery({ images }: { images: { url: string; alt: string }[] }) {
  const [active, setActive] = useState(0);
  const t = useTranslations("product");
  const current = images[active] ?? images[0];

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-3xl border bg-muted">
        {current && <Image src={current.url} alt={current.alt} fill unoptimized priority sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3" role="group" aria-label={t("gallery")}>
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              onClick={() => setActive(i)}
              aria-label={t("showImage", { n: i + 1 })}
              aria-pressed={i === active}
              className={cn(
                "relative aspect-square overflow-hidden rounded-xl border-2 bg-muted transition",
                i === active ? "border-primary" : "border-transparent opacity-75 hover:opacity-100"
              )}
            >
              <Image src={img.url} alt="" fill unoptimized sizes="120px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
