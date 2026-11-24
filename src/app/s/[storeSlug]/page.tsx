import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck, ArrowLeft, Store as StoreIcon } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeSlug: string }>;
}): Promise<Metadata> {
  const { storeSlug } = await params;
  const store = await prisma.store.findUnique({
    where: { slug: storeSlug },
    select: { name: true, tagline: true, logoUrl: true, city: true },
  });
  if (!store) {
    return { title: "Boutique introuvable — Albedo'o" };
  }
  const title = `${store.name} — Boutique en ligne (${store.city})`;
  const description = store.tagline || `Découvrez les produits de ${store.name} propulsée par Albedo'o.`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: store.logoUrl ? [{ url: store.logoUrl }] : undefined,
    },
  };
}

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
              href="/inscription-boutique"
              className="font-bold text-orange-600 hover:underline"
            >
              Créer ma boutique similaire →
            </Link>
          </div>
        </div>
      </div>

      {/* Branded Store Hero Banner (only public branding, never private RCCM/NIU/email) */}
      <div
        className="relative overflow-hidden text-white"
        style={{
          background: store.bannerUrl
            ? `linear-gradient(to right, ${store.primaryColor}E6, ${store.secondaryColor}CC), url(${store.bannerUrl}) center/cover`
            : `linear-gradient(135deg, ${store.primaryColor}, ${store.secondaryColor})`,
        }}
      >
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4 px-4 py-8">
          <div className="flex items-center gap-4">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                className="h-16 w-16 rounded-2xl object-cover bg-white p-1 shadow-md"
              />
            ) : (
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-md"
                style={{ backgroundColor: store.accentColor }}
              >
                {store.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-white"
                  style={{ backgroundColor: store.accentColor }}
                >
                  {store.sector}
                </span>
                <span className="text-xs text-white/80">
                  {store.city}, {store.country}
                </span>
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold">{store.name}</h1>
              {store.tagline && <p className="mt-1 text-sm text-white/85 max-w-2xl">{store.tagline}</p>}
            </div>
          </div>
          <Link
            href="#catalogue-boutique"
            className="rounded-xl px-5 py-2.5 text-xs font-extrabold text-white shadow-md transition hover:opacity-90"
            style={{ backgroundColor: store.buttonColor }}
          >
            Découvrir le catalogue ({store.products.length})
          </Link>
        </div>
      </div>
      <div id="catalogue-boutique" />

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
