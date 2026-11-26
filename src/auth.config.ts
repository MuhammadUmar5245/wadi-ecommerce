import type { NextAuthConfig } from "next-auth";
import { isRole } from "@/lib/rbac";

/**
 * Edge-safe Auth.js config (no Prisma / bcrypt) shared by middleware and the
 * full server config in src/auth.ts.
 */
export const authConfig = {
  pages: { signIn: "/en/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  trustHost: true,
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: string }).role ?? "CUSTOMER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = isRole(token.role) ? token.role : "CUSTOMER";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
