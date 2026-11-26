"use client";

import { useEffect, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { MapPin, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState } from "@/components/common/misc";
import { FormAlert, SubmitButton } from "@/components/forms/form-parts";
import { AddressFields } from "@/components/checkout/address-fields";
import { deleteAddressAction, saveAddressAction, setDefaultAddressAction } from "@/server/account-actions";
import { governorateName, wilayatName } from "@/lib/constants";

export type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  governorate: string;
  wilayat: string;
  area: string;
  street: string;
  building: string;
  way: string | null;
  notes: string | null;
  isDefault: boolean;
};

function AddressForm({ address, onDone }: { address: Address | null; onDone: () => void }) {
  const t = useTranslations("addresses");
  const tAll = useTranslations();
  const [state, action] = useFormState(saveAddressAction, {});
  const router = useRouter();

  useEffect(() => {
    if (state.ok) {
      toast.success(tAll(state.message ?? "addresses.saved"));
      router.refresh();
      onDone();
    }
  }, [state, onDone, router, tAll]);

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.message && !state.ok && <FormAlert>{tAll(state.message)}</FormAlert>}
      {address && <input type="hidden" name="id" value={address.id} />}
      <AddressFields errors={state.errors} defaults={address ?? {}} showLabel />
      <label className="flex items-center gap-2.5 text-sm">
        <input type="checkbox" name="isDefault" defaultChecked={address?.isDefault} className="h-4 w-4 rounded accent-[hsl(var(--primary))]" />
        {t("makeDefault")}
      </label>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        <SubmitButton pendingText={t("saving")}>{t("save")}</SubmitButton>
      </div>
    </form>
  );
}

export function AddressManager({ addresses }: { addresses: Address[] }) {
  const t = useTranslations("addresses");
  const tAll = useTranslations();
  const tc = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [editing, setEditing] = useState<Address | null | "new">(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok?: boolean; message?: string }>) =>
    start(async () => {
      const res = await fn();
      if (res.message) (res.ok ? toast.success : toast.error)(tAll(res.message));
      router.refresh();
    });

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={() => setEditing("new")}>
          <Plus aria-hidden />
          {t("add")}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState icon={MapPin} title={t("emptyTitle")} body={t("emptyBody")} />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {addresses.map((a) => (
            <li key={a.id} className="flex flex-col rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{a.label}</p>
                {a.isDefault && <Badge variant="secondary">{t("default")}</Badge>}
              </div>
              <p className="mt-2 text-sm">
                {a.fullName} · <span dir="ltr">{a.phone}</span>
              </p>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">
                {a.building}, {a.street}
                {a.way ? ` · ${a.way}` : ""}, {a.area}
                <br />
                {wilayatName(a.governorate, a.wilayat, locale)}, {governorateName(a.governorate, locale)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 border-t pt-4">
                <Button size="sm" variant="outline" onClick={() => setEditing(a)}>
                  <Pencil aria-hidden />
                  {t("edit")}
                </Button>
                {!a.isDefault && (
                  <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => setDefaultAddressAction(a.id))}>
                    <Star aria-hidden />
                    {t("setDefault")}
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10"
                  disabled={pending}
                  onClick={() => {
                    if (window.confirm(t("confirmDelete"))) run(() => deleteAddressAction(a.id));
                  }}
                >
                  <Trash2 aria-hidden />
                  {t("delete")}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={editing !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent closeLabel={tc("close")} className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing === "new" ? t("add") : t("edit")}</DialogTitle>
          </DialogHeader>
          {editing !== null && <AddressForm address={editing === "new" ? null : editing} onDone={() => setEditing(null)} />}
        </DialogContent>
      </Dialog>
    </>
  );
}
