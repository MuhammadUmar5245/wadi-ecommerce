import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@/auth";
import { db } from "./db";
import { hasRole, isRole } from "./rbac";
import type { Role } from "./constants";

export type CurrentUser = { id: string; name: string; email: string; phone: string; role: Role };

/**
 * Resolves the signed-in user from the session AND the database, so a role
 * change or deactivation takes effect immediately, even with an older JWT.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  const user = await db.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, phone: true, role: true, isActive: true },
  });
  if (!user || !user.isActive || !isRole(user.role)) return null;
  return { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role };
});

export class AuthorizationError extends Error {
  constructor(public reason: "unauthenticated" | "forbidden") {
    super(reason);
  }
}

/** For server actions / route handlers: throws when the user lacks `min` role. */
export async function assertRole(min: Role): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("unauthenticated");
  if (!hasRole(user.role, min)) throw new AuthorizationError("forbidden");
  return user;
}

/** For server components/pages: redirects instead of throwing. */
export async function requireRole(min: Role, callbackPath?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  const locale = await getLocale();
  if (!user) {
    const cb = callbackPath ? `?callbackUrl=${encodeURIComponent(`/${locale}${callbackPath}`)}` : "";
    redirect(`/${locale}/login${cb}`);
  }
  if (!hasRole(user.role, min)) redirect(`/${locale}/forbidden`);
  return user;
}

export const requireUser = (callbackPath?: string) => requireRole("CUSTOMER", callbackPath);
