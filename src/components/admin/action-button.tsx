"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import type { ActionState } from "@/lib/validation";

/** Runs a server action on click, toasts its translated result and refreshes the page. */
export function ActionButton({
  action,
  confirm,
  children,
  ...props
}: Omit<ButtonProps, "onClick" | "action"> & { action: () => Promise<ActionState>; confirm?: string }) {
  const [pending, start] = useTransition();
  const tAll = useTranslations();
  const router = useRouter();
  return (
    <Button
      {...props}
      disabled={pending || props.disabled}
      aria-busy={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action();
          if (res.message) (res.ok ? toast.success : toast.error)(tAll(res.message));
          router.refresh();
        });
      }}
    >
      {children}
    </Button>
  );
}
