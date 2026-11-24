import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

const PLAN_CONFIG: Record<string, { priceFcfa: number; commissionRate: number; maxProducts: number | null }> = {
  STARTER: { priceFcfa: 0, commissionRate: 0.05, maxProducts: 50 },
  PRO: { priceFcfa: 15000, commissionRate: 0.02, maxProducts: null },
  BUSINESS: { priceFcfa: 45000, commissionRate: 0.0, maxProducts: null },
};

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !user.storeId) {
    return NextResponse.json({ error: "Aucune boutique associée à ce compte." }, { status: 403 });
  }

  const [store, productCount, invoices] = await Promise.all([
    prisma.store.findUnique({ where: { id: user.storeId } }),
    prisma.product.count({ where: { storeId: user.storeId } }),
    prisma.billingInvoice.findMany({
      where: { storeId: user.storeId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!store) {
    return NextResponse.json({ error: "Boutique introuvable." }, { status: 404 });
  }

  const cfg = PLAN_CONFIG[store.plan] || PLAN_CONFIG.STARTER;
  return NextResponse.json({
    store,
    productCount,
    maxProducts: cfg.maxProducts,
    commissionRate: cfg.commissionRate,
    invoices,
  });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.storeId) {
      return NextResponse.json({ error: "Authentification boutique requise." }, { status: 403 });
    }

    const body = await req.json();
    const { plan, paymentMethod } = body as { plan?: string; paymentMethod?: string };

    if (!plan || !PLAN_CONFIG[plan]) {
      return NextResponse.json({ error: "Plan SaaS invalide." }, { status: 400 });
    }

    const cfg = PLAN_CONFIG[plan];
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
    const invoiceNumber = `INV-SAAS-${Date.now().toString().slice(-7)}`;

    const result = await prisma.$transaction(async (tx) => {
      const store = await tx.store.update({
        where: { id: user.storeId! },
        data: { plan },
      });

      if (user.vendorProfile) {
        await tx.vendorProfile.update({
          where: { id: user.vendorProfile.id },
          data: { commissionRate: cfg.commissionRate },
        });
      }

      await tx.subscription.create({
        data: {
          storeId: store.id,
          plan,
          priceFcfa: cfg.priceFcfa,
          status: "ACTIVE",
          currentPeriodEnd: nextMonth,
        },
      });

      const invoice = await tx.billingInvoice.create({
        data: {
          invoiceNumber,
          storeId: store.id,
          plan,
          amountFcfa: cfg.priceFcfa,
          paymentMethod: paymentMethod || "ORANGE_MONEY",
          status: "PAID",
        },
      });

      return { store, invoice };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Billing upgrade error:", error);
    return NextResponse.json({ error: "Erreur lors de la mise à niveau du plan." }, { status: 500 });
  }
}
