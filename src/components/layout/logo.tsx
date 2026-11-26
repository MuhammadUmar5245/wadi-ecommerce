import { cn } from "@/lib/utils";

/** SVG text logo: a sun over two wadi dunes, plus the bilingual wordmark. */
export function Logo({ locale, className, compact = false }: { locale: string; className?: string; compact?: boolean }) {
  const ar = locale === "ar";
  const name = ar ? "وادي الغبيطة" : "Wadi Al Ghubaitah";
  const sub = ar ? "للتجارة والمقاولات" : "TRADE & CONT.";
  const width = compact ? 44 : ar ? 190 : 212;

  return (
    <svg
      role="img"
      aria-label={`${name} — ${sub}`}
      viewBox={`0 0 ${width} 44`}
      width={width}
      height={44}
      className={cn("h-10 w-auto shrink-0 text-foreground", className)}
      direction={ar ? "rtl" : "ltr"}
    >
      <g transform={ar && !compact ? `translate(${width - 44} 0)` : undefined}>
        <rect width="44" height="44" rx="12" className="fill-primary" />
        <circle cx="29" cy="15" r="5" className="fill-accent" />
        <path d="M4 30c5-6 10-8 15-5s8 3 12-1c3-3 6-3 9-2v14H4z" className="fill-accent" opacity=".85" />
        <path d="M4 35c6-4 12-5 17-2s10 2 14-1c2-1 4-2 5-2v8H4z" fill="#FAFAF7" opacity=".92" />
      </g>
      {!compact && (
        <g className="fill-current">
          <text
            x={ar ? width - 54 : 54}
            y="21"
            textAnchor="start"
            fontFamily="var(--font-heading)"
            fontWeight="800"
            fontSize={ar ? 17 : 15.5}
          >
            {name}
          </text>
          <text
            x={ar ? width - 54 : 54}
            y="37"
            textAnchor="start"
            fontFamily="var(--font-body)"
            fontWeight="600"
            fontSize={ar ? 11 : 9.5}
            letterSpacing={ar ? 0 : 2.6}
            className="fill-primary dark:fill-accent"
          >
            {sub}
          </text>
        </g>
      )}
    </svg>
  );
}
