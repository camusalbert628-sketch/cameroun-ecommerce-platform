import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getCurrentUser, setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function GET() {
  const user = await getCurrentUser();

  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          accountStatus: user.accountStatus,
          title: user.title,
          city: user.city,
          quarter: user.quarter,
          phone: user.phone,
          loyaltyPoints: user.loyaltyPoints,
          storeId: user.storeId,
          store: user.store
            ? { id: user.store.id, name: user.store.name, slug: user.store.slug, plan: user.store.plan }
            : null,
          vendorProfile: user.vendorProfile,
        }
      : null,
  });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`auth:login:${ip}`, 12, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop de tentatives. Réessayez dans ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { email, password } = body as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { vendorProfile: true, store: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Identifiants invalides." }, { status: 401 });
    }

    await setSessionCookie(user.id, user.role, user.storeId);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        city: user.city,
        loyaltyPoints: user.loyaltyPoints,
        storeId: user.storeId,
        store: user.store
          ? { id: user.store.id, name: user.store.name, slug: user.store.slug, plan: user.store.plan }
          : null,
        vendorProfile: user.vendorProfile,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json({ error: "Erreur d'authentification." }, { status: 500 });
  }
}

export async function DELETE() {
  await clearSessionCookie();
  return NextResponse.json({ ok: true });
}
