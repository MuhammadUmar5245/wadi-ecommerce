"use client";

import { useEffect, useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FormAlert, SubmitButton } from "@/components/forms/form-parts";
import type { ActionState } from "@/lib/validation";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

function DialogForm({ action, onDone, children, submitLabel }: { action: Action; onDone: () => void; children: (errors?: Record<string, string>) => React.ReactNode; submitLabel: string }) {
  const [state, formAction] = useFormState(action, {});
  const tAll = useTranslations();
  const router = useRouter();
  useEffect(() => {
    if (state.ok) {
      if (state.message) toast.success(tAll(state.message));
      router.refresh();
      onDone();
    }
  }, [state, onDone, router, tAll]);
  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && !state.ok && <FormAlert>{tAll(state.message)}</FormAlert>}
      {children(state.errors)}
      <div className="flex justify-end pt-2">
        <SubmitButton>{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}

/** A trigger button that opens a dialog containing a server-action form; closes and refreshes on success. */
export function FormDialog({
  title,
  description,
  trigger,
  triggerProps,
  action,
  submitLabel,
  wide,
  children,
}: {
  title: string;
  description?: string;
  trigger: React.ReactNode;
  triggerProps?: ButtonProps;
  action: Action;
  submitLabel: string;
  wide?: boolean;
  children: (errors?: Record<string, string>) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const tc = useTranslations("common");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button {...triggerProps}>{trigger}</Button>
      </DialogTrigger>
      <DialogContent closeLabel={tc("close")} className={wide ? "max-w-2xl" : undefined}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {open && (
          <DialogForm action={action} onDone={() => setOpen(false)} submitLabel={submitLabel}>
            {children}
          </DialogForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
