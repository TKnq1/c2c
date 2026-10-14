import { beforeEach, describe, expect, it, vi } from "vitest";

const { prisma, sendVerificationEmail } = vi.hoisted(() => ({
  prisma: {
    mailLog: { findFirst: vi.fn() },
    adminAuditLog: { findMany: vi.fn(), create: vi.fn() },
    user: { findMany: vi.fn(), count: vi.fn() },
    emailVerificationToken: { deleteMany: vi.fn() },
  },
  sendVerificationEmail: vi.fn(),
}));
vi.mock("@/lib/prisma", () => ({ prisma }));
vi.mock("@/lib/email-verification", () => ({ sendVerificationEmail }));

import { audienceWhere, RESEND_ACTION, resendVerificationMails, resendVerificationTo, verificationResendAudience } from "@/lib/verification-resend";

const FIRST_FAILURE = new Date("2026-10-13T14:49:00Z");

beforeEach(() => {
  vi.clearAllMocks();
  prisma.mailLog.findFirst.mockResolvedValue({ createdAt: FIRST_FAILURE });
  prisma.adminAuditLog.findMany.mockResolvedValue([]);
  prisma.user.count.mockResolvedValue(0);
});

describe("audienceWhere", () => {
  const now = new Date("2026-10-14T10:00:00Z");

  it("takes unconfirmed, live, non-admin accounts created since the first failed mail", () => {
    const where = audienceWhere(FIRST_FAILURE, [], now);
    expect(where).toMatchObject({
      emailVerified: false,
      deletedAt: null,
      suspendedAt: null,
      isAdmin: false,
      role: { not: "ADMIN" },
      createdAt: { gte: FIRST_FAILURE },
    });
    expect(where).not.toHaveProperty("id");
  });

  it("leaves out accounts that were already sent a link and those with a link from the last 10 minutes", () => {
    const where = audienceWhere(FIRST_FAILURE, ["u1", "u2"], now);
    expect(where.id).toEqual({ notIn: ["u1", "u2"] });
    expect(where.emailVerificationTokens).toEqual({ none: { createdAt: { gt: new Date("2026-10-14T09:50:00Z") } } });
  });
});

describe("verificationResendAudience", () => {
  it("is empty while no mail has failed", async () => {
    prisma.mailLog.findFirst.mockResolvedValue(null);
    expect(await verificationResendAudience()).toEqual({ count: 0, since: null });
    expect(prisma.user.count).not.toHaveBeenCalled();
  });

  it("counts the accounts since the first failure", async () => {
    prisma.user.count.mockResolvedValue(7);
    prisma.adminAuditLog.findMany.mockResolvedValue([{ targetId: "u9" }, { targetId: null }]);
    expect(await verificationResendAudience()).toEqual({ count: 7, since: FIRST_FAILURE });
    expect(prisma.user.count.mock.calls[0][0].where.id).toEqual({ notIn: ["u9"] });
  });
});

describe("resendVerificationTo", () => {
  const user = { id: "u1", email: "a@example.com", locale: "fr" };

  it("sends in the account's language and notes it in the audit log", async () => {
    sendVerificationEmail.mockResolvedValue({ ok: true, id: "m1" });
    expect(await resendVerificationTo("admin1", user)).toEqual({ ok: true });
    expect(sendVerificationEmail).toHaveBeenCalledWith("u1", "a@example.com", "fr");
    expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({ data: { adminId: "admin1", action: RESEND_ACTION, targetId: "u1" } });
  });

  it("takes the new link back and leaves no audit entry when the mail doesn't go out", async () => {
    sendVerificationEmail.mockResolvedValue({ ok: false, error: "domain not verified" });
    expect(await resendVerificationTo("admin1", user)).toEqual({ ok: false, error: "domain not verified" });
    expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1", createdAt: { gte: expect.any(Date) } } });
    expect(prisma.adminAuditLog.create).not.toHaveBeenCalled();
  });
});

describe("resendVerificationMails", () => {
  it("sends nothing while no mail has failed", async () => {
    prisma.mailLog.findFirst.mockResolvedValue(null);
    expect(await resendVerificationMails("admin1")).toEqual({ sent: 0, failed: 0, remaining: 0 });
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("sends one batch, counts failures and reports who is left", async () => {
    prisma.user.findMany.mockResolvedValue([
      { id: "u1", email: "a@example.com", locale: "de" },
      { id: "u2", email: "b@example.com", locale: null },
    ]);
    sendVerificationEmail.mockResolvedValueOnce({ ok: true, id: "m1" }).mockResolvedValueOnce({ ok: false, error: "x" });
    prisma.user.count.mockResolvedValue(30);

    expect(await resendVerificationMails("admin1")).toEqual({ sent: 1, failed: 1, remaining: 29 });
    expect(prisma.user.findMany.mock.calls[0][0].take).toBe(25);
    expect(prisma.adminAuditLog.create).toHaveBeenCalledTimes(1);
  });
});
