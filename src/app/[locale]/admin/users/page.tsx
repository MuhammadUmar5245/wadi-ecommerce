import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminPageHeader, FilterBar, FilterSelect } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/action-button";
import { CreateStaffDialog, RoleSelect } from "@/components/admin/user-controls";
import { Pagination } from "@/components/common/pagination";
import { toggleUserActiveAction } from "@/server/admin/actions";
import { requireRole } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { ROLES } from "@/lib/constants";

type SP = Record<string, string | undefined>;
const PER_PAGE = 20;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.nav");
  return { title: t("users") };
}

export default async function AdminUsers({ params: { locale }, searchParams: sp }: { params: { locale: string }; searchParams: SP }) {
  setRequestLocale(locale);
  const me = await requireRole("ADMIN", "/admin/users");
  const t = await getTranslations("admin.users");
  const ta = await getTranslations("admin");
  const format = await getFormatter();
  const page = Math.max(1, Number(sp.page) || 1);

  const where: Prisma.UserWhereInput = {};
  if (sp.role && (ROLES as readonly string[]).includes(sp.role)) where.role = sp.role;
  if (sp.q) where.OR = [{ name: { contains: sp.q } }, { email: { contains: sp.q.toLowerCase() } }];
  const [total, users, counts] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, orderBy: [{ role: "asc" }, { createdAt: "asc" }], skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    db.user.groupBy({ by: ["role"], _count: true }),
  ]);

  return (
    <>
      <AdminPageHeader
        title={ta("nav.users")}
        subtitle={ROLES.map((r) => `${ta(`roles.${r}`)}: ${counts.find((c) => c.role === r)?._count ?? 0}`).join(" · ")}
        actions={<CreateStaffDialog />}
      />
      <div className="mb-4 rounded-2xl border bg-info/10 p-4 text-sm text-info">{t("rbacNote")}</div>
      <FilterBar q={sp.q} placeholder={t("searchPlaceholder")}>
        <FilterSelect name="role" label={t("role")} value={sp.role} options={[{ value: "", label: ta("all") }, ...ROLES.map((r) => ({ value: r, label: ta(`roles.${r}`) }))]} />
      </FilterBar>
      <div className="rounded-2xl border bg-card shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("user")}</TableHead>
              <TableHead>{t("role")}</TableHead>
              <TableHead>{t("status")}</TableHead>
              <TableHead>{t("lastLogin")}</TableHead>
              <TableHead className="text-end">
                <span className="sr-only">{ta("actions")}</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const self = u.id === me.id;
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <p className="font-medium">
                      {u.name} {self && <Badge variant="secondary">{t("you")}</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </TableCell>
                  <TableCell>
                    <RoleSelect userId={u.id} role={u.role} disabled={self} name={u.name} />
                  </TableCell>
                  <TableCell>{u.isActive ? <Badge variant="success">{t("active")}</Badge> : <Badge variant="destructive">{t("disabled")}</Badge>}</TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">{u.lastLoginAt ? format.dateTime(u.lastLoginAt, { dateStyle: "medium", timeStyle: "short" }) : "—"}</TableCell>
                  <TableCell className="text-end">
                    {!self && (
                      <ActionButton
                        size="sm"
                        variant={u.isActive ? "outline" : "default"}
                        confirm={u.isActive ? t("confirmDisable", { name: u.name }) : undefined}
                        action={toggleUserActiveAction.bind(null, u.id)}
                      >
                        {u.isActive ? t("disable") : t("enable")}
                      </ActionButton>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <Pagination page={page} pages={Math.ceil(total / PER_PAGE)} pathname="/admin/users" searchParams={sp} />
    </>
  );
}
