// The brand-deals switch and the briefing version an offer is bound to, against a real Postgres (see
// lifecycle.integration.test.ts for how to run these).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { seedOffer, type SeedOptions } from "@/lib/deals/test-helpers";

const DB = process.env.DEAL_TEST_DATABASE_URL;

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => "en", getT: async () => (key: string) => key, getMessages: async () => ({}) }));
vi.mock("@/lib/admin-digest", () => ({ notifyUrgent: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => ({ ok: true, id: "mail_test" })) }));
vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { create: vi.fn() } }, webhooks: { constructEvent: vi.fn() } } }));

type Db = typeof import("@/lib/prisma").prisma;
let prisma: Db;
let authMock: ReturnType<typeof vi.fn>;
let payments: typeof import("@/lib/actions/payments");
let briefingActions: typeof import("@/lib/actions/briefing");
let briefingForm: typeof import("@/lib/compliance/briefing-form");
let terms: typeof import("@/lib/deals/terms");

const created: string[] = [];
const seed = (options: SeedOptions = {}) => seedOffer(prisma, created, options);
type Seeded = Awaited<ReturnType<typeof seed>>;
type Actor = { id: string; role: "STARTUP" | "CREATOR" };

function as(actor: Actor) {
  authMock.mockResolvedValue({ user: { id: actor.id, role: actor.role, email: `${actor.id}@test.local`, isAdmin: false }, expires: "2099-01-01" });
}

// The briefing builder's form values for a request, with some of them changed.
async function briefingValues(requestId: string, changes: Record<string, string> = {}) {
  const request = await prisma.request.findUniqueOrThrow({ where: { id: requestId }, include: { briefing: true } });
  const input = request.briefing ? terms.briefingRowToInput(request.briefing as Parameters<typeof terms.briefingRowToInput>[0]) : terms.defaultBriefingFor(request);
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...briefingForm.briefingToValues(input), ...changes })) fd.set(k, v ?? "");
  return fd;
}

async function saveBriefing(s: Seeded, changes: Record<string, string> = {}) {
  as(s.brand);
  return briefingActions.saveBriefingAction(s.request.id, undefined, await briefingValues(s.request.id, changes));
}

// The offer the way the brand sends it, so it is bound to the briefing version of that moment.
async function sendOffer(s: Seeded) {
  await prisma.offerEvent.deleteMany({ where: { interestId: s.interest.id } });
  await prisma.interest.update({
    where: { id: s.interest.id },
    data: { paymentStatus: null, amountCents: null, platformFeeCents: null, payoutCents: null, offerRole: null, offeredAt: null, offerBriefingVersion: null },
  });
  as(s.brand);
  const fd = new FormData();
  fd.set("amount", String(s.amount / 100));
  const result = await payments.sendOfferAction(s.interest.id, undefined, fd);
  expect(result?.success, JSON.stringify(result)).toBe(true);
}

const interestOf = (s: Seeded) => prisma.interest.findUniqueOrThrow({ where: { id: s.interest.id } });

describe.skipIf(!DB)("brand deals switch and offer versions (needs a database)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.REQUIRE_VERIFIED_EMAIL = "0";
    process.env.BRAND_DEALS_ENABLED = "1";
    prisma = (await import("@/lib/prisma")).prisma;
    authMock = (await import("@/lib/auth")).auth as unknown as ReturnType<typeof vi.fn>;
    payments = await import("@/lib/actions/payments");
    briefingActions = await import("@/lib/actions/briefing");
    briefingForm = await import("@/lib/compliance/briefing-form");
    terms = await import("@/lib/deals/terms");
  });

  beforeEach(() => {
    process.env.BRAND_DEALS_ENABLED = "1";
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  describe("the switch", () => {
    it("makes no deal and moves nothing else when it is off", async () => {
      process.env.BRAND_DEALS_ENABLED = "";
      const s = await seed();
      as(s.creator);
      await payments.acceptOfferAction(s.interest.id, s.amount);
      expect((await interestOf(s)).paymentStatus).toBe("ACCEPTED");
      expect(await prisma.deal.findUnique({ where: { interestId: s.interest.id } })).toBeNull();
      // The brand is told to pay, as before deals existed.
      const note = await prisma.notification.findFirst({ where: { userId: s.brand.id }, orderBy: { createdAt: "desc" } });
      expect(note?.message).toContain("pay");
    });

    it("does not record a briefing version while it is off, and does not look at the briefing", async () => {
      process.env.BRAND_DEALS_ENABLED = "";
      const s = await seed();
      // A briefing that would block an offer when deals are on: no advertising label.
      await prisma.campaignBriefing.update({ where: { requestId: s.request.id }, data: { disclosureLabels: [] } });
      await sendOffer(s);
      expect((await interestOf(s)).offerBriefingVersion).toBeNull();
    });

    it("refuses to save a briefing while it is off", async () => {
      process.env.BRAND_DEALS_ENABLED = "";
      const s = await seed();
      const result = await saveBriefing(s);
      expect(result?.error).toBeTruthy();
      expect(result?.success).toBeUndefined();
    });

    it("makes the deal when it is on", async () => {
      const s = await seed();
      as(s.creator);
      await payments.acceptOfferAction(s.interest.id, s.amount);
      expect((await prisma.deal.findUnique({ where: { interestId: s.interest.id } }))?.status).toBe("CONTRACT_PENDING");
    });
  });

  describe("offers and the briefing version", () => {
    it("binds a sent offer to the version of the briefing and lets it be accepted while that stays", async () => {
      const s = await seed();
      await sendOffer(s);
      const briefing = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } });
      expect((await interestOf(s)).offerBriefingVersion).toBe(briefing.version);
      as(s.creator);
      await payments.acceptOfferAction(s.interest.id, s.amount);
      expect(await prisma.deal.findUnique({ where: { interestId: s.interest.id } })).not.toBeNull();
    });

    it("holds the offer back when the briefing changed, tells the proposer, and accepts after it was confirmed again", async () => {
      const s = await seed();
      await sendOffer(s);

      const saved = await saveBriefing(s, { minLiveHours: "168" });
      expect(saved?.success, JSON.stringify(saved)).toBe(true);
      expect(saved?.staleOffers).toBe(1);

      as(s.creator);
      await expect(payments.acceptOfferAction(s.interest.id, s.amount)).rejects.toThrow(/briefing changed/i);
      // Nothing was accepted, no deal exists, and the brand knows.
      expect((await interestOf(s)).paymentStatus).toBe("OFFERED");
      expect(await prisma.deal.findUnique({ where: { interestId: s.interest.id } })).toBeNull();
      const notes = await prisma.notification.findMany({ where: { userId: s.brand.id } });
      expect(notes.some((n) => n.message.includes("briefing changed"))).toBe(true);

      // Only the proposer can confirm it again.
      as(s.creator);
      expect((await payments.refreshOfferAction(s.interest.id))?.error).toBeTruthy();
      as(s.brand);
      expect((await payments.refreshOfferAction(s.interest.id))?.success).toBe(true);
      const briefing = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } });
      expect((await interestOf(s)).offerBriefingVersion).toBe(briefing.version);

      as(s.creator);
      await payments.acceptOfferAction(s.interest.id, s.amount);
      const deal = await prisma.deal.findUniqueOrThrow({ where: { interestId: s.interest.id } });
      // The contract is a copy of the briefing as it is now.
      expect((deal.terms as { workflow: { minLiveHours: number } }).workflow.minLiveHours).toBe(168);
    });

    it("leaves the version alone when a save changes nothing", async () => {
      const s = await seed();
      await sendOffer(s);
      const before = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } });
      const saved = await saveBriefing(s);
      expect(saved?.success, JSON.stringify(saved)).toBe(true);
      expect(saved?.staleOffers).toBeUndefined();
      const after = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } });
      expect(after.version).toBe(before.version);
    });

    it("holds back an offer that was made on the defaults when the brand writes a briefing", async () => {
      const s = await seed({ noBriefing: true });
      await sendOffer(s);
      expect((await interestOf(s)).offerBriefingVersion).toBe(0);
      const saved = await saveBriefing(s, { contentFormats: "TIKTOK_VIDEO,INSTAGRAM_REEL" });
      expect(saved?.success, JSON.stringify(saved)).toBe(true);
      expect(saved?.staleOffers).toBe(1);
      as(s.creator);
      await expect(payments.acceptOfferAction(s.interest.id, s.amount)).rejects.toThrow(/briefing changed/i);
    });

    it("lets an offer from before versions through", async () => {
      const s = await seed();
      // The seeded offer has no version, like one made before this existed.
      expect((await interestOf(s)).offerBriefingVersion).toBeNull();
      await saveBriefing(s, { minLiveHours: "168" });
      as(s.creator);
      await payments.acceptOfferAction(s.interest.id, s.amount);
      expect(await prisma.deal.findUnique({ where: { interestId: s.interest.id } })).not.toBeNull();
    });

    it("confirms all of the brand's open offers on a request at once", async () => {
      const s = await seed();
      await sendOffer(s);
      await saveBriefing(s, { minLiveHours: "168" });
      as(s.brand);
      expect(await payments.refreshOpenOffersAction(s.request.id)).toEqual({ count: 1 });
      expect(await payments.refreshOpenOffersAction(s.request.id)).toEqual({ count: 0 });
      as(s.creator);
      await payments.acceptOfferAction(s.interest.id, s.amount);
      expect(await prisma.deal.findUnique({ where: { interestId: s.interest.id } })).not.toBeNull();
    });

    it("binds a counter offer to the version too, so the brand cannot accept it blindly after a change", async () => {
      const s = await seed();
      await sendOffer(s);
      // The creator counters under the current briefing.
      as(s.creator);
      const fd = new FormData();
      fd.set("amount", String((s.amount - 10_000) / 100));
      expect((await payments.counterOfferAction(s.interest.id, s.amount, undefined, fd))?.success).toBe(true);
      const briefing = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } });
      const countered = await interestOf(s);
      expect(countered.offerBriefingVersion).toBe(briefing.version);

      await saveBriefing(s, { minLiveHours: "168" });
      as(s.brand);
      await expect(payments.acceptOfferAction(s.interest.id, countered.amountCents!)).rejects.toThrow(/briefing changed/i);
    });

    it("clears the version when an offer is withdrawn", async () => {
      const s = await seed();
      await sendOffer(s);
      as(s.brand);
      await payments.withdrawOfferAction(s.interest.id);
      const row = await interestOf(s);
      expect(row.paymentStatus).toBeNull();
      expect(row.offerBriefingVersion).toBeNull();
    });
  });
});
