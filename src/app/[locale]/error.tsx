"use client";

import { ErrorView } from "@/components/common/error-view";

// Catches errors thrown by layouts under [locale] (e.g. the shop or admin layout itself).
export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} />;
}
