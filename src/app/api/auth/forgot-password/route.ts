import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendTransactionalNotification } from "@/lib/notifications";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers);
    const rl = checkRateLimit(`auth:forgot:${ip}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: `Trop de demandes. Réessayez dans ${rl.retryAfterSec}s.` },
        { status: 429 }
      );
    }

    const { email } = (await req.json()) as { email?: string };
    if (!email?.trim()) {
      return NextResponse.json({ error: "Adresse email requise." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user) {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash, expiresAt },
      });

      const resetUrl = `${req.nextUrl.origin}/compte?resetToken=${rawToken}`;
      await sendTransactionalNotification({
        storeId: user.storeId,
        channel: "EMAIL",
        recipient: user.email,
        subject: "Réinitialisation de votre mot de passe Albedo'o",
        message: `Cliquez sur ce lien (valable 30 minutes) pour définir un nouveau mot de passe : ${resetUrl}`,
      });
    }

    // Always return generic success to avoid email enumeration
    return NextResponse.json({
      ok: true,
      message: "Si un compte correspond à cet email, un lien de réinitialisation a été envoyé.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: "Erreur lors de la demande." }, { status: 500 });
  }
}
