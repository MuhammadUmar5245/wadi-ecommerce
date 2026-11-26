import { getTranslations } from "next-intl/server";
import { AuthorizationError, assertRole } from "@/lib/auth-guard";
import { toCsv } from "@/lib/csv";
import { buildReport, isReportKey, REPORT_MIN_ROLE } from "@/server/reports";

/** CSV export: /api/reports/sales?from=2026-09-01&to=2026-09-30&locale=en */
export async function GET(req: Request, { params }: { params: { report: string } }) {
  if (!isReportKey(params.report)) return new Response("Not found", { status: 404 });
  // API routes are outside the middleware, so the role is enforced here.
  try {
    await assertRole(REPORT_MIN_ROLE[params.report]);
  } catch (e) {
    if (e instanceof AuthorizationError) return new Response(e.reason === "forbidden" ? "Forbidden" : "Unauthorised", { status: e.reason === "forbidden" ? 403 : 401 });
    throw e;
  }

  const url = new URL(req.url);
  const locale = url.searchParams.get("locale") === "ar" ? "ar" : "en";
  const report = await buildReport(params.report, locale, url.searchParams.get("from") ?? undefined, url.searchParams.get("to") ?? undefined);
  const ts = await getTranslations({ locale, namespace: "orderStatus" });
  const tp = await getTranslations({ locale, namespace: "paymentStatus" });

  const csv = toCsv(report.columns, report.rows, {
    totals: report.totals,
    label: (type, v) => (type === "orderStatus" ? ts(v as "PLACED") : tp(v as "PENDING")),
  });
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="wadi-${report.key}-${report.from}_to_${report.to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
