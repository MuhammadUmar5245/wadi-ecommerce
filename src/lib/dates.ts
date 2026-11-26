/** Date helpers in Asia/Muscat time (UTC+4, no daylight saving). */
export const MUSCAT_OFFSET_MS = 4 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** "YYYY-MM-DD" of the Muscat calendar day containing `d`. */
export function muscatDayKey(d: Date): string {
  return new Date(d.getTime() + MUSCAT_OFFSET_MS).toISOString().slice(0, 10);
}

/** UTC instant of 00:00 Muscat on the given "YYYY-MM-DD". */
export function muscatDayStart(key: string): Date {
  return new Date(new Date(`${key}T00:00:00.000Z`).getTime() - MUSCAT_OFFSET_MS);
}

export function addDays(key: string, n: number): string {
  return new Date(new Date(`${key}T00:00:00.000Z`).getTime() + n * DAY).toISOString().slice(0, 10);
}

/** Consecutive day keys from `from` to `to` inclusive. */
export function dayKeys(from: string, to: string): string[] {
  const out: string[] = [];
  for (let k = from; k <= to && out.length < 1000; k = addDays(k, 1)) out.push(k);
  return out;
}

const KEY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a report date range from query params. Defaults to the last `defaultDays`
 * days (inclusive of today). Returns keys plus the [gte, lt) UTC instants.
 */
export function parseRange(from?: string, to?: string, defaultDays = 30) {
  const today = muscatDayKey(new Date());
  let f = from && KEY.test(from) ? from : addDays(today, -(defaultDays - 1));
  let t = to && KEY.test(to) ? to : today;
  if (f > t) [f, t] = [t, f];
  return { from: f, to: t, gte: muscatDayStart(f), lt: muscatDayStart(addDays(t, 1)) };
}
