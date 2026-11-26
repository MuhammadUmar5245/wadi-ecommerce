"use client";

import { useTranslations } from "next-intl";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  const t = useTranslations("admin");
  return (
    <Button type="button" onClick={() => window.print()} className="no-print">
      <Printer aria-hidden />
      {t("print")}
    </Button>
  );
}
