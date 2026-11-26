"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Field, FieldError, useErrorText } from "@/components/forms/form-parts";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GOVERNORATES } from "@/lib/constants";

export type AddressDefaults = Partial<{
  label: string;
  fullName: string;
  phone: string;
  governorate: string;
  wilayat: string;
  area: string;
  street: string;
  building: string;
  way: string | null;
  notes: string | null;
}>;

/** Omani address fields: governorate drives the wilayat list. */
export function AddressFields({
  errors,
  defaults = {},
  showLabel = false,
  showNotes = true,
}: {
  errors?: Record<string, string>;
  defaults?: AddressDefaults;
  showLabel?: boolean;
  showNotes?: boolean;
}) {
  const t = useTranslations("address");
  const locale = useLocale();
  const err = useErrorText();
  const [gov, setGov] = useState(defaults.governorate ?? "");
  const [wilayat, setWilayat] = useState(defaults.wilayat ?? "");
  const wilayats = GOVERNORATES.find((g) => g.code === gov)?.wilayats ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {showLabel && <Field className="sm:col-span-2" label={t("label")} name="label" placeholder={t("labelPlaceholder")} defaultValue={defaults.label} error={err(errors?.label)} />}
      <Field label={t("fullName")} name="fullName" autoComplete="name" required defaultValue={defaults.fullName} error={err(errors?.fullName)} />
      <Field
        label={t("phone")}
        name="phone"
        type="tel"
        autoComplete="tel"
        dir="ltr"
        required
        placeholder="+968 9123 4567"
        defaultValue={defaults.phone}
        error={err(errors?.phone)}
      />
      <div className="space-y-1.5">
        <Label htmlFor="governorate">{t("governorate")}</Label>
        <NativeSelect
          id="governorate"
          name="governorate"
          required
          value={gov}
          onChange={(e) => {
            setGov(e.target.value);
            setWilayat("");
          }}
          aria-invalid={!!errors?.governorate}
          aria-describedby={errors?.governorate ? "governorate-error" : undefined}
        >
          <option value="">{t("choose")}</option>
          {GOVERNORATES.map((g) => (
            <option key={g.code} value={g.code}>
              {locale === "ar" ? g.ar : g.en}
            </option>
          ))}
        </NativeSelect>
        <FieldError id="governorate-error" message={err(errors?.governorate)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="wilayat">{t("wilayat")}</Label>
        <NativeSelect
          id="wilayat"
          name="wilayat"
          required
          disabled={!gov}
          value={wilayat}
          onChange={(e) => setWilayat(e.target.value)}
          aria-invalid={!!errors?.wilayat}
          aria-describedby={errors?.wilayat ? "wilayat-error" : undefined}
        >
          <option value="">{gov ? t("choose") : t("chooseGovernorateFirst")}</option>
          {wilayats.map((w) => (
            <option key={w.en} value={w.en}>
              {locale === "ar" ? w.ar : w.en}
            </option>
          ))}
        </NativeSelect>
        <FieldError id="wilayat-error" message={err(errors?.wilayat)} />
      </div>
      <Field label={t("area")} name="area" required placeholder={t("areaPlaceholder")} defaultValue={defaults.area} error={err(errors?.area)} />
      <Field label={t("street")} name="street" required defaultValue={defaults.street} error={err(errors?.street)} />
      <Field label={t("building")} name="building" required placeholder={t("buildingPlaceholder")} defaultValue={defaults.building} error={err(errors?.building)} />
      <Field label={t("way")} name="way" dir="ltr" defaultValue={defaults.way ?? undefined} hint={t("wayHint")} error={err(errors?.way)} />
      {showNotes && (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="notes">{t("notes")}</Label>
          <Textarea id="notes" name="notes" rows={2} maxLength={300} placeholder={t("notesPlaceholder")} defaultValue={defaults.notes ?? undefined} />
        </div>
      )}
    </div>
  );
}
