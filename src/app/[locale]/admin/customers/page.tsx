import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar } from "@/components/admin/ui";
import { Pagination } from "@/components/common/pagination";
import { EmptyState } from "@/components/common/misc";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { governorateName } from "@/lib/constants";

type SP = Record<string, string | undefined>;
const PER_PAGE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("customers") };
}

export default async function AdminCustomers({ params: { locale }, searchParams: sp }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const t = await getTranslations("admin.customers");
  const ta = await getTranslations("admin");
  const format = await getFormatter();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
  if (sp.q) where.OR = [{ name: { contains: sp.q } }, { email: { contains: sp.q.toLowerCase() } }, { phone: { contains: sp.q } }];

  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      include: { addresses: { where: { isDefault: true }, take: 1 } },
    }),
  ]);
  const stats = await db.order.groupBy({
    by: ["userId"],
    where: { userId: { in: users.map((u) => u.id) }, status: { not: "CANCELLED" } },
    _count: true,
    _sum: { total: true },
    _max: { createdAt: true },
  });

  return (
    <>
      <AdminPageHeader title={ta("nav.customers")} subtitle={t("count", { count: total })} />
      <FilterBar q={sp.q} placeholder={t("searchPlaceholder")} />
      {users.length === 0 ? (
        <EmptyState title={t("empty")} />
      ) : (
        <div className="rounded-2xl border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("customer")}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead className="text-end">{t("orders")}</TableHead>
                <TableHead className="text-end">{t("spent")}</TableHead>
                <TableHead>{t("lastOrder")}</TableHead>
                <TableHead>{t("joined")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const s = stats.find((x) => x.userId === u.id);
                return (
                  <TableRow key={u.id}>
                    <TableCell>
                      <Link href={`/admin/customers/${u.id}`} className="font-medium text-primary hover:underline">
                        {u.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      {!u.isActive && <Badge variant="destructive">{t("disabled")}</Badge>}
                    </TableCell>
                    <TableCell className="text-sm">{u.addresses[0] ? governorateName(u.addresses[0].governorate, locale) : "—"}</TableCell>
                    <TableCell className="tabular text-end">{s?._count ?? 0}</TableCell>
                    <TableCell className="tabular whitespace-nowrap text-end font-semibold">{formatOMR(s?._sum.total ?? 0, locale)}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm">{s?._max.createdAt ? format.dateTime(s._max.createdAt, { dateStyle: "medium" }) : "—"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{format.dateTime(u.createdAt, { dateStyle: "medium" })}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} pathname="/admin/customers" searchParams={sp} />
    </>
  );
}
