import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["ADMIN", "VENDOR", "LOGISTICS", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await req.json();

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    if (user.role === "VENDOR") {
      const ownsProduct =
        (user.storeId && existing.storeId === user.storeId) ||
        (user.vendorProfile?.id && existing.vendorId === user.vendorProfile.id);
      if (!ownsProduct) {
        return NextResponse.json({ error: "Ce produit n'appartient pas à votre boutique." }, { status: 403 });
      }
    }

    const data: Record<string, unknown> = {};
    if (body.qualityStatus && ["ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
      data.qualityStatus = body.qualityStatus;
    }
    if (typeof body.addStock === "number" && body.addStock > 0) {
      data.stock = existing.stock + Math.round(body.addStock);
    } else if (typeof body.stock === "number") {
      data.stock = Math.max(0, Math.round(body.stock));
    }
    if (typeof body.priceFcfa === "number" && body.priceFcfa > 0) {
      data.priceFcfa = Math.round(body.priceFcfa);
    }
    if (typeof body.isFeatured === "boolean" && ["ADMIN", "SUPER_ADMIN"].includes(user.role)) {
      data.isFeatured = body.isFeatured;
    }

    const product = await prisma.product.update({
      where: { id },
      data,
      include: { category: true, vendor: true, variants: true },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Update product error:", error);
    return NextResponse.json({ error: "Erreur de mise à jour." }, { status: 500 });
  }
}
