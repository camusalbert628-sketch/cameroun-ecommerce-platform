import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductDetailClient } from "@/components/ProductDetailClient";

export const dynamic = "force-dynamic";

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
