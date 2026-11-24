import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cameroun-ecommerce-platform.vercel.app";

  const staticPaths = ["/", "/catalogue", "/saas", "/inscription-boutique", "/suivi"];
  let dynamicPaths: string[] = [];

  try {
    const [products, stores] = await Promise.all([
      prisma.product.findMany({ select: { slug: true }, take: 200 }),
      prisma.store.findMany({ where: { status: "ACTIVE" }, select: { slug: true }, take: 100 }),
    ]);
    dynamicPaths = [
      ...products.map((p) => `/produit/${p.slug}`),
      ...stores.map((s) => `/s/${s.slug}`),
    ];
  } catch {
    // fallback to static paths
  }

  const urls = [...staticPaths, ...dynamicPaths]
    .map((p) => `<url><loc>${baseUrl}${p}</loc></url>`)
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
