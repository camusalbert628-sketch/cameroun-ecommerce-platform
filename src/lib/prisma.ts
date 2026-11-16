import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getDatabaseUrl(): string | undefined {
  if (process.env.VERCEL && (!process.env.DATABASE_URL || process.env.DATABASE_URL.startsWith("file:"))) {
    const tmpDb = "/tmp/dev.db";
    if (!fs.existsSync(tmpDb)) {
      const seedDb = path.join(process.cwd(), "prisma", "seed.db");
      if (fs.existsSync(seedDb)) {
        fs.copyFileSync(seedDb, tmpDb);
      }
    }
    return `file:${tmpDb}`;
  }
  return process.env.DATABASE_URL;
}

const dbUrl = getDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(dbUrl ? { datasources: { db: { url: dbUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
