// What people are told about a deal (in the app and by e-mail) and the correction of issued invoices, against a real Postgres.
// Like the lifecycle test it only runs when DEAL_TEST_DATABASE_URL is set:
//   DEAL_TEST_DATABASE_URL=postgresql://user:pw@localhost:5432/c2c_test npx vitest run src/lib/deals/documents.integration.test.ts
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { dealAt } from "@/lib/deals/test-helpers";

const DB = process.env.DEAL_TEST_DATABASE_URL;

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => "en", getT: async () => (key: string) => key, getMessages: async () => ({}) }));
vi.mock("@/lib/admin-digest", () => ({ notifyUrgent: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => ({ ok: true, id: "mail_test" })) }));
vi.mock("@/lib/stripe", () => ({ stripe: { transfers: { create: vi.fn(), list: vi.fn() }, refunds: { create: vi.fn() } } }));

type Mock = ReturnType<typeof vi.fn>;
type Db = typeof import("@/lib/prisma").prisma;
let prisma: Db;
let sendEmail: Mock;
let authMock: Mock;
let notify: typeof import("@/lib/deals/notify");
let issue: typeof import("@/lib/billing/issue");
let correct: typeof import("@/lib/billing/correct");
let announce: typeof import("@/lib/billing/announce");
let adminActions: typeof import("@/lib/actions/deal-admin");

const created: string[] = [];
const PASSWORD = "Correct-horse-1";

async function seed(target: Parameters<typeof dealAt>[2], options: Parameters<typeof dealAt>[3] = {}) {
  const s = await dealAt(prisma, created, target, options);
  sendEmail.mockClear();
  return s;
}

// A completed deal with both documents issued.
async function invoiced() {
  const s = await seed("COMPLETED");
  const result = await issue.issueDealInvoices(s.dealId);
  expect(result.issued).toHaveLength(2);
  const invoices = await prisma.invoice.findMany({ where: { dealId: s.dealId }, orderBy: { number: "asc" } });
  const invoice = invoices.find((i) => i.kind === "BRAND_INVOICE")!;
  const credit = invoices.find((i) => i.kind === "CREATOR_CREDIT_NOTE")!;
  return { ...s, invoice, credit };
}

const sequenceOf = (number: string) => Number(number.split("-")[2]);

describe.skipIf(!DB)("notices and documents (needs a database)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.IMPRINT_VAT_ID = "DE123456789";
    process.env.REQUIRE_VERIFIED_EMAIL = "0";
    process.env.REQUIRE_ADMIN_2FA = "0";
    process.env.BRAND_DEALS_ENABLED = "1";
    prisma = (await import("@/lib/prisma")).prisma;
    sendEmail = (await import("@/lib/email")).sendEmail as unknown as Mock;
    authMock = (await import("@/lib/auth")).auth as unknown as Mock;
    notify = await import("@/lib/deals/notify");
    issue = await import("@/lib/billing/issue");
    correct = await import("@/lib/billing/correct");
    announce = await import("@/lib/billing/announce");
    adminActions = await import("@/lib/actions/deal-admin");
  });

  beforeEach(async () => {
    await prisma.deal.updateMany({ data: { status: "CANCELLED" } });
    sendEmail.mockReset().mockResolvedValue({ ok: true, id: "mail_test" });
  });

  afterAll(async () => {
    if (!prisma) return;
    const mine = await prisma.deal.findMany({ where: { interest: { request: { startup: { userId: { in: created } } } } }, select: { id: true } });
    await prisma.invoice.deleteMany({ where: { dealId: { in: mine.map((d) => d.id) } } });
    await prisma.adminAuditLog.deleteMany({ where: { adminId: { in: created } } });
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  describe("notices by e-mail", () => {
    const link = (dealId: string) => `/dashboard/deals/${dealId}`;
    const inApp = (userId: string, text: string) => prisma.notification.count({ where: { userId, message: { contains: text } } });

    it("sends a deadline reminder as an e-mail as well, to an address that is confirmed", async () => {
      const s = await seed("IN_PRODUCTION");
      const creator = await prisma.user.findUniqueOrThrow({ where: { id: s.creator.id } });

      await notify.notifyDealParty(s.creator.id, "reminder_draft_due", { title: "Autumn launch", date: new Date("2026-10-08T10:00:00Z"), hours: 24, brand: "Glow GmbH" }, link(s.dealId));

      expect(await inApp(s.creator.id, "Your draft for “Autumn launch” was due")).toBe(1);
      expect(sendEmail).toHaveBeenCalledTimes(1);
      const mail = sendEmail.mock.calls[0][0] as { to: string; subject: string; text: string; html: string };
      expect(mail.to).toBe(creator.email);
      expect(mail.subject).toBe("Reminder: your draft for “Autumn launch” is due");
      expect(mail.text).toContain("Your deal needs you.");
      expect(mail.text).toContain(`/dashboard/deals/${s.dealId}`);
      expect(mail.text).toMatch(/^Your deal needs you\./);
    });

    it("does not let the payment setting switch off a notice that can cost a deal", async () => {
      const s = await seed("IN_PRODUCTION");
      await prisma.user.update({ where: { id: s.creator.id }, data: { notifyPayments: false } });

      await notify.notifyDealParty(s.creator.id, "reminder_post_due", { title: "Autumn launch", hours: 24, brand: "Glow GmbH" }, link(s.dealId));
      await notify.notifyDealParty(s.creator.id, "draft_approved", { title: "Autumn launch", brand: "Glow GmbH" }, link(s.dealId));

      // The reminder arrives, the routine step respects the setting.
      expect(await inApp(s.creator.id, "posting deadline")).toBe(1);
      expect(await inApp(s.creator.id, "approved your draft")).toBe(0);
      expect(sendEmail).toHaveBeenCalledTimes(1);
    });

    it("keeps routine steps in the app", async () => {
      const s = await seed("IN_PRODUCTION");

      await notify.notifyDealParty(s.brand.id, "draft_submitted", { title: "Autumn launch", creator: "Mia", version: 1, date: new Date() }, link(s.dealId));
      await notify.notifyDealParty(s.brand.id, "invoice_issued_brand", { title: "Autumn launch", number: "RE-2026-000001" }, "/dashboard/invoices/x");

      expect(await inApp(s.brand.id, "submitted draft")).toBe(1);
      expect(await inApp(s.brand.id, "RE-2026-000001")).toBe(1);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("writes to nobody whose address is not confirmed, and to nobody who is suspended or gone", async () => {
      const s = await seed("IN_PRODUCTION");
      const params = { title: "Autumn launch", hours: 24, brand: "Glow GmbH" };

      await prisma.user.update({ where: { id: s.creator.id }, data: { emailVerified: false } });
      await notify.notifyDealParty(s.creator.id, "reminder_post_due", params, link(s.dealId));
      await prisma.user.update({ where: { id: s.creator.id }, data: { emailVerified: true, suspendedAt: new Date() } });
      await notify.notifyDealParty(s.creator.id, "reminder_post_due", params, link(s.dealId));
      await prisma.user.update({ where: { id: s.creator.id }, data: { suspendedAt: null, deletedAt: new Date() } });
      await notify.notifyDealParty(s.creator.id, "reminder_post_due", params, link(s.dealId));

      expect(sendEmail).not.toHaveBeenCalled();
      // The app still has them: only the mail is held back.
      expect(await inApp(s.creator.id, "posting deadline")).toBe(3);
    });

    it("writes in the language of the account", async () => {
      const s = await seed("IN_PRODUCTION");
      await prisma.user.update({ where: { id: s.brand.id }, data: { locale: "de" } });

      await notify.notifyDealParty(s.brand.id, "reminder_review_due", { title: "Herbst-Launch", date: new Date("2026-10-12T10:00:00Z") }, link(s.dealId));

      const mail = sendEmail.mock.calls[0][0] as { subject: string; text: string };
      expect(mail.subject).toBe("Erinnerung: Prüfe den Entwurf für „Herbst-Launch“");
      expect(mail.text).toContain("Dein Deal braucht dich.");
      expect(await inApp(s.brand.id, "Prüfe den Entwurf")).toBe(1);
    });

    it("never fails the step it belongs to when the mail does not go out", async () => {
      const s = await seed("IN_PRODUCTION");
      sendEmail.mockRejectedValue(new Error("Resend is down"));

      await expect(notify.notifyDealParty(s.creator.id, "reminder_post_due", { title: "Autumn launch", hours: 24, brand: "Glow GmbH" }, link(s.dealId))).resolves.toBeUndefined();

      expect(await inApp(s.creator.id, "posting deadline")).toBe(1);
    });
  });

  describe("correcting an issued invoice", () => {
    const reason = "The brand's address was wrong on the invoice.";

    it("cancels the invoice and issues a replacement, both with the next numbers", async () => {
      const s = await invoiced();

      const result = await announce.correctAndAnnounce({ invoiceId: s.invoice.id, reason, patch: { recipient: { name: "Glow Cosmetics GmbH", addressLines: ["Neue Straße 2", "10117 Berlin"] } } });
      if (!result.ok) throw new Error(result.error);

      const original = await prisma.invoice.findUniqueOrThrow({ where: { id: s.invoice.id } });
      const cancellation = await prisma.invoice.findUniqueOrThrow({ where: { id: result.cancellation.id } });
      const replacement = await prisma.invoice.findUniqueOrThrow({ where: { id: result.replacement.id } });

      expect(original).toMatchObject({ status: "CANCELLED", cancelReason: reason, revision: 0, netCents: 100_000 });
      expect(original.cancelledAt).not.toBeNull();
      expect(cancellation).toMatchObject({ status: "ISSUED", kind: "BRAND_INVOICE", revision: 1, cancelsInvoiceId: original.id, netCents: -100_000, vatCents: -19_000, grossCents: -119_000 });
      expect(replacement).toMatchObject({ status: "ISSUED", kind: "BRAND_INVOICE", revision: 2, cancelsInvoiceId: null, netCents: 100_000, vatCents: 19_000, grossCents: 119_000 });
      expect(replacement.recipient).toMatchObject({ name: "Glow Cosmetics GmbH", addressLines: ["Neue Straße 2", "10117 Berlin"] });
      // The books: the original and its cancellation net out, the replacement is the one that counts.
      expect(original.grossCents + cancellation.grossCents).toBe(0);
      // Gapless: the cancellation and the replacement are the next two numbers of the series.
      expect(sequenceOf(cancellation.number)).toBe(sequenceOf(original.number) + 1);
      expect(sequenceOf(replacement.number)).toBe(sequenceOf(original.number) + 2);
      expect(cancellation.number.startsWith("RE-")).toBe(true);
      // The credit note is untouched, and no further document is issued for the deal.
      expect(await prisma.invoice.findUniqueOrThrow({ where: { id: s.credit.id } })).toMatchObject({ status: "ISSUED", revision: 0 });
      expect((await issue.issueDealInvoices(s.dealId)).issued).toEqual([]);
      expect(await prisma.invoice.count({ where: { dealId: s.dealId } })).toBe(4);
      // The recipient hears about it in the app, not by mail.
      const notice = await prisma.notification.findFirstOrThrow({ where: { userId: s.brand.id, message: { contains: "was corrected" } } });
      expect(notice.message).toContain(original.number);
      expect(notice.message).toContain(replacement.number);
      expect(notice.link).toBe(`/dashboard/invoices/${replacement.id}`);
      expect(sendEmail).not.toHaveBeenCalled();
    });

    it("does not correct the same document twice, and corrects the replacement again", async () => {
      const s = await invoiced();
      const first = await correct.correctInvoice({ invoiceId: s.invoice.id, reason, patch: { recipient: { name: "Glow Cosmetics GmbH" } } });
      if (!first.ok) throw new Error(first.error);

      const again = await correct.correctInvoice({ invoiceId: s.invoice.id, reason, patch: { recipient: { name: "Another GmbH" } } });
      expect(again).toEqual({ ok: false, error: expect.stringContaining("can't be corrected") });
      const ofCancellation = await correct.correctInvoice({ invoiceId: first.cancellation.id, reason, patch: { recipient: { name: "Another GmbH" } } });
      expect(ofCancellation.ok).toBe(false);

      const second = await correct.correctInvoice({ invoiceId: first.replacement.id, reason: "The name had a typo as well.", patch: { recipient: { name: "Glow Cosmetics AG" } } });
      if (!second.ok) throw new Error(second.error);
      const revisions = (await prisma.invoice.findMany({ where: { dealId: s.dealId, kind: "BRAND_INVOICE" }, orderBy: { revision: "asc" } })).map((i) => [i.revision, i.status, i.grossCents]);
      expect(revisions).toEqual([
        [0, "CANCELLED", 119_000],
        [1, "ISSUED", -119_000],
        [2, "CANCELLED", 119_000],
        [3, "ISSUED", -119_000],
        [4, "ISSUED", 119_000],
      ]);
      // Whatever the chain, the books add up to exactly one invoice: every cancellation offsets the document it cancelled.
      const sum = (await prisma.invoice.aggregate({ where: { dealId: s.dealId, kind: "BRAND_INVOICE" }, _sum: { grossCents: true } }))._sum.grossCents;
      expect(sum).toBe(119_000);
    });

    it("lets only one of two simultaneous corrections through, without losing a number", async () => {
      const s = await invoiced();
      const attempt = (name: string) => correct.correctInvoice({ invoiceId: s.invoice.id, reason, patch: { recipient: { name } } });

      const results = await Promise.all([attempt("Glow One GmbH"), attempt("Glow Two GmbH")]);

      expect(results.filter((r) => r.ok)).toHaveLength(1);
      const winner = results.find((r) => r.ok)!;
      if (!winner.ok) throw new Error("unreachable");
      expect(sequenceOf(winner.replacement.number)).toBe(sequenceOf(winner.cancellation.number) + 1);
      expect(await prisma.invoice.count({ where: { dealId: s.dealId, kind: "BRAND_INVOICE" } })).toBe(3);
    });

    it("refuses a correction that would break the document, and changes nothing", async () => {
      const s = await invoiced();
      const numbersBefore = await prisma.invoiceSequence.findMany({ orderBy: { key: "asc" } });

      for (const patch of [{ recipient: { name: "G" } }, { recipient: { vatId: "ATU12345678" } }, { issuer: { vatId: "", taxNumber: "" } }, { recipient: { name: "Glow GmbH" } }]) {
        expect((await correct.correctInvoice({ invoiceId: s.invoice.id, reason, patch })).ok).toBe(false);
      }
      expect((await correct.correctInvoice({ invoiceId: "does-not-exist", reason, patch: { recipient: { name: "Other GmbH" } } })).ok).toBe(false);

      expect(await prisma.invoice.findUniqueOrThrow({ where: { id: s.invoice.id } })).toMatchObject({ status: "ISSUED", cancelledAt: null });
      expect(await prisma.invoiceSequence.findMany({ orderBy: { key: "asc" } })).toEqual(numbersBefore);
    });
  });

  describe("the admin action", () => {
    async function admin() {
      const user = await prisma.user.create({
        data: { email: `admin-${Date.now()}@test.local`, passwordHash: await (await import("@/lib/password")).hashPassword(PASSWORD), role: "ADMIN", emailVerified: true },
      });
      created.push(user.id);
      authMock.mockResolvedValue({ user: { id: user.id, role: "ADMIN", email: user.email, isAdmin: true }, expires: "2099-01-01" });
      return user;
    }
    const reason = "The brand told us the address and name by e-mail.";
    const fields = { reason, name: "Glow Cosmetics GmbH", address: "Neue Straße 2\n10117 Berlin", vatId: "", taxNumber: "12/345/67890" };

    it("corrects the brand on an invoice, behind the password, and writes it into the audit log", async () => {
      const s = await invoiced();
      const user = await admin();

      expect(await adminActions.correctInvoiceAction(s.invoice.id, fields, "wrong password")).toEqual({ error: "Incorrect password." });
      expect(await adminActions.correctInvoiceAction(s.invoice.id, { ...fields, reason: "short" }, PASSWORD)).toMatchObject({ error: expect.stringContaining("at least a sentence") });
      expect(await prisma.invoice.count({ where: { dealId: s.dealId } })).toBe(2);

      expect(await adminActions.correctInvoiceAction(s.invoice.id, fields, PASSWORD)).toEqual({});

      const replacement = await prisma.invoice.findFirstOrThrow({ where: { dealId: s.dealId, kind: "BRAND_INVOICE", revision: 2 } });
      expect(replacement.recipient).toMatchObject({ name: "Glow Cosmetics GmbH", addressLines: ["Neue Straße 2", "10117 Berlin"] });
      expect(await prisma.adminAuditLog.count({ where: { adminId: user.id, action: "invoice.correct", targetId: s.invoice.id } })).toBe(1);
    });

    it("corrects the creator on a credit note, since there the creator is the one who issues it", async () => {
      const s = await invoiced();
      await admin();

      expect(await adminActions.correctInvoiceAction(s.credit.id, { ...fields, name: "Mia Summers-Berg", address: "Linienstraße 7\n10119 Berlin" }, PASSWORD)).toEqual({});

      const replacement = await prisma.invoice.findFirstOrThrow({ where: { dealId: s.dealId, kind: "CREATOR_CREDIT_NOTE", revision: 2 } });
      expect(replacement.issuer).toMatchObject({ name: "Mia Summers-Berg", addressLines: ["Linienstraße 7", "10119 Berlin"] });
      expect(replacement.recipient).toMatchObject({ vatId: "DE123456789" });
    });

    it("refuses anyone who is not an admin", async () => {
      const s = await invoiced();
      authMock.mockResolvedValue({ user: { id: s.brand.id, role: "STARTUP", email: "x@test.local", isAdmin: false }, expires: "2099-01-01" });

      expect(await adminActions.correctInvoiceAction(s.invoice.id, fields, PASSWORD)).toEqual({ error: "Not authorized." });
      expect(await prisma.invoice.count({ where: { dealId: s.dealId } })).toBe(2);
    });
  });
});
