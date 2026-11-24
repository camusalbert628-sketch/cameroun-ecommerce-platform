import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { signSessionPayload } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectTarget = req.nextUrl.searchParams.get("redirect") || "/inscription-boutique";
  const safeRedirect = redirectTarget.startsWith("/") ? redirectTarget : "/inscription-boutique";

  if (!clientId || !clientSecret) {
    const fallbackUrl = new URL("/compte", req.nextUrl.origin);
    fallbackUrl.searchParams.set("error", "google_not_configured");
    fallbackUrl.searchParams.set("redirect", safeRedirect);
    return NextResponse.redirect(fallbackUrl);
  }

  const stateNonce = crypto.randomBytes(24).toString("hex");
  const callbackUrl = `${req.nextUrl.origin}/api/auth/google/callback`;

  const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleAuthUrl.searchParams.set("client_id", clientId);
  googleAuthUrl.searchParams.set("redirect_uri", callbackUrl);
  googleAuthUrl.searchParams.set("response_type", "code");
  googleAuthUrl.searchParams.set("scope", "openid email profile");
  googleAuthUrl.searchParams.set("prompt", "select_account");
  googleAuthUrl.searchParams.set("state", stateNonce);

  const res = NextResponse.redirect(googleAuthUrl);
  res.cookies.set("albedoo_oauth_state", signSessionPayload(stateNonce, safeRedirect, null), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return res;
}
