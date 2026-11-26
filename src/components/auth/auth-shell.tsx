import { getTranslations } from "next-intl/server";
import { CheckCircle2 } from "lucide-react";
import { ScopedMessages } from "@/components/scoped-messages";

export async function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const t = await getTranslations("auth");
  const perks = [t("perk1"), t("perk2"), t("perk3")];

  return (
    <div className="container grid max-w-5xl gap-8 py-10 lg:grid-cols-[1fr_1.1fr] lg:py-16">
      <aside className="relative hidden overflow-hidden rounded-3xl bg-primary p-10 text-primary-foreground lg:block">
        <svg className="absolute inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden>
          <path d="M0 80c60-40 120-50 180-20s110 25 160-10c25-17 45-20 60-15v85H0z" className="fill-accent" opacity=".5" />
          <path d="M0 100c70-25 140-30 200-10s120 15 200-15v45H0z" fill="#fff" opacity=".12" />
        </svg>
        <p className="text-sm font-semibold uppercase tracking-widest text-sand">{t("brandTag")}</p>
        <h2 className="mt-3 text-3xl font-bold leading-tight">{t("brandTitle")}</h2>
        <ul className="relative mt-8 space-y-3 text-sm">
          {perks.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
              {p}
            </li>
          ))}
        </ul>
      </aside>
      <section className="rounded-3xl border bg-card p-6 shadow-sm sm:p-10">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">
          <ScopedMessages namespaces={["auth"]}>{children}</ScopedMessages>
        </div>
      </section>
    </div>
  );
}
