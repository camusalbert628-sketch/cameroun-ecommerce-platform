import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { code, subtotalFcfa, storeId } = (await req.json()) as {
      code?: string;
      subtotalFcfa?: number;
      storeId?: string | null;
    };

    if (!code?.trim() || typeof subtotalFcfa !== "number") {
      return NextResponse.json({ error: "Code promo et sous-total requis." }, { status: 400 });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!coupon || !coupon.active) {
      return NextResponse.json({ valid: false, error: "Code promo invalide ou inactif." }, { status: 404 });
    }

    if (coupon.storeId && storeId && coupon.storeId !== storeId) {
      return NextResponse.json({ valid: false, error: "Ce code promo ne s'applique pas à cette boutique." }, { status: 400 });
    }

    if (coupon.expiresAt && coupon.expiresAt <= new Date()) {
      return NextResponse.json({ valid: false, error: "Ce code promo a expiré." }, { status: 400 });
    }

    if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses) {
      return NextResponse.json({ valid: false, error: "Ce code promo a atteint sa limite d'utilisation." }, { status: 400 });
    }

    if (subtotalFcfa < coupon.minOrderFcfa) {
      return NextResponse.json(
        { valid: false, error: `Minimum de commande requis : ${coupon.minOrderFcfa.toLocaleString("fr-FR")} FCFA.` },
        { status: 400 }
      );
    }

    const rawDiscount =
      coupon.discountType === "PERCENT"
        ? Math.round((subtotalFcfa * coupon.value) / 100)
        : coupon.value;
    const discountFcfa = Math.min(subtotalFcfa, rawDiscount);

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discountFcfa,
      label:
        coupon.discountType === "PERCENT"
          ? `-${coupon.value}%`
          : `-${coupon.value.toLocaleString("fr-FR")} FCFA`,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json({ valid: false, error: "Erreur validation coupon." }, { status: 500 });
  }
}
