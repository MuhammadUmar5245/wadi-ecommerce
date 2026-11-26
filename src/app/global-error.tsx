"use client";

import "./globals.css";

// Last-resort boundary when the root layout itself fails; it can't rely on translations.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-background p-6 text-center text-foreground">
        <main role="alert">
          <h1 className="text-2xl font-bold">Something went wrong · حدث خطأ ما</h1>
          <button type="button" onClick={reset} className="mt-6 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground">
            Try again · حاول مجدداً
          </button>
        </main>
      </body>
    </html>
  );
}
