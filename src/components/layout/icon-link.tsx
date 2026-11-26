import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (!count) return null;
  return (
    <span
      className={cn(
        "absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-none text-accent-foreground ring-2 ring-card",
        className
      )}
      aria-hidden
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function IconLink({
  href,
  label,
  count = 0,
  children,
  className,
}: {
  href: string;
  label: string;
  count?: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      prefetch={false}
      className={cn("relative inline-flex h-10 w-10 items-center justify-center rounded-xl hover:bg-muted", className)}
      aria-label={count ? `${label} (${count})` : label}
    >
      {children}
      <CountBadge count={count} />
    </Link>
  );
}
