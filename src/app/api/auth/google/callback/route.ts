import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie, verifySessionPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const oauthErr = req.nextUrl.searchParams.get("error");

  const stateCookie = req.cookies.get("albedoo_oauth_state")?.value;
  const parsedState = stateCookie ? verifySessionPayload(stateCookie) : null;
  const redirectTarget = parsedState?.role?.startsWith("/") ? parsedState.role : "/inscription-boutique";

  const failRedirect = (errCode: string) => {
    const url = new URL("/compte", req.nextUrl.origin);
    url.searchParams.set("error", errCode);
    url.searchParams.set("redirect", redirectTarget);
    const r = NextResponse.redirect(url);
    r.cookies.delete("albedoo_oauth_state");
    return r;
  };

  if (oauthErr || !code || !state || !parsedState || parsedState.userId !== state) {
    return failRedirect("google_oauth_failed");
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return failRedirect("google_not_configured");
  }

  try {
    const callbackUrl = `${req.nextUrl.origin}/api/auth/google/callback`;
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: callbackUrl,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenRes.ok) {
      return failRedirect("google_token_error");
    }

    const tokens = (await tokenRes.json()) as { access_token?: string };
    if (!tokens.access_token) {
      return failRedirect("google_token_error");
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!profileRes.ok) {
      return failRedirect("google_profile_error");
    }

    const profile = (await profileRes.json()) as {
      sub?: string;
      email?: string;
      email_verified?: boolean;
      name?: string;
    };

    if (!profile.sub || !profile.email) {
      return failRedirect("google_profile_incomplete");
    }

    const normalizedEmail = profile.email.trim().toLowerCase();

    let user = null;
    const existingAccount = await prisma.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.sub } },
      include: { user: true },
    });

    if (existingAccount) {
      user = existingAccount.user;
    } else {
      user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        const randomHash = await bcrypt.hash(crypto.randomBytes(24).toString("hex"), 10);
        user = await prisma.user.create({
          data: {
            name: profile.name?.trim() || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            passwordHash: randomHash,
            role: "CLIENT",
            loyaltyPoints: 100,
          },
        });
      }

      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: "google",
          providerAccountId: profile.sub,
          email: normalizedEmail,
        },
      });
    }

    await setSessionCookie(user.id, user.role, user.storeId);

    const dest = new URL(redirectTarget, req.nextUrl.origin);
    const res = NextResponse.redirect(dest);
    res.cookies.delete("albedoo_oauth_state");
    return res;
  } catch (error) {
    console.error("Google OAuth callback error:", error);
    return failRedirect("google_oauth_failed");
  }
}
