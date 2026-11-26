"use client";

import { useLocale, useTranslations } from "next-intl";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { formatOMR } from "@/lib/money";

/** Categorical slots, in fixed order (validated light + dark steps live in globals.css). */
export const VIZ = ["var(--viz-1)", "var(--viz-2)", "var(--viz-3)", "var(--viz-4)", "var(--viz-5)", "var(--viz-6)", "var(--viz-7)"];

/**
 * Recharts tags individual marks with role="img" but no text alternative. Each
 * chart wrapper already has role="img" + aria-label and the data is available
 * as a table, so the inner roles are removed to keep one clear description.
 */
function stripInnerRoles(el: HTMLDivElement | null) {
  if (!el) return;
  const run = () => el.querySelectorAll('svg [role="img"]').forEach((n) => n.removeAttribute("role"));
  run();
  new MutationObserver(run).observe(el, { subtree: true, childList: true });
}

const AXIS = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };
const GRID = "hsl(var(--border))";

function TipBox({ title, rows }: { title?: string; rows: { label: string; value: string; color?: string }[] }) {
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-lg" dir="auto">
      {title && <p className="mb-1 font-semibold text-foreground">{title}</p>}
      {rows.map((r) => (
        <p key={r.label} className="flex items-center gap-2 text-muted-foreground">
          {r.color && <span className="h-2 w-2 rounded-full" style={{ background: r.color }} aria-hidden />}
          <span>{r.label}</span>
          <span className="tabular ms-auto ps-3 font-semibold text-foreground">{r.value}</span>
        </p>
      ))}
    </div>
  );
}

const shortDay = (key: string, locale: string) =>
  new Date(`${key}T00:00:00Z`).toLocaleDateString(locale === "ar" ? "ar-OM-u-nu-latn" : "en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

const compactOmr = (baisa: number) => (baisa >= 1_000_000 ? `${(baisa / 1_000_000).toFixed(1)}k` : `${Math.round(baisa / 1000)}`);

/** Daily revenue line (single series → titled by its panel, no legend). */
export function SalesTrendChart({ data, height = 280 }: { data: { day: string; revenue: number; orders: number }[]; height?: number }) {
  const locale = useLocale();
  const t = useTranslations("admin.charts");
  const rtl = locale === "ar";
  return (
    <div ref={stripInnerRoles} dir="ltr" style={{ height }} role="img" aria-label={t("salesAria")}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--viz-1)" stopOpacity={0.25} />
              <stop offset="100%" stopColor="var(--viz-1)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" tickFormatter={(k) => shortDay(k, locale)} tick={AXIS} tickLine={false} axisLine={false} reversed={rtl} minTickGap={24} />
          <YAxis tickFormatter={compactOmr} tick={AXIS} tickLine={false} axisLine={false} width={44} orientation={rtl ? "right" : "left"} />
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
            content={({ active, payload, label }: TooltipProps<number, string>) =>
              active && payload?.length ? (
                <TipBox
                  title={shortDay(String(label), locale)}
                  rows={[
                    { label: t("revenue"), value: formatOMR(payload[0].payload.revenue, locale), color: "var(--viz-1)" },
                    { label: t("orders"), value: String(payload[0].payload.orders) },
                  ]}
                />
              ) : null
            }
          />
          <Area type="monotone" isAnimationActive={false} dataKey="revenue" stroke="var(--viz-1)" strokeWidth={2} fill="url(#salesFill)" activeDot={{ r: 5, strokeWidth: 2, stroke: "hsl(var(--card))" }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut with an HTML legend carrying label + count, so identity never rests on colour alone. */
export function DonutChart({ data, height = 220, valueFormat }: { data: { key: string; label: string; value: number }[]; height?: number; valueFormat?: (v: number) => string }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const fmt = valueFormat ?? ((v: number) => String(v));
  const t = useTranslations("admin.charts");
  return (
    <div className="flex flex-col items-center gap-5">
      <div ref={stripInnerRoles} dir="ltr" className="relative w-full max-w-[220px]" style={{ height }} role="img" aria-label={t("donutAria")}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="95%" paddingAngle={1} stroke="hsl(var(--card))" strokeWidth={2} isAnimationActive={false}>
              {data.map((d, i) => (
                <Cell key={d.key} fill={VIZ[i % VIZ.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }: TooltipProps<number, string>) =>
                active && payload?.length ? (
                  <TipBox rows={[{ label: String(payload[0].name), value: `${fmt(Number(payload[0].value))} · ${total ? Math.round((Number(payload[0].value) / total) * 100) : 0}%`, color: String(payload[0].payload.fill) }]} />
                ) : null
              }
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="tabular text-xl font-bold">{fmt(total)}</span>
          <span className="text-xs text-muted-foreground">{t("total")}</span>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
        {data.map((d, i) => (
          <li key={d.key} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: VIZ[i % VIZ.length] }} aria-hidden />
            <span className="min-w-0 flex-1 truncate text-muted-foreground">{d.label}</span>
            <span className="tabular font-semibold">{fmt(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Horizontal bars for ranked items (single measure → one colour). */
export function RankedBarChart({
  data,
  height,
  money = true,
}: {
  data: { name: string; value: number }[];
  height?: number;
  money?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("admin.charts");
  const rtl = locale === "ar";
  const fmt = (v: number) => (money ? formatOMR(v, locale) : String(v));
  const h = height ?? Math.max(160, data.length * 44);
  return (
    <div ref={stripInnerRoles} dir="ltr" style={{ height: h }} role="img" aria-label={t("barAria")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={10}>
          <CartesianGrid stroke={GRID} strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tickFormatter={(v) => (money ? compactOmr(v) : String(v))} tick={AXIS} tickLine={false} axisLine={false} reversed={rtl} />
          <YAxis
            type="category"
            dataKey="name"
            width={150}
            tick={{ ...AXIS, fill: "hsl(var(--foreground))" }}
            tickFormatter={(n: string) => (n.length > 22 ? `${n.slice(0, 21)}…` : n)}
            tickLine={false}
            axisLine={false}
            orientation={rtl ? "right" : "left"}
          />
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))" }}
            content={({ active, payload }: TooltipProps<number, string>) =>
              active && payload?.length ? <TipBox title={String(payload[0].payload.name)} rows={[{ label: money ? t("revenue") : t("quantity"), value: fmt(Number(payload[0].value)), color: "var(--viz-1)" }]} /> : null
            }
          />
          <Bar dataKey="value" isAnimationActive={false} fill="var(--viz-1)" radius={rtl ? [4, 0, 0, 4] : [0, 4, 4, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Vertical bars over categories (e.g. per day or per governorate), optionally stacked by series. */
export function ColumnChart({
  data,
  series,
  height = 260,
  money = false,
  stacked = false,
}: {
  data: Record<string, string | number>[];
  series: { key: string; label: string }[];
  height?: number;
  money?: boolean;
  stacked?: boolean;
}) {
  const locale = useLocale();
  const rtl = locale === "ar";
  const fmt = (v: number) => (money ? formatOMR(v, locale) : String(v));
  const t = useTranslations("admin.charts");
  return (
    <div>
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs" aria-label={t("legend")}>
          {series.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1.5 text-muted-foreground">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: VIZ[i % VIZ.length] }} aria-hidden />
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <div ref={stripInnerRoles} dir="ltr" style={{ height }} role="img" aria-label={t("columnAria")}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={GRID} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} reversed={rtl} interval="preserveStartEnd" minTickGap={8} />
            <YAxis tickFormatter={(v) => (money ? compactOmr(v) : String(v))} tick={AXIS} tickLine={false} axisLine={false} width={44} orientation={rtl ? "right" : "left"} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: "hsl(var(--muted))" }}
              content={({ active, payload, label }: TooltipProps<number, string>) =>
                active && payload?.length ? (
                  <TipBox
                    title={String(label)}
                    rows={payload.map((p, i) => ({ label: series.find((s) => s.key === p.dataKey)?.label ?? String(p.dataKey), value: fmt(Number(p.value)), color: VIZ[series.findIndex((s) => s.key === p.dataKey) % VIZ.length] ?? VIZ[i] }))}
                  />
                ) : null
              }
            />
            {series.map((s, i) => (
              <Bar key={s.key} isAnimationActive={false} dataKey={s.key} stackId={stacked ? "a" : undefined} fill={VIZ[i % VIZ.length]} stroke="hsl(var(--card))" strokeWidth={stacked ? 1 : 0} radius={stacked && i < series.length - 1 ? 0 : [4, 4, 0, 0]} maxBarSize={36} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
