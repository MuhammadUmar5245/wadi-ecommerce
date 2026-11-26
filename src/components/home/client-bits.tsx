"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Check, Copy } from "lucide-react";
import { subscribeAction } from "@/server/newsletter-actions";
import { FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";

export function CopyCode({ code }: { code: string }) {
  const t = useTranslations("home");
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable — the code is visible anyway */
        }
      }}
      className="inline-flex items-center gap-3 rounded-xl border-2 border-dashed border-accent-foreground/40 bg-white/90 px-4 py-2.5 font-mono text-lg font-bold tracking-widest text-accent-foreground hover:bg-white"
      aria-label={t("copyCode", { code })}
    >
      {code}
      {copied ? <Check className="h-4 w-4 text-success" aria-hidden /> : <Copy className="h-4 w-4" aria-hidden />}
      <span className="sr-only" aria-live="polite">
        {copied ? t("copied") : ""}
      </span>
    </button>
  );
}

export function NewsletterForm() {
  const [state, action] = useFormState(subscribeAction, {});
  const t = useTranslations("home");
  const tAll = useTranslations();
  const err = useErrorText();

  if (state.ok) return <FormAlert tone="success">{tAll(state.message ?? "home.newsletterThanks")}</FormAlert>;

  return (
    <form action={action} className="space-y-2" noValidate>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          {t("newsletterLabel")}
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          placeholder="name@example.com"
          aria-invalid={!!state.errors?.email}
          aria-describedby={state.errors?.email ? "newsletter-error" : undefined}
          className="h-12 flex-1 rounded-xl border border-primary-foreground/30 bg-primary-foreground/10 px-4 text-sm text-primary-foreground placeholder:text-primary-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        />
        <SubmitButton variant="accent" size="lg">
          {t("subscribe")}
        </SubmitButton>
      </div>
      {state.errors?.email && (
        <p id="newsletter-error" role="alert" className="text-sm font-medium text-sand">
          {err(state.errors.email)}
        </p>
      )}
    </form>
  );
}
