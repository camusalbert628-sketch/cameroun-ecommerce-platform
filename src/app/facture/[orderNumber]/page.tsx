import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatFcfa } from "@/lib/format";
import { PrintInvoiceButton } from "@/components/PrintInvoiceButton";

export const dynamic = "force-dynamic";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: {
      store: true,
      items: { include: { product: true } },
    },
  });

  if (!order) {
    notFound();
  }

  const brandName = order.store?.name || "Albedo'o Cameroun";
  const rccm = order.store?.rccm || "RC/DLA/2026/B/1042";
  const niu = order.store?.niu || "M032614908821K";

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm border border-slate-200 print:border-none print:shadow-none">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-amber-600">
              Facture / Reçu Officiel
            </p>
            <h1 className="mt-1 text-2xl font-bold text-[#0B192C]">{brandName}</h1>
            <p className="mt-1 text-xs text-slate-500">
              RCCM : {rccm} · NIU : {niu} · {order.store?.city || "Douala"}, Cameroun
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-[#0B192C]">{order.orderNumber}</p>
            <p className="text-xs text-slate-500">
              Émise le {new Date(order.createdAt).toLocaleDateString("fr-FR")}
            </p>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${
                order.paymentStatus === "PAID"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {order.paymentStatus === "PAID" ? "PAYÉE" : "EN ATTENTE DE PAIEMENT"}
            </span>
          </div>
        </div>

        <div className="mb-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Client</p>
            <p className="mt-1 font-semibold text-slate-900">{order.customerName}</p>
            <p className="text-sm text-slate-600">{order.customerPhone}</p>
            {order.customerEmail && <p className="text-sm text-slate-600">{order.customerEmail}</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-400">Livraison & Paiement</p>
            <p className="mt-1 text-sm text-slate-800">
              {order.city} — {order.quarter}
            </p>
            <p className="text-xs text-slate-600">{order.deliveryAddress}</p>
            <p className="mt-1 text-xs font-medium text-slate-700">
              Mode : {order.paymentMethod}
              {order.paymentReference ? ` · Réf: ${order.paymentReference}` : ""}
            </p>
          </div>
        </div>

        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="py-3">Article</th>
              <th className="py-3 text-center">Qté</th>
              <th className="py-3 text-right">Prix unitaire</th>
              <th className="py-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="py-3">
                  <p className="font-medium text-slate-900">{item.product.title}</p>
                  {item.variantLabel && (
                    <p className="text-xs text-slate-500">Variante : {item.variantLabel}</p>
                  )}
                </td>
                <td className="py-3 text-center text-slate-700">{item.quantity}</td>
                <td className="py-3 text-right text-slate-700">{formatFcfa(item.unitPriceFcfa)}</td>
                <td className="py-3 text-right font-semibold text-slate-900">
                  {formatFcfa(item.unitPriceFcfa * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-6 border-t border-slate-200 pt-4 text-sm">
          <div className="ml-auto max-w-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Sous-total</span>
              <span>{formatFcfa(order.subtotalFcfa)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Livraison</span>
              <span>{formatFcfa(order.deliveryFeeFcfa)}</span>
            </div>
            {order.discountFcfa > 0 && (
              <div className="flex justify-between text-emerald-700 font-medium">
                <span>Remise {order.couponCode ? `(${order.couponCode})` : "(Fidélité)"}</span>
                <span>-{formatFcfa(order.discountFcfa)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-[#0B192C]">
              <span>Total TTC</span>
              <span>{formatFcfa(order.totalFcfa)}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
          <Link
            href={`/suivi?order=${encodeURIComponent(order.orderNumber)}`}
            className="text-sm font-medium text-slate-600 hover:text-[#0B192C] print:hidden"
          >
            ← Retour au suivi de commande
          </Link>
          <PrintInvoiceButton />
        </div>
      </div>
    </div>
  );
}
