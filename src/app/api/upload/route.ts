import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const scope = req.nextUrl.searchParams.get("scope");
    const isOnboarding = scope === "onboarding";
    const isPaymentProof = scope === "payment-proof" && Boolean(user);
    const isAuthorizedStaff = Boolean(
      user && ["VENDOR", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)
    );

    if (!isAuthorizedStaff && !isOnboarding && !isPaymentProof) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    if (isOnboarding && !isAuthorizedStaff) {
      const ip = getClientIp(req.headers);
      const rl = checkRateLimit(`upload:onboarding:${ip}`, 15, 60_000);
      if (!rl.allowed) {
        return NextResponse.json(
          { error: `Trop de fichiers envoyés. Réessayez dans ${rl.retryAfterSec}s.` },
          { status: 429 }
        );
      }
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Format non supporté. Utilisez PNG, JPG ou WebP." },
        { status: 400 }
      );
    }

    const maxBytes = isAuthorizedStaff ? 4.5 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Image trop volumineuse (max ${isAuthorizedStaff ? "4,5" : "2"} Mo).` },
        { status: 400 }
      );
    }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const folder = user?.storeId || "onboarding";
      const safeName = `albedoo/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const blob = await put(safeName, file, {
        access: "public",
        contentType: file.type,
      });
      return NextResponse.json({ url: blob.url, storage: "vercel-blob" });
    }

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    return NextResponse.json({ url: dataUrl, storage: "inline" });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Erreur lors de l'envoi de l'image." }, { status: 500 });
  }
}
