import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = (await req.json()) as { token?: string; password?: string };

    if (!token || !password || password.length < 6) {
      return NextResponse.json(
        { error: "Jeton valide et nouveau mot de passe (min. 6 caractères) requis." },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token.trim()).digest("hex");
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return NextResponse.json({ error: "Lien de réinitialisation invalide ou expiré." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true, message: "Mot de passe mis à jour avec succès." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Erreur lors de la réinitialisation." }, { status: 500 });
  }
}
