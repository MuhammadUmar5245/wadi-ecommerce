/**
 * Role-based access rules. Pure and edge-safe: used by middleware, server
 * guards, navigation and unit tests, so there is a single source of truth.
 */
import type { Role } from "./constants";

const RANK: Record<Role, number> = { CUSTOMER: 0, STAFF: 1, ADMIN: 2 };

export function isRole(value: unknown): value is Role {
  return value === "CUSTOMER" || value === "STAFF" || value === "ADMIN";
}

/** True when `role` is at least `min` (ADMIN ⊃ STAFF ⊃ CUSTOMER). */
export function hasRole(role: string | null | undefined, min: Role): boolean {
  if (!isRole(role)) return false;
  return RANK[role] >= RANK[min];
}

export const isStaff = (role?: string | null) => hasRole(role, "STAFF");
export const isAdmin = (role?: string | null) => hasRole(role, "ADMIN");

/** Admin-area paths (without locale) that only ADMIN may open. Prefix match. */
export const ADMIN_ONLY_PREFIXES = [
  "/admin/coupons",
  "/admin/users",
  "/admin/reports/sales",
  "/admin/reports/payments",
] as const;

/** Paths that need any signed-in user. */
export const AUTH_REQUIRED_PREFIXES = ["/account", "/checkout"] as const;

/** Pages a signed-in user should not see (redirected to their account). */
export const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"] as const;

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

export type AccessDecision = "allow" | "login" | "forbidden" | "already-signed-in";

/** Decide whether `role` (undefined = guest) may open `path` (locale already stripped). */
export function accessFor(path: string, role: string | null | undefined): AccessDecision {
  if (matches(path, "/admin")) {
    if (!role) return "login";
    if (!isStaff(role)) return "forbidden";
    if (ADMIN_ONLY_PREFIXES.some((p) => matches(path, p)) && !isAdmin(role)) return "forbidden";
    return "allow";
  }
  if (AUTH_REQUIRED_PREFIXES.some((p) => matches(path, p))) return role ? "allow" : "login";
  if (role && GUEST_ONLY_PATHS.some((p) => matches(path, p))) return "already-signed-in";
  return "allow";
}

/** Strip a leading /en or /ar. */
export function splitLocale(pathname: string): { locale: string | null; path: string } {
  const m = pathname.match(/^\/(en|ar)(?=\/|$)(.*)$/);
  if (!m) return { locale: null, path: pathname || "/" };
  return { locale: m[1], path: m[2] || "/" };
}

/** Only allow same-site relative callback URLs to prevent open redirects. */
export function safeCallbackUrl(url: string | null | undefined, fallback: string): string {
  if (!url || !url.startsWith("/") || url.startsWith("//") || url.startsWith("/\\")) return fallback;
  return url;
}
