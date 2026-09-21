import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

async function getClientIp(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get("x-forwarded-for")?.split(",")[0]?.trim() || headersList.get("x-real-ip");
}

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
// token is only ever emailed (see requestPasswordResetAction), never
// returned to the caller, so this is purely an anti-spam/anti-hammering cap.
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
  const ipAddress = await getClientIp();

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

const SIGNUP_WINDOW_MINUTES = 60;
const MAX_SIGNUPS_PER_IP = 5;

// Keyed by IP, not email — unlike login/reset there's no account yet to key
// on, and the whole point is capping how many accounts one network can mint,
// not how many times one address is retried.
export async function isSignupRateLimited(): Promise<boolean> {
  const ipAddress = await getClientIp();
  if (!ipAddress) return false;

  const since = new Date(Date.now() - SIGNUP_WINDOW_MINUTES * 60 * 1000);
  const recentCount = await prisma.signupAttempt.count({
    where: { ipAddress, createdAt: { gte: since } },
  });
  return recentCount >= MAX_SIGNUPS_PER_IP;
}

export const SIGNUP_RATE_LIMIT_MESSAGE = `Too many accounts created from this network. Try again in ${SIGNUP_WINDOW_MINUTES} minutes.`;

export async function logSignupAttempt() {
  const ipAddress = await getClientIp();
  await prisma.signupAttempt.create({ data: { ipAddress } });
}
