import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientIp, takeToken, HOUR, MINUTE } from "@/lib/rate-limit";

const WINDOW_MINUTES = 15;
const WINDOW_MS = WINDOW_MINUTES * MINUTE;

// Failed sign-ins are counted per person AND network, per network, and (much higher) per
// person. Counting only per email let anyone lock a stranger out with five wrong guesses and
// did nothing against one network trying many accounts.
const MAX_FAILED_PER_EMAIL_AND_IP = 5;
const MAX_FAILED_PER_IP = 30;
const MAX_FAILED_PER_EMAIL = 50;

export async function isRateLimited(email: string): Promise<boolean> {
  const ip = await clientIp();
  const failed = { succeeded: false, createdAt: { gte: new Date(Date.now() - WINDOW_MS) } };
  const [byEmailAndIp, byIp, byEmail] = await Promise.all([
    ip ? prisma.loginAttempt.count({ where: { email, ipAddress: ip, ...failed } }) : Promise.resolve(0),
    ip ? prisma.loginAttempt.count({ where: { ipAddress: ip, ...failed } }) : Promise.resolve(0),
    prisma.loginAttempt.count({ where: { email, ...failed } }),
  ]);
  // Without a known address (local development) only the per-email count applies, at the strict limit.
  if (!ip) return byEmail >= MAX_FAILED_PER_EMAIL_AND_IP;
  return byEmailAndIp >= MAX_FAILED_PER_EMAIL_AND_IP || byIp >= MAX_FAILED_PER_IP || byEmail >= MAX_FAILED_PER_EMAIL;
}

export const RATE_LIMIT_MESSAGE = `Too many failed attempts. Try again in ${WINDOW_MINUTES} minutes.`;

const RESET_WINDOW_MINUTES = 15;
const MAX_RESET_REQUESTS = 3;

// Caps how many reset tokens one account can generate in a stretch — the
// token is only ever emailed (see requestPasswordResetAction), never
// returned to the caller, so this is purely an anti-spam/anti-hammering cap.
export async function isPasswordResetRateLimited(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - RESET_WINDOW_MINUTES * MINUTE);
  const recentCount = await prisma.passwordResetToken.count({
    where: { userId, createdAt: { gte: since } },
  });
  return recentCount >= MAX_RESET_REQUESTS;
}

export const RESET_RATE_LIMIT_MESSAGE = `Too many reset requests. Try again in ${RESET_WINDOW_MINUTES} minutes.`;

// Reset mails per network address: one address can't be used to mail-bomb many accounts.
export async function takeResetRequestToken(): Promise<boolean> {
  const ip = await clientIp();
  if (!ip) return true;
  return takeToken("password-reset", ip, 10, HOUR);
}

export async function logLoginAttempt(data: { email: string; succeeded: boolean; userId?: string | null }) {
  const headersList = await headers();
  const userAgent = headersList.get("user-agent");
  const ipAddress = await clientIp();

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
  const ipAddress = await clientIp();
  if (!ipAddress) return false;

  const since = new Date(Date.now() - SIGNUP_WINDOW_MINUTES * MINUTE);
  const recentCount = await prisma.signupAttempt.count({
    where: { ipAddress, createdAt: { gte: since } },
  });
  return recentCount >= MAX_SIGNUPS_PER_IP;
}

export const SIGNUP_RATE_LIMIT_MESSAGE = `Too many accounts created from this network. Try again in ${SIGNUP_WINDOW_MINUTES} minutes.`;

export async function logSignupAttempt() {
  const ipAddress = await clientIp();
  await prisma.signupAttempt.create({ data: { ipAddress } });
}
