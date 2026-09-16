import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const WINDOW_MINUTES = 15;
const MAX_FAILED_ATTEMPTS = 5;

export async function isRateLimited(email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const failedCount = await prisma.loginAttempt.count({
    where: { email, succeeded: false, createdAt: { gte: since } },
  });
  return failedCount >= MAX_FAILED_ATTEMPTS;
}

export const RATE_LIMIT_MESSAGE = `Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.`;

const RESET_WINDOW_MINUTES = 15;
const MAX_RESET_REQUESTS = 3;

// Caps how many reset tokens one account can generate in a stretch — the
// link itself is still handed back in the response rather than emailed
// (see requestPasswordResetAction), so this doesn't close that gap, only
// how fast someone can hammer it for a given account.
export async function isPasswordResetRateLimited(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - RESET_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.passwordResetToken.count({
    where: { userId, createdAt: { gte: since } },
  });
  return recentCount >= MAX_RESET_REQUESTS;
}

export const RESET_RATE_LIMIT_MESSAGE = `Too many reset requests. Try again in ${RESET_WINDOW_MINUTES} minutes.`;

export async function logLoginAttempt(data: { email: string; succeeded: boolean; userId?: string | null }) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  const ipAddress = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip");

  await prisma.loginAttempt.create({
    data: {
      email: data.email,
      succeeded: data.succeeded,
      userId: data.userId ?? null,
      userAgent,
      ipAddress,
    },
  });
}
