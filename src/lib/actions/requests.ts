"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validation";
import { getCreatorFeed } from "@/lib/visibility";
import { getMutualBlockedUserIds } from "@/lib/moderation";
import { notify } from "@/lib/notifications";

export type ActionState = { error?: string } | undefined;

// Shared by createRequestAction and duplicateRequestAction — a duplicate is
// a genuinely new, open request, so it should reach matching creators too.
async function notifyMatchingCreators(
  request: { niche: string; minFollowers: number; title: string },
  startup: { companyName: string },
  viewerUserId: string,
) {
  const blockedUserIds = await getMutualBlockedUserIds(viewerUserId);
  const matchingCreators = await prisma.creatorProfile.findMany({
    where: {
      niche: request.niche,
      platforms: { some: { followerCount: { gte: request.minFollowers } } },
      userId: { notIn: blockedUserIds },
    },
    select: { userId: true },
  });
  await Promise.all(
    matchingCreators.map((c) =>
      notify(
        c.userId,
        `New ${request.niche} request from ${startup.companyName}: "${request.title}"`,
        "/dashboard/creator",
        "newRequests",
      ),
    ),
  );
}

export async function createRequestAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    return { error: "Not authorized." };
  }

  const parsed = createRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });

  const request = await prisma.request.create({
    data: { ...parsed.data, startupId: startup.id },
  });

  // Let creators whose niche and follower count already qualify know right
  // away, instead of relying on them to check back on their own.
  await notifyMatchingCreators(request, startup, session.user.id);

  revalidatePath("/dashboard/startup");
  redirect("/dashboard/startup");
}

// Pre-fills a new request from an existing one and republishes it — for a
// brand running the same kind of collab again. Redirects straight to Edit
// so the copy (title included) can be tweaked before going live.
export async function duplicateRequestAction(requestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const source = await prisma.request.findUnique({ where: { id: requestId } });
  if (!source || source.startupId !== startup.id) throw new Error("This request could not be found.");

  const duplicate = await prisma.request.create({
    data: {
      startupId: startup.id,
      title: `${source.title} (Copy)`,
      description: source.description,
      niche: source.niche,
      language: source.language,
      minFollowers: source.minFollowers,
      productCategory: source.productCategory,
    },
  });

  await notifyMatchingCreators(duplicate, startup, session.user.id);

  revalidatePath("/dashboard/startup");
  redirect(`/dashboard/startup/requests/${duplicate.id}/edit`);
}

export async function updateRequestAction(
  requestId: string,
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    return { error: "Not authorized." };
  }

  const parsed = createRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "Please fill in all fields correctly." };
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request || request.startupId !== startup.id) {
    return { error: "This request could not be found." };
  }

  await prisma.request.update({ where: { id: requestId }, data: parsed.data });

  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  revalidatePath("/dashboard/startup");
  redirect(`/dashboard/startup/requests/${requestId}`);
}

export async function closeRequestAction(requestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request || request.startupId !== startup.id) throw new Error("This request could not be found.");

  await prisma.request.update({ where: { id: requestId }, data: { status: "CLOSED" } });

  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  revalidatePath("/dashboard/startup");
}

export async function reopenRequestAction(requestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request || request.startupId !== startup.id) throw new Error("This request could not be found.");

  await prisma.request.update({ where: { id: requestId }, data: { status: "OPEN" } });

  revalidatePath(`/dashboard/startup/requests/${requestId}`);
  revalidatePath("/dashboard/startup");
}

// Closes several of the brand's own requests in one go — scoped to
// startupId so a tampered id list can't touch anyone else's, and to
// status: "OPEN" so it's a no-op (not an error) on ones already closed.
export async function bulkCloseRequestsAction(requestIds: string[]) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });

  const { count } = await prisma.request.updateMany({
    where: { id: { in: requestIds }, startupId: startup.id, status: "OPEN" },
    data: { status: "CLOSED" },
  });

  revalidatePath("/dashboard/startup");
  return { count };
}

// Shared by expressInterestAction and startConversationAsCreatorAction —
// both are "creator commits to this request" in substance, they just differ
// in what happens after (stay on the feed vs. jump into the new thread).
async function createInterestAsCreator(
  creator: { id: string; displayName: string; niche: string; platforms: { followerCount: number }[] },
  requestId: string,
  userId: string,
) {
  // Never trust that the UI only offered a matching request — re-verify
  // server-side against the same live feed computation.
  const matches = await getCreatorFeed(creator, userId);
  const match = matches.find((r) => r.id === requestId);
  if (!match) {
    throw new Error("This request is currently unavailable.");
  }

  const interest = await prisma.interest.upsert({
    where: { requestId_creatorId: { requestId, creatorId: creator.id } },
    create: { requestId, creatorId: creator.id },
    update: {},
  });

  await notify(
    match.startup.userId,
    `${creator.displayName} is interested in "${match.title}"`,
    `/dashboard/startup/requests/${requestId}`,
    "newInterest",
  );

  return interest;
}

export async function expressInterestAction(requestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") {
    throw new Error("Not authorized.");
  }

  const creator = await prisma.creatorProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: { platforms: true },
  });

  await createInterestAsCreator(creator, requestId, session.user.id);

  revalidatePath("/dashboard/creator");
}

// Lets a creator start a conversation directly from a brand's Discover
// profile, picking which of the brand's matching requests it's about —
// same underlying "interest" as expressInterestAction, just landing in the
// new thread instead of staying on the feed. Must run via a native <form
// action> (not ActionButton): redirect() only works there.
export async function startConversationAsCreatorAction(formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") {
    throw new Error("Not authorized.");
  }

  const requestId = formData.get("requestId");
  if (typeof requestId !== "string" || !requestId) {
    throw new Error("Please choose which request this is about.");
  }

  const creator = await prisma.creatorProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: { platforms: true },
  });

  const interest = await createInterestAsCreator(creator, requestId, session.user.id);

  revalidatePath("/dashboard/creator");
  redirect(`/dashboard/messages/${interest.id}`);
}

// Brand-side counterpart: lets a brand start a conversation directly from a
// creator's Discover profile, picking which of their own open requests it's
// about. Unlike the creator flow there's no eligibility check — a brand can
// always reach out about their own request regardless of the stated
// follower threshold.
export async function startConversationAsStartupAction(creatorId: string, formData: FormData) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    throw new Error("Not authorized.");
  }

  const requestId = formData.get("requestId");
  if (typeof requestId !== "string" || !requestId) {
    throw new Error("Please choose which request this is about.");
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request || request.startupId !== startup.id) {
    throw new Error("This request could not be found.");
  }

  const interest = await prisma.interest.upsert({
    where: { requestId_creatorId: { requestId, creatorId } },
    create: { requestId, creatorId },
    update: {},
  });

  revalidatePath("/dashboard/startup");
  redirect(`/dashboard/messages/${interest.id}`);
}

export async function withdrawInterestAction(interestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") throw new Error("Not authorized.");

  const creator = await prisma.creatorProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({ where: { id: interestId } });
  if (!interest || interest.creatorId !== creator.id) throw new Error("This interest could not be found.");
  if (interest.paymentStatus !== null) {
    throw new Error("Can't withdraw — a payment is already in progress for this collab.");
  }
  if (interest.depositStatus !== null) {
    throw new Error("Can't withdraw — a deposit is already in progress for this collab.");
  }

  await prisma.interest.delete({ where: { id: interestId } });

  revalidatePath("/dashboard/creator");
}

export async function rejectInterestAction(interestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") throw new Error("Not authorized.");

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const interest = await prisma.interest.findUnique({ where: { id: interestId }, include: { request: true } });
  if (!interest || interest.request.startupId !== startup.id) throw new Error("This interest could not be found.");
  if (interest.depositStatus !== null) {
    throw new Error("Can't remove — a deposit is already in progress for this collab.");
  }
  if (interest.paymentStatus !== null) {
    throw new Error("Can't remove — a payment is already in progress for this collab.");
  }

  await prisma.interest.delete({ where: { id: interestId } });

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
}
