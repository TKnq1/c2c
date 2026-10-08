// What happens around the money of a deal that nobody clicks: refunds and chargebacks made in Stripe, a payout whose outcome is
// unknown, the daily job closing gaps, the checks on the admin's Open page. Like the lifecycle test it needs a database the
// migrations have been applied to, so it only runs when DEAL_TEST_DATABASE_URL is set:
//   DEAL_TEST_DATABASE_URL=postgresql://user:pw@localhost:5432/c2c_test npx vitest run src/lib/deals/money.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dealAt } from "@/lib/deals/test-helpers";

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
    transfers: { create: vi.fn(), list: vi.fn() },
    refunds: { create: vi.fn() },
    webhooks: { constructEvent: vi.fn() },
  },
}));

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

type Mock = ReturnType<typeof vi.fn>;
type Db = typeof import("@/lib/prisma").prisma;
let prisma: Db;
let stripe: {
  checkout: { sessions: { create: Mock; retrieve: Mock; expire: Mock } };
  paymentIntents: { retrieve: Mock };
  transfers: { create: Mock; list: Mock };
  refunds: { create: Mock };
  webhooks: { constructEvent: Mock };
};
let notifyUrgent: Mock;
let sendEmail: Mock;
let events: typeof import("@/lib/deals/stripe-events");
let payout: typeof import("@/lib/deals/payout");
let handlers: typeof import("@/lib/deals/handlers");
let webhook: typeof import("@/app/api/webhooks/stripe/route");
let adminChecks: typeof import("@/lib/deals/admin-checks");
let adminTasks: typeof import("@/lib/admin-tasks");
let issue: typeof import("@/lib/billing/issue");

const created: string[] = [];

// Taking a deal to a state sends its own notices and mails on the way: a test counts only what happens after that.
async function seed(target: Parameters<typeof dealAt>[2], options: Parameters<typeof dealAt>[3] = {}) {
  const s = await dealAt(prisma, created, target, options);
  sendEmail.mockClear();
  notifyUrgent.mockClear();
  return s;
}
const dealOf = (interestId: string) => prisma.deal.findUniqueOrThrow({ where: { interestId } });
const interestOf = (id: string) => prisma.interest.findUniqueOrThrow({ where: { id } });
const alertKeys = () => notifyUrgent.mock.calls.map(([notice]) => (notice as { key: string }).key);

// What Stripe's auto-paginating list hands back: something to `for await` over.
const stripeList = (items: unknown[]) => ({
  async *[Symbol.asyncIterator]() {
    for (const item of items) yield item;
  },
});

function chargeFor(chargeId: string, refunded: number, amount = 119_000) {
  return { id: chargeId, amount, amount_refunded: refunded, refunded: refunded >= amount };
}

function chargeback(id: string, chargeId: string, status = "needs_response") {
  return { id, charge: chargeId, amount: 119_000, reason: "fraudulent", status, evidence_details: { due_by: 1_790_000_000 } };
}

async function emailsOf(...userIds: string[]) {
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { email: true } });
  return users.map((u) => u.email).sort();
}

const mailedTo = () => sendEmail.mock.calls.map(([mail]) => (mail as { to: string }).to).sort();

describe.skipIf(!DB)("the money around a deal (needs a database)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
    process.env.IMPRINT_VAT_ID = "DE123456789";
    process.env.REQUIRE_VERIFIED_EMAIL = "0";
    process.env.BRAND_DEALS_ENABLED = "1";
    prisma = (await import("@/lib/prisma")).prisma;
    stripe = (await import("@/lib/stripe")).stripe as unknown as typeof stripe;
    notifyUrgent = (await import("@/lib/admin-digest")).notifyUrgent as unknown as Mock;
    sendEmail = (await import("@/lib/email")).sendEmail as unknown as Mock;
    events = await import("@/lib/deals/stripe-events");
    payout = await import("@/lib/deals/payout");
    handlers = await import("@/lib/deals/handlers");
    webhook = await import("@/app/api/webhooks/stripe/route");
    adminChecks = await import("@/lib/deals/admin-checks");
    adminTasks = await import("@/lib/admin-tasks");
    issue = await import("@/lib/billing/issue");
  });

  beforeEach(async () => {
    // The deadline job looks at every deal in the database: leave only this test's own deals for it.
    await prisma.deal.updateMany({ data: { status: "CANCELLED" } });
    stripe.transfers.create.mockReset().mockResolvedValue({ id: "tr_test" });
    stripe.transfers.list.mockReset().mockReturnValue(stripeList([]));
    stripe.refunds.create.mockReset().mockResolvedValue({ id: "re_test" });
    stripe.webhooks.constructEvent.mockReset();
    notifyUrgent.mockClear();
    sendEmail.mockClear();
  });

  afterAll(async () => {
    if (!prisma) return;
    // Invoices are not deleted with a deal (they outlive it by design), so they go first.
    const mine = await prisma.deal.findMany({ where: { interest: { request: { startup: { userId: { in: created } } } } }, select: { id: true } });
    await prisma.invoice.deleteMany({ where: { dealId: { in: mine.map((d) => d.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  describe("a refund made in Stripe", () => {
    it("ends a funded deal, tells both sides and the admins, and does nothing the second time", async () => {
      const s = await seed("IN_PRODUCTION");

      expect(await events.onChargeRefunded(chargeFor(s.chargeId, 119_000))).toBe("cancelled");

      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "REFUNDED", disputedAt: null });
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "CANCELLED", cancelReason: "REFUNDED_IN_STRIPE" });
      expect(await prisma.dealEvent.count({ where: { dealId: s.dealId, kind: "refunded.outside" } })).toBe(1);
      // Both sides get it in the app and by e-mail.
      expect(await prisma.notification.count({ where: { userId: { in: [s.brand.id, s.creator.id] }, message: { contains: "outside comtor" } } })).toBe(2);
      expect(mailedTo()).toEqual(await emailsOf(s.brand.id, s.creator.id));
      expect(sendEmail.mock.calls[0][0]).toMatchObject({ subject: "Payment refunded: “Autumn launch”" });
      expect(alertKeys()).toContain(`charge-refunded-${s.chargeId}`);

      // Stripe sends the event again: nothing happens twice.
      expect(await events.onChargeRefunded(chargeFor(s.chargeId, 119_000))).toBe("ignored:already-refunded");
      expect(sendEmail).toHaveBeenCalledTimes(2);
    });

    it("settles the dispute a person had opened, since the money is gone", async () => {
      const s = await seed("DISPUTED");

      expect(await events.onChargeRefunded(chargeFor(s.chargeId, 119_000))).toBe("cancelled");

      expect(await dealOf(s.interest.id)).toMatchObject({ status: "CANCELLED", cancelReason: "REFUNDED_IN_STRIPE" });
      expect(await prisma.dealDispute.findFirstOrThrow({ where: { dealId: s.dealId } })).toMatchObject({ status: "RESOLVED_REFUND" });
      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "REFUNDED", disputedAt: null });
    });

    it("leaves a partial refund alone, writes it down and tells the admins", async () => {
      const s = await seed("IN_PRODUCTION");

      expect(await events.onChargeRefunded(chargeFor(s.chargeId, 5_000))).toBe("alert:partial-refund");

      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "HELD" });
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "IN_PRODUCTION" });
      expect(await prisma.dealEvent.count({ where: { dealId: s.dealId, kind: "payment.partially_refunded" } })).toBe(1);
      expect(alertKeys()).toContain(`charge-refunded-partial-${s.chargeId}-5000`);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("only alerts the admins once the creator has been paid", async () => {
      const s = await seed("COMPLETED");

      expect(await events.onChargeRefunded(chargeFor(s.chargeId, 119_000))).toBe("alert:after-payout");

      expect(await dealOf(s.interest.id)).toMatchObject({ status: "COMPLETED" });
      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "RELEASED" });
      expect(alertKeys()).toContain(`charge-refunded-after-payout-${s.chargeId}`);
    });

    it("ignores the refund the app made itself, and a payment it does not know", async () => {
      const s = await seed("IN_PRODUCTION");
      await prisma.interest.update({ where: { id: s.interest.id }, data: { paymentStatus: "REFUNDED", refundedAt: new Date(), stripeRefundId: "re_own" } });

      expect(await events.onChargeRefunded(chargeFor(s.chargeId, 119_000))).toBe("ignored:already-refunded");
      expect(await events.onChargeRefunded(chargeFor("ch_nobody_knows", 119_000))).toBe("ignored:unknown-charge");
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "IN_PRODUCTION" });
      expect(notifyUrgent).not.toHaveBeenCalled();
    });
  });

  describe("a chargeback", () => {
    it("freezes a funded deal as a dispute of its own kind, once", async () => {
      const s = await seed("IN_PRODUCTION");

      expect(await events.onDisputeCreated(chargeback("dp_1", s.chargeId))).toBe("frozen");

      expect(await dealOf(s.interest.id)).toMatchObject({ status: "DISPUTED", statusBeforeDispute: "IN_PRODUCTION" });
      expect(await prisma.dealDispute.findFirstOrThrow({ where: { dealId: s.dealId } })).toMatchObject({
        reason: "CHARGEBACK",
        status: "OPEN",
        stripeDisputeId: "dp_1",
        openedByRole: null,
      });
      expect((await interestOf(s.interest.id)).disputedAt).not.toBeNull();
      expect(alertKeys()).toContain("dispute-created-dp_1");
      // Both sides are told that it is frozen, by e-mail as well.
      expect(mailedTo()).toEqual(await emailsOf(s.brand.id, s.creator.id));

      // The same event again opens nothing.
      expect(await events.onDisputeCreated(chargeback("dp_1", s.chargeId))).toBe("ignored:duplicate");
      expect(await prisma.dealDispute.count({ where: { dealId: s.dealId } })).toBe(1);
    });

    it("joins the dispute a person had opened, so the decision is made once", async () => {
      const s = await seed("DISPUTED");

      expect(await events.onDisputeCreated(chargeback("dp_join", s.chargeId))).toBe("joined");

      const disputes = await prisma.dealDispute.findMany({ where: { dealId: s.dealId } });
      expect(disputes).toHaveLength(1);
      expect(disputes[0]).toMatchObject({ reason: "CONTENT_MISMATCH", stripeDisputeId: "dp_join" });
      expect(disputes[0].details).toContain("dp_join");
    });

    it("is only an alert once the creator has been paid", async () => {
      const s = await seed("COMPLETED");

      expect(await events.onDisputeCreated(chargeback("dp_late", s.chargeId))).toBe("alert:after-payout");

      expect(await dealOf(s.interest.id)).toMatchObject({ status: "COMPLETED" });
      expect(await prisma.dealEvent.count({ where: { dealId: s.dealId, kind: "payment.chargeback_opened" } })).toBe(1);
      expect(alertKeys()).toContain("dispute-created-dp_late");
    });

    it("freezes the money of a collaboration from before brand deals", async () => {
      const legacy = await seed("AWAITING_ESCROW");
      await prisma.deal.delete({ where: { id: legacy.dealId } });
      await prisma.interest.update({ where: { id: legacy.interest.id }, data: { paymentStatus: "HELD", stripeChargeId: "ch_legacy" } });

      expect(await events.onDisputeCreated(chargeback("dp_legacy", "ch_legacy"))).toBe("alert:legacy");
      expect(await interestOf(legacy.interest.id)).toMatchObject({ paymentStatus: "HELD", disputeReason: expect.stringContaining("Stripe chargeback") });
      expect((await interestOf(legacy.interest.id)).disputedAt).not.toBeNull();

      // Won: the freeze is lifted again.
      expect(await events.onDisputeClosed(chargeback("dp_legacy", "ch_legacy", "won"))).toBe("resumed");
      expect(await interestOf(legacy.interest.id)).toMatchObject({ paymentStatus: "HELD", disputedAt: null, disputeReason: null });
    });

    it("alerts the admins about a payment it does not know", async () => {
      expect(await events.onDisputeCreated(chargeback("dp_unknown", "ch_nobody_knows"))).toBe("alert:unknown-charge");
      expect(alertKeys()).toContain("dispute-unknown-dp_unknown");
      expect(await events.onDisputeCreated({ ...chargeback("dp_nocharge", "x"), charge: null })).toBe("ignored:no-charge");
    });

    it("lets the deal carry on where it stood when the bank sides with the brand's opponent", async () => {
      const s = await seed("IN_PRODUCTION");
      await events.onDisputeCreated(chargeback("dp_won", s.chargeId));
      sendEmail.mockClear();

      expect(await events.onDisputeClosed(chargeback("dp_won", s.chargeId, "won"))).toBe("resumed");

      expect(await dealOf(s.interest.id)).toMatchObject({ status: "IN_PRODUCTION" });
      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "HELD", disputedAt: null });
      expect(await prisma.dealDispute.findFirstOrThrow({ where: { dealId: s.dealId } })).toMatchObject({ status: "RESOLVED_RESUME" });
      expect(mailedTo()).toEqual(await emailsOf(s.brand.id, s.creator.id));

      // Closed twice (Stripe retries): nothing happens again.
      expect(await events.onDisputeClosed(chargeback("dp_won", s.chargeId, "won"))).toBe("ignored:duplicate");
    });

    it("ends the deal and pays nobody when the chargeback is lost", async () => {
      const s = await seed("IN_PRODUCTION");
      await events.onDisputeCreated(chargeback("dp_lost", s.chargeId));
      sendEmail.mockClear();

      expect(await events.onDisputeClosed(chargeback("dp_lost", s.chargeId, "lost"))).toBe("chargeback-lost");

      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "REFUNDED", disputedAt: null });
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "CANCELLED", cancelReason: "CHARGEBACK_LOST" });
      expect(await prisma.dealDispute.findFirstOrThrow({ where: { dealId: s.dealId } })).toMatchObject({ status: "RESOLVED_REFUND" });
      expect(stripe.transfers.create).not.toHaveBeenCalled();
      expect(sendEmail.mock.calls.map(([mail]) => (mail as { subject: string }).subject)).toEqual(["Payment reversed: “Autumn launch”", "Payment reversed: “Autumn launch”"]);
    });

    it("alerts the admins about a closed dispute it has no record of", async () => {
      expect(await events.onDisputeClosed(chargeback("dp_nothing", "ch_nobody_knows", "lost"))).toBe("alert:no-open-dispute");
      expect(alertKeys()).toContain("dispute-closed-dp_nothing");
    });
  });

  describe("the Stripe webhook", () => {
    async function post(event: unknown) {
      stripe.webhooks.constructEvent.mockReturnValue(event);
      return webhook.POST(new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "sig" }, body: "{}" }));
    }

    it("hands refunds and chargebacks to the deal", async () => {
      const refunded = await seed("IN_PRODUCTION");
      expect((await post({ type: "charge.refunded", data: { object: chargeFor(refunded.chargeId, 119_000) } })).status).toBe(200);
      expect(await dealOf(refunded.interest.id)).toMatchObject({ status: "CANCELLED", cancelReason: "REFUNDED_IN_STRIPE" });

      const disputed = await seed("IN_PRODUCTION");
      expect((await post({ type: "charge.dispute.created", data: { object: chargeback("dp_hook", disputed.chargeId) } })).status).toBe(200);
      expect(await dealOf(disputed.interest.id)).toMatchObject({ status: "DISPUTED" });

      expect((await post({ type: "charge.dispute.closed", data: { object: chargeback("dp_hook", disputed.chargeId, "lost") } })).status).toBe(200);
      expect(await dealOf(disputed.interest.id)).toMatchObject({ status: "CANCELLED", cancelReason: "CHARGEBACK_LOST" });
    });

    it("starts a deal whose payment was marked as held by a delivery that stopped halfway", async () => {
      const s = await seed("AWAITING_ESCROW");
      await prisma.interest.update({
        where: { id: s.interest.id },
        data: { paymentStatus: "HELD", paidAt: new Date(), stripeChargeId: s.chargeId, stripeCheckoutSessionId: "cs_halfway" },
      });
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "AWAITING_ESCROW" });

      const response = await post({
        type: "checkout.session.completed",
        data: { object: { id: "cs_halfway", mode: "payment", payment_status: "paid", amount_total: 119_000, currency: "eur", payment_intent: "pi_1" } },
      });

      expect(response.status).toBe(200);
      const deal = await dealOf(s.interest.id);
      expect(deal.status).toBe("IN_PRODUCTION");
      expect(deal.draftDueAt).not.toBeNull();
    });
  });

  describe("a payout whose outcome is unknown", () => {
    // The transfer call fails twice without an answer from Stripe: the payment stays marked as released, with no transfer id.
    async function unknownOutcome() {
      const s = await seed("PAYOUT_PENDING");
      stripe.transfers.create.mockRejectedValue(new Error("socket hang up"));
      const result = await payout.releaseDealPayout(s.dealId);
      expect(result.error).toMatch(/didn't finish/);
      stripe.transfers.create.mockReset().mockResolvedValue({ id: "tr_new" });
      return s;
    }

    it("does not complete the deal on its own, and says so to the admins", async () => {
      const s = await unknownOutcome();
      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "RELEASED", stripeTransferId: null });
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "PAYOUT_PENDING" });
      expect(await prisma.report.count({ where: { status: "OPEN", reason: "Automated: Payout needs reconciliation", details: { contains: s.interest.id } } })).toBe(1);

      // The next run finds nothing in Stripe, and it is too early to pay again: the deal waits, nothing is sent twice.
      const result = await payout.releaseDealPayout(s.dealId);

      expect(result.error).toMatch(/checked in Stripe/);
      expect(stripe.transfers.create).not.toHaveBeenCalled();
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "PAYOUT_PENDING" });
      expect(alertKeys().some((key) => key.startsWith(`deal-payout-unrecorded-${s.dealId}`))).toBe(true);
      expect(await prisma.invoice.count({ where: { dealId: s.dealId } })).toBe(0);
    });

    it("completes once Stripe shows the transfer, and closes the report", async () => {
      const s = await unknownOutcome();
      stripe.transfers.list.mockReturnValue(stripeList([{ id: "tr_other", source_transaction: "ch_someone_else" }, { id: "tr_found", source_transaction: s.chargeId }]));

      const result = await payout.releaseDealPayout(s.dealId);

      expect(result).toEqual({});
      expect(stripe.transfers.create).not.toHaveBeenCalled();
      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "RELEASED", stripeTransferId: "tr_found" });
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "COMPLETED" });
      expect(await prisma.report.count({ where: { status: "OPEN", details: { contains: s.interest.id } } })).toBe(0);
      expect(await prisma.invoice.count({ where: { dealId: s.dealId } })).toBe(2);
      // The transfer is looked up at the creator's account, from shortly before the payment was released.
      expect(stripe.transfers.list.mock.calls[0][0]).toMatchObject({ destination: "acct_test", limit: 100 });
    });

    it("pays again only when Stripe has no trace of the transfer after the idempotency window", async () => {
      const s = await unknownOutcome();
      await prisma.interest.update({ where: { id: s.interest.id }, data: { releasedAt: new Date(Date.now() - 40 * HOUR) } });

      const result = await payout.releaseDealPayout(s.dealId);

      expect(result).toEqual({});
      expect(stripe.transfers.create).toHaveBeenCalledTimes(1);
      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "RELEASED", stripeTransferId: "tr_new" });
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "COMPLETED" });
      expect(await prisma.report.count({ where: { status: "OPEN", details: { contains: s.interest.id } } })).toBe(0);
    });

    it("keeps waiting when Stripe cannot be asked", async () => {
      const s = await unknownOutcome();
      await prisma.interest.update({ where: { id: s.interest.id }, data: { releasedAt: new Date(Date.now() - 40 * HOUR) } });
      stripe.transfers.list.mockImplementation(() => {
        throw new Error("Stripe is down");
      });

      const result = await payout.releaseDealPayout(s.dealId);

      expect(result.error).toMatch(/checked in Stripe/);
      expect(stripe.transfers.create).not.toHaveBeenCalled();
      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "RELEASED", stripeTransferId: null });
    });

    it("tells the admins when Stripe turns the transfer down, and tries again tomorrow", async () => {
      const s = await seed("PAYOUT_PENDING");
      stripe.transfers.create.mockRejectedValue(Object.assign(new Error("No such destination"), { type: "StripeInvalidRequestError" }));

      const result = await payout.releaseDealPayout(s.dealId);

      expect(result.error).toMatch(/Releasing the payment failed/);
      expect(await interestOf(s.interest.id)).toMatchObject({ paymentStatus: "HELD", releasedAt: null });
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "PAYOUT_PENDING" });
      expect(alertKeys().some((key) => key.startsWith(`deal-payout-failed-${s.dealId}`))).toBe(true);
    });
  });

  describe("a cancellation that was cut off", () => {
    it("finishes the cancellation when the refund already went through", async () => {
      const s = await seed("IN_PRODUCTION");
      await prisma.interest.update({ where: { id: s.interest.id }, data: { paymentStatus: "REFUNDED", refundedAt: new Date(), stripeRefundId: "re_before" } });

      const result = await payout.cancelDeal(s.dealId, "POST_DEADLINE_MISSED", "SYSTEM");

      expect(result).toEqual({ ok: true });
      expect(stripe.refunds.create).not.toHaveBeenCalled();
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "CANCELLED", cancelReason: "POST_DEADLINE_MISSED" });
      // The brand is told its money is back, since it is.
      expect(sendEmail.mock.calls.map(([mail]) => (mail as { subject: string }).subject)).toContain("Deal cancelled and refunded: “Autumn launch”");
    });

    it("does not refund twice when an admin settles a dispute for the brand again", async () => {
      const s = await seed("DISPUTED");
      const admin = await prisma.user.create({ data: { email: `admin-${Date.now()}@test.local`, passwordHash: "x", role: "ADMIN", emailVerified: true } });
      created.push(admin.id);
      await prisma.interest.update({ where: { id: s.interest.id }, data: { paymentStatus: "REFUNDED", refundedAt: new Date(), stripeRefundId: "re_before", disputedAt: null } });
      const dispute = await prisma.dealDispute.findFirstOrThrow({ where: { dealId: s.dealId } });

      const result = await payout.resolveDealDispute(dispute.id, admin.id, "REFUND", "The refund was made before, finishing the decision.");

      expect(result).toEqual({});
      expect(stripe.refunds.create).not.toHaveBeenCalled();
      expect(await dealOf(s.interest.id)).toMatchObject({ status: "CANCELLED", cancelReason: "DISPUTE_REFUND" });
      expect(await prisma.dealDispute.findUniqueOrThrow({ where: { id: dispute.id } })).toMatchObject({ status: "RESOLVED_REFUND" });
    });
  });

  describe("the daily job", () => {
    it("starts a paid deal that still waits for its payment", async () => {
      const s = await seed("AWAITING_ESCROW");
      await prisma.interest.update({ where: { id: s.interest.id }, data: { paymentStatus: "HELD", paidAt: new Date(), stripeChargeId: s.chargeId } });

      const summary = await handlers.runDealDeadlines();

      expect(summary.healed).toBe(1);
      expect(summary.failures).toEqual([]);
      const deal = await dealOf(s.interest.id);
      expect(deal.status).toBe("IN_PRODUCTION");
      expect(deal.fundedAt).not.toBeNull();
      // And leaves a deal alone that is waiting for a payment which has not come.
      const waiting = await seed("AWAITING_ESCROW");
      expect((await handlers.runDealDeadlines()).healed).toBe(0);
      expect(await dealOf(waiting.interest.id)).toMatchObject({ status: "AWAITING_ESCROW" });
    });

    it("tells the admins about a completed deal whose invoices cannot be written, and writes them when it can", async () => {
      const s = await seed("COMPLETED");
      const vat = process.env.IMPRINT_VAT_ID;
      delete process.env.IMPRINT_VAT_ID;
      try {
        const summary = await handlers.runDealDeadlines();
        expect(summary.invoicesIssued).toBe(0);
        expect(await prisma.invoice.count({ where: { dealId: s.dealId } })).toBe(0);
      } finally {
        process.env.IMPRINT_VAT_ID = vat;
      }

      const summary = await handlers.runDealDeadlines();
      expect(summary.invoicesIssued).toBe(2);
      // The recipients are told in the app that their documents are there.
      const brandNotice = await prisma.notification.findFirstOrThrow({ where: { userId: s.brand.id, message: { contains: "invoice RE-" } } });
      expect(brandNotice.link).toMatch(/^\/dashboard\/invoices\//);
      expect(await prisma.notification.count({ where: { userId: s.creator.id, message: { contains: "credit note GS-" } } })).toBe(1);
    });
  });

  describe("the checks on the admin's Open page", () => {
    const keyOf = (checks: { key: string; title: string }[], key: string) => checks.find((c) => c.key === key);
    // "3 Deals im Streit" -> 3: the checks are counted over the whole database, so a test compares before and after.
    const countOf = (checks: { key: string; title: string }[], key: string) => Number(keyOf(checks, key)?.title.match(/^\d+/)?.[0] ?? 0);
    const later = () => new Date(Date.now() + 3 * DAY);

    it("asks for a decision on a frozen deal", async () => {
      const before = countOf(await adminChecks.dealChecks(later()), "deal-disputes-open");
      await seed("DISPUTED");
      const checks = await adminChecks.dealChecks(later());
      expect(countOf(checks, "deal-disputes-open")).toBe(before + 1);
      expect(keyOf(checks, "deal-disputes-open")).toMatchObject({ priority: "HIGH", href: "/admin/deals" });
      // The page's own check list has it too.
      expect((await adminTasks.computeChecks()).some((c) => c.key === "deal-disputes-open")).toBe(true);
    });

    it("flags a payout that has been due for a day, not one that is due now", async () => {
      const s = await seed("PAYOUT_PENDING");
      const now = new Date();
      const base = countOf(await adminChecks.dealChecks(now), "deal-payouts-stuck");
      expect(countOf(await adminChecks.dealChecks(later()), "deal-payouts-stuck")).toBe(base + 1);
      // Paid out: no longer stuck.
      await prisma.deal.update({ where: { id: s.dealId }, data: { status: "COMPLETED", completedAt: now } });
      await prisma.interest.update({ where: { id: s.interest.id }, data: { paymentStatus: "RELEASED", stripeTransferId: "tr_done", releasedAt: now } });
      expect(countOf(await adminChecks.dealChecks(later()), "deal-payouts-stuck")).toBe(base);
    });

    it("flags a transfer Stripe has not confirmed after the first hour, not while it is being made", async () => {
      const inTwoHours = () => new Date(Date.now() + 2 * HOUR);
      const before = countOf(await adminChecks.dealChecks(inTwoHours()), "deal-transfer-unrecorded");
      const s = await seed("PAYOUT_PENDING");
      await prisma.interest.update({ where: { id: s.interest.id }, data: { paymentStatus: "RELEASED", releasedAt: new Date() } });
      expect(countOf(await adminChecks.dealChecks(new Date()), "deal-transfer-unrecorded")).toBe(before);
      const checks = await adminChecks.dealChecks(inTwoHours());
      expect(countOf(checks, "deal-transfer-unrecorded")).toBe(before + 1);
      expect(keyOf(checks, "deal-transfer-unrecorded")).toMatchObject({ priority: "HIGH" });
      await prisma.interest.update({ where: { id: s.interest.id }, data: { stripeTransferId: "tr_known" } });
      expect(countOf(await adminChecks.dealChecks(inTwoHours()), "deal-transfer-unrecorded")).toBe(before);
    });

    it("flags completed deals without their invoices and lets go once they exist", async () => {
      const before = countOf(await adminChecks.dealChecks(later()), "deal-invoices-missing");
      const s = await seed("COMPLETED");
      expect(countOf(await adminChecks.dealChecks(later()), "deal-invoices-missing")).toBe(before + 1);
      // Not yet: the daily job is still on it.
      expect(countOf(await adminChecks.dealChecks(new Date()), "deal-invoices-missing")).toBe(before);
      await issue.issueDealInvoices(s.dealId);
      expect(countOf(await adminChecks.dealChecks(later()), "deal-invoices-missing")).toBe(before);
    });

    it("flags a VAT ID VIES did not confirm", async () => {
      const before = countOf(await adminChecks.dealChecks(later()), "deal-vat-unconfirmed");
      const s = await seed("AWAITING_ESCROW");
      await prisma.businessProfile.update({ where: { userId: s.brand.id }, data: { vatId: "DE123456789", vatIdStatus: "UNAVAILABLE" } });
      expect(countOf(await adminChecks.dealChecks(later()), "deal-vat-unconfirmed")).toBe(before + 1);
      await prisma.businessProfile.update({ where: { userId: s.brand.id }, data: { vatIdStatus: "VALID" } });
      expect(countOf(await adminChecks.dealChecks(later()), "deal-vat-unconfirmed")).toBe(before);
    });
  });
});
