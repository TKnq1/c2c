"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRequestSchema } from "@/lib/validation";
import { getCreatorFeed } from "@/lib/visibility";
import { getMutualBlockedUserIds, isBlocked } from "@/lib/moderation";
import { notify } from "@/lib/notifications";
import { MAX_REQUEST_PHOTOS } from "@/lib/request-photo-types";
import { sniffImage, type ImageType } from "@/lib/image-sniff";
import { DAY, takeToken } from "@/lib/rate-limit";
import { VERIFY_EMAIL_MESSAGE, emailIsVerified } from "@/lib/verified";
import { REQUEST_PHOTO_TYPES } from "@/lib/request-photo-types";
import { dealsEnabled } from "@/lib/deals/flag";
import { applyDefaultTemplateToNewRequest, copyBriefingToNewRequest } from "@/lib/deals/briefing-templates";

export type ActionState = { error?: string } | undefined;

// The client resizes and re-encodes every photo before submitting (see
// RequestPhotosInput), so a real upload lands far under this — it's a
// ceiling, not a target. Five of them still fit Vercel's 4.5 MB body limit.
const MAX_PHOTO_BYTES = 900 * 1024;

type PhotoToken = { kind: "new"; index: number } | { kind: "existing"; id: string } | { kind: "legacy" };

// The form posts its photos as `photoOrder` — a JSON list, in display
// order (cover first), of "new:<n>" (the n-th file in `photos`),
// "existing:<id>" (a RequestImage this request already has) or "legacy"
// (the one image an older request keeps in imageUrl).
async function readPhotos(
  formData: FormData,
): Promise<{ tokens: PhotoToken[]; files: { type: ImageType; data: Uint8Array<ArrayBuffer> }[] } | { error: string }> {
  const uploads = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  // What a file is comes from its first bytes, not from the type the sender names.
  const files: { type: ImageType; data: Uint8Array<ArrayBuffer> }[] = [];
  for (const file of uploads) {
    if (file.size > MAX_PHOTO_BYTES) return { error: "One of the photos is too large. Try a smaller one." };
    const data = new Uint8Array(await file.arrayBuffer());
    const type = sniffImage(data);
    if (!type) return { error: "Photos have to be JPEG, PNG or WebP images." };
    files.push({ type, data });
  }
  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("photoOrder") ?? "[]"));
  } catch {
    return { error: "Something went wrong with the photos. Try adding them again." };
  }
  if (!Array.isArray(raw) || raw.length > MAX_REQUEST_PHOTOS) {
    return { error: `Add at most ${MAX_REQUEST_PHOTOS} photos.` };
  }
  const tokens: PhotoToken[] = [];
  const usedFiles = new Set<number>();
  for (const t of raw) {
    if (t === "legacy") tokens.push({ kind: "legacy" });
    else if (typeof t === "string" && t.startsWith("existing:")) tokens.push({ kind: "existing", id: t.slice(9) });
    else if (typeof t === "string" && /^new:\d+$/.test(t)) {
      const index = Number(t.slice(4));
      if (index >= files.length || usedFiles.has(index)) return { error: "Something went wrong with the photos. Try adding them again." };
      usedFiles.add(index);
      tokens.push({ kind: "new", index });
    } else return { error: "Something went wrong with the photos. Try adding them again." };
  }
  return { tokens, files };
}

// The legacy imageUrl's bytes, for turning it into a proper photo.
function legacyPhoto(imageUrl: string | null) {
  const match = imageUrl?.match(/^data:([^;,]+);base64,([\s\S]*)$/);
  if (!match || !REQUEST_PHOTO_TYPES.includes(match[1])) return null;
  return { contentType: match[1], data: new Uint8Array(Buffer.from(match[2], "base64")) };
}

// The validated form fields, as the Request columns they're stored in.
function requestFields(data: ReturnType<typeof createRequestSchema.parse>) {
  const { budgetMin, budgetMax, ...rest } = data;
  return { ...rest, budgetMinCents: budgetMin, budgetMaxCents: budgetMax ?? budgetMin };
}

// Shared by createRequestAction and duplicateRequestAction — a duplicate is
// a genuinely new, open request, so it should reach matching creators too.
// By now the request exists, so nothing in here may fail the action: an error
// would send the brand back to post it again, and it would be there twice.
async function notifyMatchingCreators(
  request: { niche: string; languages: string[]; minFollowers: number; title: string },
  startup: { companyName: string },
  viewerUserId: string,
) {
  try {
    const blockedUserIds = await getMutualBlockedUserIds(viewerUserId);
    const matchingCreators = await prisma.creatorProfile.findMany({
      where: {
        niches: { has: request.niche },
        // Same rule as the Feed: the creator's content language has to be one
        // of the request's, if they've set one.
        OR: [{ contentLanguage: null }, { contentLanguage: { in: request.languages } }],
        platforms: { some: { followerCount: { gte: request.minFollowers } } },
        userId: { notIn: blockedUserIds },
        user: { suspendedAt: null },
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
  } catch (err) {
    console.error(`Notifying creators about the new request "${request.title}" failed:`, err);
  }
}

export async function createRequestAction(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const session = await auth();
  if (!session || session.user.role !== "STARTUP") {
    return { error: "Not authorized." };
  }

  if (!(await emailIsVerified(session.user.id))) return { error: VERIFY_EMAIL_MESSAGE };

  const parsed = createRequestSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please fill in all fields correctly." };
  }

  // A request notifies every matching creator and stores up to five photos in the database.
  if (!(await takeToken("create-request", session.user.id, 10, DAY))) {
    return { error: "You've reached today's limit for new requests. Try again tomorrow." };
  }
  const openRequests = await prisma.request.count({ where: { startup: { userId: session.user.id }, status: "OPEN" } });
  if (openRequests >= 50) return { error: "You have 50 open requests. Close some before posting new ones." };

  const photos = await readPhotos(formData);
  if ("error" in photos) return { error: photos.error };
  if (photos.tokens.some((t) => t.kind !== "new")) return { error: "Something went wrong with the photos. Try adding them again." };
  const images = photos.tokens.map((t, position) => {
    const file = photos.files[(t as { index: number }).index];
    return { position, contentType: file.type, data: file.data };
  });

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });

  const request = await prisma.request.create({
    data: { ...requestFields(parsed.data), startupId: startup.id, images: { create: images } },
    select: { id: true, niche: true, languages: true, minFollowers: true, title: true },
  });

  // The brand's default briefing template (if it has one) is the new request's briefing from the start, so creators see the
  // campaign rules the brand actually wants. Never fails the request.
  if (dealsEnabled()) await applyDefaultTemplateToNewRequest(request.id, session.user.id);

  // Let creators whose niche, language and follower count already qualify know right
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
  if (!(await emailIsVerified(session.user.id))) redirect("/dashboard/verify-email");
  // A copy goes live and notifies creators like a new request, so it counts against the same limits.
  if (!(await takeToken("create-request", session.user.id, 10, DAY))) {
    throw new Error("You've reached today's limit for new requests.");
  }
  if ((await prisma.request.count({ where: { startup: { userId: session.user.id }, status: "OPEN" } })) >= 50) {
    throw new Error("You have 50 open requests. Close some before posting new ones.");
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const source = await prisma.request.findUnique({
    where: { id: requestId },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!source || source.startupId !== startup.id) throw new Error("This request could not be found.");

  // A post-by date that's already gone would go live on the copy as-is —
  // leave it flexible instead; Edit is right after anyway.
  const now = new Date();
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const postBy = source.postBy && source.postBy.getTime() >= today ? source.postBy : null;

  const duplicate = await prisma.request.create({
    data: {
      startupId: startup.id,
      title: `${source.title} (Copy)`,
      description: source.description,
      niche: source.niche,
      languages: source.languages,
      minFollowers: source.minFollowers,
      productCategory: source.productCategory,
      budgetMinCents: source.budgetMinCents,
      budgetMaxCents: source.budgetMaxCents,
      platform: source.platform,
      deliverables: source.deliverables,
      postBy,
      productIncluded: source.productIncluded,
      imageUrl: source.images.length === 0 ? source.imageUrl : null,
      images: {
        create: source.images.map((i) => ({ position: i.position, contentType: i.contentType, data: i.data })),
      },
    },
  });

  // The copy starts with the original's briefing, or with the default template when the original has none.
  if (dealsEnabled() && !(await copyBriefingToNewRequest(session.user.id, source.id, duplicate.id))) {
    await applyDefaultTemplateToNewRequest(duplicate.id, session.user.id);
  }

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
    return { error: parsed.error.issues[0]?.message ?? "Please fill in all fields correctly." };
  }

  const photos = await readPhotos(formData);
  if ("error" in photos) return { error: photos.error };

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const request = await prisma.request.findUnique({
    where: { id: requestId },
    select: { startupId: true, imageUrl: true, images: { select: { id: true } } },
  });
  if (!request || request.startupId !== startup.id) {
    return { error: "This request could not be found." };
  }

  // Everything the new photo order needs, read before the transaction so
  // it stays short: new files' bytes, and which existing ids are really
  // this request's.
  const ownIds = new Set(request.images.map((i) => i.id));
  const legacy = legacyPhoto(request.imageUrl);
  const plan: ({ position: number } & ({ id: string } | { contentType: string; data: Uint8Array<ArrayBuffer> }))[] = [];
  for (const [position, t] of photos.tokens.entries()) {
    if (t.kind === "existing") {
      if (!ownIds.has(t.id)) return { error: "Something went wrong with the photos. Reload the page and try again." };
      plan.push({ position, id: t.id });
    } else if (t.kind === "legacy") {
      if (legacy) plan.push({ position, ...legacy });
    } else {
      const file = photos.files[t.index];
      plan.push({ position, contentType: file.type, data: file.data });
    }
  }
  const keptIds = plan.flatMap((p) => ("id" in p ? [p.id] : []));

  await prisma.$transaction(async (tx) => {
    // Whatever the legacy image was, it's either a proper photo now or gone.
    await tx.request.update({ where: { id: requestId }, data: { ...requestFields(parsed.data), imageUrl: null } });
    await tx.requestImage.deleteMany({ where: { requestId, id: { notIn: keptIds } } });
    for (const p of plan) {
      if ("id" in p) await tx.requestImage.update({ where: { id: p.id }, data: { position: p.position } });
      else await tx.requestImage.create({ data: { requestId, position: p.position, contentType: p.contentType, data: p.data } });
    }
  });

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
  // Closed by moderation: only an admin can open it again.
  if (request.closedByAdmin) throw new Error("This request was closed by moderation and can't be reopened.");

  await prisma.request.update({ where: { id: requestId }, data: { status: "OPEN", closedByAdmin: false } });

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

const UNAVAILABLE = "This request is currently unavailable.";

// Shared by expressInterestAction and startConversationAsCreatorAction —
// both are "creator commits to this request" in substance, they just differ
// in what happens after (stay on the feed vs. jump into the new thread).
// Null when the request isn't open to this creator (closed, blocked, or out
// of their reach).
async function createInterestAsCreator(
  creator: {
    id: string;
    displayName: string;
    niches: string[];
    contentLanguage: string | null;
    platforms: { followerCount: number }[];
  },
  requestId: string,
  userId: string,
) {
  // Never trust that the UI only offered a matching request — re-verify
  // server-side against the same live feed computation. "all", not
  // "forYou": the Feed's All tab offers requests outside the creator's niches.
  const blockedUserIds = await getMutualBlockedUserIds(userId);
  const matches = await getCreatorFeed(creator, blockedUserIds, "all", { requestId });
  const match = matches.find((r) => r.id === requestId);
  if (!match) return null;

  const interest = await prisma.interest.upsert({
    where: { requestId_creatorId: { requestId, creatorId: creator.id } },
    create: { requestId, creatorId: creator.id, initiatedBy: "CREATOR" },
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

// True if the interest went out, false if the request isn't open to this
// creator.
async function sendInterest(requestId: string) {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") {
    throw new Error("Not authorized.");
  }

  const creator = await prisma.creatorProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
    include: { platforms: true },
  });

  if (!(await createInterestAsCreator(creator, requestId, session.user.id))) return false;

  revalidatePath("/dashboard/creator");
  return true;
}

export async function expressInterestAction(requestId: string) {
  if (!(await sendInterest(requestId))) throw new Error(UNAVAILABLE);
}

// The Feed's "Interested" swipe. The same as expressInterestAction, except a
// request that's gone comes back as `unavailable` instead of an error: in
// production a thrown message is redacted, so the stack couldn't tell it
// from a dropped connection, and would keep putting the card back.
export async function swipeInterestedAction(requestId: string): Promise<{ unavailable: true } | undefined> {
  if (!(await sendInterest(requestId))) return { unavailable: true };
}

async function requireCreatorProfileId() {
  const session = await auth();
  if (!session || session.user.role !== "CREATOR") throw new Error("Not authorized.");
  const creator = await prisma.creatorProfile.findUniqueOrThrow({
    where: { userId: session.user.id },
    select: { id: true },
  });
  return creator.id;
}

// Remembers a left swipe so the request stays out of the Feed on later
// visits. Deliberately no revalidatePath (unlike expressInterestAction):
// re-rendering the Feed would remount the swipe stack and drop its undo
// state — the card is already gone locally anyway.
export async function passRequestAction(requestId: string) {
  const creatorId = await requireCreatorProfileId();
  await prisma.requestPass.upsert({
    where: { creatorId_requestId: { creatorId, requestId } },
    create: { creatorId, requestId },
    update: {},
  });
}

export async function undoPassAction(requestId: string) {
  const creatorId = await requireCreatorProfileId();
  await prisma.requestPass.deleteMany({ where: { creatorId, requestId } });
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
  if (!interest) throw new Error(UNAVAILABLE);

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
  // Reaching out is what throwaway accounts are made for: it needs a verified address.
  if (!(await emailIsVerified(session.user.id))) redirect("/dashboard/verify-email");

  const requestId = formData.get("requestId");
  if (typeof requestId !== "string" || !requestId) {
    throw new Error("Please choose which request this is about.");
  }

  const startup = await prisma.startupProfile.findUniqueOrThrow({ where: { userId: session.user.id } });
  const request = await prisma.request.findUnique({ where: { id: requestId } });
  if (!request || request.startupId !== startup.id) {
    throw new Error("This request could not be found.");
  }
  if (request.status !== "OPEN") throw new Error("This request is closed.");

  // The creator has to exist, be active, and not have blocked this brand (or the other way round).
  // Without this a block did nothing against a brand that called the action directly.
  const creator = await prisma.creatorProfile.findFirst({
    where: { id: creatorId, user: { suspendedAt: null } },
    select: { id: true, userId: true },
  });
  if (!creator || (await isBlocked(session.user.id, creator.userId))) {
    throw new Error("This creator could not be found.");
  }
  if (!(await takeToken("start-conversation", session.user.id, 30, DAY))) {
    throw new Error("You've reached today's limit for new conversations.");
  }

  const interest = await prisma.interest.upsert({
    where: { requestId_creatorId: { requestId, creatorId: creator.id } },
    create: { requestId, creatorId: creator.id, initiatedBy: "STARTUP" },
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
    throw new Error("Can't withdraw: a payment is already in progress for this collab.");
  }
  if (interest.depositStatus !== null) {
    throw new Error("Can't withdraw: a deposit is already in progress for this collab.");
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
    throw new Error("Can't remove: a deposit is already in progress for this collab.");
  }
  if (interest.paymentStatus !== null) {
    throw new Error("Can't remove: a payment is already in progress for this collab.");
  }

  await prisma.interest.delete({ where: { id: interestId } });

  revalidatePath(`/dashboard/startup/requests/${interest.requestId}`);
  revalidatePath("/dashboard/startup/payments");
}
