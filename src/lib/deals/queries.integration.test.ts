// Whose turn the deal lists and the badge on the Deals tab say it is, against a real Postgres (see lifecycle.integration.test.ts
// for how to run these): a screenshot proof the brand has not confirmed is the brand's turn.
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { dealAt } from "@/lib/deals/test-helpers";

const DB = process.env.DEAL_TEST_DATABASE_URL;

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

type Db = typeof import("@/lib/prisma").prisma;
let prisma: Db;
let queries: typeof import("@/lib/deals/queries");
let nextStepFor: typeof import("@/lib/deals/list-next-step");

const created: string[] = [];

describe.skipIf(!DB)("deal lists and the action badge (needs a database)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    prisma = (await import("@/lib/prisma")).prisma;
    queries = await import("@/lib/deals/queries");
    nextStepFor = await import("@/lib/deals/list-next-step");
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  it("is the brand's turn while a screenshot proof waits, and nobody's once it is confirmed", async () => {
    const s = await dealAt(prisma, created, "IN_PRODUCTION");
    await prisma.deal.update({ where: { id: s.dealId }, data: { status: "POST_SUBMITTED" } });
    const post = await prisma.dealPost.create({ data: { dealId: s.dealId, format: "TIKTOK_VIDEO", source: "PROOF", status: "PENDING" } });

    const [deal] = await queries.listDealsForUser(s.brand.id, "STARTUP");
    expect(deal.proofPending).toBe(true);
    expect(queries.isMyTurn(deal, "STARTUP")).toBe(true);
    expect(queries.isMyTurn(deal, "CREATOR")).toBe(false);
    expect(nextStepFor.nextStepForListItem(deal, "STARTUP", "en")).toMatchObject({ key: "next.submittedProof.brand", mine: true });
    expect(await queries.getDealActionCount(s.brand.id, "STARTUP")).toBe(1);
    expect(await queries.getDealActionCount(s.creator.id, "CREATOR")).toBe(0);

    await prisma.dealPost.update({ where: { id: post.id }, data: { status: "VERIFIED", verifiedAt: new Date() } });
    const [confirmed] = await queries.listDealsForUser(s.brand.id, "STARTUP");
    expect(confirmed.proofPending).toBe(false);
    expect(queries.isMyTurn(confirmed, "STARTUP")).toBe(false);
    expect(await queries.getDealActionCount(s.brand.id, "STARTUP")).toBe(0);
  });

  it("does not count a post that is not a proof, and keeps the lists of other deals apart", async () => {
    const s = await dealAt(prisma, created, "IN_PRODUCTION");
    await prisma.deal.update({ where: { id: s.dealId }, data: { status: "POST_SUBMITTED" } });
    await prisma.dealPost.create({ data: { dealId: s.dealId, format: "TIKTOK_VIDEO", source: "MANUAL", status: "PENDING" } });

    const [deal] = await queries.listDealsForUser(s.brand.id, "STARTUP");
    expect(deal.proofPending).toBe(false);
    expect(await queries.getDealActionCount(s.brand.id, "STARTUP")).toBe(0);
    // Scoped to a request: only that request's deals.
    expect(await queries.listDealsForUser(s.brand.id, "STARTUP", s.request.id)).toHaveLength(1);
    expect(await queries.listDealsForUser(s.brand.id, "STARTUP", "no-such-request")).toHaveLength(0);
  });
});
