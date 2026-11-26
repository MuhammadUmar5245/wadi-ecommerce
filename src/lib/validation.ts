/**
 * zod schemas shared by client forms and server actions. Error messages are
 * translation keys under the "validation" namespace so they render bilingually.
 */
import { z } from "zod";
import { OMAN_PHONE_REGEX, isValidWilayat } from "./constants";

/** Accepts "9123 4567", "+968 9123-4567", "96891234567" and normalises to "+96891234567". */
export function normaliseOmanPhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\d{8}$/.test(digits)) return `+968${digits}`;
  if (/^968\d{8}$/.test(digits)) return `+${digits}`;
  if (/^00968\d{8}$/.test(digits)) return `+${digits.slice(2)}`;
  return digits;
}

export const emailSchema = z.string().trim().toLowerCase().min(1, "required").email("emailInvalid").max(120, "tooLong");

export const phoneSchema = z
  .string()
  .trim()
  .min(1, "required")
  .transform(normaliseOmanPhone)
  .refine((v) => OMAN_PHONE_REGEX.test(v), "phoneInvalid");

export const passwordSchema = z
  .string()
  .min(8, "passwordMin")
  .max(72, "passwordMax")
  .refine((v) => /[a-z]/.test(v) && /[A-Z]/.test(v), "passwordCase")
  .refine((v) => /\d/.test(v), "passwordDigit")
  .refine((v) => /[^A-Za-z0-9]/.test(v), "passwordSymbol");

export const nameSchema = z.string().trim().min(2, "nameMin").max(80, "tooLong");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "required").max(72, "passwordMax"),
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "required"),
    terms: z.literal("on", { errorMap: () => ({ message: "termsRequired" }) }),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch" });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch" })
  .refine((d) => d.newPassword !== d.currentPassword, { path: ["newPassword"], message: "passwordSame" });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    token: z.string().regex(/^[a-f0-9]{64}$/, "tokenInvalid"),
    password: passwordSchema,
    confirmPassword: z.string().min(1, "required"),
  })
  .refine((d) => d.password === d.confirmPassword, { path: ["confirmPassword"], message: "passwordMismatch" });

export type FieldErrors = Record<string, string>;

/** Flatten zod issues to { field: firstMessageKey }. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Standard result shape returned by form server actions. */
export type ActionState = {
  ok?: boolean;
  /** translation key for a form-level message */
  message?: string;
  errors?: FieldErrors;
  /** extra data, e.g. a demo reset link */
  data?: Record<string, string>;
};

const GOV_CODES = ["muscat", "dhofar", "musandam", "buraimi", "dakhiliyah", "batinah-north", "batinah-south", "sharqiyah-north", "sharqiyah-south", "dhahirah", "wusta"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "tooLong")
    .optional()
    .transform((v) => (v ? v : undefined));

export const addressSchema = z
  .object({
    label: z.string().trim().max(30, "tooLong").optional().transform((v) => v || "Home"),
    fullName: nameSchema,
    phone: phoneSchema,
    governorate: z.enum(GOV_CODES, { errorMap: () => ({ message: "governorateRequired" }) }),
    wilayat: z.string().trim().min(1, "wilayatRequired"),
    area: z.string().trim().min(2, "required").max(80, "tooLong"),
    street: z.string().trim().min(1, "required").max(120, "tooLong"),
    building: z.string().trim().min(1, "required").max(80, "tooLong"),
    way: optionalText(20),
    notes: optionalText(300),
  })
  .refine((a) => isValidWilayat(a.governorate, a.wilayat), { path: ["wilayat"], message: "wilayatRequired" });

export const checkoutSchema = z.object({
  addressId: optionalText(40),
  deliveryMethod: z.enum(["STANDARD", "EXPRESS"], { errorMap: () => ({ message: "required" }) }),
  paymentMethod: z.enum(["CARD", "COD"], { errorMap: () => ({ message: "paymentRequired" }) }),
  couponCode: optionalText(30),
  saveAddress: z.literal("on").optional(),
});

export const cardSchema = z.object({
  orderNumber: z.string().regex(/^WG-\d{5}$/, "invalid"),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^\d{16}$/.test(v), "cardNumberInvalid"),
  cardHolder: z.string().trim().min(2, "cardHolderRequired").max(60, "tooLong"),
  expiry: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\s*\/\s*(\d{2})$/, "expiryInvalid")
    .refine((v) => {
      const [mm, yy] = v.split("/").map((x) => Number(x.trim()));
      const end = new Date(2000 + yy, mm, 1); // first day of the month after expiry
      return end > new Date();
    }, "cardExpired"),
  cvc: z.string().trim().regex(/^\d{3,4}$/, "cvcInvalid"),
});
