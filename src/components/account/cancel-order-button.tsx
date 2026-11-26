"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { XCircle } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cancelOrderAction } from "@/server/account-actions";

export function CancelOrderButton({ orderNumber, refundNote }: { orderNumber: string; refundNote: boolean }) {
  const t = useTranslations("orders");
  const tAll = useTranslations();
  const tc = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">
          <XCircle aria-hidden />
          {t("cancelOrder")}
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={tc("close")}>
        <DialogHeader>
          <DialogTitle>{t("cancelTitle", { number: orderNumber })}</DialogTitle>
          <DialogDescription>
            {t("cancelBody")} {refundNote && t("cancelRefund")}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {t("keepOrder")}
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                const res = await cancelOrderAction(orderNumber);
                if (res.ok) {
                  toast.success(tAll(res.message ?? "orders.cancelled"));
                  setOpen(false);
                  router.refresh();
                } else {
                  toast.error(tAll(res.message ?? "orders.errors.notCancellable"));
                }
              })
            }
          >
            {pending ? t("cancelling") : t("confirmCancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
