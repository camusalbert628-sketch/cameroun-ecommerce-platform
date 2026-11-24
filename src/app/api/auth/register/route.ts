import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`auth:register:${ip}`, 8, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop d'inscriptions depuis cette IP. Réessayez dans ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { name, email, password, phone, city } = body as {
      name?: string;
      email?: string;
      password?: string;
      phone?: string;
      city?: string;
    };

    if (!name?.trim() || !email?.trim() || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Nom, email valide et mot de passe (min. 6 caractères) requis." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (exists) {
      return NextResponse.json({ error: "Un compte existe déjà avec cet email." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        phone: phone?.trim() || null,
        city: city || "Douala",
        role: "CLIENT",
        loyaltyPoints: 100, // Bonus de bienvenue
      },
    });

    await setSessionCookie(user.id, user.role, null);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          city: user.city,
          loyaltyPoints: user.loyaltyPoints,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Erreur lors de la création du compte." }, { status: 500 });
  }
}
