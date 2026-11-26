"use client";

import { useLocale } from "next-intl";
import type { Chart } from "@/server/reports";
import { formatOMR } from "@/lib/money";
import { ColumnChart, DonutChart, RankedBarChart } from "./charts";

export function ReportChart({ chart }: { chart: Chart }) {
  const locale = useLocale();
  if (chart.kind === "column") return <ColumnChart data={chart.data} series={chart.series} money={chart.money} stacked={chart.stacked} />;
  if (chart.kind === "ranked") return <RankedBarChart data={chart.data} money={chart.money} />;
  return <DonutChart data={chart.data} valueFormat={chart.money ? (v) => formatOMR(v, locale) : undefined} />;
}
