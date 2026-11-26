"use client";

import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { Field, FieldError, FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";
import { sendContactAction } from "@/server/contact-actions";

export function ContactForm({ defaults }: { defaults?: { name?: string; email?: string; phone?: string } }) {
  const t = useTranslations("pages.contact");
  const tAll = useTranslations();
  const err = useErrorText();
  const [state, action] = useFormState(sendContactAction, {});

  if (state.ok) return <FormAlert tone="success">{tAll(state.message ?? "pages.contact.sent")}</FormAlert>;

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && <FormAlert>{tAll(state.message)}</FormAlert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("name")} name="name" autoComplete="name" defaultValue={defaults?.name} required error={err(state.errors?.name)} />
        <Field label={t("emailLabel")} name="email" type="email" autoComplete="email" dir="ltr" defaultValue={defaults?.email} required error={err(state.errors?.email)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("phone")} name="phone" type="tel" autoComplete="tel" dir="ltr" placeholder="+968 9123 4567" defaultValue={defaults?.phone} error={err(state.errors?.phone)} />
        <Field label={t("subject")} name="subject" required error={err(state.errors?.subject)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">{t("message")}</Label>
        <Textarea
          id="contact-message"
          name="message"
          rows={6}
          maxLength={3000}
          placeholder={t("messagePlaceholder")}
          required
          aria-invalid={!!state.errors?.message}
          aria-describedby={state.errors?.message ? "contact-message-error" : undefined}
        />
        <FieldError id="contact-message-error" message={err(state.errors?.message)} />
      </div>
      {/* Honeypot — hidden from people and assistive technology */}
      <div aria-hidden className="absolute -start-[9999px] h-0 w-0 overflow-hidden">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden />
      </div>
      <p className="text-xs text-muted-foreground">
        {t.rich("privacy", { link: (c) => <Link href="/privacy" className="font-medium text-primary underline">{c}</Link> })}
      </p>
      <SubmitButton size="lg" pendingText={t("sending")}>
        <Send className="rtl-flip" aria-hidden />
        {t("send")}
      </SubmitButton>
    </form>
  );
}
