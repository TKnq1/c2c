import { beforeEach, describe, expect, it, vi } from "vitest";

// The rules that keep a draft from reaching anyone: every way a request can go live checks the same
// things, and nothing but a draft's own post button turns a draft into an open request.
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  emailIsVerified: vi.fn(),
  takeToken: vi.fn(),
  notify: vi.fn(),
  prisma: {
    startupProfile: { findUniqueOrThrow: vi.fn() },
    request: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    creatorProfile: { findMany: vi.fn() },
    requestImage: { deleteMany: vi.fn(), update: vi.fn(), create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/prisma", () => ({ prisma: mocks.prisma }));
vi.mock("@/lib/verified", () => ({
  emailIsVerified: mocks.emailIsVerified,
  VERIFY_EMAIL_MESSAGE: "verify first",
}));
vi.mock("@/lib/rate-limit", () => ({ takeToken: mocks.takeToken, DAY: 86_400_000 }));
vi.mock("@/lib/notifications", () => ({ notify: mocks.notify }));
vi.mock("@/lib/moderation", () => ({ getMutualBlockedUserIds: vi.fn(async () => []), isBlocked: vi.fn(async () => false) }));
vi.mock("@/lib/visibility", () => ({ getCreatorFeed: vi.fn(async () => []) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((to: string) => {
    throw new Error(`REDIRECT ${to}`);
  }),
}));

import {
  closeRequestAction,
  createRequestAction,
  deleteDraftAction,
  duplicateRequestAction,
  reopenRequestAction,
  updateRequestAction,
} from "@/lib/actions/requests";

const brand = { user: { id: "u1", role: "STARTUP" } };
const startup = { id: "s1", companyName: "Acme" };
const draft = { id: "r1", startupId: "s1", status: "DRAFT", closedByAdmin: false, imageUrl: null, images: [] };

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
};
// What the request form posts for a request that is filled in far enough to go live.
const complete = {
  title: "Serum launch",
  description: "Show it in your routine.",
  niche: "Beauty",
  languages: "English",
  minFollowers: "0",
  productCategory: "Cosmetics",
  platform: "Instagram",
  deliverables: "1 Reel",
  budgetMin: "200",
  budgetMax: "",
  postBy: "",
  productIncluded: "false",
  photoOrder: "[]",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue(brand);
  mocks.emailIsVerified.mockResolvedValue(true);
  mocks.takeToken.mockResolvedValue(true);
  mocks.prisma.startupProfile.findUniqueOrThrow.mockResolvedValue(startup);
  mocks.prisma.request.count.mockResolvedValue(0);
  mocks.prisma.request.findUnique.mockResolvedValue(draft);
  mocks.prisma.creatorProfile.findMany.mockResolvedValue([]);
  mocks.prisma.request.updateMany.mockResolvedValue({ count: 1 });
  mocks.prisma.$transaction.mockImplementation(async (fn: (tx: typeof mocks.prisma) => unknown) => fn(mocks.prisma));
});

describe("a draft can't be put live around the posting checks", () => {
  it("can't be reopened", async () => {
    await expect(reopenRequestAction("r1")).rejects.toThrow(/draft/i);
    expect(mocks.prisma.request.update).not.toHaveBeenCalled();
  });

  it("can't be closed", async () => {
    await expect(closeRequestAction("r1")).rejects.toThrow(/draft/i);
    expect(mocks.prisma.request.update).not.toHaveBeenCalled();
  });

  it("can't be copied", async () => {
    await expect(duplicateRequestAction("r1")).rejects.toThrow(/draft/i);
    expect(mocks.prisma.request.create).not.toHaveBeenCalled();
  });

  it("is only deleted by its own brand, and only while it is a draft", async () => {
    mocks.prisma.request.deleteMany.mockResolvedValue({ count: 1 });
    await deleteDraftAction("r1");
    expect(mocks.prisma.request.deleteMany).toHaveBeenCalledWith({
      where: { id: "r1", status: "DRAFT", startup: { userId: "u1" } },
    });

    mocks.prisma.request.deleteMany.mockResolvedValue({ count: 0 });
    await expect(deleteDraftAction("r1")).rejects.toThrow();
  });
});

describe("posting a draft", () => {
  it("needs a confirmed email, and says so with a code the form can act on", async () => {
    mocks.emailIsVerified.mockResolvedValue(false);
    const result = await updateRequestAction("r1", undefined, form({ ...complete, intent: "post" }));
    expect(result).toEqual({ error: "verify first", code: "VERIFY_EMAIL" });
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("needs everything a new request needs", async () => {
    const result = await updateRequestAction("r1", undefined, form({ ...complete, title: "", intent: "post" }));
    expect(result?.error).toMatch(/title/i);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("counts against the open-request and daily limits", async () => {
    mocks.prisma.request.count.mockResolvedValue(50);
    expect((await updateRequestAction("r1", undefined, form({ ...complete, intent: "post" })))?.error).toMatch(/50 open/);

    mocks.prisma.request.count.mockResolvedValue(0);
    mocks.takeToken.mockResolvedValue(false);
    expect((await updateRequestAction("r1", undefined, form({ ...complete, intent: "post" })))?.error).toMatch(/limit/);
    expect(mocks.prisma.$transaction).not.toHaveBeenCalled();
  });

  it("goes live in one guarded write that can only hit a draft, and tells matching creators", async () => {
    await expect(updateRequestAction("r1", undefined, form({ ...complete, intent: "post" }))).rejects.toThrow("REDIRECT /dashboard/startup");
    const call = mocks.prisma.request.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({ id: "r1", status: "DRAFT" });
    expect(call.data.status).toBe("OPEN");
    expect(call.data.createdAt).toBeInstanceOf(Date);
    expect(mocks.prisma.creatorProfile.findMany).toHaveBeenCalledTimes(1);
  });

  it("is not posted twice when it was posted in another tab meanwhile", async () => {
    mocks.prisma.request.updateMany.mockResolvedValue({ count: 0 });
    const result = await updateRequestAction("r1", undefined, form({ ...complete, intent: "post" }));
    expect(result?.error).toMatch(/changed in the meantime/);
    expect(mocks.prisma.creatorProfile.findMany).not.toHaveBeenCalled();
  });
});

describe("saving a draft", () => {
  it("needs no confirmed email and no more than a draft's fields", async () => {
    mocks.emailIsVerified.mockResolvedValue(false);
    const bare = { ...complete, title: "", description: "", deliverables: "", budgetMin: "", intent: "draft" };
    await expect(updateRequestAction("r1", undefined, form(bare))).rejects.toThrow("REDIRECT /dashboard/startup?status=DRAFT");
    const call = mocks.prisma.request.updateMany.mock.calls[0][0];
    expect(call.data.status).toBeUndefined();
    expect(call.where).toEqual({ id: "r1", status: "DRAFT" });
    // Nothing went out to creators, and the posting allowance wasn't used.
    expect(mocks.prisma.creatorProfile.findMany).not.toHaveBeenCalled();
    expect(mocks.takeToken).toHaveBeenCalledWith("save-draft", "u1", 60, 86_400_000);
    expect(mocks.takeToken).not.toHaveBeenCalledWith("create-request", expect.anything(), expect.anything(), expect.anything());
  });

  it("a new draft is stored as DRAFT without notifying anyone", async () => {
    mocks.emailIsVerified.mockResolvedValue(false);
    const bare = { ...complete, title: "", description: "", deliverables: "", budgetMin: "", intent: "draft" };
    await expect(createRequestAction(undefined, form(bare))).rejects.toThrow("REDIRECT /dashboard/startup?status=DRAFT");
    expect(mocks.prisma.request.create.mock.calls[0][0].data.status).toBe("DRAFT");
    expect(mocks.prisma.creatorProfile.findMany).not.toHaveBeenCalled();
  });

  it("is capped, so photos in drafts can't pile up in the database", async () => {
    mocks.prisma.request.count.mockResolvedValue(20);
    const result = await createRequestAction(undefined, form({ ...complete, intent: "draft" }));
    expect(result?.error).toMatch(/20 drafts/);
    expect(mocks.prisma.request.create).not.toHaveBeenCalled();
  });
});

describe("a request that is already posted", () => {
  it("just saves, whatever intent the form sends", async () => {
    mocks.prisma.request.findUnique.mockResolvedValue({ ...draft, status: "OPEN" });
    await expect(updateRequestAction("r1", undefined, form({ ...complete, intent: "draft" }))).rejects.toThrow(
      "REDIRECT /dashboard/startup/requests/r1",
    );
    const call = mocks.prisma.request.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({ id: "r1", status: "OPEN" });
    expect(call.data.status).toBeUndefined();
  });
});
