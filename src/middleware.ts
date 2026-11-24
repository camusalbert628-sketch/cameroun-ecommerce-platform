import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "cm_ecom_session";
const SECRET = process.env.AUTH_SECRET || "cameroun-ecommerce-dev-secret-2026";

const ROUTE_ROLES: { prefix: string; roles: string[] }[] = [
  { prefix: "/inscription-boutique", roles: ["CLIENT", "VENDOR", "LOGISTICS", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
  { prefix: "/boutique", roles: ["CLIENT", "VENDOR", "LOGISTICS", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
  { prefix: "/vendeur", roles: ["VENDOR", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
  { prefix: "/logistique", roles: ["LOGISTICS", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
  { prefix: "/admin", roles: ["ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
  { prefix: "/direction", roles: ["EXECUTIVE", "SUPER_ADMIN"] },
  { prefix: "/super-admin", roles: ["ADMIN", "EXECUTIVE", "SUPER_ADMIN"] },
];

async function verifyEdgeSession(signed: string): Promise<{ userId: string; role: string; storeId: string | null } | null> {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = signed.slice(0, lastDot);
  const sigHex = signed.slice(lastDot + 1);

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expectedHex = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (sigHex !== expectedHex) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = ROUTE_ROLES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`));
  if (!rule) return NextResponse.next();

  const rawCookie = req.cookies.get(COOKIE_NAME)?.value;
  if (!rawCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/compte";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  const session = await verifyEdgeSession(rawCookie);
  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = "/compte";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (!rule.roles.includes(session.role)) {
    const url = req.nextUrl.clone();
    url.pathname = "/compte";
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/inscription-boutique",
    "/inscription-boutique/:path*",
    "/boutique/:path*",
    "/vendeur/:path*",
    "/logistique/:path*",
    "/admin/:path*",
    "/direction/:path*",
    "/super-admin/:path*",
  ],
};
