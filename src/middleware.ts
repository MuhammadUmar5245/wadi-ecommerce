import NextAuth from "next-auth";
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { routing } from "@/i18n/routing";
import { accessFor, splitLocale } from "@/lib/rbac";

const { auth } = NextAuth(authConfig);
const intlMiddleware = createIntlMiddleware(routing);

/**
 * First line of defence for role-based access. Every server action and
 * protected page also re-checks the role against the database.
 */
export default auth((req) => {
  const { pathname, search } = req.nextUrl;
  const { locale, path } = splitLocale(pathname);
  if (!locale) return intlMiddleware(req);

  const role = req.auth?.user?.role;
  const decision = accessFor(path, role);

  if (decision === "login") {
    const url = new URL(`/${locale}/login`, req.nextUrl);
    url.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (decision === "forbidden") {
    return NextResponse.rewrite(new URL(`/${locale}/forbidden`, req.nextUrl), { status: 403 });
  }
  if (decision === "already-signed-in") {
    return NextResponse.redirect(new URL(`/${locale}${role === "CUSTOMER" ? "/account" : "/admin"}`, req.nextUrl));
  }
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
