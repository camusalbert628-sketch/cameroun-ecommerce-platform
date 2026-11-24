import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./prisma";

export const SESSION_COOKIE_NAME = "cm_ecom_session";
const SECRET = process.env.AUTH_SECRET || "cameroun-ecommerce-dev-secret-2026";

export function signSessionPayload(userId: string, role: string, storeId?: string | null): string {
  const payload = Buffer.from(JSON.stringify({ userId, role, storeId: storeId || null })).toString("base64url");
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionPayload(signed: string): { userId: string; role: string; storeId: string | null } | null {
  const lastDot = signed.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = signed.slice(0, lastDot);
  const sig = signed.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", SECRET).update(payload).digest("hex");
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function setSessionCookie(userId: string, role = "CLIENT", storeId?: string | null) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, signSessionPayload(userId, role, storeId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  const parsed = verifySessionPayload(raw);
  if (!parsed?.userId) return null;
  return prisma.user.findUnique({
    where: { id: parsed.userId },
    include: { vendorProfile: true, store: true },
  });
}
