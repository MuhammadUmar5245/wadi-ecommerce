import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminPageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Panel({ title, actions, children, className }: { title?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border bg-card shadow-sm", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3.5">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "warning";
}) {
  return (
    <div className="min-w-0 rounded-2xl border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", tone === "warning" ? "bg-warning/15 text-warning" : "bg-secondary text-primary")}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="tabular mt-3 whitespace-nowrap text-xl font-bold sm:text-2xl">{value}</p>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

/** GET search/filter bar used on admin list pages (works without JavaScript). */
export function FilterBar({ children, q, placeholder }: { children?: React.ReactNode; q?: string; placeholder?: string }) {
  const t = useTranslations("admin");
  return (
    <form method="get" className="no-print mb-4 flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4">
      <div className="min-w-[12rem] flex-1">
        <label htmlFor="admin-q" className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("search")}
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <input
            id="admin-q"
            name="q"
            defaultValue={q}
            placeholder={placeholder}
            className="h-10 w-full rounded-lg border border-input bg-background ps-9 pe-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>
      {children}
      <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
        {t("apply")}
      </button>
    </form>
  );
}

export function FilterSelect({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <select
        id={`f-${name}`}
        name={name}
        defaultValue={value ?? ""}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FilterDate({ name, label, value }: { name: string; label: string; value?: string }) {
  return (
    <div>
      <label htmlFor={`f-${name}`} className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <input
        id={`f-${name}`}
        type="date"
        name={name}
        defaultValue={value}
        dir="ltr"
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    </div>
  );
}
