import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !["VENDOR", "ADMIN", "EXECUTIVE"].includes(user.role)) {
      return NextResponse.json(
        { error: "Connectez-vous en tant que Vendeur ou Administrateur pour ajouter une variante." },
        { status: 403 }
      );
    }

    const { id } = await context.params;
    const body = await req.json();
    const { label, usesCustomPrice, priceFcfa, initialStock, colorHex } = body as {
      label?: string;
      usesCustomPrice?: boolean;
      priceFcfa?: number;
      initialStock?: number;
      colorHex?: string;
    };

    if (!label || !label.trim()) {
      return NextResponse.json(
        { error: "Le libellé de la variante est obligatoire." },
        { status: 400 }
      );
    }

    if (initialStock === undefined || initialStock === null || Number(initialStock) < 0) {
      return NextResponse.json(
        { error: "La quantité initiale disponible est obligatoire (≥ 0)." },
        { status: 400 }
      );
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    }

    const useCustom = Boolean(usesCustomPrice);
    if (useCustom && (!priceFcfa || Number(priceFcfa) <= 0)) {
      return NextResponse.json(
        { error: "Veuillez saisir un prix spécifique valide en FCFA." },
        { status: 400 }
      );
    }

    const finalPrice = useCustom ? Math.round(Number(priceFcfa)) : product.priceFcfa;
    const qty = Math.max(0, Math.round(Number(initialStock)));
    const sku = `${product.sku}-V${Date.now().toString().slice(-4)}`;

    const variant = await prisma.productVariant.create({
      data: {
        productId: id,
        label: label.trim(),
        sku,
        usesCustomPrice: useCustom,
        priceFcfa: finalPrice,
        initialStock: qty,
        stock: qty,
        colorHex: colorHex || null,
      },
    });

    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    console.error("Create variant error:", error);
    return NextResponse.json({ error: "Erreur lors de l'ajout de la variante." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["VENDOR", "ADMIN", "EXECUTIVE", "LOGISTICS"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await req.json();
    const { variantId, addStock, priceFcfa, usesCustomPrice } = body as {
      variantId?: string;
      addStock?: number;
      priceFcfa?: number;
      usesCustomPrice?: boolean;
    };

    if (!variantId) {
      return NextResponse.json({ error: "variantId requis." }, { status: 400 });
    }

    const existing = await prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "Variante introuvable." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};
    if (typeof addStock === "number" && addStock > 0) {
      data.stock = existing.stock + Math.round(addStock);
    }
    if (typeof usesCustomPrice === "boolean") {
      data.usesCustomPrice = usesCustomPrice;
      data.priceFcfa = usesCustomPrice && priceFcfa ? Math.round(priceFcfa) : existing.product.priceFcfa;
    } else if (typeof priceFcfa === "number" && priceFcfa > 0) {
      data.priceFcfa = Math.round(priceFcfa);
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data,
    });

    return NextResponse.json({ variant });
  } catch (error) {
    console.error("Update variant error:", error);
    return NextResponse.json({ error: "Erreur de mise à jour variante." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["VENDOR", "ADMIN", "EXECUTIVE"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }
    const { searchParams } = new URL(req.url);
    const variantId = searchParams.get("variantId");
    if (!variantId) {
      return NextResponse.json({ error: "variantId requis." }, { status: 400 });
    }
    await prisma.productVariant.delete({ where: { id: variantId } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Delete variant error:", error);
    return NextResponse.json({ error: "Erreur de suppression." }, { status: 500 });
  }
}
