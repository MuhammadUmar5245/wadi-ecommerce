import { Breadcrumbs } from "@/components/common/misc";

/** Shared header band for content pages. */
export function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <section className="relative overflow-hidden border-b bg-gradient-to-b from-secondary/70 to-background">
      <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full text-accent/15" viewBox="0 0 1440 100" preserveAspectRatio="none" aria-hidden>
        <path d="M0 70c180-45 360-55 540-25s330 30 480-5 300-40 420-15v75H0z" fill="currentColor" />
      </svg>
      <div className="container relative py-10 lg:py-14">
        <Breadcrumbs items={[{ label: title }]} />
        <h1 className="mt-4 text-3xl font-extrabold sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{subtitle}</p>}
        {children}
      </div>
    </section>
  );
}

type Section = { heading: string; body: string[] };

/** Long-form legal text with an in-page table of contents. */
export function LegalBody({ sections, tocLabel, updated }: { sections: Section[]; tocLabel: string; updated: string }) {
  return (
    <div className="container grid gap-10 py-12 lg:grid-cols-[240px_1fr]">
      <nav aria-label={tocLabel} className="hidden lg:block">
        <ol className="sticky top-32 space-y-1 border-s ps-4 text-sm">
          {sections.map((s, i) => (
            <li key={s.heading}>
              <a href={`#s${i + 1}`} className="block py-1 text-muted-foreground hover:text-primary">
                {i + 1}. {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>
      <article className="max-w-3xl">
        <p className="mb-8 text-sm text-muted-foreground">{updated}</p>
        {sections.map((s, i) => (
          <section key={s.heading} id={`s${i + 1}`} className="mb-8 scroll-mt-32">
            <h2 className="text-xl font-bold">
              {i + 1}. {s.heading}
            </h2>
            {s.body.map((p, j) => (
              <p key={j} className="mt-3 leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
