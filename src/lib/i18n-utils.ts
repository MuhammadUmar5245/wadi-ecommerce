/** Pick the English or Arabic variant of a bilingual field. */
export function loc(locale: string, en: string, ar: string | null | undefined) {
  return locale === "ar" && ar ? ar : en;
}

export type Spec = { keyEn: string; keyAr: string; valueEn: string; valueAr: string };

export function parseSpecs(json: string): Spec[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((s) => s && typeof s.keyEn === "string") : [];
  } catch {
    return [];
  }
}
