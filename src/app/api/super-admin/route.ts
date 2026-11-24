import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import webpush from "web-push";
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
    vendors,
    categories,
    products,
    recentOrders,
    orderAgg,
    paidOrdersCount,
    claims,
    reviews,
    zones,
    coupons,
    invoices,
    notifications,
    pushCount,
    analyticsCount,
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
      take: 200,
    }),
    prisma.vendorProfile.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { products: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.product.findMany({
      include: {
        category: { select: { name: true } },
        store: { select: { name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 150,
    }),
    prisma.order.findMany({
      include: {
        store: { select: { name: true, slug: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.order.aggregate({ _sum: { totalFcfa: true }, _count: { id: true } }),
    prisma.order.count({ where: { paymentStatus: "PAID" } }),
    prisma.claim.findMany({
      include: {
        order: { select: { orderNumber: true, customerName: true, totalFcfa: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.review.findMany({
      include: { product: { select: { title: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.deliveryZone.findMany({ orderBy: [{ city: "asc" }, { zoneName: "asc" }] }),
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.billingInvoice.findMany({
      include: { store: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.notificationLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.pushSubscription.count(),
    prisma.analyticsEvent.count(),
  ]);

  const mrrFcfa = activeSubs.reduce((sum, s) => sum + s.priceFcfa, 0);

  return NextResponse.json({
    stores,
    users,
    vendors,
    categories,
    products,
    recentOrders,
    claims,
    reviews,
    zones,
    coupons,
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
      totalProducts: products.length,
      openClaims: claims.filter((c) => ["OPEN", "IN_REVIEW"].includes(c.status)).length,
      pushSubscribers: pushCount,
      analyticsEvents: analyticsCount,
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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await req.json();
  const { entity } = body as { entity?: string };

  if (entity === "CATEGORY") {
    const { name, description, icon } = body as { name?: string; description?: string; icon?: string };
    if (!name?.trim()) return NextResponse.json({ error: "Nom requis." }, { status: 400 });
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        slug: `${slug}-${Date.now().toString().slice(-3)}`,
        description: description?.trim() || name.trim(),
        icon: icon?.trim() || "Package",
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  }

  if (entity === "ZONE") {
    const { city, zoneName, feeFcfa, estimatedDays, supportsCod, codMaxFcfa } = body as {
      city?: string;
      zoneName?: string;
      feeFcfa?: number;
      estimatedDays?: string;
      supportsCod?: boolean;
      codMaxFcfa?: number;
    };
    if (!city?.trim() || !zoneName?.trim()) {
      return NextResponse.json({ error: "Ville et nom de zone requis." }, { status: 400 });
    }
    const zone = await prisma.deliveryZone.create({
      data: {
        city: city.trim(),
        zoneName: zoneName.trim(),
        feeFcfa: Math.max(0, Math.round(Number(feeFcfa) || 1500)),
        estimatedDays: estimatedDays?.trim() || "24h - 48h",
        supportsCod: supportsCod !== false,
        codMaxFcfa: Math.max(0, Math.round(Number(codMaxFcfa) || 150000)),
      },
    });
    return NextResponse.json({ zone }, { status: 201 });
  }

  if (entity === "BROADCAST_PUSH") {
    const { title, message, url } = body as { title?: string; message?: string; url?: string };
    if (!title?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "Titre et message requis." }, { status: 400 });
    }
    const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const priv = process.env.VAPID_PRIVATE_KEY;
    if (!pub || !priv) {
      return NextResponse.json({ error: "Clés VAPID non configurées." }, { status: 400 });
    }
    webpush.setVapidDetails("mailto:notifications@albedoo.cm", pub, priv);
    const subs = await prisma.pushSubscription.findMany();
    let sent = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: title.trim(), body: message.trim(), url: url || "/" })
        );
        sent++;
      } catch {
        // ignore stale subscription
      }
    }
    return NextResponse.json({ ok: true, sent, total: subs.length });
  }

  return NextResponse.json({ error: "Entité non supportée." }, { status: 400 });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const body = await req.json();
  const { entity } = body as { entity?: string };

  if (entity === "VENDOR" && body.vendorId) {
    const data: Record<string, unknown> = {};
    if (body.status && ["PENDING", "APPROVED", "SUSPENDED"].includes(body.status)) data.status = body.status;
    if (typeof body.commissionRate === "number") data.commissionRate = Math.min(0.5, Math.max(0, body.commissionRate));
    if (typeof body.verifiedBadge === "boolean") data.verifiedBadge = body.verifiedBadge;
    const vendor = await prisma.vendorProfile.update({ where: { id: body.vendorId }, data });
    return NextResponse.json({ vendor });
  }

  if (entity === "PRODUCT" && body.productId) {
    const data: Record<string, unknown> = {};
    if (body.qualityStatus && ["PENDING_QC", "APPROVED", "REJECTED"].includes(body.qualityStatus)) {
      data.qualityStatus = body.qualityStatus;
    }
    if (typeof body.isFeatured === "boolean") data.isFeatured = body.isFeatured;
    if (typeof body.isSponsored === "boolean") data.isSponsored = body.isSponsored;
    if (typeof body.priceFcfa === "number" && body.priceFcfa > 0) data.priceFcfa = Math.round(body.priceFcfa);
    if (typeof body.stock === "number" && body.stock >= 0) data.stock = Math.round(body.stock);
    const product = await prisma.product.update({ where: { id: body.productId }, data });
    return NextResponse.json({ product });
  }

  if (entity === "ORDER" && body.orderId) {
    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.paymentStatus && ["PENDING", "PAID", "FAILED", "REFUNDED"].includes(body.paymentStatus)) {
      data.paymentStatus = body.paymentStatus;
    }
    if (body.assignedCourier !== undefined) data.assignedCourier = body.assignedCourier;
    const order = await prisma.order.update({
      where: { id: body.orderId },
      data: {
        ...data,
        events: {
          create: {
            stepCode: `ADMIN_${body.status || "UPDATE"}`,
            label: `Mise à jour Super-Admin (${body.status || body.paymentStatus || "Info"})`,
            description: body.note || `Intervention Super-Admin par ${user.name}`,
            actorName: user.name,
          },
        },
      },
    });
    return NextResponse.json({ order });
  }

  if (entity === "CLAIM" && body.claimId) {
    const data: Record<string, unknown> = {};
    if (body.status && ["OPEN", "IN_REVIEW", "APPROVED", "RESOLVED", "REJECTED"].includes(body.status)) {
      data.status = body.status;
    }
    if (typeof body.refundAmountFcfa === "number") data.refundAmountFcfa = Math.max(0, Math.round(body.refundAmountFcfa));
    if (body.resolutionNote !== undefined) data.resolutionNote = body.resolutionNote;
    const claim = await prisma.claim.update({ where: { id: body.claimId }, data });
    return NextResponse.json({ claim });
  }

  if (entity === "ZONE" && body.zoneId) {
    const data: Record<string, unknown> = {};
    if (typeof body.feeFcfa === "number") data.feeFcfa = Math.max(0, Math.round(body.feeFcfa));
    if (typeof body.supportsCod === "boolean") data.supportsCod = body.supportsCod;
    if (body.estimatedDays) data.estimatedDays = body.estimatedDays;
    const zone = await prisma.deliveryZone.update({ where: { id: body.zoneId }, data });
    return NextResponse.json({ zone });
  }

  if (entity === "COUPON" && body.couponId) {
    const coupon = await prisma.coupon.update({
      where: { id: body.couponId },
      data: { active: Boolean(body.active) },
    });
    return NextResponse.json({ coupon });
  }

  if (body.userId) {
    const allowedRoles = ["CLIENT", "VENDOR", "LOGISTICS", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"];
    const data: Record<string, unknown> = {};
    if (body.role && allowedRoles.includes(body.role)) data.role = body.role;
    if (body.assignStoreId !== undefined) data.storeId = body.assignStoreId || null;
    if (typeof body.loyaltyPoints === "number") data.loyaltyPoints = Math.max(0, Math.round(body.loyaltyPoints));
    if (body.newPassword && String(body.newPassword).length >= 6) {
      data.passwordHash = await bcrypt.hash(String(body.newPassword), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: body.userId },
      data,
      select: { id: true, name: true, email: true, role: true, storeId: true, loyaltyPoints: true },
    });
    return NextResponse.json({ user: updatedUser });
  }

  if (!body.storeId) {
    return NextResponse.json({ error: "Identifiant cible requis." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (body.status && ["ACTIVE", "SUSPENDED"].includes(body.status)) data.status = body.status;
  if (body.plan && ["STARTER", "PRO", "BUSINESS"].includes(body.plan)) data.plan = body.plan;

  const store = await prisma.store.update({ where: { id: body.storeId }, data });
  return NextResponse.json({ store });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !isSuperAdmin(user.role)) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  const entity = req.nextUrl.searchParams.get("entity");
  const id = req.nextUrl.searchParams.get("id");
  if (!entity || !id) {
    return NextResponse.json({ error: "entity et id requis." }, { status: 400 });
  }

  if (entity === "STORE") await prisma.store.delete({ where: { id } });
  else if (entity === "USER") {
    if (id === user.id) return NextResponse.json({ error: "Impossible de supprimer votre propre compte actif." }, { status: 400 });
    await prisma.user.delete({ where: { id } });
  } else if (entity === "PRODUCT") await prisma.product.delete({ where: { id } });
  else if (entity === "CATEGORY") await prisma.category.delete({ where: { id } });
  else if (entity === "REVIEW") await prisma.review.delete({ where: { id } });
  else if (entity === "ZONE") await prisma.deliveryZone.delete({ where: { id } });
  else if (entity === "ORDER") await prisma.order.delete({ where: { id } });
  else return NextResponse.json({ error: "Entité inconnue." }, { status: 400 });

  return NextResponse.json({ ok: true });
}
