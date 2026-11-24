import { NextRequest, NextResponse } from "next/server";
import dns from "dns/promises";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const domain = req.nextUrl.searchParams.get("domain")?.trim().toLowerCase();
  if (!domain) {
    return NextResponse.json({ error: "Paramètre domain requis." }, { status: 400 });
  }

  try {
    const [cnameRecords, aRecords] = await Promise.allSettled([
      dns.resolveCname(domain),
      dns.resolve4(domain),
    ]);

    const cnames = cnameRecords.status === "fulfilled" ? cnameRecords.value : [];
    const ips = aRecords.status === "fulfilled" ? aRecords.value : [];
    const pointsToVercel =
      cnames.some((c) => c.includes("vercel-dns.com") || c.includes("vercel.app")) ||
      ips.includes("76.76.21.21");

    return NextResponse.json({
      domain,
      verified: pointsToVercel,
      cnames,
      ips,
      expectedCname: "cname.vercel-dns.com",
      expectedA: "76.76.21.21",
    });
  } catch {
    return NextResponse.json({
      domain,
      verified: false,
      cnames: [],
      ips: [],
      expectedCname: "cname.vercel-dns.com",
      expectedA: "76.76.21.21",
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.storeId) {
      return NextResponse.json({ error: "Authentification boutique requise." }, { status: 403 });
    }

    const store = await prisma.store.findUnique({ where: { id: user.storeId } });
    if (!store) {
      return NextResponse.json({ error: "Boutique introuvable." }, { status: 404 });
    }

    if (store.plan === "STARTER") {
      return NextResponse.json(
        { error: "Les domaines personnalisés sont réservés aux plans Pro et Business." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { customDomain } = body as { customDomain?: string };

    const cleanDomain = customDomain
      ? customDomain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "")
      : null;

    if (cleanDomain && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(cleanDomain)) {
      return NextResponse.json({ error: "Format de nom de domaine invalide." }, { status: 400 });
    }

    let vercelProvisioned = false;
    if (cleanDomain && process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID) {
      const vercelRes = await fetch(
        `https://api.vercel.com/v10/projects/${process.env.VERCEL_PROJECT_ID}/domains`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: cleanDomain }),
        }
      );
      vercelProvisioned = vercelRes.ok;
    }

    const updated = await prisma.store.update({
      where: { id: store.id },
      data: { customDomain: cleanDomain },
    });

    return NextResponse.json({
      store: updated,
      vercelProvisioned,
      dnsInstructions: cleanDomain
        ? { type: "CNAME", host: cleanDomain, value: "cname.vercel-dns.com" }
        : null,
    });
  } catch (error) {
    console.error("Update customDomain error:", error);
    return NextResponse.json({ error: "Ce domaine est déjà utilisé ou invalide." }, { status: 400 });
  }
}
