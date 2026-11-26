"use client";

import { useId, useState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Translates a validation key; unknown keys fall back to a generic message. */
export function useErrorText() {
  const t = useTranslations("validation");
  return (key?: string) => (key ? (t.has(key) ? t(key) : t("invalid")) : undefined);
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-xs font-medium text-destructive" role="alert">
      <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

type FieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  password?: boolean;
};

export function Field({ label, name, error, hint, password, className, type, ...props }: FieldProps) {
  const id = useId();
  const errId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [show, setShow] = useState(false);
  const t = useTranslations("common");
  const describedBy = [error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={password ? (show ? "text" : "password") : type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={password ? "pe-11" : undefined}
          {...props}
        />
        {password && (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute end-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            aria-label={show ? t("hidePassword") : t("showPassword")}
            aria-pressed={show}
          >
            {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          </button>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      <FieldError id={errId} message={error} />
    </div>
  );
}

export function SubmitButton({ children, pendingText, className, ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || props.disabled} aria-busy={pending} className={className} {...props}>
      {pending && <Loader2 className="animate-spin" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </Button>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: React.ReactNode }) {
  const Icon = tone === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        tone === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
        tone === "success" && "border-success/30 bg-success/10 text-success",
        tone === "info" && "border-info/30 bg-info/10 text-info"
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
