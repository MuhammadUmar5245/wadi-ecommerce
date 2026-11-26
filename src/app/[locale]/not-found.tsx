import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Compass } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/top-bar";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { HeaderSearch } from "@/components/layout/header-search";

export default async function NotFound() {
  const t = await getTranslations("pages.notFound");
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <SiteHeader />
      <main id="main" className="flex flex-1 items-center">
        <div className="container flex max-w-xl flex-col items-center py-20 text-center">
          <div className="relative">
            <p className="tabular select-none text-[7rem] font-extrabold leading-none text-primary/10 sm:text-[9rem]" aria-hidden>
              404
            </p>
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                <Compass className="h-8 w-8" aria-hidden />
              </span>
            </span>
          </div>
          <h1 className="mt-6 text-3xl font-bold">{t("title")}</h1>
          <p className="mt-3 text-muted-foreground">{t("body")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/">{t("home")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/shop">{t("shop")}</Link>
            </Button>
          </div>
          <p className="mt-10 text-sm text-muted-foreground">{t("search")}</p>
          <Suspense fallback={null}>
            <HeaderSearch id="notfound-search" className="mt-3 max-w-md" />
          </Suspense>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
