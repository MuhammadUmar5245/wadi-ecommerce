"use client";

import { useEffect, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useWishlist } from "@/stores/wishlist";
import { toggleWishlistAction } from "@/server/account-actions";
import { cn } from "@/lib/utils";

export function WishlistInit({ ids, signedIn }: { ids: string[]; signedIn: boolean }) {
  const init = useWishlist((s) => s.init);
  const key = ids.join(",");
  useEffect(() => {
    init(key ? key.split(",") : [], signedIn);
  }, [key, signedIn, init]);
  return null;
}

export function WishlistButton({ productId, name, size = "sm", className }: { productId: string; name: string; size?: "sm" | "lg"; className?: string }) {
  const t = useTranslations("wishlist");
  const saved = useWishlist((s) => s.ids.has(productId));
  const signedIn = useWishlist((s) => s.signedIn);
  const setSaved = useWishlist((s) => s.set);
  const router = useRouter();
  const pathname = usePathname();
  const [pending, start] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? t("removeNamed", { name }) : t("addNamed", { name })}
      onClick={() => {
        if (!signedIn) {
          router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
          return;
        }
        setSaved(productId, !saved); // optimistic
        start(async () => {
          const res = await toggleWishlistAction(productId);
          if (!res.ok) {
            setSaved(productId, saved);
            toast.error(t("error"));
            return;
          }
          setSaved(productId, !!res.saved);
          toast.success(res.saved ? t("added") : t("removed"));
          router.refresh();
        });
      }}
      className={cn(
        "inline-flex items-center justify-center rounded-lg border bg-card transition-colors hover:bg-muted disabled:opacity-60",
        size === "lg" ? "h-12 w-12 rounded-xl" : "h-9 w-9",
        saved && "border-destructive/30 text-destructive",
        className
      )}
    >
      <Heart className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} fill={saved ? "currentColor" : "none"} aria-hidden />
    </button>
  );
}
