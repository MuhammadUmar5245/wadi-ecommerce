/**
 * Notes written by the system are stored as stable codes and translated when
 * displayed; free-text notes typed by staff are shown as entered.
 */
export const NOTE = {
  OPENING_STOCK: "@opening_stock",
  SUPPLIER_DELIVERY: "@supplier_delivery",
  PAYMENT_RECEIVED: "@payment_received",
  CANCELLED_BY_CUSTOMER: "@cancelled_by_customer",
  CANCELLED_BY_STORE: "@cancelled_by_store",
} as const;

export function noteText(note: string | null | undefined, t: (key: string) => string): string | null {
  if (!note) return null;
  return note.startsWith("@") ? t(note.slice(1)) : note;
}
