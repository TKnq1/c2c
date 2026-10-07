import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { buildTimeline, type TimelineInput } from "@/lib/admin-timeline";

const at = (iso: string) => new Date(iso);
const base: TimelineInput = {
  side: "brand",
  signedUp: at("2026-10-01T10:00:00Z"),
  source: null,
  heardFrom: null,
  termsAcceptedAt: null,
  marketingConsentAt: null,
  suspendedAt: null,
  suspendedReason: null,
  onboarding: [],
  requests: [],
  collabs: [],
  firstMessages: [],
  reportsMade: [],
  reportsReceived: [],
  logins: [],
};

describe("buildTimeline", () => {
  it("starts with the sign-up and names the campaign it came from", () => {
    const events = buildTimeline({ ...base, source: "instagram", heardFrom: "social" });
    expect(events).toEqual([{ at: base.signedUp, kind: "account", text: "Konto angelegt (Quelle instagram), gehört über: social" }]);
  });

  it("puts everything in order, newest first, and words each step of a collab", () => {
    const events = buildTimeline({
      ...base,
      requests: [{ title: "Fashion Drop", at: at("2026-10-02T09:00:00Z") }],
      collabs: [
        {
          title: "Fashion Drop",
          counterpart: "Sara",
          startedByThem: true,
          at: at("2026-10-03T09:00:00Z"),
          acceptedAt: at("2026-10-04T09:00:00Z"),
          paidAt: at("2026-10-05T09:00:00Z"),
          amountCents: 30000,
          proofSubmittedAt: null,
          disputedAt: null,
          releasedAt: at("2026-10-07T09:00:00Z"),
          refundedAt: null,
        },
      ],
      firstMessages: [{ title: "Fashion Drop", at: at("2026-10-03T09:30:00Z"), count: 12 }],
    });
    expect(events.map((e) => e.text)).toEqual([
      "Zahlung für „Fashion Drop“ ausgezahlt",
      expect.stringContaining("Zahlung für „Fashion Drop“ eingegangen (300,00"),
      expect.stringContaining("Angebot für „Fashion Drop“ angenommen"),
      "Erste Nachricht zu „Fashion Drop“ (12 insgesamt)",
      "Gespräch mit Sara zu „Fashion Drop“ gestartet (von Sara)",
      "Anfrage „Fashion Drop“ gepostet",
      "Konto angelegt",
    ]);
  });

  it("shows reports, a suspension and failed sign-ins, but not onboarding steps that were only viewed", () => {
    const events = buildTimeline({
      ...base,
      onboarding: [
        { step: "profile", kind: "viewed", at: at("2026-10-01T10:05:00Z") },
        { step: "profile", kind: "completed", at: at("2026-10-01T10:10:00Z") },
      ],
      reportsReceived: [{ reason: "Spam", at: at("2026-10-06T10:00:00Z"), automatic: true }],
      suspendedAt: at("2026-10-07T10:00:00Z"),
      suspendedReason: "Betrug",
      logins: [{ at: at("2026-10-06T08:00:00Z"), succeeded: false, userAgent: null }],
    });
    const texts = events.map((e) => e.text);
    expect(texts).toContain("Onboarding-Schritt „profile“ abgeschlossen");
    expect(texts.some((t) => t.includes("angesehen"))).toBe(false);
    expect(texts).toContain("Automatisch gemeldet: Spam");
    expect(texts[0]).toBe("Gesperrt: Betrug");
    expect(texts.some((t) => t.startsWith("Fehlgeschlagene Anmeldung"))).toBe(true);
  });
});
