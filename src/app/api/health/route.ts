import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Pinged on a schedule (see vercel.json) purely to keep Neon's compute from
// autosuspending after 5 minutes idle — that's what causes the multi-second
// "cold start" on the first real request after a quiet stretch. A trivial
// query is enough; the response itself isn't meant to be consumed.
export async function GET() {
  await prisma.$queryRaw`SELECT 1`;
  return NextResponse.json({ ok: true });
}
