import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function isSuperAdmin(role?: string | null) {
  return Boolean(role && ["ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(role));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: "Accès réservé au Super-Admin SaaS." }, { status: 403 });
  }

  const [
    stores,
    activeSubs,
    users,
    recentOrders,
    orderAgg,
    paidOrdersCount,
    totalProducts,
    totalCoupons,
    invoices,
    notifications,
  ] = await Promise.all([
    prisma.store.findMany({
      include: {
        subscriptions: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { products: true, orders: true, users: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.findMany({ where: { status: "ACTIVE" } }),
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        city: true,
        loyaltyPoints: true,
        storeId: true,
        store: { select: { name: true, slug: true } },
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.findMany({
      select: {
        id: true,
        orderNumber: true,
        customerName: true,
        city: true,
        totalFcfa: true,
        paymentMethod: true,
        paymentStatus: true,
        status: true,
        createdAt: true,
        store: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.order.aggregate({
      _sum: { totalFcfa: true },
      _count: { id: true },
    }),
    prisma.order.count({ where: { paymentStatus: "PAID" } }),
    prisma.product.count(),
    prisma.coupon.count({ where: { active: true } }),
    prisma.billingInvoice.findMany({
      include: { store: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notificationLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  const mrrFcfa = activeSubs.reduce((sum, s) => sum + s.priceFcfa, 0);

  return NextResponse.json({
    stores,
    users,
    recentOrders,
    invoices,
    notifications,
    metrics: {
      totalStores: stores.length,
      activeStores: stores.filter((s) => s.status === "ACTIVE").length,
      mrrFcfa,
      arrFcfa: mrrFcfa * 12,
      gmvFcfa: orderAgg._sum.totalFcfa || 0,
      totalOrders: orderAgg._count.id || 0,
      paidOrders: paidOrdersCount,
      totalUsers: users.length,
      totalProducts,
      totalCoupons,
    },
    systemHealth: {
      database: "PostgreSQL (Neon)",
      blobConfigured: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
      pushConfigured: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
      paymentGateway: process.env.NOTCHPAY_PUBLIC_KEY
        ? "NotchPay (Live)"
        : process.env.CINETPAY_API_KEY
        ? "CinetPay (Live)"
        : "Sandbox Intégré",
      emailProvider: process.env.RESEND_API_KEY ? "Resend (Live)" : "Journalisé (Base)",
      whatsappProvider: process.env.WHATSAPP_TOKEN ? "WhatsApp Cloud (Live)" : "Journalisé (Base)",
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await req.json();
  const { storeId, status, plan, userId, role, assignStoreId } = body as {
    storeId?: string;
    status?: string;
    plan?: string;
    userId?: string;
    role?: string;
    assignStoreId?: string | null;
  };

  if (userId) {
    const allowedRoles = ["CLIENT", "VENDOR", "LOGISTICS", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"];
    const data: Record<string, unknown> = {};
    if (role && allowedRoles.includes(role)) data.role = role;
    if (assignStoreId !== undefined) data.storeId = assignStoreId || null;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, email: true, role: true, storeId: true },
    });
    return NextResponse.json({ user: updatedUser });
  }

  if (!storeId) {
    return NextResponse.json({ error: "storeId ou userId requis." }, { status: 400 });
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
