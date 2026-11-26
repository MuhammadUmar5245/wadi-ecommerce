import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs, SectionHeading } from "@/components/common/misc";
import { ProductGallery } from "@/components/product/gallery";
import { BuyBox } from "@/components/product/buy-box";
import { Price, discountPercent } from "@/components/product/price";
import { RatingStars } from "@/components/product/rating-stars";
import { StockBadge } from "@/components/product/stock-badge";
import { ReviewList, ReviewSummary } from "@/components/product/reviews";
import { ProductCard, ProductGrid, ProductGridSkeleton } from "@/components/product/product-card";
import { ProductCardActions } from "@/components/product/product-card-actions";
import { WishlistButton } from "@/components/account/wishlist-button";
import { ReviewForm } from "@/components/product/review-form";
import { ScopedMessages } from "@/components/scoped-messages";
import { getCurrentUser } from "@/lib/auth-guard";
import { reviewEligibility } from "@/server/order-ops";
import { getProductBySlug, getProductReviews, getRelated, getReviewSummary } from "@/server/catalog";
import { loc, parseSpecs } from "@/lib/i18n-utils";
import { baisaToOmrString } from "@/lib/money";

type Props = { params: { locale: string; slug: string } };

export async function generateMetadata({ params: { locale, slug } }: Props): Promise<Metadata> {
  const p = await getProductBySlug(slug);
  // Resolved before streaming starts, so unknown products get a real 404 status.
  if (!p) notFound();
  const name = loc(locale, p.nameEn, p.nameAr);
  return {
    title: name,
    description: loc(locale, p.descriptionEn, p.descriptionAr),
    openGraph: { title: name, images: p.images[0] ? [p.images[0].url] : [] },
  };
}

export default async function ProductPage({ params: { locale, slug } }: Props) {
  setRequestLocale(locale);
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const t = await getTranslations("product");
  const tc = await getTranslations("catalog");
  const [summary, reviews] = await Promise.all([
    getReviewSummary(product.id),
    getProductReviews(product.id),
  ]);

  const user = await getCurrentUser();
  const eligibility = user ? await reviewEligibility(user.id, product.id) : null;
  const name = loc(locale, product.nameEn, product.nameAr);
  const categoryName = loc(locale, product.category.nameEn, product.category.nameAr);
  const specs = parseSpecs(product.specs);
  const off = discountPercent(product.price, product.compareAtPrice);
  const images = product.images.map((i) => ({ url: i.url, alt: loc(locale, i.altEn, i.altAr) }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    sku: product.sku,
    brand: { "@type": "Brand", name: product.brand },
    image: images.map((i) => i.url),
    description: loc(locale, product.descriptionEn, product.descriptionAr),
    offers: {
      "@type": "Offer",
      priceCurrency: "OMR",
      price: baisaToOmrString(product.price).replace(/,/g, ""),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(summary.total ? { aggregateRating: { "@type": "AggregateRating", ratingValue: summary.avg.toFixed(1), reviewCount: summary.total } } : {}),
  };

  return (
    <div className="container py-8 lg:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs
        items={[
          { href: "/shop", label: tc("shopTitle") },
          { href: `/category/${product.category.slug}`, label: categoryName },
          { label: name },
        ]}
      />

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-12">
        <ProductGallery images={images} />

        <div className="space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/category/${product.category.slug}`} className="text-sm font-medium text-primary hover:underline">
                {categoryName}
              </Link>
              {off > 0 && <Badge variant="accent">{t("percentOff", { percent: off })}</Badge>}
            </div>
            <h1 className="mt-2 text-2xl font-bold leading-tight sm:text-3xl">{name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("brand")}: <span className="font-medium text-foreground">{product.brand}</span> · {t("sku")}:{" "}
              <span className="font-mono text-foreground" dir="ltr">
                {product.sku}
              </span>
            </p>
            <a href="#reviews" className="mt-3 inline-flex rounded-md">
              {summary.total > 0 ? (
                <RatingStars value={summary.avg} count={summary.total} showValue size="md" />
              ) : (
                <span className="text-sm text-muted-foreground">{t("noReviewsYet")}</span>
              )}
            </a>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <Price amount={product.price} compareAt={product.compareAtPrice} size="lg" />
            <p className="mt-1 text-xs text-muted-foreground">{t("vatNote")}</p>
            <div className="mt-4 flex items-center gap-2">
              <StockBadge stock={product.stock} threshold={product.lowStockThreshold} />
            </div>
            <div className="mt-5">
              <BuyBox product={{ id: product.id, name, stock: product.stock }} extra={<WishlistButton productId={product.id} name={name} size="lg" />} />
            </div>
          </div>

          <p className="leading-relaxed text-muted-foreground">{loc(locale, product.descriptionEn, product.descriptionAr)}</p>

          <ul className="grid gap-3 text-sm sm:grid-cols-2">
            {[
              { icon: Truck, text: t("perkDelivery") },
              { icon: ShieldCheck, text: t("perkSecure") },
              { icon: RotateCcw, text: t("perkReturns") },
              { icon: BadgeCheck, text: t("perkGenuine") },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 rounded-xl bg-muted/60 px-3 py-2.5">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-14" aria-labelledby="specs-heading">
        <h2 id="specs-heading" className="mb-4 text-2xl font-bold">
          {t("specifications")}
        </h2>
        <div className="overflow-hidden rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <caption className="sr-only">{t("specsOf", { name })}</caption>
            <tbody>
              <tr className="border-b">
                <th scope="row" className="w-1/3 bg-muted/50 px-4 py-3 text-start font-medium">
                  {t("sku")}
                </th>
                <td className="px-4 py-3 font-mono" dir="ltr">
                  {product.sku}
                </td>
              </tr>
              {specs.map((s, i) => (
                <tr key={i} className="border-b last:border-0">
                  <th scope="row" className="w-1/3 bg-muted/50 px-4 py-3 text-start font-medium">
                    {loc(locale, s.keyEn, s.keyAr)}
                  </th>
                  <td className="px-4 py-3">{loc(locale, s.valueEn, s.valueAr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="reviews" className="mt-14 scroll-mt-32" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="mb-4 text-2xl font-bold">
          {t("customerReviews")}
        </h2>
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="space-y-4">
            <ReviewSummary summary={summary} />
            {eligibility?.eligible ? (
              <ScopedMessages namespaces={["reviews", "auth.errors"]}>
                <ReviewForm productId={product.id} />
              </ScopedMessages>
            ) : (
              <p className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
                {eligibility?.reason === "already" ? t("alreadyReviewed") : user ? t("reviewPolicy") : t("reviewLogin")}
              </p>
            )}
          </div>
          <ReviewList reviews={reviews} />
        </div>
      </section>

      <Suspense fallback={<ProductGridSkeleton count={4} />}>
        <RelatedProducts productId={product.id} categoryId={product.categoryId} categorySlug={product.category.slug} locale={locale} />
      </Suspense>
    </div>
  );
}

/** Streamed separately so the main product content renders first. */
async function RelatedProducts({ productId, categoryId, categorySlug, locale }: { productId: string; categoryId: string; categorySlug: string; locale: string }) {
  const [t, related] = await Promise.all([getTranslations("product"), getRelated(productId, categoryId, locale)]);
  if (related.length === 0) return null;
  return (
    <section className="mt-14" aria-labelledby="related-heading">
      <SectionHeading title={t("related")} href={`/category/${categorySlug}`} linkLabel={t("viewCategory")} />
      <ProductGrid>
        {related.map((p) => (
          <ProductCard key={p.id} product={p} actions={<ProductCardActions product={p} />} />
        ))}
      </ProductGrid>
    </section>
  );
}
