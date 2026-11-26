import { useTranslations } from "next-intl";
import { ChevronRight, PackageSearch } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const t = useTranslations("common");
  return (
    <nav aria-label={t("breadcrumb")} className="breadcrumbs text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link href="/" className="hover:text-foreground">
            {t("home")}
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5 rtl-flip" aria-hidden />
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="line-clamp-1 font-medium text-foreground">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function EmptyState({
  icon: Icon = PackageSearch,
  title,
  body,
  action,
  className,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  body?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center rounded-2xl border border-dashed bg-card px-6 py-14 text-center", className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="mt-4 text-lg font-semibold">{title}</h2>
      {body && <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionHeading({
  title,
  subtitle,
  href,
  linkLabel,
  className,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="text-2xl font-bold sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1.5 text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      {href && linkLabel && (
        <Link href={href} className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline">
          {linkLabel}
          <ChevronRight className="h-4 w-4 rtl-flip" aria-hidden />
        </Link>
      )}
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6">
      {children}
      <h1 className="mt-3 text-3xl font-bold sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-3xl text-muted-foreground">{subtitle}</p>}
    </div>
  );
}
