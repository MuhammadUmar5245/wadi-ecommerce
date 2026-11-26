"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

export function Providers({ children, dir }: { children: React.ReactNode; dir: "ltr" | "rtl" }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
      <Toaster richColors closeButton position={dir === "rtl" ? "top-left" : "top-right"} dir={dir} />
    </ThemeProvider>
  );
}
