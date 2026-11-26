"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

/** Friendly error boundary UI with retry; the digest helps match server logs. */
export function ErrorView({ error, reset, homeHref = "/" }: { error: Error & { digest?: string }; reset: () => void; homeHref?: string }) {
  const t = useTranslations("errors");
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex max-w-xl flex-col items-center py-20 text-center" role="alert">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-8 w-8" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-bold sm:text-3xl">{t("errorTitle")}</h1>
      <p className="mt-3 text-muted-foreground">{t("errorBody")}</p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-muted-foreground" dir="ltr">
          {t("errorRef")}: {error.digest}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>
          <RotateCcw aria-hidden />
          {t("tryAgain")}
        </Button>
        <Button asChild variant="outline">
          <Link href={homeHref}>{t("goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
