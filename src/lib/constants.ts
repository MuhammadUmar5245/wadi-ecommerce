export const ROLES = ["CUSTOMER", "STAFF", "ADMIN"] as const;
export type Role = (typeof ROLES)[number];

export const ORDER_STATUSES = [
  "PLACED",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Happy-path order of the tracking timeline (Cancelled is shown separately). */
export const ORDER_FLOW: OrderStatus[] = ["PLACED", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];
export const CUSTOMER_CANCELLABLE: OrderStatus[] = ["PLACED", "CONFIRMED"];

export const PAYMENT_METHODS = ["CARD", "COD"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Order-level payment state. VOID = cancelled before any money was taken (e.g. COD). */
export const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "VOID"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

/** Individual payment transaction state. */
export const TXN_STATUSES = ["PENDING", "SUCCEEDED", "FAILED", "REFUNDED", "VOID"] as const;
export type TxnStatus = (typeof TXN_STATUSES)[number];

export const DELIVERY_METHODS = ["STANDARD", "EXPRESS"] as const;
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number];

export const STOCK_REASONS = ["INITIAL", "RESTOCK", "SALE", "CANCELLATION", "ADJUSTMENT", "DAMAGE", "RETURN"] as const;
export type StockReason = (typeof STOCK_REASONS)[number];

export const COUPON_TYPES = ["PERCENT", "FIXED"] as const;
export const REVIEW_STATUSES = ["PUBLISHED", "HIDDEN"] as const;
export const CONTACT_STATUSES = ["NEW", "READ", "REPLIED", "ARCHIVED"] as const;

export const VAT_RATE_PERCENT = 5;
export const STANDARD_DELIVERY_FEE = 1_500; // baisa
export const EXPRESS_DELIVERY_FEE = 3_500; // baisa
export const FREE_DELIVERY_THRESHOLD = 20_000; // baisa, merchandise after discount
export const MAX_QTY_PER_LINE = 20;

/** Omani mobile/landline: +968 followed by 8 digits. */
export const OMAN_PHONE_REGEX = /^\+968\d{8}$/;

export type Governorate = { code: string; en: string; ar: string; wilayats: { en: string; ar: string }[] };

const w = (pairs: [string, string][]) => pairs.map(([en, ar]) => ({ en, ar }));

export const GOVERNORATES: Governorate[] = [
  {
    code: "muscat", en: "Muscat", ar: "مسقط",
    wilayats: w([["Muscat", "مسقط"], ["Muttrah", "مطرح"], ["Bawshar", "بوشر"], ["Al Seeb", "السيب"], ["Al Amerat", "العامرات"], ["Qurayyat", "قريات"]]),
  },
  {
    code: "dhofar", en: "Dhofar", ar: "ظفار",
    wilayats: w([["Salalah", "صلالة"], ["Taqah", "طاقة"], ["Mirbat", "مرباط"], ["Sadah", "سدح"], ["Rakhyut", "رخيوت"], ["Dhalkut", "ضلكوت"], ["Thumrait", "ثمريت"], ["Muqshin", "مقشن"], ["Shalim and Al Hallaniyat Islands", "شليم وجزر الحلانيات"], ["Al Mazyunah", "المزيونة"]]),
  },
  {
    code: "musandam", en: "Musandam", ar: "مسندم",
    wilayats: w([["Khasab", "خصب"], ["Bukha", "بخا"], ["Daba", "دبا"], ["Madha", "مدحاء"]]),
  },
  {
    code: "buraimi", en: "Al Buraimi", ar: "البريمي",
    wilayats: w([["Al Buraimi", "البريمي"], ["Mahdah", "محضة"], ["Al Sunaynah", "السنينة"]]),
  },
  {
    code: "dakhiliyah", en: "Ad Dakhiliyah", ar: "الداخلية",
    wilayats: w([["Nizwa", "نزوى"], ["Bahla", "بهلاء"], ["Manah", "منح"], ["Al Hamra", "الحمراء"], ["Adam", "أدم"], ["Izki", "إزكي"], ["Samail", "سمائل"], ["Bidbid", "بدبد"], ["Al Jabal Al Akhdar", "الجبل الأخضر"]]),
  },
  {
    code: "batinah-north", en: "North Al Batinah", ar: "شمال الباطنة",
    wilayats: w([["Sohar", "صحار"], ["Shinas", "شناص"], ["Liwa", "لوى"], ["Saham", "صحم"], ["Al Khaburah", "الخابورة"], ["Al Suwaiq", "السويق"]]),
  },
  {
    code: "batinah-south", en: "South Al Batinah", ar: "جنوب الباطنة",
    wilayats: w([["Al Rustaq", "الرستاق"], ["Al Awabi", "العوابي"], ["Nakhal", "نخل"], ["Wadi Al Maawil", "وادي المعاول"], ["Barka", "بركاء"], ["Al Musannah", "المصنعة"]]),
  },
  {
    code: "sharqiyah-north", en: "North Al Sharqiyah", ar: "شمال الشرقية",
    wilayats: w([["Ibra", "إبراء"], ["Al Mudhaibi", "المضيبي"], ["Bidiyah", "بدية"], ["Al Qabil", "القابل"], ["Wadi Bani Khalid", "وادي بني خالد"], ["Dima Wa Al Taiyin", "دماء والطائيين"], ["Sinaw", "سناو"]]),
  },
  {
    code: "sharqiyah-south", en: "South Al Sharqiyah", ar: "جنوب الشرقية",
    wilayats: w([["Sur", "صور"], ["Al Kamil Wal Wafi", "الكامل والوافي"], ["Jaalan Bani Bu Hassan", "جعلان بني بو حسن"], ["Jaalan Bani Bu Ali", "جعلان بني بو علي"], ["Masirah", "مصيرة"]]),
  },
  {
    code: "dhahirah", en: "Al Dhahirah", ar: "الظاهرة",
    wilayats: w([["Ibri", "عبري"], ["Yanqul", "ينقل"], ["Dhank", "ضنك"]]),
  },
  {
    code: "wusta", en: "Al Wusta", ar: "الوسطى",
    wilayats: w([["Haima", "هيماء"], ["Duqm", "الدقم"], ["Mahout", "محوت"], ["Al Jazer", "الجازر"]]),
  },
];

export function governorateName(code: string, locale: string) {
  const g = GOVERNORATES.find((x) => x.code === code);
  return g ? (locale === "ar" ? g.ar : g.en) : code;
}

export function wilayatName(govCode: string, wilayat: string, locale: string) {
  const g = GOVERNORATES.find((x) => x.code === govCode);
  const found = g?.wilayats.find((x) => x.en === wilayat);
  return found ? (locale === "ar" ? found.ar : found.en) : wilayat;
}

export function isValidWilayat(govCode: string, wilayat: string) {
  return !!GOVERNORATES.find((g) => g.code === govCode)?.wilayats.some((x) => x.en === wilayat);
}
