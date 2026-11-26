import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/layout/logo";
import { PrintButton } from "@/components/admin/print-button";
import { db } from "@/lib/db";
import { formatOMR } from "@/lib/money";
import { loc } from "@/lib/i18n-utils";
import { governorateName, VAT_RATE_PERCENT, wilayatName } from "@/lib/constants";

type Props = { params: { locale: string; orderNumber: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const t = await getTranslations("admin.invoice");
  return { title: `${t("title")} ${params.orderNumber}` };
}

export default async function InvoicePage({ params: { locale, orderNumber } }: Props) {
  setRequestLocale(locale);
  const order = await db.order.findUnique({ where: { orderNumber }, include: { items: true, user: { select: { email: true } } } });
  if (!order) notFound();
  const t = await getTranslations("admin.invoice");
  const tp = await getTranslations("paymentStatus");
  const format = await getFormatter();
  const row = "flex justify-between gap-6 py-1";

  return (
    <div className="mx-auto max-w-3xl">
      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>
      <article className="rounded-2xl border bg-white p-8 text-[#13201f] shadow-sm print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b pb-6">
          <div>
            <Logo locale={locale} className="h-11 text-[#13201f]" />
            <p className="mt-3 text-xs leading-relaxed text-gray-600">
              {t("company")}
              <br />
              {t("address")}
              <br />
              <span dir="ltr">+968 2400 0000</span> · info@wadialghubaitah.test
              <br />
              {t("vatNo")}: <span dir="ltr">OM1100XXXXXX</span>
            </p>
          </div>
          <div className="text-end">
            <h1 className="text-2xl font-bold uppercase tracking-wide">{t("taxInvoice")}</h1>
            <dl className="mt-2 text-sm">
              <div className="flex justify-end gap-2">
                <dt className="text-gray-600">{t("number")}</dt>
                <dd className="font-mono font-semibold" dir="ltr">
                  INV-{order.orderNumber.slice(3)}
                </dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-gray-600">{t("order")}</dt>
                <dd className="font-mono" dir="ltr">
                  {order.orderNumber}
                </dd>
              </div>
              <div className="flex justify-end gap-2">
                <dt className="text-gray-600">{t("date")}</dt>
                <dd>{format.dateTime(order.createdAt, { dateStyle: "long" })}</dd>
              </div>
            </dl>
          </div>
        </header>

        <section className="grid gap-6 border-b py-6 text-sm sm:grid-cols-2">
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("billTo")}</h2>
            <p className="font-semibold">{order.shipName}</p>
            <p dir="ltr" className="text-start">
              {order.shipPhone}
            </p>
            <p>{order.user.email}</p>
          </div>
          <div>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">{t("shipTo")}</h2>
            <p>
              {order.building}, {order.street}
              {order.way ? ` · ${order.way}` : ""}
            </p>
            <p>
              {order.area}, {wilayatName(order.governorate, order.wilayat, locale)}
            </p>
            <p>
              {governorateName(order.governorate, locale)}, {t("oman")}
            </p>
          </div>
        </section>

        <table className="mt-6 w-full text-sm">
          <thead>
            <tr className="border-b text-xs uppercase tracking-wide text-gray-500">
              <th className="py-2 text-start font-semibold">{t("item")}</th>
              <th className="py-2 text-end font-semibold">{t("qty")}</th>
              <th className="py-2 text-end font-semibold">{t("unit")}</th>
              <th className="py-2 text-end font-semibold">{t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((i) => (
              <tr key={i.id} className="border-b border-gray-100">
                <td className="py-2.5">
                  {loc(locale, i.nameEn, i.nameAr)}
                  <span className="block font-mono text-xs text-gray-500" dir="ltr">
                    {i.sku}
                  </span>
                </td>
                <td className="tabular py-2.5 text-end">{i.quantity}</td>
                <td className="tabular py-2.5 text-end">{formatOMR(i.unitPrice, locale)}</td>
                <td className="tabular py-2.5 text-end">{formatOMR(i.lineTotal, locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ms-auto mt-6 max-w-xs text-sm">
          <div className={row}>
            <span>{t("subtotal")}</span>
            <span className="tabular">{formatOMR(order.subtotal, locale)}</span>
          </div>
          {order.discount > 0 && (
            <div className={row}>
              <span>
                {t("discount")} {order.couponCode && `(${order.couponCode})`}
              </span>
              <span className="tabular">−{formatOMR(order.discount, locale)}</span>
            </div>
          )}
          <div className={row}>
            <span>{t("delivery")}</span>
            <span className="tabular">{formatOMR(order.deliveryFee, locale)}</span>
          </div>
          <div className={row}>
            <span>{t("vat", { rate: VAT_RATE_PERCENT })}</span>
            <span className="tabular">{formatOMR(order.vat, locale)}</span>
          </div>
          <div className={`${row} mt-2 border-t-2 border-[#13201f] pt-2 text-base font-bold`}>
            <span>{t("total")}</span>
            <span className="tabular">{formatOMR(order.total, locale)}</span>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            {t("paymentLine", { method: order.paymentMethod === "CARD" ? t("card") : t("cod"), status: tp(order.paymentStatus as "PAID") })}
          </p>
        </div>

        <footer className="mt-10 border-t pt-4 text-center text-xs text-gray-500">{t("thanks")}</footer>
      </article>
    </div>
  );
}
