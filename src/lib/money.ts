/** Money helpers. All amounts are integer baisa; 1 OMR = 1000 baisa. */

export const BAISA_PER_OMR = 1000;

export function toBaisa(omr: number | string): number {
  const n = typeof omr === "string" ? Number(omr.replace(/,/g, "")) : omr;
  if (!Number.isFinite(n)) throw new Error("Invalid amount");
  return Math.round(n * BAISA_PER_OMR);
}

export function baisaToOmrString(baisa: number): string {
  const sign = baisa < 0 ? "-" : "";
  const abs = Math.abs(Math.trunc(baisa));
  const whole = Math.floor(abs / BAISA_PER_OMR);
  const frac = String(abs % BAISA_PER_OMR).padStart(3, "0");
  return `${sign}${whole.toLocaleString("en-US")}.${frac}`;
}

/** "OMR 12.500" in English, "12.500 ر.ع." in Arabic. Western digits are kept in both for clarity. */
export function formatOMR(baisa: number, locale: string = "en"): string {
  const amount = baisaToOmrString(baisa);
  return locale === "ar" ? `${amount} ر.ع.` : `OMR ${amount}`;
}
