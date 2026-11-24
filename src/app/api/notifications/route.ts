import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user || !["VENDOR", "ADMIN", "EXECUTIVE", "SUPER_ADMIN", "LOGISTICS"].includes(user.role)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const where = user.role === "VENDOR" && user.storeId ? { storeId: user.storeId } : {};

  const notifications = await prisma.notificationLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 25,
  });

  return NextResponse.json({ notifications });
}
