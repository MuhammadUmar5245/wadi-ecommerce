import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { authConfig } from "./auth.config";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { clientIp, loginLockMinutes, recordLoginAttempt } from "@/lib/rate-limit";
import { isRole } from "@/lib/rbac";

class InvalidCredentials extends CredentialsSignin {
  code = "invalid_credentials";
}
class RateLimited extends CredentialsSignin {
  constructor(minutes: number) {
    super();
    this.code = `rate_limited:${minutes}`;
  }
}
class AccountDisabled extends CredentialsSignin {
  code = "account_disabled";
}

// Compared against when the email is unknown so response time doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("timing-equaliser-not-a-real-password", 10);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidCredentials();
        const { email, password } = parsed.data;
        const ip = clientIp(request?.headers);

        const lockedFor = await loginLockMinutes(email, ip);
        if (lockedFor > 0) throw new RateLimited(lockedFor);

        const user = await db.user.findUnique({ where: { email } });
        const valid = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);

        if (!user || !valid) {
          await recordLoginAttempt(email, ip, false);
          throw new InvalidCredentials();
        }
        if (!user.isActive) throw new AccountDisabled();

        await recordLoginAttempt(email, ip, true);
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

        return { id: user.id, name: user.name, email: user.email, role: isRole(user.role) ? user.role : "CUSTOMER" };
      },
    }),
  ],
});
