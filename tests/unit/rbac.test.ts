import { beforeEach, describe, expect, it, vi } from "vitest";
import { accessFor, hasRole, isAdmin, isStaff, safeCallbackUrl, splitLocale } from "@/lib/rbac";
import { REPORT_MIN_ROLE } from "@/server/reports";

// The guard depends on the session; mock it so we can test role decisions.
const currentUser = vi.fn();
vi.mock("@/lib/auth-guard", async () => {
  class AuthorizationError extends Error {
    constructor(public reason: "unauthenticated" | "forbidden") {
      super(reason);
    }
  }
  const { hasRole: has } = await import("@/lib/rbac");
  return {
    AuthorizationError,
    assertRole: async (min: "CUSTOMER" | "STAFF" | "ADMIN") => {
      const u = currentUser();
      if (!u) throw new AuthorizationError("unauthenticated");
      if (!has(u.role, min)) throw new AuthorizationError("forbidden");
      return u;
    },
  };
});
// reports.ts imports the database and next-intl; only its role table is under test.
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("next-intl/server", () => ({ getTranslations: vi.fn() }));

describe("role hierarchy", () => {
  it("ranks ADMIN ⊃ STAFF ⊃ CUSTOMER", () => {
    expect(hasRole("ADMIN", "STAFF")).toBe(true);
    expect(hasRole("STAFF", "STAFF")).toBe(true);
    expect(hasRole("STAFF", "ADMIN")).toBe(false);
    expect(hasRole("CUSTOMER", "STAFF")).toBe(false);
    expect(isStaff("ADMIN")).toBe(true);
    expect(isAdmin("STAFF")).toBe(false);
  });
  it("treats unknown or missing roles as no access", () => {
    expect(hasRole("SUPERUSER", "CUSTOMER")).toBe(false);
    expect(hasRole(undefined, "CUSTOMER")).toBe(false);
  });
});

describe("route access (middleware rules)", () => {
  it.each([
    ["/admin", undefined, "login"],
    ["/admin", "CUSTOMER", "forbidden"],
    ["/admin", "STAFF", "allow"],
    ["/admin/orders/WG-10001", "STAFF", "allow"],
    ["/admin/reports/inventory", "STAFF", "allow"],
    ["/admin/reports/sales", "STAFF", "forbidden"],
    ["/admin/reports/payments", "STAFF", "forbidden"],
    ["/admin/coupons", "STAFF", "forbidden"],
    ["/admin/users", "STAFF", "forbidden"],
    ["/admin/users", "ADMIN", "allow"],
    ["/admin/reports/sales", "ADMIN", "allow"],
    ["/account/orders", undefined, "login"],
    ["/checkout", undefined, "login"],
    ["/checkout", "CUSTOMER", "allow"],
    ["/login", "CUSTOMER", "already-signed-in"],
    ["/shop", undefined, "allow"],
    ["/administrator", "CUSTOMER", "allow"], // prefix match is per path segment
  ] as const)("%s as %s → %s", (path, role, decision) => {
    expect(accessFor(path, role)).toBe(decision);
  });

  it("strips the locale prefix", () => {
    expect(splitLocale("/ar/admin/users")).toEqual({ locale: "ar", path: "/admin/users" });
    expect(splitLocale("/en")).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/english")).toEqual({ locale: null, path: "/english" });
  });

  it("only allows same-site callback URLs", () => {
    expect(safeCallbackUrl("/en/checkout", "/en")).toBe("/en/checkout");
    expect(safeCallbackUrl("https://evil.example", "/en")).toBe("/en");
    expect(safeCallbackUrl("//evil.example", "/en")).toBe("/en");
    expect(safeCallbackUrl("/\\evil.example", "/en")).toBe("/en");
    expect(safeCallbackUrl(null, "/en")).toBe("/en");
  });

  it("keeps financial reports admin-only", () => {
    expect(REPORT_MIN_ROLE.sales).toBe("ADMIN");
    expect(REPORT_MIN_ROLE.payments).toBe("ADMIN");
    expect(REPORT_MIN_ROLE.inventory).toBe("STAFF");
    expect(REPORT_MIN_ROLE["customer-orders"]).toBe("STAFF");
    expect(REPORT_MIN_ROLE.delivery).toBe("STAFF");
  });
});

describe("server-action guard", () => {
  beforeEach(() => currentUser.mockReset());

  it("runs the action for a user with enough privilege", async () => {
    const { guarded } = await import("@/server/admin/guard");
    currentUser.mockReturnValue({ id: "a", role: "ADMIN" });
    const action = vi.fn().mockResolvedValue({ ok: true });
    await expect(guarded("ADMIN", action)).resolves.toEqual({ ok: true });
    expect(action).toHaveBeenCalledOnce();
  });

  it("refuses staff calling an ADMIN-only action, without running it", async () => {
    const { guarded } = await import("@/server/admin/guard");
    currentUser.mockReturnValue({ id: "s", role: "STAFF" });
    const action = vi.fn();
    await expect(guarded("ADMIN", action)).resolves.toEqual({ message: "admin.errors.forbidden" });
    expect(action).not.toHaveBeenCalled();
  });

  it("refuses customers and signed-out callers", async () => {
    const { guarded } = await import("@/server/admin/guard");
    const action = vi.fn();
    currentUser.mockReturnValue({ id: "c", role: "CUSTOMER" });
    await expect(guarded("STAFF", action)).resolves.toEqual({ message: "admin.errors.forbidden" });
    currentUser.mockReturnValue(null);
    await expect(guarded("STAFF", action)).resolves.toEqual({ message: "auth.errors.sessionExpired" });
    expect(action).not.toHaveBeenCalled();
  });
});
