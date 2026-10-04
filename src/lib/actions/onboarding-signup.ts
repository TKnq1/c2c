"use server";

import { cookies } from "next/headers";
import { after } from "next/server";
import { AuthError } from "next-auth";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { processAvatarUpload } from "@/lib/avatar-upload";
import { creatorNicheColumns } from "@/lib/creator-niches";
import { sendEmail } from "@/lib/email";
import { welcomeEmail } from "@/lib/email-templates";
import { LOCALE_COOKIE, parseLocale } from "@/lib/i18n/locales";
import { isSignupRateLimited, logSignupAttempt, SIGNUP_RATE_LIMIT_MESSAGE } from "@/lib/login-security";
import { notifyBrandsAboutCreator } from "@/lib/onboarding-notify";
import { SITE_URL } from "@/lib/site";
import { guestBrandSignupSchema, guestCreatorSignupSchema } from "@/lib/validation";
import type { OnboardingState } from "@/lib/actions/onboarding";
import { randomBytes } from "crypto";

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

// Creates the account with the profile already filled in, then signs in
// without leaving the page. A redirect back to /onboarding would see a
// complete profile and skip payouts, notifications and the finish screen.
export async function signupFromDraftAction(_prevState: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const role = field(formData, "role");
  const email = field(formData, "email");
  const password = formData.get("password");
  const passwordText = typeof password === "string" ? password : "";
  const creatorParsed =
    role === "CREATOR"
      ? guestCreatorSignupSchema.safeParse({
          role,
          email,
          password: passwordText,
          displayName: field(formData, "displayName"),
          niches: field(formData, "niches"),
          platforms: field(formData, "platforms"),
        })
      : null;
  const brandParsed =
    role === "STARTUP"
      ? guestBrandSignupSchema.safeParse({
          role,
          email,
          password: passwordText,
          companyName: field(formData, "companyName"),
          niche: field(formData, "niche"),
        })
      : null;
  if (!creatorParsed?.success && !brandParsed?.success) return { error: "Please fill in all fields correctly." };
  const account = creatorParsed?.success ? creatorParsed.data : brandParsed?.success ? brandParsed.data : null;
  if (!account) return { error: "Please fill in all fields correctly." };

  if (await isSignupRateLimited()) return { error: SIGNUP_RATE_LIMIT_MESSAGE };
  await logSignupAttempt();

  const locale = parseLocale((await cookies()).get(LOCALE_COOKIE)?.value);
  const { avatarUrl, error: avatarError } = await processAvatarUpload(formData, role === "STARTUP" ? "Logo" : "Photo");
  if (avatarError) return { error: avatarError };

  const existing = await prisma.user.findUnique({ where: { email: account.email }, select: { id: true } });
  if (existing) return { error: "This email is already registered." };

  try {
    const passwordHash = await bcrypt.hash(account.password, 10);
    if (creatorParsed?.success) {
      const data = creatorParsed.data;
      const maxFollowers = data.platforms.reduce((max, p) => Math.max(max, p.followerCount), 0);
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "CREATOR",
          locale,
          creatorProfile: {
            create: {
              displayName: data.displayName,
              ...creatorNicheColumns(data.niches),
              avatarUrl: avatarUrl ?? null,
              platforms: {
                create: data.platforms.map((p) => ({ ...p, url: p.url || null })),
              },
            },
          },
        },
        include: { creatorProfile: true },
      });
      if (user.creatorProfile) {
        await notifyBrandsAboutCreator(user.creatorProfile, maxFollowers).catch(() => undefined);
      }
      after(() => sendWelcome(user.id, user.email, "CREATOR"));
      return await signInWithoutLeaving(data.email, data.password);
    }

    if (brandParsed?.success) {
      const data = brandParsed.data;
      const user = await prisma.user.create({
        data: {
          email: data.email,
          passwordHash,
          role: "STARTUP",
          locale,
          startupProfile: {
            create: {
              companyName: data.companyName,
              niche: data.niche,
              avatarUrl: avatarUrl ?? null,
            },
          },
        },
      });
      after(() => sendWelcome(user.id, user.email, "STARTUP"));
      return await signInWithoutLeaving(data.email, data.password);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "This email is already registered." };
    }
    throw error;
  }

  return { error: "Please fill in all fields correctly." };
}

async function signInWithoutLeaving(email: string, password: string): Promise<OnboardingState> {
  try {
    const signedIn = await signIn("credentials", {
      email,
      password,
      redirect: false,
      redirectTo: "/onboarding",
    });
    if (typeof signedIn === "string" && /[?&]error=/.test(signedIn)) {
      return { error: "Account created, but automatic login failed. Please log in manually." };
    }
  } catch (error) {
    // Auth.js sets the session cookie before it redirects. Staying here is
    // what keeps the optional finish steps on screen.
    if (isNextRedirect(error)) return { success: true };
    if (error instanceof AuthError) {
      return { error: "Account created, but automatic login failed. Please log in manually." };
    }
    throw error;
  }
  return { success: true };
}

async function sendWelcome(userId: string, email: string, welcomeAs: "CREATOR" | "STARTUP") {
  const token = randomBytes(32).toString("hex");
  await prisma.emailVerificationToken.create({
    data: { userId, token, expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  await sendEmail({ to: email, ...welcomeEmail(`${SITE_URL}/verify-email/${token}`, welcomeAs) });
}
