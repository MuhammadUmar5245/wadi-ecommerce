"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { emailSchema, fieldErrors, type ActionState } from "@/lib/validation";

export async function subscribeAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = z.object({ email: emailSchema }).safeParse({ email: formData.get("email") });
  if (!parsed.success) return { errors: fieldErrors(parsed.error) };
  await db.newsletterSubscriber.upsert({ where: { email: parsed.data.email }, create: { email: parsed.data.email }, update: {} });
  return { ok: true, message: "home.newsletterThanks" };
}
