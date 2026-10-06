import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// A preview deployment should run on its own database (a Neon branch), not on the live one:
// DATABASE_URL_PREVIEW is used for VERCEL_ENV=preview when it's set. Without it a preview shares
// the production database, which is logged once so it doesn't go unnoticed.
function databaseUrl() {
  if (process.env.VERCEL_ENV === "preview") {
    if (process.env.DATABASE_URL_PREVIEW) return process.env.DATABASE_URL_PREVIEW;
    console.warn("DATABASE_URL_PREVIEW is not set: this preview deployment uses the production database.");
  }
  return process.env.DATABASE_URL!;
}

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: databaseUrl() });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
