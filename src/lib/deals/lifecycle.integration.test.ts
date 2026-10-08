// The whole brand-deal lifecycle against a real Postgres, with Stripe, the session and the platforms' answers faked.
// It needs a database the migrations have been applied to, so it only runs when DEAL_TEST_DATABASE_URL is set:
//   DEAL_TEST_DATABASE_URL=postgresql://user:pw@localhost:5432/c2c_test npx vitest run src/lib/deals/lifecycle.integration.test.ts
// The data it creates is removed again; point it at a scratch database all the same.
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { seedOffer, type SeedOptions } from "@/lib/deals/test-helpers";

const DB = process.env.DEAL_TEST_DATABASE_URL;

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => "en", getT: async () => (key: string) => key, getMessages: async () => ({}) }));
vi.mock("@/lib/admin-digest", () => ({ notifyUrgent: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => ({ ok: true, id: "mail_test" })) }));
vi.mock("@/lib/stripe", () => ({
  stripe: {
    checkout: { sessions: { create: vi.fn(), retrieve: vi.fn(), expire: vi.fn() } },
    paymentIntents: { retrieve: vi.fn() },
    transfers: { create: vi.fn() },
    refunds: { create: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  },
}));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type Db = typeof import("@/lib/prisma").prisma;
let prisma: Db;
let stripe: {
  checkout: { sessions: { create: ReturnType<typeof vi.fn> } };
  paymentIntents: { retrieve: ReturnType<typeof vi.fn> };
  transfers: { create: ReturnType<typeof vi.fn> };
  refunds: { create: ReturnType<typeof vi.fn> };
  webhooks: { constructEvent: ReturnType<typeof vi.fn> };
};
let authMock: ReturnType<typeof vi.fn>;
let payments: typeof import("@/lib/actions/payments");
let deals: typeof import("@/lib/actions/deals");
let handlers: typeof import("@/lib/deals/handlers");
let verification: typeof import("@/lib/deals/verification");
let payout: typeof import("@/lib/deals/payout");
let webhook: typeof import("@/app/api/webhooks/stripe/route");
let escrow: typeof import("@/lib/deals/escrow");

const created: string[] = [];
let counter = 0;

type Actor = { id: string; role: "STARTUP" | "CREATOR" };
function as(actor: Actor) {
  authMock.mockResolvedValue({ user: { id: actor.id, role: actor.role, email: `${actor.id}@test.local`, isAdmin: false }, expires: "2099-01-01" });
}

function form(values: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(values)) fd.set(k, v);
  return fd;
}

const CAPTION = "Werbung | Meine liebste Creme für den Herbst #glow";
const TIKTOK_URL = "https://www.tiktok.com/@mia/video/7412345678901234567";

function stubPlatform(status: number, body: unknown = { title: CAPTION }) {
  vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })));
}

const seed = (options: SeedOptions = {}) => seedOffer(prisma, created, options);

type Seeded = Awaited<ReturnType<typeof seed>>;

async function dealOf(interestId: string) {
  return prisma.deal.findUniqueOrThrow({ where: { interestId } });
}

async function acceptAndSign(s: Seeded) {
  const existing = await prisma.deal.findUnique({ where: { interestId: s.interest.id } });
  if (!existing) {
    as(s.creator);
    await payments.acceptOfferAction(s.interest.id, s.amount);
  }
  const deal = await dealOf(s.interest.id);
  as(s.creator);
  expect((await deals.signContractAction(deal.id, deal.termsHash))?.success).toBe(true);
  as(s.brand);
  expect((await deals.signContractAction(deal.id, deal.termsHash))?.success).toBe(true);
  return dealOf(s.interest.id);
}

// The escrow, the way Stripe's webhook funds it.
async function fundViaWebhook(s: Seeded, sessionId = `cs_${Date.now()}${++counter}`) {
  const deal = await dealOf(s.interest.id);
  stripe.checkout.sessions.create.mockResolvedValue({ id: sessionId, url: "https://stripe.test/pay", status: "open" });
  as(s.brand);
  const checkout = await payments.createCheckoutSessionAction(s.interest.id);
  expect(checkout).toEqual({ url: "https://stripe.test/pay" });
  stripe.webhooks.constructEvent.mockReturnValue({
    type: "checkout.session.completed",
    data: { object: { id: sessionId, mode: "payment", payment_status: "paid", amount_total: deal.brandTotalCents, currency: "eur", payment_intent: "pi_1" } },
  });
  stripe.paymentIntents.retrieve.mockResolvedValue({ latest_charge: `ch_${sessionId}` });
  const response = await webhook.POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "sig" }, body: "{}" }));
  expect(response.status).toBe(200);
}

async function goLive(s: Seeded, dealId: string) {
  as(s.creator);
  const draft = await deals.submitDraftAction(dealId, undefined, form({ kind: "SCRIPT", url: "https://docs.example.com/script", caption: CAPTION, disclosureConfirmed: "true" }));
  expect(draft?.success, JSON.stringify(draft)).toBe(true);
  as(s.brand);
  expect((await deals.reviewDraftAction(dealId, undefined, form({ decision: "APPROVE" })))?.success).toBe(true);
  stubPlatform(200);
  as(s.creator);
  const post = await deals.submitDealPostAction(
    dealId,
    undefined,
    form({ format: "TIKTOK_VIDEO", url: TIKTOK_URL, caption: CAPTION, paidPartnershipLabel: "true", disclosureInContent: "true" }),
  );
  expect(post?.success, JSON.stringify(post)).toBe(true);
  await verification.verifyDealPosts(dealId);
}

describe.skipIf(!DB)("brand deal lifecycle (needs a database)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.IMPRINT_VAT_ID = "DE123456789";
    process.env.REQUIRE_VERIFIED_EMAIL = "0";
    process.env.BRAND_DEALS_ENABLED = "1";
    prisma = (await import("@/lib/prisma")).prisma;
    stripe = (await import("@/lib/stripe")).stripe as unknown as typeof stripe;
    authMock = (await import("@/lib/auth")).auth as unknown as ReturnType<typeof vi.fn>;
    payments = await import("@/lib/actions/payments");
    deals = await import("@/lib/actions/deals");
    handlers = await import("@/lib/deals/handlers");
    verification = await import("@/lib/deals/verification");
    payout = await import("@/lib/deals/payout");
    webhook = await import("@/app/api/webhooks/stripe/route");
    escrow = await import("@/lib/deals/escrow");
  });

  beforeEach(async () => {
    // The deadline job looks at every deal in the database: leave only this test's own deals for it.
    await prisma.deal.updateMany({ data: { status: "CANCELLED" } });
    stripe.transfers.create.mockReset().mockResolvedValue({ id: "tr_test" });
    stripe.refunds.create.mockReset().mockResolvedValue({ id: "re_test" });
    stripe.checkout.sessions.create.mockReset();
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    if (!prisma) return;
    vi.unstubAllGlobals();
    // Invoices are not deleted with a deal (they outlive it by design), so they go first.
    const mine = await prisma.deal.findMany({ where: { interest: { request: { startup: { userId: { in: created } } } } }, select: { id: true } });
    await prisma.invoice.deleteMany({ where: { dealId: { in: mine.map((d) => d.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  it("runs from accepted offer to payout and invoices", async () => {
    const s = await seed();

    // Accepting the offer creates the deal with frozen terms.
    as(s.creator);
    await payments.acceptOfferAction(s.interest.id, s.amount);
    let deal = await dealOf(s.interest.id);
    expect(deal.status).toBe("CONTRACT_PENDING");
    expect(deal.termsHash).toMatch(/^[0-9a-f]{64}$/);

    // The checkout is refused until both sides signed.
    as(s.brand);
    expect(await payments.createCheckoutSessionAction(s.interest.id)).toMatchObject({ error: expect.stringContaining("contract") });

    // A stale hash cannot be signed.
    as(s.creator);
    expect((await deals.signContractAction(deal.id, "0".repeat(64)))?.error).toMatch(/terms changed/i);

    deal = await acceptAndSign(s);
    expect(deal.status).toBe("AWAITING_ESCROW");
    expect(deal).toMatchObject({ brandNetCents: 100_000, brandVatCents: 19_000, brandTotalCents: 119_000 });

    // Checkout charges net + VAT as two lines.
    await fundViaWebhook(s, "cs_happy");
    const lineItems = stripe.checkout.sessions.create.mock.calls[0][0].line_items as { price_data: { unit_amount: number } }[];
    expect(lineItems.map((l) => l.price_data.unit_amount)).toEqual([100_000, 19_000]);

    deal = await dealOf(s.interest.id);
    expect(deal.status).toBe("IN_PRODUCTION");
    expect(deal.draftDueAt).not.toBeNull();
    expect((await prisma.interest.findUniqueOrThrow({ where: { id: s.interest.id } })).paymentStatus).toBe("HELD");

    // The legacy approve button does not apply to a deal.
    as(s.brand);
    expect(await payments.approvePaymentAction(s.interest.id)).toMatchObject({ error: expect.stringContaining("brand deal") });

    // A caption without the advertising label is refused before the brand sees it.
    as(s.creator);
    const bad = await deals.submitDraftAction(deal.id, undefined, form({ kind: "SCRIPT", url: "https://docs.example.com/script", caption: "Meine Creme #ad", disclosureConfirmed: "true" }));
    expect(bad?.issues?.map((i) => i.code)).toContain("DISCLOSURE_LABEL_INSUFFICIENT");

    await goLive(s, deal.id);
    deal = await dealOf(s.interest.id);
    expect(deal.status).toBe("VERIFYING");
    expect(deal.verificationEndsAt!.getTime() - deal.firstLiveAt!.getTime()).toBe(24 * HOUR);

    // The payout does not move inside the hold window ...
    await handlers.runDealDeadlines(new Date(deal.firstLiveAt!.getTime() + 2 * HOUR));
    expect(stripe.transfers.create).not.toHaveBeenCalled();
    expect((await dealOf(s.interest.id)).status).toBe("VERIFYING");

    // ... and moves once it is over.
    const summary = await handlers.runDealDeadlines(new Date(deal.verificationEndsAt!.getTime() + HOUR));
    expect(summary.failures).toEqual([]);
    deal = await dealOf(s.interest.id);
    expect(deal.status).toBe("COMPLETED");
    expect(stripe.transfers.create).toHaveBeenCalledTimes(1);
    expect(stripe.transfers.create.mock.calls[0][0]).toMatchObject({ amount: 90_000, destination: "acct_test" });
    expect((await prisma.interest.findUniqueOrThrow({ where: { id: s.interest.id } })).paymentStatus).toBe("RELEASED");

    // Both documents exist with the right figures.
    const invoices = await prisma.invoice.findMany({ where: { dealId: deal.id }, orderBy: { kind: "asc" } });
    expect(invoices).toHaveLength(2);
    const brandInvoice = invoices.find((i) => i.kind === "BRAND_INVOICE")!;
    const creditNote = invoices.find((i) => i.kind === "CREATOR_CREDIT_NOTE")!;
    expect(brandInvoice).toMatchObject({ netCents: 100_000, vatCents: 19_000, grossCents: 119_000, taxTreatment: "DOMESTIC_VAT", recipientUserId: s.brand.id });
    expect(creditNote).toMatchObject({ grossCents: 90_000, netCents: 75_630, vatCents: 14_370, recipientUserId: s.creator.id });
    expect(brandInvoice.number).toMatch(/^RE-\d{4}-\d{6}$/);
    expect(creditNote.number).toMatch(/^GS-\d{4}-\d{6}$/);

    // Running the job again changes nothing.
    await handlers.runDealDeadlines(new Date(deal.verificationEndsAt!.getTime() + 2 * HOUR));
    expect(stripe.transfers.create).toHaveBeenCalledTimes(1);
    expect(await prisma.invoice.count({ where: { dealId: deal.id } })).toBe(2);
  });

  it("cancels and refunds when the creator misses the draft deadline", async () => {
    const s = await seed();
    await acceptAndSign(s);
    await fundViaWebhook(s);
    const deal = await dealOf(s.interest.id);

    // Just after the deadline: only a reminder.
    const reminded = await handlers.runDealDeadlines(new Date(deal.draftDueAt!.getTime() + HOUR));
    expect(reminded.results).toMatchObject({ "remind:draft_due": 1 });
    expect((await dealOf(s.interest.id)).status).toBe("IN_PRODUCTION");

    // After the grace period: cancelled, refunded.
    await handlers.runDealDeadlines(new Date(deal.draftDueAt!.getTime() + 73 * HOUR));
    expect((await dealOf(s.interest.id)).status).toBe("CANCELLED");
    expect(stripe.refunds.create).toHaveBeenCalledTimes(1);
    expect((await prisma.interest.findUniqueOrThrow({ where: { id: s.interest.id } })).paymentStatus).toBe("REFUNDED");
    expect(stripe.transfers.create).not.toHaveBeenCalled();
  });

  it("treats an unanswered draft as approved", async () => {
    const s = await seed();
    await acceptAndSign(s);
    await fundViaWebhook(s);
    const deal = await dealOf(s.interest.id);
    as(s.creator);
    await deals.submitDraftAction(deal.id, undefined, form({ kind: "SCRIPT", url: "https://docs.example.com/s", caption: CAPTION, disclosureConfirmed: "true" }));
    const submitted = await dealOf(s.interest.id);
    expect(submitted.status).toBe("DRAFT_SUBMITTED");
    await handlers.runDealDeadlines(new Date(submitted.draftReviewDueAt!.getTime() + HOUR));
    expect((await dealOf(s.interest.id)).status).toBe("DRAFT_APPROVED");
    expect((await prisma.dealDraft.findFirstOrThrow({ where: { dealId: deal.id } })).autoApproved).toBe(true);
  });

  it("limits revision rounds and sends a rejected draft to dispute", async () => {
    const s = await seed();
    await acceptAndSign(s);
    await fundViaWebhook(s);
    const deal = await dealOf(s.interest.id);
    const submit = async () => {
      as(s.creator);
      const r = await deals.submitDraftAction(deal.id, undefined, form({ kind: "SCRIPT", url: "https://docs.example.com/s", caption: CAPTION, disclosureConfirmed: "true" }));
      expect(r?.success, JSON.stringify(r)).toBe(true);
    };
    const changes = async () => {
      as(s.brand);
      return deals.reviewDraftAction(deal.id, undefined, form({ decision: "CHANGES", feedback: "Please show the packaging more clearly." }));
    };
    await submit();
    expect((await changes())?.success).toBe(true);
    await submit();
    expect((await changes())?.success).toBe(true);
    await submit();
    expect((await changes())?.error).toMatch(/revision rounds/i);

    as(s.brand);
    const rejected = await deals.reviewDraftAction(deal.id, undefined, form({ decision: "REJECT", feedback: "Still not what we briefed." }));
    expect(rejected?.success).toBe(true);
    expect((await dealOf(s.interest.id)).status).toBe("DISPUTED");
    const interest = await prisma.interest.findUniqueOrThrow({ where: { id: s.interest.id } });
    expect(interest.disputedAt).not.toBeNull();
    const dispute = await prisma.dealDispute.findFirstOrThrow({ where: { dealId: deal.id } });
    expect(dispute.reason).toBe("DRAFT_REJECTED");

    // Nothing leaves escrow around the dispute, not even by the old release path.
    const { releaseHeldPayment } = await import("@/lib/payment-release");
    expect((await releaseHeldPayment(s.interest.id, "verified")).error).toBeTruthy();
    expect((await releaseHeldPayment(s.interest.id, "approved")).error).toBeTruthy();
    expect(stripe.transfers.create).not.toHaveBeenCalled();

    // An admin settles it for the brand.
    const settled = await payout.resolveDealDispute(dispute.id, "admin1", "REFUND", "Draft did not match the briefing.");
    expect(settled).toEqual({});
    expect((await dealOf(s.interest.id)).status).toBe("CANCELLED");
    expect(stripe.refunds.create).toHaveBeenCalledTimes(1);
  });

  it("gives a creator whose post disappeared a grace period, then freezes the deal", async () => {
    const s = await seed();
    await acceptAndSign(s);
    await fundViaWebhook(s);
    const deal = await dealOf(s.interest.id);
    await goLive(s, deal.id);
    expect((await dealOf(s.interest.id)).status).toBe("VERIFYING");

    // One failed check is a hiccup, the second one is a removal.
    stubPlatform(400, {});
    await verification.verifyDealPosts(deal.id);
    expect((await dealOf(s.interest.id)).status).toBe("VERIFYING");
    await verification.verifyDealPosts(deal.id);
    const removed = await dealOf(s.interest.id);
    expect(removed.status).toBe("REPOST_REQUIRED");
    expect(removed.graceUntil).not.toBeNull();

    // Nobody republishes: frozen as a dispute.
    await handlers.runDealDeadlines(new Date(removed.graceUntil!.getTime() + HOUR));
    const frozen = await dealOf(s.interest.id);
    expect(frozen.status).toBe("DISPUTED");
    expect(frozen.statusBeforeDispute).toBe("REPOST_REQUIRED");
    expect((await prisma.dealDispute.findFirstOrThrow({ where: { dealId: deal.id } })).reason).toBe("POST_REMOVED");

    // The admin decides the post was put back: the deal resumes where it stood.
    const dispute = await prisma.dealDispute.findFirstOrThrow({ where: { dealId: deal.id } });
    expect(await payout.resolveDealDispute(dispute.id, "admin1", "RESUME", "Creator showed the repost.")).toEqual({});
    expect((await dealOf(s.interest.id)).status).toBe("REPOST_REQUIRED");
    expect((await prisma.interest.findUniqueOrThrow({ where: { id: s.interest.id } })).disputedAt).toBeNull();

    // The repost starts a fresh window.
    stubPlatform(200);
    as(s.creator);
    const repost = await deals.submitDealPostAction(
      deal.id,
      undefined,
      form({ format: "TIKTOK_VIDEO", url: "https://www.tiktok.com/@mia/video/7412345678901234999", caption: CAPTION, paidPartnershipLabel: "true", disclosureInContent: "true" }),
    );
    expect(repost?.success, JSON.stringify(repost)).toBe(true);
    await verification.verifyDealPosts(deal.id);
    expect((await dealOf(s.interest.id)).status).toBe("VERIFYING");
  });

  it("releases to the creator when an admin decides so, and refuses a second decision", async () => {
    const s = await seed();
    await acceptAndSign(s);
    await fundViaWebhook(s);
    const deal = await dealOf(s.interest.id);
    await goLive(s, deal.id);

    as(s.brand);
    const opened = await deals.openDisputeAction(deal.id, undefined, form({ reason: "CONTENT_MISMATCH", details: "The video shows a different product." }));
    expect(opened?.success, JSON.stringify(opened)).toBe(true);
    const dispute = await prisma.dealDispute.findFirstOrThrow({ where: { dealId: deal.id } });

    expect(await payout.resolveDealDispute(dispute.id, "admin1", "RELEASE", "Product matches the briefing.")).toEqual({});
    expect((await dealOf(s.interest.id)).status).toBe("COMPLETED");
    expect(stripe.transfers.create).toHaveBeenCalledTimes(1);
    expect(await prisma.invoice.count({ where: { dealId: deal.id } })).toBe(2);
    expect((await payout.resolveDealDispute(dispute.id, "admin1", "REFUND", "Changed my mind.")).error).toMatch(/already settled/);
  });

  it("holds the payout back while paid usage rights are not handed over", async () => {
    const s = await seed();
    await prisma.campaignBriefing.update({
      where: { requestId: s.request.id },
      data: { usageType: "PAID_ADS", usageChannels: ["TIKTOK_SPARK_ADS"], usageDurationDays: 60, usageFeeCents: 20_000 },
    });
    const deal = await acceptAndSign(s);
    await fundViaWebhook(s);
    await goLive(s, deal.id);
    const live = await dealOf(s.interest.id);
    expect(live.usageExpiresAt!.getTime() - live.usageStartsAt!.getTime()).toBe(60 * DAY);

    const after = new Date(live.verificationEndsAt!.getTime() + HOUR);
    await handlers.runDealDeadlines(after);
    expect((await dealOf(s.interest.id)).status).toBe("VERIFYING");
    expect(stripe.transfers.create).not.toHaveBeenCalled();

    // The code, then the payout.
    as(s.creator);
    const bad = await deals.deliverUsageAction(deal.id, undefined, form({ sparkAdsCode: "nope" }));
    expect(bad?.issues?.map((i) => i.code)).toContain("SPARK_CODE_INVALID");
    const good = await deals.deliverUsageAction(deal.id, undefined, form({ sparkAdsCode: "#abcDEF0123456789xyzABC", sparkAdsCodeExpiresAt: "2099-01-01" }));
    expect(good?.success, JSON.stringify(good)).toBe(true);
    await handlers.runDealDeadlines(after);
    expect((await dealOf(s.interest.id)).status).toBe("COMPLETED");

    // The usage line is on the invoice.
    const invoice = await prisma.invoice.findFirstOrThrow({ where: { dealId: deal.id, kind: "BRAND_INVOICE" } });
    expect(JSON.stringify(invoice.lines)).toContain("Nutzungsrechte");
  });

  it("refuses a post that breaks the disclosure rules or does not fit the booked format", async () => {
    const s = await seed();
    const deal = await acceptAndSign(s);
    await fundViaWebhook(s);
    as(s.creator);
    await deals.submitDraftAction(deal.id, undefined, form({ kind: "SCRIPT", url: "https://docs.example.com/s", caption: CAPTION, disclosureConfirmed: "true" }));
    as(s.brand);
    await deals.reviewDraftAction(deal.id, undefined, form({ decision: "APPROVE" }));
    as(s.creator);

    const noLabel = await deals.submitDealPostAction(deal.id, undefined, form({ format: "TIKTOK_VIDEO", url: TIKTOK_URL, caption: "Meine Creme", paidPartnershipLabel: "true", disclosureInContent: "true" }));
    expect(noLabel?.issues?.map((i) => i.code)).toContain("DISCLOSURE_LABEL_MISSING");
    const noPlatformLabel = await deals.submitDealPostAction(deal.id, undefined, form({ format: "TIKTOK_VIDEO", url: TIKTOK_URL, caption: CAPTION, disclosureInContent: "true" }));
    expect(noPlatformLabel?.issues?.map((i) => i.code)).toContain("PAID_PARTNERSHIP_LABEL_REQUIRED");
    const wrongHost = await deals.submitDealPostAction(deal.id, undefined, form({ format: "TIKTOK_VIDEO", url: "https://www.instagram.com/reel/C8aBcDeFgHi/", caption: CAPTION, paidPartnershipLabel: "true", disclosureInContent: "true" }));
    expect(wrongHost?.issues?.map((i) => i.code)).toContain("POST_URL_FORMAT_MISMATCH");
    expect(await prisma.dealPost.count({ where: { dealId: deal.id } })).toBe(0);
  });

  it("blocks a competitor's post inside an exclusivity window", async () => {
    // Brand A buys exclusivity for 30 days after its post; the same creator is then booked by brand B in the same category.
    const a = await seed({ brand: "Glow GmbH", exclusivity: { days: 30 } });
    const dealA = await acceptAndSign(a);
    await fundViaWebhook(a);
    await prisma.deal.update({ where: { id: dealA.id }, data: { scheduledFor: new Date(Date.now() + 5 * DAY), status: "POST_SCHEDULED" } });

    const b = await seed({ brand: "Rival AG", creatorUserId: a.creator.id });
    const dealB = await acceptAndSign(b);
    await fundViaWebhook(b);
    await prisma.deal.update({ where: { id: dealB.id }, data: { status: "DRAFT_APPROVED" } });

    as(b.creator);
    const clash = await deals.schedulePostAction(dealB.id, undefined, form({ scheduledFor: new Date(Date.now() + 10 * DAY).toISOString() }));
    expect(clash?.issues?.map((i) => i.code)).toContain("EXCLUSIVITY_CONFLICT_EXISTING");
    expect((await dealOf(b.interest.id)).status).toBe("DRAFT_APPROVED");

    // Before brand A's post there is nothing to protect.
    const fine = await deals.schedulePostAction(dealB.id, undefined, form({ scheduledFor: new Date(Date.now() + 2 * DAY).toISOString() }));
    expect(fine?.success, JSON.stringify(fine)).toBe(true);
  });

  it("lets either side back out before anything was produced, and refunds a funded escrow", async () => {
    const s = await seed();
    await acceptAndSign(s);
    await fundViaWebhook(s);
    const deal = await dealOf(s.interest.id);
    as(s.brand);
    expect((await deals.cancelDealAction(deal.id))?.success).toBe(true);
    expect((await dealOf(s.interest.id)).status).toBe("CANCELLED");
    expect(stripe.refunds.create).toHaveBeenCalledTimes(1);

    // An unfunded deal goes back to "nothing agreed".
    const t = await seed();
    await acceptAndSign(t);
    const unfunded = await dealOf(t.interest.id);
    stripe.checkout.sessions.create.mockResolvedValue({ id: "cs_unfunded", url: "https://stripe.test/pay", status: "open" });
    as(t.brand);
    await payments.createCheckoutSessionAction(t.interest.id);
    (stripe.checkout.sessions as unknown as { retrieve: ReturnType<typeof vi.fn>; expire: ReturnType<typeof vi.fn> }).retrieve = vi.fn().mockResolvedValue({ status: "open" });
    (stripe.checkout.sessions as unknown as { expire: ReturnType<typeof vi.fn> }).expire = vi.fn().mockResolvedValue({});
    as(t.creator);
    expect((await deals.cancelDealAction(unfunded.id))?.success).toBe(true);
    const interest = await prisma.interest.findUniqueOrThrow({ where: { id: t.interest.id } });
    expect(interest).toMatchObject({ paymentStatus: null, amountCents: null, stripeCheckoutSessionId: null });
  });

  it("will not let a party sign without complete business details, and holds an EU brand to a VIES-confirmed VAT ID", async () => {
    const s = await seed();
    as(s.creator);
    await payments.acceptOfferAction(s.interest.id, s.amount);
    const deal = await dealOf(s.interest.id);

    // No business details at all.
    await prisma.businessProfile.delete({ where: { userId: s.brand.id } });
    as(s.brand);
    const missing = await deals.signContractAction(deal.id, deal.termsHash);
    expect(missing?.issues?.map((i) => i.code)).toContain("BUSINESS_PROFILE_INCOMPLETE");
    expect(missing?.fixHref).toBe("/dashboard/business");

    // A French brand whose VAT ID VIES has not confirmed.
    const profile = {
      userId: s.brand.id,
      legalName: "Glow SARL",
      businessType: "COMPANY",
      country: "FR",
      addressLine1: "1 rue de Test",
      postalCode: "75001",
      city: "Paris",
      vatId: "FR12345678901",
      vatIdStatus: "UNCHECKED" as const,
      traderSelfCertifiedAt: new Date(),
    };
    await prisma.businessProfile.create({ data: profile });
    const unverified = await deals.signContractAction(deal.id, deal.termsHash);
    expect(unverified?.issues?.map((i) => i.code)).toContain("VAT_ID_NOT_VERIFIED");

    // Once VIES has confirmed it: signed without VAT.
    await prisma.businessProfile.update({ where: { userId: s.brand.id }, data: { vatIdStatus: "VALID", vatIdConsultationNumber: "WAPIAAAAtest" } });
    expect((await deals.signContractAction(deal.id, deal.termsHash))?.success).toBe(true);
    as(s.creator);
    expect((await deals.signContractAction(deal.id, deal.termsHash))?.success).toBe(true);
    const signed = await dealOf(s.interest.id);
    expect(signed).toMatchObject({ status: "AWAITING_ESCROW", brandNetCents: 100_000, brandVatCents: 0, brandTotalCents: 100_000 });
    expect(JSON.stringify(signed.taxSnapshot)).toContain("REVERSE_CHARGE_EU");

    // The checkout then has a single line.
    await fundViaWebhook(s, "cs_reverse_charge");
    const lines = stripe.checkout.sessions.create.mock.calls.at(-1)![0].line_items as unknown[];
    expect(lines).toHaveLength(1);
  });

  it("continues a contract that waited for business details once they are fixed", async () => {
    const s = await seed();
    as(s.creator);
    await payments.acceptOfferAction(s.interest.id, s.amount);
    const deal = await dealOf(s.interest.id);
    // Both sign, then the creator's details become unusable before the second signature is processed.
    as(s.creator);
    await deals.signContractAction(deal.id, deal.termsHash);
    await prisma.businessProfile.update({ where: { userId: s.creator.id }, data: { traderSelfCertifiedAt: null } });
    await prisma.deal.update({ where: { id: deal.id }, data: { brandSignedAt: new Date(), brandSignedBy: s.brand.id } });
    as(s.brand);
    const stuck = await deals.signContractAction(deal.id, deal.termsHash);
    expect(stuck?.issues?.length).toBeGreaterThan(0);
    expect((await dealOf(s.interest.id)).status).toBe("CONTRACT_PENDING");

    // The creator fixes the details: saving them lets the contract go on by itself.
    await prisma.businessProfile.update({ where: { userId: s.creator.id }, data: { traderSelfCertifiedAt: new Date() } });
    const { completePendingContracts } = await import("@/lib/deals/contract");
    expect(await completePendingContracts(s.creator.id, "en")).toBe(1);
    expect((await dealOf(s.interest.id)).status).toBe("AWAITING_ESCROW");
  });

  it("writes the credit note with the payout that was really made when a side went Pro after the contract", async () => {
    const s = await seed();
    const deal = await acceptAndSign(s);
    await fundViaWebhook(s);
    await goLive(s, deal.id);
    // Pro fee (3 %) instead of 10 %: the creator gets 97 000 instead of 90 000.
    await prisma.interest.update({ where: { id: s.interest.id }, data: { platformFeeCents: 3_000, payoutCents: 97_000 } });
    const live = await dealOf(s.interest.id);
    await handlers.runDealDeadlines(new Date(live.verificationEndsAt!.getTime() + HOUR));
    expect((await dealOf(s.interest.id)).status).toBe("COMPLETED");
    expect(stripe.transfers.create.mock.calls[0][0]).toMatchObject({ amount: 97_000 });
    const note = await prisma.invoice.findFirstOrThrow({ where: { dealId: deal.id, kind: "CREATOR_CREDIT_NOTE" } });
    expect(note.grossCents).toBe(97_000);
    expect(note.netCents + note.vatCents).toBe(97_000);
  });

  it("is idempotent when the funding webhook arrives twice", async () => {
    const s = await seed();
    await acceptAndSign(s);
    await fundViaWebhook(s, "cs_twice");
    const first = await dealOf(s.interest.id);
    await escrow.onEscrowFunded(first.id);
    const second = await dealOf(s.interest.id);
    expect(second.fundedAt).toEqual(first.fundedAt);
    expect(await prisma.dealEvent.count({ where: { dealId: first.id, kind: "status.IN_PRODUCTION" } })).toBe(1);
  });
});
