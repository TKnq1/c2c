import { Webhook } from "standardwebhooks";
import { describe, expect, it } from "vitest";
import { outreachEventKind, outreachStats, verifyResendWebhook } from "@/lib/outreach-tracking";

const secret = `whsec_${Buffer.from("outreach-webhook-secret-value").toString("base64")}`;

function signed(payload: string) {
  const wh = new Webhook(secret);
  const id = "msg_test";
  const timestamp = new Date();
  return {
    id,
    timestamp: String(Math.floor(timestamp.getTime() / 1000)),
    signature: wh.sign(id, timestamp, payload),
  };
}

describe("outreachStats", () => {
  it("counts sends that were opened or clicked, not raw pixel fires", () => {
    expect(
      outreachStats([
        { openCount: 4, clickCount: 0 },
        { openCount: 0, clickCount: 0 },
        { openCount: 1, clickCount: 2 },
      ]),
    ).toEqual({ sent: 3, opened: 2, clicked: 1 });
  });
});

describe("outreach webhooks", () => {
  it("tells opens from clicks and ignores everything else", () => {
    expect(outreachEventKind("email.opened")).toBe("OPEN");
    expect(outreachEventKind("email.clicked")).toBe("CLICK");
    expect(outreachEventKind("email.delivered")).toBeNull();
  });

  it("accepts a signed open event and rejects a tampered one", () => {
    const payload = JSON.stringify({ type: "email.opened", data: { email_id: "em_123" } });
    const headers = signed(payload);
    expect(verifyResendWebhook(payload, headers, secret)).toEqual({
      type: "email.opened",
      data: { email_id: "em_123" },
    });
    expect(() => verifyResendWebhook(payload, { ...headers, signature: "v1,bm90LXJlYWw=" }, secret)).toThrow();
  });
});
