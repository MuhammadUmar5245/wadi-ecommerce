import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { loc } from "@/lib/i18n-utils";

export const PAGE_SIZE = 12;
export const SORTS = ["newest", "price-asc", "price-desc", "rating"] as const;
export type Sort = (typeof SORTS)[number];

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  lowStockThreshold: number;
  image: string;
  imageAlt: string;
  ratingAvg: number;
  ratingCount: number;
  categoryName: string;
  categorySlug: string;
};

const cardInclude = {
  images: { orderBy: { sortOrder: "asc" }, take: 1 },
  category: { select: { slug: true, nameEn: true, nameAr: true } },
} satisfies Prisma.ProductInclude;

type CardRow = Prisma.ProductGetPayload<{ include: typeof cardInclude }>;

export function toCard(p: CardRow, locale: string): ProductCardData {
  const img = p.images[0];
  return {
    id: p.id,
    slug: p.slug,
    name: loc(locale, p.nameEn, p.nameAr),
    brand: p.brand,
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    stock: p.stock,
    lowStockThreshold: p.lowStockThreshold,
    image: img?.url ?? "/images/placeholder.svg",
    imageAlt: img ? loc(locale, img.altEn, img.altAr) : loc(locale, p.nameEn, p.nameAr),
    ratingAvg: p.ratingAvg,
    ratingCount: p.ratingCount,
    categoryName: loc(locale, p.category.nameEn, p.category.nameAr),
    categorySlug: p.category.slug,
  };
}

export const getCategories = cache(async (locale: string) => {
  const rows = await db.category.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { isActive: true } } } } },
  });
  return rows.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: loc(locale, c.nameEn, c.nameAr),
    description: loc(locale, c.descriptionEn, c.descriptionAr),
    icon: c.icon,
    image: `/images/categories/${c.slug}.svg`,
    count: c._count.products,
  }));
});

export const getCategoryBySlug = cache(async (slug: string) =>
  db.category.findFirst({ where: { slug, isActive: true } })
);

export type ListingParams = {
  q?: string;
  category?: string;
  min?: number; // baisa
  max?: number; // baisa
  inStock?: boolean;
  rating?: number;
  sort?: Sort;
  page?: number;
};

/** Parse URL search params into validated listing params. */
export function parseListingParams(sp: Record<string, string | string[] | undefined>): ListingParams {
  const one = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined));
  const num = (k: string) => {
    const v = Number(one(k));
    return Number.isFinite(v) && v >= 0 ? v : undefined;
  };
  const sort = one("sort");
  const minOmr = num("min");
  const maxOmr = num("max");
  const rating = num("rating");
  return {
    q: one("q")?.trim().slice(0, 80) || undefined,
    category: one("category") || undefined,
    min: minOmr != null ? Math.round(minOmr * 1000) : undefined,
    max: maxOmr != null ? Math.round(maxOmr * 1000) : undefined,
    inStock: one("inStock") === "1",
    rating: rating && rating >= 1 && rating <= 5 ? Math.floor(rating) : undefined,
    sort: SORTS.includes(sort as Sort) ? (sort as Sort) : "newest",
    page: Math.max(1, Math.floor(num("page") ?? 1)),
  };
}

function whereFor(p: ListingParams): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [{ isActive: true }, { category: { isActive: true } }];
  if (p.category) and.push({ category: { slug: p.category } });
  if (p.min != null) and.push({ price: { gte: p.min } });
  if (p.max != null) and.push({ price: { lte: p.max } });
  if (p.inStock) and.push({ stock: { gt: 0 } });
  if (p.rating) and.push({ ratingAvg: { gte: p.rating } });
  if (p.q) {
    const terms = p.q.split(/\s+/).filter(Boolean).slice(0, 5);
    for (const term of terms) {
      and.push({
        OR: [
          { nameEn: { contains: term } },
          { nameAr: { contains: term } },
          { brand: { contains: term } },
          { sku: { contains: term } },
          { descriptionEn: { contains: term } },
          { descriptionAr: { contains: term } },
          { category: { nameEn: { contains: term } } },
          { category: { nameAr: { contains: term } } },
        ],
      });
    }
  }
  return { AND: and };
}

const orderFor = (sort: Sort = "newest"): Prisma.ProductOrderByWithRelationInput[] => {
  switch (sort) {
    case "price-asc":
      return [{ price: "asc" }, { id: "asc" }];
    case "price-desc":
      return [{ price: "desc" }, { id: "asc" }];
    case "rating":
      return [{ ratingAvg: "desc" }, { ratingCount: "desc" }, { id: "asc" }];
    default:
      return [{ createdAt: "desc" }, { id: "asc" }];
  }
};

export async function listProducts(params: ListingParams, locale: string) {
  const where = whereFor(params);
  const total = await db.product.count({ where });
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(params.page ?? 1, pages);
  const rows = await db.product.findMany({
    where,
    orderBy: orderFor(params.sort),
    include: cardInclude,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  return { items: rows.map((r) => toCard(r, locale)), total, page, pages };
}

export async function getFeatured(locale: string, take = 8) {
  const rows = await db.product.findMany({
    where: { isActive: true, isFeatured: true },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    include: cardInclude,
    take,
  });
  return rows.map((r) => toCard(r, locale));
}

export async function getNewArrivals(locale: string, take = 8) {
  const rows = await db.product.findMany({ where: { isActive: true }, orderBy: { createdAt: "desc" }, include: cardInclude, take });
  return rows.map((r) => toCard(r, locale));
}

export async function getBestSellers(locale: string, take = 8) {
  const rows = await db.product.findMany({
    where: { isActive: true },
    orderBy: [{ soldCount: "desc" }, { ratingAvg: "desc" }],
    include: cardInclude,
    take,
  });
  return rows.map((r) => toCard(r, locale));
}

export async function getProductBySlug(slug: string) {
  return db.product.findFirst({
    where: { slug, isActive: true },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });
}

export async function getRelated(productId: string, categoryId: string, locale: string, take = 4) {
  const rows = await db.product.findMany({
    where: { isActive: true, categoryId, id: { not: productId } },
    orderBy: [{ soldCount: "desc" }],
    include: cardInclude,
    take,
  });
  return rows.map((r) => toCard(r, locale));
}

export async function getReviewSummary(productId: string) {
  const grouped = await db.review.groupBy({
    by: ["rating"],
    where: { productId, status: "PUBLISHED" },
    _count: true,
  });
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({ star, count: grouped.find((g) => g.rating === star)?._count ?? 0 }));
  const total = breakdown.reduce((s, b) => s + b.count, 0);
  const avg = total ? breakdown.reduce((s, b) => s + b.star * b.count, 0) / total : 0;
  return { total, avg, breakdown };
}

export async function getProductReviews(productId: string, take = 10) {
  return db.review.findMany({
    where: { productId, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    take,
    select: { id: true, rating: true, title: true, comment: true, createdAt: true, user: { select: { name: true } } },
  });
}

export async function getHomeReviews(locale: string, take = 6) {
  const rows = await db.review.findMany({
    where: { status: "PUBLISHED", rating: { gte: 4 } },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      rating: true,
      title: true,
      comment: true,
      createdAt: true,
      user: { select: { name: true } },
      product: { select: { slug: true, nameEn: true, nameAr: true } },
    },
  });
  return rows.map((r) => ({ ...r, productName: loc(locale, r.product.nameEn, r.product.nameAr) }));
}

export async function getStoreStats() {
  const [products, customers, delivered, rating] = await Promise.all([
    db.product.count({ where: { isActive: true } }),
    db.user.count({ where: { role: "CUSTOMER" } }),
    db.order.count({ where: { status: "DELIVERED" } }),
    db.review.aggregate({ where: { status: "PUBLISHED" }, _avg: { rating: true } }),
  ]);
  return { products, customers, delivered, avgRating: rating._avg.rating ?? 0 };
}
