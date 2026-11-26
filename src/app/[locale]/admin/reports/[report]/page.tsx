import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Download } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, FilterDate, KpiCard, Panel } from "@/components/admin/ui";
import { ReportChart } from "@/components/admin/report-charts";
import { PrintButton } from "@/components/admin/print-button";
import { OrderStatusBadge, PaymentStatusBadge } from "@/components/orders/order-status";
import { Logo } from "@/components/layout/logo";
import { requireRole } from "@/lib/auth-guard";
import { formatOMR } from "@/lib/money";
import { addDays, muscatDayKey } from "@/lib/dates";
import { buildReport, isReportKey, REPORT_MIN_ROLE, type Column, type Row, type Summary } from "@/server/reports";
import { BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = { params: { locale: string; report: string }; searchParams: { from?: string; to?: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (!isReportKey(params.report)) return {};
  const t = await getTranslations("reports");
  return { title: t(`${params.report}.title`) };
}

export default async function ReportPage({ params: { locale, report: key }, searchParams }: Props) {
  setRequestLocale(locale);
  if (!isReportKey(key)) notFound();
  // Financial reports: ADMIN only (also enforced by middleware and the CSV route).
  await requireRole(REPORT_MIN_ROLE[key], `/admin/reports/${key}`);

  const t = await getTranslations("reports");
  const format = await getFormatter();
  const report = await buildReport(key, locale, searchParams.from, searchParams.to);

  const today = muscatDayKey(new Date());
  const presets = [
    { label: t("last7"), from: addDays(today, -6), to: today },
    { label: t("last30"), from: addDays(today, -29), to: today },
    { label: t("last90"), from: addDays(today, -89), to: today },
    { label: t("thisMonth"), from: `${today.slice(0, 8)}01`, to: today },
  ];
  const period = `${format.dateTime(new Date(`${report.from}T12:00:00Z`), { dateStyle: "medium" })} – ${format.dateTime(new Date(`${report.to}T12:00:00Z`), { dateStyle: "medium" })}`;

  const summaryValue = (s: Summary) => {
    if (s.type === "money") return formatOMR(s.value, locale);
    if (s.type === "pct") return format.number(s.value, { style: "percent", maximumFractionDigits: 1 });
    if (s.type === "hours") return t("hoursValue", { days: (s.value / 24).toFixed(1) });
    return format.number(s.value);
  };

  const cell = (c: Column, r: Row) => {
    const v = r[c.key];
    if (v == null || v === "") return "—";
    switch (c.type) {
      case "money":
        return formatOMR(Number(v), locale);
      case "int":
        return format.number(Number(v));
      case "pct":
        return format.number(Number(v), { style: "percent", maximumFractionDigits: 1 });
      case "date":
        return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? format.dateTime(new Date(`${v}T12:00:00Z`), { dateStyle: "medium" }) : String(v);
      case "datetime":
        return v instanceof Date ? format.dateTime(v, { dateStyle: "short", timeStyle: "short" }) : String(v);
      case "orderStatus":
        return <OrderStatusBadge status={String(v)} />;
      case "txnStatus":
        return <PaymentStatusBadge status={String(v)} />;
      case "code":
        return (
          <span className="font-mono text-xs" dir="ltr">
            {String(v)}
          </span>
        );
      default:
        return String(v);
    }
  };

  const csvHref = `/api/reports/${key}?from=${report.from}&to=${report.to}&locale=${locale}`;

  return (
    <div className="report">
      {/* Print-only letterhead */}
      <div className="print-only mb-6 border-b pb-4">
        <div className="flex items-start justify-between gap-4">
          <Logo locale={locale} className="h-10 text-black" />
          <div className="text-end text-xs">
            <p className="font-semibold">{t("printGenerated", { date: format.dateTime(new Date(), { dateStyle: "medium", timeStyle: "short" }) })}</p>
            <p>{t("printConfidential")}</p>
          </div>
        </div>
      </div>

      <Link href="/admin/reports" className="no-print mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 rtl-flip" aria-hidden />
        {t("allReports")}
      </Link>
      <AdminPageHeader
        title={report.title}
        subtitle={`${report.description} · ${t("period")}: ${period}`}
        actions={
          <>
            <Button asChild variant="outline">
              <a href={csvHref} download>
                <Download aria-hidden />
                {t("exportCsv")}
              </a>
            </Button>
            <PrintButton />
          </>
        }
      />

      <form method="get" className="no-print mb-6 flex flex-wrap items-end gap-3 rounded-2xl border bg-card p-4" aria-label={t("dateRange")}>
        <FilterDate name="from" label={t("from")} value={report.from} />
        <FilterDate name="to" label={t("to")} value={report.to} />
        <button type="submit" className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          {t("apply")}
        </button>
        <div className="flex flex-wrap gap-1.5">
          {presets.map((p) => {
            const active = p.from === report.from && p.to === report.to;
            return (
              <Link
                key={p.label}
                href={`/admin/reports/${key}?from=${p.from}&to=${p.to}`}
                aria-current={active ? "true" : undefined}
                className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted")}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </form>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {report.summary.map((s) => (
          <KpiCard key={s.label} label={s.label} value={summaryValue(s)} hint={s.hint} icon={BarChart3} />
        ))}
      </div>

      <div className={cn("mt-6 grid gap-6", report.charts.length > 1 && "xl:grid-cols-2")}>
        {report.charts.map((c) => (
          <Panel key={c.title} title={c.title} className="break-inside-avoid">
            {(c.kind === "donut" ? c.data.length : c.data.length) > 0 ? <ReportChart chart={c} /> : <p className="text-sm text-muted-foreground">{t("noData")}</p>}
          </Panel>
        ))}
      </div>

      <Panel title={t("details", { count: report.rows.length })} className="mt-6">
        {report.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("noData")}</p>
        ) : (
          <Table className="text-[13px]">
            <TableHeader>
              <TableRow>
                {report.columns.map((c) => (
                  <TableHead key={c.key} className={c.align === "end" ? "text-end" : undefined}>
                    {c.label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {report.rows.map((r, i) => (
                <TableRow key={i}>
                  {report.columns.map((c) => (
                    <TableCell key={c.key} className={cn("whitespace-nowrap", c.align === "end" && "tabular text-end")}>
                      {cell(c, r)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
            {report.totals && (
              <TableFooter>
                <TableRow>
                  {report.columns.map((c) => (
                    <TableCell key={c.key} className={cn("whitespace-nowrap font-semibold", c.align === "end" && "tabular text-end")}>
                      {report.totals![c.key] == null || report.totals![c.key] === "" ? "" : c.key === report.columns[0].key ? String(report.totals![c.key]) : cell(c, report.totals!)}
                    </TableCell>
                  ))}
                </TableRow>
              </TableFooter>
            )}
          </Table>
        )}
      </Panel>
    </div>
  );
}
