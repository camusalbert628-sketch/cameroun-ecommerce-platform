import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, MapPin, Store as StoreIcon, ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/ProductCard";

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
    <div className="bg-slate-50 min-h-screen pb-14">
      {/* Tenant Brand Header */}
      <section
        className="text-white py-12 shadow-md"
        style={{
          background: `linear-gradient(135deg, ${store.primaryColor} 0%, #1E3A5F 100%)`,
        }}
      >
        <div className="mx-auto max-w-[1680px] px-4 space-y-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la marketplace Albedo&apos;o
          </Link>

          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="h-14 w-auto object-contain" />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 border border-white/20">
                  <StoreIcon className="h-7 w-7 text-orange-400" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-extrabold">{store.name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                    <ShieldCheck className="h-3.5 w-3.5" /> Boutique Vérifiée
                  </span>
                </div>
                {store.tagline && <p className="mt-1 text-sm text-slate-200">{store.tagline}</p>}
                <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-orange-400" /> {store.city}, Cameroun
                  </span>
                  {store.rccm && <span>RCCM : {store.rccm}</span>}
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/10 px-4 py-2.5 text-xs backdrop-blur-xs border border-white/15">
              <div className="text-slate-300">Catalogue boutique</div>
              <div className="text-lg font-extrabold">{store.products.length} article(s)</div>
            </div>
          </div>
        </div>
      </section>

      {/* Tenant Products Grid */}
      <section className="mx-auto max-w-[1680px] px-4 mt-8">
        {store.products.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <h2 className="text-lg font-extrabold text-[#0B192C]">Cette boutique vient d&apos;ouvrir !</h2>
            <p className="text-xs text-slate-500">
              Le marchand peut ajouter ses premiers produits et variantes depuis son Espace Marchand (`/vendeur`).
            </p>
            <Link
              href="/vendeur"
              className="inline-block rounded-xl bg-orange-500 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-orange-600"
            >
              Ajouter des produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {store.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
