"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { emailSchema, fieldErrors, nameSchema, normaliseOmanPhone, type ActionState } from "@/lib/validation";
import { OMAN_PHONE_REGEX } from "@/lib/constants";

const contactSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? normaliseOmanPhone(v) : undefined))
    .refine((v) => v === undefined || OMAN_PHONE_REGEX.test(v), "phoneInvalid"),
  subject: z.string().trim().min(3, "subjectMin").max(120, "tooLong"),
  message: z.string().trim().min(20, "messageMin").max(3000, "tooLong"),
  // Honeypot: real visitors never see or fill this field.
  website: z.string().max(0).optional(),
});

export async function sendContactAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    // Silently "succeed" for bots that filled the honeypot.
    if (parsed.error.issues.some((i) => i.path[0] === "website")) return { ok: true, message: "pages.contact.sent" };
    return { errors: fieldErrors(parsed.error) };
  }
  const { name, email, phone, subject, message } = parsed.data;
  const data = { name, email, phone, subject, message };

  // Basic flood protection: at most 3 messages per email every 10 minutes.
  const recent = await db.contactMessage.count({ where: { email: data.email, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } } });
  if (recent >= 3) return { message: "validation.tooMany" };

  await db.contactMessage.create({ data: { ...data, phone: data.phone ?? null } });
  return { ok: true, message: "pages.contact.sent" };
}
