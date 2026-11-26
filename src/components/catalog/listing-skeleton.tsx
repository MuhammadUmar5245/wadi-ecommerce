import { Skeleton } from "@/components/ui/skeleton";
import { ProductGridSkeleton } from "@/components/product/product-card";

export function ListingPageSkeleton({ banner = false }: { banner?: boolean }) {
  return (
    <div className="container py-8 lg:py-10" aria-busy="true">
      <Skeleton className="h-4 w-40" />
      {banner ? <Skeleton className="mb-8 mt-4 h-48 rounded-3xl" /> : <Skeleton className="mb-8 mt-4 h-10 w-64" />}
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <Skeleton className="hidden h-[520px] rounded-2xl lg:block" />
        <div>
          <div className="mb-4 flex justify-between">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-9 w-48" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
