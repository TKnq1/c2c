"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notifications";
import { isBlocked, detectSuspiciousText, flagForReview, flagIfMessageBurst } from "@/lib/moderation";

export type MessageActionState = { error?: string } | undefined;

export async function sendMessageAction(
  interestId: string,
  _prevState: MessageActionState,
  formData: FormData,
): Promise<MessageActionState> {
  const session = await auth();
  if (!session) return { error: "Not authorized." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Message can't be empty." };
  if (body.length > 2000) return { error: "Message is too long." };

  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: { include: { startup: true } }, creator: true },
  });
  if (!interest) return { error: "This conversation could not be found." };

  let recipientUserId: string;
  let senderName: string;
  if (session.user.role === "STARTUP") {
    if (interest.request.startup.userId !== session.user.id) {
      return { error: "This conversation could not be found." };
    }
    recipientUserId = interest.creator.userId;
    senderName = interest.request.startup.companyName;
  } else {
    if (interest.creator.userId !== session.user.id) {
      return { error: "This conversation could not be found." };
    }
    recipientUserId = interest.request.startup.userId;
    senderName = interest.creator.displayName;
  }

  if (await isBlocked(session.user.id, recipientUserId)) {
    return { error: "You can't message this person." };
  }

  await prisma.message.create({
    data: { interestId, senderRole: session.user.role, body },
  });

  // Best-effort automated moderation — flags land in the same admin review
  // queue as user reports, doesn't block or alter the send itself.
  const suspiciousReason = detectSuspiciousText(body);
  if (suspiciousReason) {
    await flagForReview(session.user.id, suspiciousReason, `Message: "${body}"`);
  }
  await flagIfMessageBurst(interestId, session.user.role, session.user.id);

  await notify(recipientUserId, `New message from ${senderName}`, `/dashboard/messages/${interestId}`, "messages");

  revalidatePath(`/dashboard/messages/${interestId}`);
  revalidatePath("/dashboard/messages");
  return undefined;
}

export async function markThreadReadAction(interestId: string) {
  const session = await auth();
  if (!session) return;

  const interest = await prisma.interest.findUnique({
    where: { id: interestId },
    include: { request: { include: { startup: true } }, creator: true },
  });
  if (!interest) return;

  // Mark as read whichever side's messages the current viewer did NOT send.
  const otherRole = session.user.role === "STARTUP" ? "CREATOR" : "STARTUP";
  const isParticipant =
    session.user.role === "STARTUP"
      ? interest.request.startup.userId === session.user.id
      : interest.creator.userId === session.user.id;
  if (!isParticipant) return;

  await prisma.message.updateMany({
    where: { interestId, senderRole: otherRole, read: false },
    data: { read: true },
  });

  revalidatePath("/dashboard/messages");
}
