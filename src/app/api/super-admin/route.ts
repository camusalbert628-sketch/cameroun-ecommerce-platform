import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Accès réservé au Super-Admin SaaS." }, { status: 403 });
  }

  const stores = await prisma.store.findMany({
    include: {
      subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
      _count: { select: { products: true, orders: true, users: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeSubs = await prisma.subscription.findMany({
    where: { status: "ACTIVE" },
  });

  const mrrFcfa = activeSubs.reduce((sum, s) => sum + s.priceFcfa, 0);

  return NextResponse.json({
    stores,
    metrics: {
      totalStores: stores.length,
      activeStores: stores.filter((s) => s.status === "ACTIVE").length,
      mrrFcfa,
      arrFcfa: mrrFcfa * 12,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !["ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await req.json();
  const { storeId, status, plan } = body as {
    storeId: string;
    status?: string;
    plan?: string;
  };

  if (!storeId) {
    return NextResponse.json({ error: "storeId requis." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (status && ["ACTIVE", "SUSPENDED"].includes(status)) data.status = status;
  if (plan && ["STARTER", "PRO", "BUSINESS"].includes(plan)) data.plan = plan;

  const store = await prisma.store.update({
    where: { id: storeId },
    data,
  });

  return NextResponse.json({ store });
}
