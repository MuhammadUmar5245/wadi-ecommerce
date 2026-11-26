"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { useTranslations } from "next-intl";
import { Star } from "lucide-react";
import { Field, FieldError, FormAlert, SubmitButton, useErrorText } from "@/components/forms/form-parts";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/input";
import { submitReviewAction } from "@/server/account-actions";
import { cn } from "@/lib/utils";

export function ReviewForm({ productId }: { productId: string }) {
  const t = useTranslations("reviews");
  const tAll = useTranslations();
  const err = useErrorText();
  const [state, action] = useFormState(submitReviewAction, {});
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  if (state.ok) return <FormAlert tone="success">{tAll(state.message ?? "reviews.thanks")}</FormAlert>;

  return (
    <form action={action} className="space-y-4 rounded-2xl border bg-card p-5" noValidate id="write-review">
      <h3 className="font-semibold">{t("writeTitle")}</h3>
      {state.message && <FormAlert>{tAll(state.message)}</FormAlert>}
      <input type="hidden" name="productId" value={productId} />
      <fieldset>
        <legend className="mb-1.5 text-sm font-medium">{t("yourRating")}</legend>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer rounded-md p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring" onMouseEnter={() => setHover(n)}>
              <input type="radio" name="rating" value={n} checked={rating === n} onChange={() => setRating(n)} className="sr-only" aria-label={t("starsLabel", { count: n })} />
              <Star
                className={cn("h-7 w-7 transition-colors", (hover || rating) >= n ? "text-accent" : "text-muted-foreground/30")}
                fill="currentColor"
                strokeWidth={0}
                aria-hidden
              />
            </label>
          ))}
        </div>
        <FieldError id="rating-error" message={err(state.errors?.rating)} />
      </fieldset>
      <Field label={t("title")} name="title" maxLength={80} placeholder={t("titlePlaceholder")} error={err(state.errors?.title)} />
      <div className="space-y-1.5">
        <Label htmlFor="review-comment">{t("comment")}</Label>
        <Textarea
          id="review-comment"
          name="comment"
          rows={4}
          maxLength={1000}
          placeholder={t("commentPlaceholder")}
          aria-invalid={!!state.errors?.comment}
          aria-describedby={state.errors?.comment ? "comment-error" : undefined}
        />
        <FieldError id="comment-error" message={err(state.errors?.comment)} />
      </div>
      <SubmitButton pendingText={t("submitting")}>{t("submit")}</SubmitButton>
    </form>
  );
}
