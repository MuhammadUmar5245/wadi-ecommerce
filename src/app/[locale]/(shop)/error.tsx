"use client";

import { ErrorView } from "@/components/common/error-view";

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorView error={error} reset={reset} />;
}
