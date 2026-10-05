import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

export type OutreachStats = { sent: number; opened: number; clicked: number };

// Opened counts a send whose images loaded at least once. Clicked counts a
// send whose button was followed. Raw pixel fires stay on the row; the list
// shows how many sends were opened or clicked, not how often the pixel fired.
export function outreachStats(deliveries: { openCount: number; clickCount: number }[]): OutreachStats {
  return {
    sent: deliveries.length,
    opened: deliveries.filter((delivery) => delivery.openCount > 0).length,
    clicked: deliveries.filter((delivery) => delivery.clickCount > 0).length,
  };
}

export type ResendEmailEvent = {
  type?: string;
  data?: { email_id?: string };
};

export function verifyResendWebhook(
  payload: string,
  headers: { id: string; timestamp: string; signature: string },
  secret: string,
): ResendEmailEvent {
  // verify() only checks the signature. The key is unused, and the
  // constructor still insists on one.
  const event = new Resend(process.env.RESEND_API_KEY?.trim() || "re_webhook").webhooks.verify({
    payload,
    headers: { id: headers.id, timestamp: headers.timestamp, signature: headers.signature },
    webhookSecret: secret,
  });
  if (!event || typeof event !== "object") throw new Error("Empty webhook payload");
  return event as ResendEmailEvent;
}

export function outreachEventKind(type: string | undefined): "OPEN" | "CLICK" | null {
  if (type === "email.opened") return "OPEN";
  if (type === "email.clicked") return "CLICK";
  return null;
}

// Matches the Resend email id stored at send time. A repeated webhook id is
// ignored. An email we did not send (a verify mail, a test) is ignored too.
export async function recordOutreachEvent(eventId: string, resendId: string, kind: "OPEN" | "CLICK") {
  const delivery = await prisma.outreachDelivery.findUnique({ where: { resendId } });
  if (!delivery) return;

  try {
    await prisma.outreachDeliveryEvent.create({ data: { id: eventId, deliveryId: delivery.id, kind } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return;
    throw err;
  }

  const now = new Date();
  await prisma.outreachDelivery.update({
    where: { id: delivery.id },
    data:
      kind === "OPEN"
        ? { openCount: { increment: 1 }, openedAt: delivery.openedAt ?? now }
        : { clickCount: { increment: 1 }, clickedAt: delivery.clickedAt ?? now },
  });
}
