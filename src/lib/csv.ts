/** RFC 4180 CSV helpers. Money is written as plain OMR with 3 decimals so spreadsheets can sum it. */
import { baisaToOmrString } from "./money";
import { MUSCAT_OFFSET_MS } from "./dates";

export type CsvColumn = { key: string; label: string; type: string };
export type CsvRow = Record<string, string | number | Date | null | undefined>;

export function csvEscape(value: unknown): string {
  if (value == null) return "";
  let s = String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const muscat = (d: Date) => new Date(d.getTime() + MUSCAT_OFFSET_MS).toISOString().replace("T", " ").slice(0, 16);

export function formatCsvCell(value: CsvRow[string], type: string, label?: (type: string, v: string) => string): string {
  if (value == null || value === "") return "";
  switch (type) {
    case "money":
      return baisaToOmrString(Number(value)).replace(/,/g, "");
    case "pct":
      return `${(Number(value) * 100).toFixed(1)}%`;
    case "datetime":
      return value instanceof Date ? muscat(value) : String(value);
    case "date":
      return value instanceof Date ? muscat(value).slice(0, 10) : String(value);
    case "orderStatus":
    case "txnStatus":
      return label ? label(type, String(value)) : String(value);
    default:
      return String(value);
  }
}

export function toCsv(columns: CsvColumn[], rows: CsvRow[], opts: { totals?: CsvRow; label?: (type: string, v: string) => string } = {}): string {
  const lines = [columns.map((c) => csvEscape(c.label)).join(",")];
  for (const r of [...rows, ...(opts.totals ? [opts.totals] : [])]) {
    lines.push(columns.map((c) => csvEscape(formatCsvCell(r[c.key], c.type, opts.label))).join(","));
  }
  // BOM so Excel opens UTF-8 (Arabic) correctly.
  return `﻿${lines.join("\r\n")}\r\n`;
}
