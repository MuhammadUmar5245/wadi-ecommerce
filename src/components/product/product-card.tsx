import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProductCardData } from "@/server/catalog";
import { Price, discountPercent } from "./price";
import { RatingStars } from "./rating-stars";
import { stockLevel } from "./stock-badge";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  actions,
  priority = false,
}: {
  product: ProductCardData;
  actions?: React.ReactNode;
  priority?: boolean;
}) {
  const t = useTranslations("product");
  const level = stockLevel(product.stock, product.lowStockThreshold);
  const off = discountPercent(product.price, product.compareAtPrice);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          unoptimized
          priority={priority}
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
          className={cn("object-cover transition-transform duration-500 group-hover:scale-105", level === "out" && "opacity-60 grayscale")}
        />
        <div className="absolute start-2.5 top-2.5 flex flex-col items-start gap-1">
          {off > 0 && <Badge variant="accent">{t("percentOff", { percent: off })}</Badge>}
          {level === "out" && <Badge className="bg-foreground text-background">{t("outOfStock")}</Badge>}
          {level === "low" && <Badge className="bg-warning text-warning-foreground">{t("onlyLeft", { count: product.stock })}</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <p className="text-xs font-medium text-muted-foreground">{product.brand}</p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {product.name}
          </Link>
        </h3>
        {product.ratingCount > 0 ? (
          <RatingStars value={product.ratingAvg} count={product.ratingCount} />
        ) : (
          <p className="text-xs text-muted-foreground">{t("noReviewsYet")}</p>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-1">
          <Price amount={product.price} compareAt={product.compareAtPrice} />
          {actions && <div className="relative z-10 shrink-0">{actions}</div>}
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4", className)}>{children}</div>;
}

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border bg-card">
      <Skeleton className="aspect-square rounded-none" />
      <div className="space-y-2.5 p-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ProductGrid>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </ProductGrid>
  );
}
