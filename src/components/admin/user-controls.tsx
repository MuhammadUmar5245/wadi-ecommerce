"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { UserPlus } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { NativeSelect } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, useErrorText } from "@/components/forms/form-parts";
import { createStaffAction, setUserRoleAction } from "@/server/admin/actions";
import { FormDialog } from "./form-dialog";

export function RoleSelect({ userId, role, disabled, name }: { userId: string; role: string; disabled: boolean; name: string }) {
  const t = useTranslations("admin");
  const tAll = useTranslations();
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <NativeSelect
      value={role}
      disabled={disabled || pending}
      aria-label={t("users.roleFor", { name })}
      className="h-9 w-36"
      onChange={(e) => {
        const next = e.target.value;
        if (!window.confirm(t("users.confirmRole", { name, role: t(`roles.${next}`) }))) {
          e.target.value = role;
          return;
        }
        start(async () => {
          const res = await setUserRoleAction(userId, next);
          if (res.message) (res.ok ? toast.success : toast.error)(tAll(res.message));
          router.refresh();
        });
      }}
    >
      {(["CUSTOMER", "STAFF", "ADMIN"] as const).map((r) => (
        <option key={r} value={r}>
          {t(`roles.${r}`)}
        </option>
      ))}
    </NativeSelect>
  );
}

export function CreateStaffDialog() {
  const t = useTranslations("admin.users");
  const ta = useTranslations("admin");
  const tf = useTranslations("auth");
  const err = useErrorText();
  return (
    <FormDialog
      title={t("create")}
      description={t("createHint")}
      trigger={
        <>
          <UserPlus aria-hidden />
          {t("create")}
        </>
      }
      action={createStaffAction}
      submitLabel={t("createSubmit")}
    >
      {(errors) => (
        <>
          <Field label={tf("fullName")} name="name" error={err(errors?.name)} />
          <Field label={tf("email")} name="email" type="email" dir="ltr" error={err(errors?.email)} />
          <Field label={tf("phone")} name="phone" type="tel" dir="ltr" placeholder="+968 9123 4567" error={err(errors?.phone)} />
          <Field label={tf("password")} name="password" password hint={tf("passwordHint")} error={err(errors?.password)} />
          <div className="space-y-1.5">
            <Label htmlFor="new-role">{t("role")}</Label>
            <NativeSelect id="new-role" name="role" defaultValue="STAFF">
              <option value="STAFF">{ta("roles.STAFF")}</option>
              <option value="ADMIN">{ta("roles.ADMIN")}</option>
            </NativeSelect>
          </div>
        </>
      )}
    </FormDialog>
  );
}
