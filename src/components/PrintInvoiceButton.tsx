"use client";

import { Printer } from "lucide-react";

export function PrintInvoiceButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 print:hidden"
    >
      <Printer className="h-4 w-4" />
      Imprimer / Enregistrer en PDF
    </button>
  );
}
