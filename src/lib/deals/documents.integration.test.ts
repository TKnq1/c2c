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
let pdfRoute: typeof import("@/app/api/invoices/[id]/pdf/route");
let exportRoute: typeof import("@/app/api/admin/export/invoices/route");
let contractRoute: typeof import("@/app/api/deals/[id]/contract/route");

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
    pdfRoute = await import("@/app/api/invoices/[id]/pdf/route");
    exportRoute = await import("@/app/api/admin/export/invoices/route");
    contractRoute = await import("@/app/api/deals/[id]/contract/route");
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
      // The recipient hears about it in the app, and gets the PDFs by mail (the content of that mail is checked below).
      const notice = await prisma.notification.findFirstOrThrow({ where: { userId: s.brand.id, message: { contains: "was corrected" } } });
      expect(notice.message).toContain(original.number);
      expect(notice.message).toContain(replacement.number);
      expect(notice.link).toBe(`/dashboard/invoices/${replacement.id}`);
      expect(sendEmail).toHaveBeenCalledTimes(1);
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

  describe("the PDF of a document", () => {
    type Mail = { to: string; subject: string; text: string; attachments?: { filename: string; content: Uint8Array }[] };
    const mails = () => sendEmail.mock.calls.map(([mail]) => mail as Mail);
    const isPdf = (content: Uint8Array) => Buffer.from(content.slice(0, 5)).toString() === "%PDF-";

    it("goes to each recipient with the document it was issued for", async () => {
      const s = await seed("COMPLETED");
      const brand = await prisma.user.findUniqueOrThrow({ where: { id: s.brand.id } });
      const creator = await prisma.user.findUniqueOrThrow({ where: { id: s.creator.id } });

      await announce.issueAndAnnounce(s.dealId);

      const sent = mails();
      expect(sent).toHaveLength(2);
      const toBrand = sent.find((m) => m.to === brand.email)!;
      const toCreator = sent.find((m) => m.to === creator.email)!;
      expect(toBrand.subject).toMatch(/^Your invoice RE-\d{4}-\d{6}$/);
      expect(toBrand.attachments).toHaveLength(1);
      expect(toBrand.attachments![0].filename).toMatch(/^RE-\d{4}-\d{6}\.pdf$/);
      expect(isPdf(toBrand.attachments![0].content)).toBe(true);
      expect(toCreator.subject).toMatch(/^Your credit note GS-\d{4}-\d{6}$/);
      expect(toCreator.attachments![0].filename).toMatch(/^GS-\d{4}-\d{6}\.pdf$/);
      // Nothing more is sent when the daily job comes by again.
      await announce.issueAndAnnounce(s.dealId);
      expect(sendEmail).toHaveBeenCalledTimes(2);
    });

    it("goes out with a correction as the cancellation and the replacement", async () => {
      const s = await invoiced();
      const brand = await prisma.user.findUniqueOrThrow({ where: { id: s.brand.id } });

      const result = await announce.correctAndAnnounce({ invoiceId: s.invoice.id, reason: "The brand's address was wrong.", patch: { recipient: { name: "Glow Cosmetics GmbH" } } });
      if (!result.ok) throw new Error(result.error);

      expect(mails()).toHaveLength(1);
      const [mail] = mails();
      expect(mail.to).toBe(brand.email);
      expect(mail.subject).toBe(`Document corrected: ${s.invoice.number} replaced by ${result.replacement.number}`);
      expect(mail.attachments!.map((a) => a.filename)).toEqual([`${result.cancellation.number}.pdf`, `${result.replacement.number}.pdf`]);
      expect(mail.attachments!.every((a) => isPdf(a.content))).toBe(true);
    });

    it("is not mailed to an address that is not confirmed, but the documents are in the app all the same", async () => {
      const s = await seed("COMPLETED");
      await prisma.user.update({ where: { id: s.brand.id }, data: { emailVerified: false } });

      await announce.issueAndAnnounce(s.dealId);

      expect(mails().map((m) => m.to)).not.toContain((await prisma.user.findUniqueOrThrow({ where: { id: s.brand.id } })).email);
      expect(await prisma.invoice.count({ where: { dealId: s.dealId, recipientUserId: s.brand.id } })).toBe(1);
      expect(await prisma.notification.count({ where: { userId: s.brand.id, message: { contains: "invoice RE-" } } })).toBe(1);
    });

    describe("the download", () => {
      const call = (id: string) => pdfRoute.GET(new Request(`http://localhost/api/invoices/${id}/pdf`), { params: Promise.resolve({ id }) } as never);
      const as = (user: { id: string; role: string; isAdmin?: boolean } | null) => authMock.mockResolvedValue(user ? { user: { email: "x@test.local", isAdmin: false, ...user }, expires: "2099-01-01" } : null);

      it("gives the recipient their PDF, and only theirs", async () => {
        const s = await invoiced();

        as({ id: s.brand.id, role: "STARTUP" });
        const response = await call(s.invoice.id);
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe("application/pdf");
        expect(response.headers.get("content-disposition")).toBe(`attachment; filename="${s.invoice.number}.pdf"`);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        expect(response.headers.get("x-content-type-options")).toBe("nosniff");
        expect(Buffer.from(await response.arrayBuffer()).subarray(0, 5).toString()).toBe("%PDF-");

        // The creator cannot get the brand's invoice, and gets their own credit note.
        as({ id: s.creator.id, role: "CREATOR" });
        expect((await call(s.invoice.id)).status).toBe(404);
        expect((await call(s.credit.id)).status).toBe(200);
      });

      it("answers a stranger and a missing document the same, and asks a visitor to sign in", async () => {
        const s = await invoiced();
        const stranger = await seed("AWAITING_ESCROW");

        as({ id: stranger.brand.id, role: "STARTUP" });
        expect((await call(s.invoice.id)).status).toBe(404);
        expect((await call("does-not-exist")).status).toBe(404);
        as(null);
        expect((await call(s.invoice.id)).status).toBe(401);
      });

      it("lets an admin open any document, and limits how often one account can download", async () => {
        const s = await invoiced();
        as({ id: s.brand.id, role: "ADMIN", isAdmin: true });
        expect((await call(s.invoice.id)).status).toBe(200);

        const downloader = await seed("AWAITING_ESCROW");
        as({ id: downloader.brand.id, role: "STARTUP" });
        await prisma.rateLimitHit.createMany({ data: Array.from({ length: 60 }, () => ({ bucket: "invoice-pdf", key: downloader.brand.id })) });
        // Not their document: refused before the limit is even looked at, so nothing is counted for a stranger.
        expect((await call(s.invoice.id)).status).toBe(404);
        const own = await invoiced();
        as({ id: own.brand.id, role: "STARTUP" });
        await prisma.rateLimitHit.createMany({ data: Array.from({ length: 60 }, () => ({ bucket: "invoice-pdf", key: own.brand.id })) });
        expect((await call(own.invoice.id)).status).toBe(429);
        await prisma.rateLimitHit.deleteMany({ where: { bucket: "invoice-pdf", key: { in: [downloader.brand.id, own.brand.id] } } });
      });
    });
  });

  describe("the contract as a PDF", () => {
    const call = (id: string) => contractRoute.GET(new Request(`http://localhost/api/deals/${id}/contract`), { params: Promise.resolve({ id }) } as never);
    const as = (user: { id: string; role: string; isAdmin?: boolean } | null) => authMock.mockResolvedValue(user ? { user: { email: "x@test.local", isAdmin: false, ...user }, expires: "2099-01-01" } : null);

    it("goes to both parties, with the frozen terms, and to an admin", async () => {
      const s = await seed("IN_PRODUCTION");

      for (const who of [{ id: s.brand.id, role: "STARTUP" }, { id: s.creator.id, role: "CREATOR" }, { id: s.brand.id, role: "ADMIN", isAdmin: true }]) {
        as(who);
        const response = await call(s.dealId);
        expect(response.status).toBe(200);
        expect(response.headers.get("content-type")).toBe("application/pdf");
        expect(response.headers.get("content-disposition")).toBe(`attachment; filename="comtor-vertrag-${s.dealId}.pdf"`);
        expect(response.headers.get("cache-control")).toBe("private, no-store");
        const bytes = Buffer.from(await response.arrayBuffer());
        expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
        const pdf = await (await import("pdf-lib")).PDFDocument.load(bytes);
        expect(pdf.getTitle()).toBe("Kooperationsvertrag Autumn launch");
      }
    });

    it("is not for anyone else, and a visitor is asked to sign in", async () => {
      const s = await seed("IN_PRODUCTION");
      const stranger = await seed("AWAITING_ESCROW");

      as({ id: stranger.brand.id, role: "STARTUP" });
      expect((await call(s.dealId)).status).toBe(404);
      as({ id: stranger.creator.id, role: "CREATOR" });
      expect((await call(s.dealId)).status).toBe(404);
      expect((await call("does-not-exist")).status).toBe(404);
      as(null);
      expect((await call(s.dealId)).status).toBe(401);
    });

    it("limits how often one account can download", async () => {
      const s = await seed("IN_PRODUCTION");
      as({ id: s.brand.id, role: "STARTUP" });
      await prisma.rateLimitHit.createMany({ data: Array.from({ length: 60 }, () => ({ bucket: "contract-pdf", key: s.brand.id })) });
      expect((await call(s.dealId)).status).toBe(429);
      await prisma.rateLimitHit.deleteMany({ where: { bucket: "contract-pdf", key: s.brand.id } });
    });
  });

  describe("the exports for the tax advisor", () => {
    const get = (query: string) => exportRoute.GET(new Request(`http://localhost/api/admin/export/invoices?${query}`));
    const thisMonth = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Berlin", year: "numeric", month: "2-digit" }).format(new Date());
    const thisQuarter = `${thisMonth.slice(0, 4)}-Q${Math.floor((Number(thisMonth.slice(5)) - 1) / 3) + 1}`;

    async function signIn(role: "ADMIN" | "STARTUP") {
      const user = await prisma.user.create({
        data: { email: `export-${Date.now()}-${Math.random().toString(36).slice(2, 6)}@test.local`, passwordHash: "x", role, emailVerified: true },
      });
      created.push(user.id);
      authMock.mockResolvedValue({ user: { id: user.id, role, email: user.email, isAdmin: role === "ADMIN" }, expires: "2099-01-01" });
      return user;
    }

    it("lists the month's documents, and logs who downloaded it", async () => {
      const s = await invoiced();
      const admin = await signIn("ADMIN");

      const response = await get(`month=${thisMonth}`);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toBe("text/csv; charset=utf-8");
      expect(response.headers.get("content-disposition")).toBe(`attachment; filename="comtor-belege-${thisMonth}.csv"`);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const csv = await response.text();
      expect(csv).toContain(s.invoice.number);
      expect(csv).toContain(s.credit.number);
      expect(csv).toContain("Rechnung");
      expect(csv).toContain("Inland, mit USt");
      expect(await prisma.adminAuditLog.count({ where: { adminId: admin.id, action: "export.invoices", targetId: thisMonth } })).toBe(1);
    });

    it("shows a correction as the cancelled document, its cancellation and the replacement", async () => {
      const s = await invoiced();
      await signIn("ADMIN");
      const result = await correct.correctInvoice({ invoiceId: s.invoice.id, reason: "The brand's address was wrong.", patch: { recipient: { name: "Glow Cosmetics GmbH" } } });
      if (!result.ok) throw new Error(result.error);

      const csv = await (await get(`month=${thisMonth}`)).text();
      const lines = csv.split("\r\n");
      expect(lines.find((l) => l.startsWith(`${s.invoice.number};`))).toContain(";Storniert;");
      expect(lines.find((l) => l.startsWith(`${result.cancellation.number};`))).toMatch(/^[^;]+;Stornorechnung;.*;-1000,00;19;-190,00;-1190,00;Ausgestellt;/);
      expect(lines.find((l) => l.startsWith(`${result.cancellation.number};`))).toContain(`;${s.invoice.number};`);
      expect(lines.find((l) => l.startsWith(`${result.replacement.number};`))).toContain("Glow Cosmetics GmbH");
    });

    it("gives the summary of the services to EU businesses for a quarter", async () => {
      await signIn("ADMIN");
      const response = await get(`report=zm&quarter=${thisQuarter}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("content-disposition")).toBe(`attachment; filename="comtor-zm-${thisQuarter}.csv"`);
      expect(await response.text()).toContain("Land;USt-IdNr. des Leistungsempfängers;");
    });

    it("is for admins only, and wants a valid period", async () => {
      await signIn("STARTUP");
      expect((await get(`month=${thisMonth}`)).status).toBe(403);
      authMock.mockResolvedValue(null);
      expect((await get(`month=${thisMonth}`)).status).toBe(403);

      await signIn("ADMIN");
      expect((await get("month=2026-13")).status).toBe(400);
      expect((await get("")).status).toBe(400);
      expect((await get(`report=zm&month=${thisMonth}`)).status).toBe(400);
      expect((await get("report=zm&quarter=2026-Q5")).status).toBe(400);
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
