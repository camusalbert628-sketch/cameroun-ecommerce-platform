import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["VENDOR", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const where =
    user.role === "VENDOR" && user.storeId
      ? { storeId: user.storeId }
      : {};

  const coupons = await prisma.coupon.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["VENDOR", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const body = await req.json();
    const { code, discountType, value, minOrderFcfa, maxUses, expiresAt } = body as {
      code?: string;
      discountType?: "PERCENT" | "FIXED";
      value?: number;
      minOrderFcfa?: number;
      maxUses?: number | null;
      expiresAt?: string | null;
    };

    const cleanCode = code?.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (!cleanCode || cleanCode.length < 3 || !value || value <= 0) {
      return NextResponse.json({ error: "Code (min 3 caractères) et valeur positive requis." }, { status: 400 });
    }

    if (discountType === "PERCENT" && value > 90) {
      return NextResponse.json({ error: "La remise en pourcentage ne peut pas dépasser 90%." }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: cleanCode,
        storeId: user.role === "VENDOR" ? user.storeId || null : null,
        discountType: discountType === "FIXED" ? "FIXED" : "PERCENT",
        value: Math.round(value),
        minOrderFcfa: Math.max(0, Math.round(minOrderFcfa || 0)),
        maxUses: maxUses ? Math.max(1, Math.round(maxUses)) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active: true,
      },
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (error) {
    console.error("Create coupon error:", error);
    return NextResponse.json({ error: "Ce code promo existe déjà ou est invalide." }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["VENDOR", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis." }, { status: 400 });

  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) return NextResponse.json({ error: "Introuvable." }, { status: 404 });

  if (user.role === "VENDOR" && coupon.storeId !== user.storeId) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
