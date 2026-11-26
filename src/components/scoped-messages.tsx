import { NextIntlClientProvider, type AbstractIntlMessages } from "next-intl";
import { getMessages } from "next-intl/server";

/** Namespaces every storefront page needs on the client (header, cart drawer, product cards…). */
export const BASE_CLIENT_NAMESPACES = [
  "common",
  "header",
  "validation",
  "errors",
  "home",
  "product",
  "catalog",
  "cart",
  "wishlist",
  "notifications",
  "orderStatus",
  "paymentStatus",
];

/** Picks top-level namespaces, or nested ones written as "pages.contact". */
export async function pickMessages(names: string[]): Promise<AbstractIntlMessages> {
  const all = (await getMessages()) as AbstractIntlMessages;
  const out: Record<string, AbstractIntlMessages | string> = {};
  for (const name of names) {
    const [top, sub] = name.split(".");
    const value = all[top];
    if (value === undefined) continue;
    if (!sub) out[top] = value;
    else {
      const parent = (out[top] as AbstractIntlMessages | undefined) ?? {};
      out[top] = { ...parent, [sub]: (value as AbstractIntlMessages)[sub] };
    }
  }
  return out;
}

/**
 * Re-provides client messages for a subtree with extra namespaces. Nested
 * providers replace (not merge) messages, so the base set is always included.
 * Keeps the HTML of ordinary pages small by not shipping, e.g., checkout or
 * account strings to the home page.
 */
export async function ScopedMessages({ namespaces, children }: { namespaces: string[]; children: React.ReactNode }) {
  const messages = await pickMessages([...BASE_CLIENT_NAMESPACES, ...namespaces]);
  return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
