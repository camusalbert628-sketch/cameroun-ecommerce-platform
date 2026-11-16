import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { clearSessionCookie, getCurrentUser, setSessionCookie } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  const demoUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      title: true,
      city: true,
      loyaltyPoints: true,
      vendorProfile: { select: { id: true, companyName: true, commissionRate: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
          city: user.city,
          quarter: user.quarter,
          phone: user.phone,
          loyaltyPoints: user.loyaltyPoints,
          vendorProfile: user.vendorProfile,
        }
      : null,
    demoUsers,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, quickSwitch } = body as {
      email?: string;
      password?: string;
      quickSwitch?: boolean;
    };

    if (!email) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { vendorProfile: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
    }

    if (!quickSwitch) {
      if (!password) {
        return NextResponse.json({ error: "Mot de passe requis." }, { status: 400 });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ error: "Mot de passe incorrect." }, { status: 401 });
      }
    }

    await setSessionCookie(user.id);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        title: user.title,
        city: user.city,
        loyaltyPoints: user.loyaltyPoints,
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

