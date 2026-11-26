import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  ArrowRight,
  Boxes,
  CreditCard,
  Headphones,
  HardHat,
  MapPinned,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Users,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/common/misc";
import { ProductCard, ProductGrid } from "@/components/product/product-card";
import { ProductCardActions } from "@/components/product/product-card-actions";
import { RatingStars } from "@/components/product/rating-stars";
import { CopyCode, NewsletterForm } from "@/components/home/client-bits";
import { getBestSellers, getCategories, getFeatured, getHomeReviews, getNewArrivals, getStoreStats, type ProductCardData } from "@/server/catalog";

function Products({ items }: { items: ProductCardData[] }) {
  return (
    <ProductGrid>
      {items.map((p) => (
        <ProductCard key={p.id} product={p} actions={<ProductCardActions product={p} />} />
      ))}
    </ProductGrid>
  );
}

export default async function HomePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("home");
  const [categories, featured, arrivals, best, reviews, stats] = await Promise.all([
    getCategories(locale),
    getFeatured(locale, 7),
    getNewArrivals(locale, 4),
    getBestSellers(locale, 4),
    getHomeReviews(locale, 3),
    getStoreStats(),
  ]);
  // The hero shows the first three featured products; the Featured section shows the next four.
  const heroImages = featured.slice(0, 3);
  const featuredGrid = featured.length > 4 ? featured.slice(3) : featured;

  return (
    <>
      {/* 1 — Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-secondary/70 to-background">
        <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full text-accent/15" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden>
          <path d="M0 110c180-70 360-90 540-45s330 50 480-10 300-60 420-20v125H0z" fill="currentColor" />
        </svg>
        <div className="container relative grid items-center gap-10 py-12 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold text-primary shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden />
              {t("heroBadge")}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] sm:text-5xl lg:text-6xl">
              {t.rich("heroTitleRich", { em: (c) => <span className="text-primary">{c}</span> })}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-muted-foreground">{t("heroSubtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/shop">
                  {t("shopNow")}
                  <ArrowRight className="rtl-flip" aria-hidden />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/services">{t("ourServices")}</Link>
              </Button>
            </div>
            <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-sm">
              <div>
                <dt className="text-muted-foreground">{t("statProducts")}</dt>
                <dd className="tabular text-2xl font-bold">{stats.products}+</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("statGovernorates")}</dt>
                <dd className="tabular text-2xl font-bold">11</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">{t("statRating")}</dt>
                <dd className="tabular flex items-center gap-1 text-2xl font-bold">
                  {stats.avgRating.toFixed(1)} <Star className="h-5 w-5 text-accent" fill="currentColor" strokeWidth={0} aria-hidden />
                </dd>
              </div>
            </dl>
          </div>
          <div className="relative mx-auto hidden w-full max-w-lg grid-cols-2 gap-4 md:grid">
            {heroImages.map((p, i) => (
              <Link
                key={p.id}
                href={`/product/${p.slug}`}
                className={`relative overflow-hidden rounded-3xl shadow-lg ring-1 ring-black/5 ${i === 0 ? "row-span-2 aspect-[3/4] h-full" : "aspect-square"}`}
              >
                <Image src={p.image} alt={p.name} fill unoptimized sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-500 hover:scale-105" />
              </Link>
            ))}
            <div className="absolute -bottom-4 start-4 flex items-center gap-3 rounded-2xl border bg-card p-3 pe-5 shadow-lg">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/15 text-success">
                <PackageCheck className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="tabular text-sm font-bold">{t("deliveredCount", { count: stats.delivered })}</p>
                <p className="text-xs text-muted-foreground">{t("deliveredHint")}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2 — Trust strip */}
      <section aria-label={t("trustLabel")} className="border-y bg-card">
        <ul className="container grid grid-cols-2 gap-4 py-6 lg:grid-cols-4">
          {[
            { icon: Truck, title: t("trustDelivery"), body: t("trustDeliveryBody") },
            { icon: ShieldCheck, title: t("trustSecure"), body: t("trustSecureBody") },
            { icon: RotateCcw, title: t("trustReturns"), body: t("trustReturnsBody") },
            { icon: Headphones, title: t("trustSupport"), body: t("trustSupportBody") },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 3 — Shop by category */}
      <section className="container py-14">
        <SectionHeading title={t("categoriesTitle")} subtitle={t("categoriesSubtitle")} href="/shop" linkLabel={t("viewAll")} />
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <li key={c.id}>
              <Link href={`/category/${c.slug}`} className="group block overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md">
                <div className="relative aspect-[3/2] overflow-hidden">
                  <Image src={c.image} alt="" fill unoptimized sizes="(min-width: 1024px) 16vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold leading-tight">{c.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t("productCount", { count: c.count })}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* 4 — Featured */}
      <section className="container pb-14">
        <SectionHeading title={t("featuredTitle")} subtitle={t("featuredSubtitle")} href="/shop" linkLabel={t("viewAll")} />
        <Products items={featuredGrid} />
      </section>

      {/* 5 — Promo banner */}
      <section className="container pb-14">
        <div className="relative overflow-hidden rounded-3xl bg-accent px-6 py-10 text-accent-foreground sm:px-12">
          <svg className="absolute -end-10 -top-10 h-64 w-64 text-white/20" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="8" />
          </svg>
          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-widest">{t("promoKicker")}</p>
              <h2 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t("promoTitle")}</h2>
              <p className="mt-2 max-w-lg">{t("promoBody")}</p>
            </div>
            <div className="flex flex-col items-start gap-3">
              <CopyCode code="WELCOME10" />
              <Link href="/shop" className="text-sm font-semibold underline underline-offset-4">
                {t("promoCta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6 — New arrivals */}
      <section className="container pb-14">
        <SectionHeading title={t("newTitle")} subtitle={t("newSubtitle")} href="/shop?sort=newest" linkLabel={t("viewAll")} />
        <Products items={arrivals} />
      </section>

      {/* 7 — Best sellers */}
      <section className="container pb-14">
        <SectionHeading title={t("bestTitle")} subtitle={t("bestSubtitle")} href="/shop?sort=rating" linkLabel={t("viewAll")} />
        <Products items={best} />
      </section>

      {/* 8 — Services */}
      <section className="bg-secondary/50 py-14">
        <div className="container">
          <SectionHeading title={t("servicesTitle")} subtitle={t("servicesSubtitle")} href="/services" linkLabel={t("learnMore")} />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Boxes, title: t("svcTrading"), body: t("svcTradingBody") },
              { icon: HardHat, title: t("svcContracting"), body: t("svcContractingBody") },
              { icon: Truck, title: t("svcDelivery"), body: t("svcDeliveryBody") },
              { icon: Headphones, title: t("svcSupport"), body: t("svcSupportBody") },
              { icon: CreditCard, title: t("svcPayment"), body: t("svcPaymentBody") },
              { icon: PackageCheck, title: t("svcBulk"), body: t("svcBulkBody") },
            ].map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <Icon className="h-6 w-6" aria-hidden />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 9 — Why choose us + stats */}
      <section className="container grid items-center gap-10 py-14 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">{t("whyTitle")}</h2>
          <p className="mt-3 text-muted-foreground">{t("whyBody")}</p>
          <ul className="mt-6 space-y-3">
            {[t("why1"), t("why2"), t("why3"), t("why4")].map((w) => (
              <li key={w} className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-2 gap-4">
          {[
            { icon: Boxes, value: `${stats.products}+`, label: t("statProducts") },
            { icon: Users, value: `${stats.customers}+`, label: t("statCustomers") },
            { icon: MapPinned, value: "11", label: t("statGovernorates") },
            { icon: PackageCheck, value: `${stats.delivered}+`, label: t("statDelivered") },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-2xl border bg-card p-6 shadow-sm">
              <Icon className="h-6 w-6 text-accent" aria-hidden />
              <dd className="tabular mt-3 text-3xl font-extrabold">{value}</dd>
              <dt className="mt-1 text-sm text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      {/* 10 — Customer reviews */}
      {reviews.length > 0 && (
        <section className="container pb-14">
          <SectionHeading title={t("reviewsTitle")} subtitle={t("reviewsSubtitle")} />
          <ul className="grid gap-4 md:grid-cols-3">
            {reviews.map((r) => (
              <li key={r.id} className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm">
                <RatingStars value={r.rating} />
                {r.title && (
                  <p className="mt-3 font-semibold" dir="auto">
                    {r.title}
                  </p>
                )}
                <blockquote className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground" dir="auto">
                  “{r.comment}”
                </blockquote>
                <div className="mt-4 border-t pt-4 text-sm">
                  <p className="font-semibold">{r.user.name}</p>
                  <Link href={`/product/${r.product.slug}`} className="text-xs text-primary hover:underline">
                    {r.productName}
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 11 — Newsletter / contact CTA */}
      <section className="container pb-4">
        <div className="grid gap-8 rounded-3xl bg-primary p-8 text-primary-foreground sm:p-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">{t("newsletterTitle")}</h2>
            <p className="mt-2 text-primary-foreground/95">{t("newsletterBody")}</p>
            <div className="mt-6">
              <NewsletterForm />
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 p-6">
            <h3 className="font-semibold">{t("ctaTitle")}</h3>
            <p className="mt-1.5 text-sm text-primary-foreground/95">{t("ctaBody")}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Button asChild variant="accent">
                <Link href="/contact">{t("ctaContact")}</Link>
              </Button>
              <Button asChild variant="outline" className="border-white/40 bg-transparent text-primary-foreground hover:bg-white/10">
                <a href="tel:+96824000000" dir="ltr">
                  +968 2400 0000
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
