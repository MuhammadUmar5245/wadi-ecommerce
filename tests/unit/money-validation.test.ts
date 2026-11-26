import { describe, expect, it } from "vitest";
import { baisaToOmrString, formatOMR, toBaisa } from "@/lib/money";
import { normaliseOmanPhone, passwordSchema, phoneSchema, registerSchema } from "@/lib/validation";
import { csvEscape, toCsv } from "@/lib/csv";
import { parseRange, muscatDayKey } from "@/lib/dates";

describe("money", () => {
  it("formats baisa as OMR with three decimals", () => {
    expect(formatOMR(12_500, "en")).toBe("OMR 12.500");
    expect(formatOMR(5, "en")).toBe("OMR 0.005");
    expect(formatOMR(1_234_567, "en")).toBe("OMR 1,234.567");
    expect(formatOMR(12_500, "ar")).toBe("12.500 ر.ع.");
    expect(baisaToOmrString(-1_500)).toBe("-1.500");
  });
  it("converts OMR to integer baisa without float drift", () => {
    expect(toBaisa("12.5")).toBe(12_500);
    expect(toBaisa(0.1 + 0.2)).toBe(300);
    expect(toBaisa("1,000.005")).toBe(1_000_005);
  });
});

describe("Omani phone numbers", () => {
  it.each([
    ["9123 4567", "+96891234567"],
    ["+968 9123-4567", "+96891234567"],
    ["96891234567", "+96891234567"],
    ["0096891234567", "+96891234567"],
  ])("normalises %s", (input, out) => {
    expect(normaliseOmanPhone(input)).toBe(out);
  });
  it("rejects numbers that aren't +968 followed by 8 digits", () => {
    expect(phoneSchema.safeParse("1234567").success).toBe(false);
    expect(phoneSchema.safeParse("+97150123456").success).toBe(false);
    expect(phoneSchema.safeParse("+968912345678").success).toBe(false);
  });
});

describe("passwords and registration", () => {
  it.each([
    ["short", "Ab@1", "passwordMin"],
    ["no upper case", "abcdef@1", "passwordCase"],
    ["no digit", "Abcdefg@", "passwordDigit"],
    ["no symbol", "Abcdefg1", "passwordSymbol"],
  ])("rejects a password with %s", (_l, pw, key) => {
    const r = passwordSchema.safeParse(pw);
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues.map((i) => i.message)).toContain(key);
  });
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Customer@12345").success).toBe(true);
  });
  it("requires matching confirmation and accepted terms", () => {
    const base = { name: "Aisha", email: "A@Example.TEST ", phone: "91234567", password: "Strong@123", confirmPassword: "Strong@123", terms: "on" };
    const ok = registerSchema.safeParse(base);
    expect(ok.success && ok.data.email).toBe("a@example.test");
    expect(registerSchema.safeParse({ ...base, confirmPassword: "Other@123" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...base, terms: undefined }).success).toBe(false);
  });
});

describe("CSV export", () => {
  it("quotes commas/quotes and neutralises formula injection", () => {
    expect(csvEscape('a,"b"')).toBe('"a,""b"""');
    expect(csvEscape("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvEscape("-12.5")).toBe("-12.5");
  });
  it("writes money as plain OMR and starts with a BOM", () => {
    const csv = toCsv([{ key: "n", label: "Name", type: "text" }, { key: "t", label: "Total", type: "money" }], [{ n: "Aisha", t: 29_579 }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("Aisha,29.579");
  });
});

describe("report date ranges (Asia/Muscat)", () => {
  it("uses Muscat calendar days (UTC+4)", () => {
    expect(muscatDayKey(new Date("2026-10-19T21:30:00Z"))).toBe("2026-10-20");
  });
  it("covers whole days and swaps reversed input", () => {
    const r = parseRange("2026-10-10", "2026-10-01");
    expect(r.from).toBe("2026-10-01");
    expect(r.to).toBe("2026-10-10");
    expect(r.gte.toISOString()).toBe("2026-09-30T20:00:00.000Z");
    expect(r.lt.toISOString()).toBe("2026-10-10T20:00:00.000Z");
  });
});
