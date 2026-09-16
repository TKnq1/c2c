"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requestDepositSchema } from "@/lib/validation";
import { formatCents } from "@/lib/format";
import { notify } from "@/lib/notifications";

export type DepositActionState = { error?: string; success?: boolean } | undefined;

// Brand sets a refundable deposit the creator must pay before receiving a
// physical product — protects the brand from a creator keeping free product
// without ever posting. Unlike a payment this isn't platform revenue, so no
// fee is taken: the full amount is either returned or kept by the brand.
export async function requestDepositAction(
  interestId: string,
  _prevState: DepositActionState,
  formData: FormData,
): Promise<DepositActionState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    return { error: "Not authorized." };
  }

  const parsed = requestDepositSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please enter a valid amount." };
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: true, creator: true },
  });

  if (!interest || interest.request.startupId !== startup.id) {
    return { error: "This interest could not be found." };
  }
  if (interest.depositStatus !== null) {
    return { error: "A deposit has already been requested for this collab." };
  }

  const depositCents = parsed.data.amount;
  await prisma.interest.update({
    where: { id: interestId },
    data: { depositCents, depositStatus: "REQUESTED", depositRequestedAt: new Date() },
  });

  await notify(
    interest.creator.userId,
    `${startup.companyName} is requesting a ${formatCents(depositCents)} refundable deposit before shipping product for "${interest.request.title}"`,
    "/dashboard/creator/payments",
    "deposits",
  );

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
  return { success: true };
}

// Creator pays the exact requested deposit — a plain confirm, not a form,
// since the brand already fixed the amount.
export async function payDepositAction(interestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") {
    throw new Error("Not authorized.");
  }

  const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: { include: { startup: true } } },
  });

  if (!interest || interest.creatorId !== creator.id) {
    throw new Error("This deposit could not be found.");
  }
  if (interest.depositStatus !== "REQUESTED") {
    throw new Error("This deposit is not currently awaiting payment.");
  }

  await prisma.interest.update({
    where: { id: interestId },
    data: { depositStatus: "HELD", depositPaidAt: new Date() },
  });

  await notify(
    interest.request.startup.userId,
    `${creator.displayName} paid their ${formatCents(interest.depositCents!)} deposit for "${interest.request.title}"`,
    "/dashboard/startup/payments",
    "deposits",
  );

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
}

// Brand confirms the content was posted — returns the held deposit in full.
export async function releaseDepositAction(interestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    throw new Error("Not authorized.");
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: true, creator: true },
  });

  if (!interest || interest.request.startupId !== startup.id) {
    throw new Error("This deposit could not be found.");
  }
  if (interest.depositStatus !== "HELD") {
    throw new Error("This deposit is not currently held.");
  }

  await prisma.interest.update({
    where: { id: interestId },
    data: { depositStatus: "RELEASED", depositReleasedAt: new Date() },
  });

  await notify(
    interest.creator.userId,
    `${startup.companyName} returned your ${formatCents(interest.depositCents!)} deposit for "${interest.request.title}"`,
    "/dashboard/creator/payments",
    "deposits",
  );

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
}

// Brand determines the creator never delivered — keeps the deposit instead
// of returning it. Same honor-system trust level as every other escrow
// decision here: neither side's claim is independently verified.
export async function forfeitDepositAction(interestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    throw new Error("Not authorized.");
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: true, creator: true },
  });

  if (!interest || interest.request.startupId !== startup.id) {
    throw new Error("This deposit could not be found.");
  }
  if (interest.depositStatus !== "HELD") {
    throw new Error("This deposit is not currently held.");
  }

  await prisma.interest.update({
    where: { id: interestId },
    data: { depositStatus: "FORFEITED", depositForfeitedAt: new Date() },
  });

  await notify(
    interest.creator.userId,
    `${startup.companyName} kept your ${formatCents(interest.depositCents!)} deposit for "${interest.request.title}" — they determined the content wasn't delivered`,
    "/dashboard/creator/payments",
    "deposits",
  );

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
}
