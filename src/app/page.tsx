import React from "react";
import { prisma } from "@/lib/prisma";
import { HomeClient } from "@/components/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { qualityStatus: "APPROVED" },
    include: { category: true, vendor: true },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return <HomeClient products={products} />;
}
