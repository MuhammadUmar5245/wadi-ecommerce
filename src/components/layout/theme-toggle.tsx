"use client";

import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const t = useTranslations("common");

  return (
    <button
      type="button"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className={cn("inline-flex items-center rounded-md p-1.5 hover:bg-white/10", className)}
      aria-label={t("toggleTheme")}
    >
      <Sun className="h-3.5 w-3.5 dark:hidden" aria-hidden />
      <Moon className="hidden h-3.5 w-3.5 dark:block" aria-hidden />
    </button>
  );
}
