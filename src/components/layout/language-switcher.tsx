"use client";

import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Languages } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const qs = searchParams.toString();
        startTransition(() => router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { locale: next }));
      }}
      className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium hover:bg-white/10 disabled:opacity-60", className)}
    >
      <Languages className="h-3.5 w-3.5" aria-hidden />
      <span lang={next}>{next === "ar" ? "العربية" : "English"}</span>
      <span className="sr-only"> — {t("switchLanguage")}</span>
    </button>
  );
}
