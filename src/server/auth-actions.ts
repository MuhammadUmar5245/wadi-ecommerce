"use server";

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { getLocale } from "next-intl/server";
import { isRedirectError } from "next/dist/client/components/redirect";
import { signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth-guard";
import { safeCallbackUrl } from "@/lib/rbac";
import {
  changePasswordSchema,
  fieldErrors,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type ActionState,
} from "@/lib/validation";

const RESET_TTL_MS = 30 * 60 * 1000;
const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

/** Map Auth.js sign-in errors to translation keys. */
function signInErrorMessage(error: AuthError): ActionState {
  const code = (error as AuthError & { code?: string }).code ?? "";
  if (code.startsWith("rate_limited")) {
    return { message: "auth.errors.rateLimited", data: { minutes: code.split(":")[1] ?? "15" } };
  }
  if (code === "account_disabled") return { message: "auth.errors.disabled" };
  return { message: "auth.errors.invalidCredentials" };
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const locale = await getLocale();
  // Staff and admins land in the admin panel unless they were heading somewhere specific.
  const role = (await db.user.findUnique({ where: { email: parsed.data.email }, select: { role: true } }))?.role;
  const home = role === "STAFF" || role === "ADMIN" ? `/${locale}/admin` : `/${locale}/account`;
  const redirectTo = safeCallbackUrl(formData.get("callbackUrl")?.toString(), home);
  try {
    await signIn("credentials", { ...parsed.data, redirectTo });
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) return signInErrorMessage(error);
    throw error;
  }
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const { name, email, phone, password } = parsed.data;
  const locale = await getLocale();

  const existing = await db.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) return { errors: { email: "emailTaken" } };

  await db.user.create({
    data: {
      name,
      email,
      phone,
      locale,
      passwordHash: await bcrypt.hash(password, 12),
      role: "CUSTOMER",
      notifications: {
        create: {
          type: "SYSTEM",
          titleEn: "Welcome to Wadi Al Ghubaitah",
          titleAr: "أهلاً بك في وادي الغبيطة",
          bodyEn: "Your account is ready. Use code WELCOME10 for 10% off your first order.",
          bodyAr: "حسابك جاهز. استخدم الرمز WELCOME10 للحصول على خصم 10% على طلبك الأول.",
          link: "/shop",
        },
      },
    },
  });

  const redirectTo = safeCallbackUrl(formData.get("callbackUrl")?.toString(), `/${locale}/account?welcome=1`);
  try {
    await signIn("credentials", { email, password, redirectTo });
    return { ok: true };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) return signInErrorMessage(error);
    throw error;
  }
}

export async function logoutAction() {
  const locale = await getLocale();
  await signOut({ redirectTo: `/${locale}` });
}

export async function changePasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { message: "auth.errors.sessionExpired" };

  const parsed = changePasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const record = await db.user.findUniqueOrThrow({ where: { id: user.id }, select: { passwordHash: true } });
  if (!(await bcrypt.compare(parsed.data.currentPassword, record.passwordHash))) {
    return { errors: { currentPassword: "currentPasswordWrong" } };
  }

  await db.$transaction([
    db.user.update({ where: { id: user.id }, data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) } }),
    db.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    db.notification.create({
      data: {
        userId: user.id,
        type: "SYSTEM",
        titleEn: "Password changed",
        titleAr: "تم تغيير كلمة المرور",
        bodyEn: "Your password was changed. If this wasn't you, please contact us straight away.",
        bodyAr: "تم تغيير كلمة المرور الخاصة بك. إن لم تكن أنت من قام بذلك، يُرجى التواصل معنا فوراً.",
      },
    }),
  ]);
  return { ok: true, message: "auth.passwordChanged" };
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  const locale = await getLocale();

  // Always the same answer, so the form can't be used to discover registered emails.
  const result: ActionState = { ok: true, message: "auth.resetSent" };

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, isActive: true } });
  if (!user || !user.isActive) return result;

  // At most 3 reset requests per account every 15 minutes.
  const recent = await db.passwordResetToken.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) } },
  });
  if (recent >= 3) return result;

  const token = randomBytes(32).toString("hex");
  await db.passwordResetToken.create({
    data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
  });

  const host = headers().get("host") ?? "localhost:3000";
  const proto = headers().get("x-forwarded-proto") ?? "http";
  const link = `${proto}://${host}/${locale}/reset-password?token=${token}`;
  // Email delivery is simulated: the link goes to the server log (and the screen in demo mode).
  console.info(`[password-reset] ${parsed.data.email}: ${link}`);
  if (process.env.DEMO_MODE === "true") result.data = { link };
  return result;
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };

  const record = await db.passwordResetToken.findUnique({ where: { tokenHash: sha256(parsed.data.token) } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { message: "auth.errors.resetInvalid" };
  }

  await db.$transaction([
    db.user.update({ where: { id: record.userId }, data: { passwordHash: await bcrypt.hash(parsed.data.password, 12) } }),
    db.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    db.passwordResetToken.deleteMany({ where: { userId: record.userId, id: { not: record.id } } }),
    db.loginAttempt.deleteMany({ where: { email: (await db.user.findUniqueOrThrow({ where: { id: record.userId } })).email, success: false } }),
    db.notification.create({
      data: {
        userId: record.userId,
        type: "SYSTEM",
        titleEn: "Password reset",
        titleAr: "تمت إعادة تعيين كلمة المرور",
        bodyEn: "Your password was reset successfully.",
        bodyAr: "تمت إعادة تعيين كلمة المرور بنجاح.",
      },
    }),
  ]);
  return { ok: true, message: "auth.resetDone" };
}
