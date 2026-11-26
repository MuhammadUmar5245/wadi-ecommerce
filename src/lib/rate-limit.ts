import "server-only";
import { db } from "./db";

export const LOGIN_WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILED_PER_EMAIL = 5;
export const MAX_FAILED_PER_IP = 20;

/** Returns minutes until the lock expires, or 0 when the login may proceed. */
export async function loginLockMinutes(email: string, ip: string): Promise<number> {
  const since = new Date(Date.now() - LOGIN_WINDOW_MS);
  const [byEmail, byIp] = await Promise.all([
    db.loginAttempt.findMany({
      where: { email, success: false, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    }),
    db.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } }),
  ]);

  const emailLocked = byEmail.length >= MAX_FAILED_PER_EMAIL;
  if (!emailLocked && byIp < MAX_FAILED_PER_IP) return 0;

  // The lock lifts when the oldest counted failure falls out of the window.
  const oldest = emailLocked ? byEmail[byEmail.length - MAX_FAILED_PER_EMAIL].createdAt : since;
  const ms = oldest.getTime() + LOGIN_WINDOW_MS - Date.now();
  return Math.max(1, Math.ceil(ms / 60_000));
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  await db.loginAttempt.create({ data: { email, ip, success } });
  if (success) {
    // A successful login clears the failure count for that account.
    await db.loginAttempt.deleteMany({ where: { email, success: false } });
  }
}

export function clientIp(headers: Headers | null | undefined): string {
  const fwd = headers?.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? headers?.get("x-real-ip") ?? "local").trim().slice(0, 64);
}
