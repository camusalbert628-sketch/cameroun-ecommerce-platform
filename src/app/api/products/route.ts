import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q");
  const salesModel = searchParams.get("salesModel");
  const qualityStatus = searchParams.get("qualityStatus") || "APPROVED";
  const includeAll = searchParams.get("includeAll") === "true";

  const where: Record<string, unknown> = {};
  if (!includeAll) {
    where.qualityStatus = qualityStatus;
  }
  if (category && category !== "all") {
    where.category = { slug: category };
  }
  if (salesModel && salesModel !== "all") {
    where.salesModel = salesModel;
  }
  if (q && q.trim()) {
    where.OR = [
      { title: { contains: q.trim() } },
      { description: { contains: q.trim() } },
      { sku: { contains: q.trim() } },
    ];
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: true,
      vendor: true,
      variants: true,
    },
    orderBy: [{ isSponsored: "desc" }, { isFeatured: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "VENDOR" && user.role !== "ADMIN")) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs ou administrateurs." }, { status: 403 });
    }

    const body = await req.json();
    const {
      title,
      description,
      priceFcfa,
      costPriceFcfa,
      stock,
      categoryId,
      salesModel,
      warrantyMonths,
      imageUrl,
    } = body;

    if (!title || !description || !priceFcfa || !categoryId) {
      return NextResponse.json({ error: "Champs obligatoires manquants." }, { status: 400 });
    }

    // Enforce SaaS Plan Quota (STARTER = max 50 products)
    if (user.storeId) {
      const store = await prisma.store.findUnique({ where: { id: user.storeId } });
      if (store?.plan === "STARTER") {
        const count = await prisma.product.count({ where: { storeId: user.storeId } });
        if (count >= 50) {
          return NextResponse.json(
            {
              error:
                "Limite du plan Starter atteinte (50 produits max). Passez au plan Pro ou Business dans votre espace facturation.",
            },
            { status: 403 }
          );
        }
      }
    }

    const slugBase = String(title)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = `${slugBase}-${Date.now().toString().slice(-4)}`;
    const sku = `SKU-${Date.now().toString().slice(-6)}`;

    const isVendor = user.role === "VENDOR" && user.vendorProfile;
    const product = await prisma.product.create({
      data: {
        title,
        slug,
        description,
        sku,
        priceFcfa: Number(priceFcfa),
        costPriceFcfa: Number(costPriceFcfa || Math.round(Number(priceFcfa) * 0.82)),
        initialStock: Number(stock || 10),
        stock: Number(stock || 10),
        salesModel: isVendor ? "MARKETPLACE_PARTNER" : salesModel || "DIRECT_RETAIL",
        qualityStatus: isVendor ? "PENDING_QC" : "APPROVED",
        warrantyMonths: Number(warrantyMonths || 6),
        imageUrl: imageUrl || "/products/smartphone.jpg",
        categoryId,
        storeId: user.storeId || null,
        vendorId: isVendor ? user.vendorProfile!.id : null,
      },
      include: { category: true, vendor: true, variants: true },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ error: "Erreur lors de la création du produit." }, { status: 500 });
  }
}

