import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !["VENDOR", "ADMIN", "EXECUTIVE", "SUPER_ADMIN"].includes(user.role)) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier fourni." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Seules les images sont acceptées." }, { status: 400 });
    }

    if (file.size > 4.5 * 1024 * 1024) {
      return NextResponse.json({ error: "Image trop volumineuse (max 4,5 Mo)." }, { status: 400 });
    }

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const ext = file.name.split(".").pop()?.replace(/[^a-zA-Z0-9]/g, "") || "png";
      const safeName = `albedoo/${user.storeId || "global"}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
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
