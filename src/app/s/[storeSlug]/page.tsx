import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ArrowLeft, Store as StoreIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function TenantStorefrontPage({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}) {
  const { storeSlug } = await params;

  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    include: {
      products: {
        where: { qualityStatus: "APPROVED" },
        include: { category: true, vendor: true },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!store || store.status === "SUSPENDED") {
    notFound();
  }

  return (
    <div>
      {/* Tenant Identity Sub-Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1 font-semibold text-[#1E3A5F] hover:text-orange-600"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Albedo&apos;o
            </Link>
            <span className="text-slate-300">|</span>
            <span className="inline-flex items-center gap-1.5 font-extrabold text-[#0B192C]">
              <StoreIcon className="h-3.5 w-3.5 text-orange-500" />
              {store.name}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              <ShieldCheck className="h-3 w-3" /> Boutique Vérifiée · {store.city}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Propulsé par <strong>Albedo&apos;o SaaS</strong></span>
            <Link
              href="/saas"
              className="font-bold text-orange-600 hover:underline"
            >
              Créer ma boutique similaire →
            </Link>
          </div>
        </div>
      </div>

      {store.products.length === 0 ? (
        <div className="mx-auto max-w-2xl px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-extrabold text-[#0B192C]">{store.name}</h1>
          <p className="text-sm text-slate-600">
            Cette boutique vient d&apos;être créée avec le modèle Albedo&apos;o ! Ajoutez vos premiers produits depuis votre espace marchand.
          </p>
          <Link
            href="/vendeur"
            className="inline-block rounded-xl bg-orange-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-orange-600"
          >
            Ajouter mes produits
          </Link>
        </div>
      ) : (
        <HomeClient
          products={store.products}
          storeConfig={{
            name: store.name,
            slug: store.slug,
            tagline: store.tagline,
            primaryColor: store.primaryColor,
            accentColor: store.accentColor,
            logoUrl: store.logoUrl,
          }}
        />
      )}
    </div>
  );
}
