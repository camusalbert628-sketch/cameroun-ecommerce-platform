import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { formatFcfa } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    select: { title: true, description: true, priceFcfa: true, imageUrl: true },
  });
  if (!product) {
    return { title: "Produit introuvable — Albedo'o" };
  }
  const title = `${product.title} — ${formatFcfa(product.priceFcfa)} | Albedo'o`;
  const description = product.description?.slice(0, 155) || "Commandez sur Albedo'o avec paiement Orange Money / MTN MoMo.";
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.imageUrl ? [product.imageUrl] : undefined,
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      vendor: true,
      variants: true,
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!product) {
    notFound();
  }

  const relatedProducts = await prisma.product.findMany({
    where: {
      qualityStatus: "APPROVED",
      id: { not: product.id },
    },
    include: { category: true, vendor: true },
    orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    take: 4,
  });

  return (
    <ProductDetailClient
      product={{
        ...product,
        reviews: product.reviews.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
      }}
      relatedProducts={relatedProducts}
    />
  );
}
