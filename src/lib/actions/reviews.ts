"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validation";

export type ReviewActionState = { error?: string; success?: boolean } | undefined;

// Either side of a completed collab can leave one review of the other,
// editable afterward (upsert). Gated on RELEASED — only a fully paid-out
// collab counts as "completed" here.
export async function submitReviewAction(
  interestId: string,
  _prevState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please choose a rating." };
  }

  const interest = await prisma.interest.findUnique({ where: { id: interestId }, include: { request: true } });
  if (!interest) return { error: "This collab could not be found." };
  if (interest.paymentStatus !== "RELEASED") {
    return { error: "You can only review a completed collab." };
  }

  if (session.user.role === "STARTUP") {
    const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
    if (interest.request.startupId !== startup.id) return { error: "This collab could not be found." };
  } else {
    const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
    if (interest.creatorId !== creator.id) return { error: "This collab could not be found." };
  }

  await prisma.review.upsert({
    where: { interestId_authorRole: { interestId, authorRole: session.user.role } },
    create: {
      interestId,
      creatorId: interest.creatorId,
      startupId: interest.request.startupId,
      authorRole: session.user.role,
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
    },
    update: { rating: parsed.data.rating, comment: parsed.data.comment || null },
  });

  revalidatePath("/dashboard/startup/payments");
  revalidatePath("/dashboard/creator/payments");
  return { success: true };
}
