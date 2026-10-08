// Briefing templates, drafts and the briefing a new or copied request starts with, against a real Postgres (see
// lifecycle.integration.test.ts for how to run these).
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { seedOffer } from "@/lib/deals/test-helpers";

const DB = process.env.DEAL_TEST_DATABASE_URL;

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(), notFound: vi.fn() }));
vi.mock("@/lib/i18n/server", () => ({ getLocale: async () => "en", getT: async () => (key: string) => key, getMessages: async () => ({}) }));
vi.mock("@/lib/admin-digest", () => ({ notifyUrgent: vi.fn() }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn(async () => ({ ok: true, id: "mail_test" })) }));
vi.mock("@/lib/stripe", () => ({ stripe: { checkout: { sessions: { create: vi.fn() } }, webhooks: { constructEvent: vi.fn() } } }));

type Db = typeof import("@/lib/prisma").prisma;
let prisma: Db;
let authMock: ReturnType<typeof vi.fn>;
let actions: typeof import("@/lib/actions/briefing-templates");
let briefingActions: typeof import("@/lib/actions/briefing");
let requestActions: typeof import("@/lib/actions/requests");
let lib: typeof import("@/lib/deals/briefing-templates");
let form: typeof import("@/lib/compliance/briefing-form");
let terms: typeof import("@/lib/deals/terms");
let deletion: typeof import("@/lib/account-deletion");
let exportRoute: typeof import("@/app/api/account/export/route");

const created: string[] = [];
type Actor = { id: string; role: "STARTUP" | "CREATOR" };

function as(actor: Actor) {
  authMock.mockResolvedValue({ user: { id: actor.id, role: actor.role, email: `${actor.id}@test.local`, isAdmin: false }, expires: "2099-01-01" });
}

// A brand, with the request seedOffer makes (it has a briefing and an open offer).
async function brand(options: { noBriefing?: boolean; budget?: number } = {}) {
  const s = await seedOffer(prisma, created, options);
  return s;
}

// The builder's field values: the defaults of a request, with some changed.
function values(changes: Record<string, string> = {}, postBy: Date | null = null) {
  return { ...form.briefingToValues(terms.defaultBriefingFor({ platform: "TikTok", postBy })), ...changes };
}

function formData(fields: Record<string, string | undefined>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) if (v !== undefined) fd.set(k, v);
  return fd;
}

const save = (name: string, changes: Record<string, string> = {}, extra: Record<string, string> = {}) =>
  actions.saveBriefingTemplateAction(undefined, formData({ ...values(changes), name, ...extra }));

async function newRequest(s: Awaited<ReturnType<typeof brand>>, title: string, budget = 200, postBy = "") {
  as(s.brand);
  await requestActions.createRequestAction(
    undefined,
    formData({
      title,
      description: "A request for the tests",
      niche: "Beauty",
      languages: "English",
      minFollowers: "0",
      productCategory: "Cosmetics",
      platform: "TikTok",
      deliverables: "1 TikTok video",
      budgetMin: String(budget),
      budgetMax: "",
      postBy,
    }),
  );
  return prisma.request.findFirstOrThrow({ where: { startupId: s.request.startupId, title }, include: { briefing: true } });
}

describe.skipIf(!DB)("briefing templates (needs a database)", () => {
  beforeAll(async () => {
    process.env.DATABASE_URL = DB;
    process.env.REQUIRE_VERIFIED_EMAIL = "0";
    process.env.BRAND_DEALS_ENABLED = "1";
    prisma = (await import("@/lib/prisma")).prisma;
    authMock = (await import("@/lib/auth")).auth as unknown as ReturnType<typeof vi.fn>;
    actions = await import("@/lib/actions/briefing-templates");
    briefingActions = await import("@/lib/actions/briefing");
    requestActions = await import("@/lib/actions/requests");
    lib = await import("@/lib/deals/briefing-templates");
    form = await import("@/lib/compliance/briefing-form");
    terms = await import("@/lib/deals/terms");
    deletion = await import("@/lib/account-deletion");
    exportRoute = await import("@/app/api/account/export/route");
  });

  beforeEach(() => {
    process.env.BRAND_DEALS_ENABLED = "1";
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.user.deleteMany({ where: { id: { in: created } } });
    await prisma.$disconnect();
  });

  describe("saving, changing and deleting", () => {
    it("saves what the builder shows under a name, without the posting window", async () => {
      const s = await brand();
      as(s.brand);
      const result = await save("Reel + Story", { minLiveHours: "168", postingWindowStart: "2026-11-01", postingWindowEnd: "2026-11-30" });
      expect(result?.success, JSON.stringify(result)).toBe(true);
      const row = await prisma.briefingTemplate.findUniqueOrThrow({ where: { id: result!.templateId! } });
      expect(row.name).toBe("Reel + Story");
      const stored = row.values as Record<string, string>;
      expect(stored.minLiveHours).toBe("168");
      expect(stored.postingWindowStart).toBeUndefined();
      expect(stored.postingWindowEnd).toBeUndefined();
    });

    it("refuses a name that is empty, too long or already taken (whatever the case)", async () => {
      const s = await brand();
      as(s.brand);
      expect((await save(" "))?.error).toMatch(/name/i);
      expect((await save("x".repeat(61)))?.error).toMatch(/60/);
      expect((await save("Autumn"))?.success).toBe(true);
      expect((await save("autumn"))?.error).toMatch(/already have/i);
      // Another brand may use the same name.
      const other = await brand();
      as(other.brand);
      expect((await save("Autumn"))?.success).toBe(true);
    });

    it("refuses rules that are not allowed, like a briefing on a request", async () => {
      const s = await brand();
      as(s.brand);
      // No advertising label at all.
      const result = await save("No label", { disclosureLabels: "" });
      expect(result?.success).toBeUndefined();
      expect(result?.issues?.some((i) => i.severity === "error")).toBe(true);
      expect(await prisma.briefingTemplate.count({ where: { userId: s.brand.id } })).toBe(0);
    });

    it("keeps at most twenty templates", async () => {
      const s = await brand();
      as(s.brand);
      for (let i = 0; i < lib.MAX_TEMPLATES; i += 1) expect((await save(`Template ${i}`))?.success).toBe(true);
      expect((await save("One too many"))?.error).toMatch(/20/);
    });

    it("renames and overwrites a template, and only its owner can", async () => {
      const s = await brand();
      as(s.brand);
      const made = await save("First");
      const id = made!.templateId!;
      expect((await actions.renameBriefingTemplateAction(id, "Second"))?.success).toBe(true);
      expect((await prisma.briefingTemplate.findUniqueOrThrow({ where: { id } })).name).toBe("Second");

      const overwritten = await save("", { minLiveHours: "72" }, { templateId: id });
      expect(overwritten?.success, JSON.stringify(overwritten)).toBe(true);
      expect(((await prisma.briefingTemplate.findUniqueOrThrow({ where: { id } })).values as Record<string, string>).minLiveHours).toBe("72");

      const other = await brand();
      as(other.brand);
      expect((await actions.renameBriefingTemplateAction(id, "Stolen"))?.error).toMatch(/not be found/i);
      expect((await actions.deleteBriefingTemplateAction(id))?.error).toMatch(/not be found/i);
      expect(await prisma.briefingTemplate.count({ where: { id } })).toBe(1);

      as(s.brand);
      expect((await actions.deleteBriefingTemplateAction(id))?.success).toBe(true);
      expect(await prisma.briefingTemplate.count({ where: { id } })).toBe(0);
    });

    it("lists the default first and summarises each template", async () => {
      const s = await brand();
      as(s.brand);
      const a = await save("Alpha", { contentFormats: "TIKTOK_VIDEO,INSTAGRAM_REEL" });
      const b = await save("Beta");
      await actions.setDefaultBriefingTemplateAction(b!.templateId!);
      const list = await lib.listTemplates(s.brand.id);
      expect(list.map((t) => t.name)).toEqual(["Beta", "Alpha"]);
      expect(list[0].isDefault).toBe(true);
      expect(list[1].formats).toEqual(["TIKTOK_VIDEO", "INSTAGRAM_REEL"]);
      expect(a?.success).toBe(true);
    });

    it("refuses everything while deals are off and for a creator", async () => {
      const s = await brand();
      process.env.BRAND_DEALS_ENABLED = "";
      as(s.brand);
      expect((await save("Off"))?.error).toBeTruthy();
      process.env.BRAND_DEALS_ENABLED = "1";
      as(s.creator);
      expect((await save("Creator"))?.error).toMatch(/not authorized/i);
    });
  });

  describe("the default template", () => {
    it("is one per brand", async () => {
      const s = await brand();
      as(s.brand);
      const a = (await save("Alpha"))!.templateId!;
      const b = (await save("Beta"))!.templateId!;
      await actions.setDefaultBriefingTemplateAction(a);
      await actions.setDefaultBriefingTemplateAction(b);
      const rows = await prisma.briefingTemplate.findMany({ where: { userId: s.brand.id, isDefault: true } });
      expect(rows.map((r) => r.id)).toEqual([b]);
      await actions.setDefaultBriefingTemplateAction(null);
      expect(await prisma.briefingTemplate.count({ where: { userId: s.brand.id, isDefault: true } })).toBe(0);
      expect((await actions.setDefaultBriefingTemplateAction("nope"))?.error).toMatch(/not be found/i);
    });

    it("becomes the briefing of a new request, with the request's own date", async () => {
      const s = await brand();
      as(s.brand);
      const id = (await save("Standard", { minLiveHours: "168", usageType: "CROSS_POST", usageChannels: "BRAND_ORGANIC_REPOST", usageDurationDays: "30" }))!.templateId!;
      await actions.setDefaultBriefingTemplateAction(id);
      const postBy = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10);
      const request = await newRequest(s, "With default", 200, postBy);
      expect(request.briefing?.minLiveHours).toBe(168);
      expect(request.briefing?.usageType).toBe("CROSS_POST");
      expect(request.briefing?.postingWindowEnd?.toISOString().slice(0, 10)).toBe(postBy);
      expect((await prisma.briefingTemplate.findUniqueOrThrow({ where: { id } })).lastUsedAt).not.toBeNull();
    });

    it("leaves a new request without a briefing when there is no default", async () => {
      const s = await brand();
      const request = await newRequest(s, "Without default");
      expect(request.briefing).toBeNull();
    });

    it("does not force a template on a request it does not fit", async () => {
      const s = await brand();
      as(s.brand);
      // A usage fee of 500 euros does not fit a request with a budget of 200.
      const id = (await save("Expensive rights", { usageType: "PAID_ADS", usageChannels: "TIKTOK_SPARK_ADS", usageDurationDays: "60", usageFeeEuros: "500" }))!.templateId!;
      await actions.setDefaultBriefingTemplateAction(id);
      const request = await newRequest(s, "Too small", 200);
      expect(request.briefing).toBeNull();
    });

    it("is not used while deals are off", async () => {
      const s = await brand();
      as(s.brand);
      const id = (await save("Standard", { minLiveHours: "168" }))!.templateId!;
      await actions.setDefaultBriefingTemplateAction(id);
      process.env.BRAND_DEALS_ENABLED = "";
      const request = await newRequest(s, "Deals off");
      expect(request.briefing).toBeNull();
    });
  });

  describe("copies", () => {
    it("starts a duplicate with the briefing of the original, without its window", async () => {
      const s = await brand();
      as(s.brand);
      await prisma.campaignBriefing.update({ where: { requestId: s.request.id }, data: { minLiveHours: 168, requiredHashtags: ["glow"] } });
      await requestActions.duplicateRequestAction(s.request.id);
      const copy = await prisma.request.findFirstOrThrow({ where: { startupId: s.request.startupId, title: { endsWith: "(Copy)" } }, include: { briefing: true } });
      expect(copy.briefing?.minLiveHours).toBe(168);
      expect(copy.briefing?.requiredHashtags).toEqual(["glow"]);
      // The copy's own "post by" date, not the original's window.
      expect(copy.briefing?.postingWindowEnd?.toISOString()).toBe(copy.postBy?.toISOString());
    });

    it("starts a duplicate of a request without a briefing from the default template", async () => {
      const s = await brand({ noBriefing: true });
      as(s.brand);
      const id = (await save("Standard", { minLiveHours: "72" }))!.templateId!;
      await actions.setDefaultBriefingTemplateAction(id);
      await requestActions.duplicateRequestAction(s.request.id);
      const copy = await prisma.request.findFirstOrThrow({ where: { startupId: s.request.startupId, title: { endsWith: "(Copy)" } }, include: { briefing: true } });
      expect(copy.briefing?.minLiveHours).toBe(72);
    });

    it("copies the briefing of another request into one that has one, keeping that request's dates", async () => {
      const s = await brand();
      as(s.brand);
      const target = await newRequest(s, "Target", 200, new Date(Date.now() + 40 * 86_400_000).toISOString().slice(0, 10));
      await prisma.campaignBriefing.update({ where: { requestId: s.request.id }, data: { minLiveHours: 168 } });
      const result = await actions.copyBriefingFromRequestAction(s.request.id, target.id);
      expect(result?.success, JSON.stringify(result)).toBe(true);
      const after = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: target.id } });
      expect(after.minLiveHours).toBe(168);
      expect(after.postingWindowEnd?.toISOString().slice(0, 10)).toBe(target.postBy?.toISOString().slice(0, 10));
      // Not someone else's request.
      const other = await brand();
      expect((await actions.copyBriefingFromRequestAction(other.request.id, target.id))?.error).toBeTruthy();
    });
  });

  describe("applying a template to several requests", () => {
    it("writes the rules into each, keeps their dates, reports the ones it does not fit, and counts offers put on hold", async () => {
      const s = await brand();
      as(s.brand);
      const small = await newRequest(s, "Small budget", 200);
      const big = await newRequest(s, "Big budget", 2000);
      const id = (await save("Paid ads", { minLiveHours: "168", usageType: "PAID_ADS", usageChannels: "TIKTOK_SPARK_ADS", usageDurationDays: "60", usageFeeEuros: "500" }))!.templateId!;

      const before = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } });
      // The seeded request has an open offer made under the old briefing.
      await prisma.interest.update({ where: { id: s.interest.id }, data: { offerBriefingVersion: before.version } });
      await prisma.request.update({ where: { id: s.request.id }, data: { budgetMinCents: 200_000, budgetMaxCents: 200_000 } });

      const result = await actions.applyBriefingTemplateAction(id, [s.request.id, small.id, big.id, "missing"]);
      const byId = new Map(result!.applied!.map((r) => [r.requestId, r]));
      expect(byId.get(s.request.id)).toMatchObject({ ok: true, changed: true, staleOffers: 1 });
      expect(byId.get(big.id)).toMatchObject({ ok: true });
      expect(byId.get(small.id)?.ok).toBe(false);
      expect(byId.get(small.id)?.message).toBeTruthy();
      expect(byId.get("missing")?.ok).toBe(false);

      const applied = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } });
      expect(applied.minLiveHours).toBe(168);
      expect(applied.version).toBe(before.version + 1);
      // The seeded request kept its own window.
      expect(applied.postingWindowEnd?.toISOString()).toBe(before.postingWindowEnd?.toISOString());
      expect(await prisma.campaignBriefing.findUnique({ where: { requestId: small.id } })).toBeNull();
      expect((await prisma.briefingTemplate.findUniqueOrThrow({ where: { id } })).lastUsedAt).not.toBeNull();
    });

    it("only touches the caller's own requests and the caller's own template", async () => {
      const s = await brand();
      const other = await brand();
      as(s.brand);
      const id = (await save("Mine", { minLiveHours: "168" }))!.templateId!;
      const result = await actions.applyBriefingTemplateAction(id, [other.request.id]);
      expect(result?.applied?.[0]).toMatchObject({ ok: false });
      expect((await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: other.request.id } })).minLiveHours).toBe(24);
      as(other.brand);
      expect((await actions.applyBriefingTemplateAction(id, [other.request.id]))?.error).toMatch(/not be found/i);
    });

    it("asks for at least one and at most twenty-five requests", async () => {
      const s = await brand();
      as(s.brand);
      const id = (await save("Any"))!.templateId!;
      expect((await actions.applyBriefingTemplateAction(id, []))?.error).toMatch(/at least one/i);
      expect((await actions.applyBriefingTemplateAction(id, Array.from({ length: 26 }, (_, i) => `r${i}`)))?.error).toMatch(/at most 25/i);
    });
  });

  describe("unfinished briefings", () => {
    it("keeps a draft with errors, apart from the saved briefing, and starts the builder from it", async () => {
      const s = await brand();
      as(s.brand);
      const saved = await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } });
      const draftValues = values({ disclosureLabels: "", talkingPoints: "Half written" });
      const result = await actions.saveBriefingDraftAction(s.request.id, undefined, formData(draftValues));
      expect(result?.success).toBe(true);

      // The saved briefing is untouched, and so are the offers made under it.
      expect(await prisma.campaignBriefing.findUniqueOrThrow({ where: { requestId: s.request.id } })).toMatchObject({ version: saved.version, disclosureLabels: saved.disclosureLabels });
      const start = await lib.briefingStartValues(s.request.id, s.brand.id);
      expect(start?.source).toBe("draft");
      expect(start?.values.talkingPoints).toBe("Half written");
    });

    it("is replaced by a save without errors", async () => {
      const s = await brand();
      as(s.brand);
      await actions.saveBriefingDraftAction(s.request.id, undefined, formData(values({ talkingPoints: "Draft text" })));
      const request = await prisma.request.findUniqueOrThrow({ where: { id: s.request.id }, include: { briefing: true } });
      const fine = form.briefingToValues(terms.briefingRowToInput(request.briefing as Parameters<typeof terms.briefingRowToInput>[0]));
      const saved = await briefingActions.saveBriefingAction(s.request.id, undefined, formData({ ...fine, talkingPoints: "Final text" }));
      expect(saved?.success, JSON.stringify(saved)).toBe(true);
      expect(await prisma.briefingDraft.count({ where: { requestId: s.request.id } })).toBe(0);
      const start = await lib.briefingStartValues(s.request.id, s.brand.id);
      expect(start?.source).toBe("briefing");
      expect(start?.values.talkingPoints).toBe("Final text");
    });

    it("is ignored once the briefing was saved after it", async () => {
      const s = await brand();
      as(s.brand);
      await actions.saveBriefingDraftAction(s.request.id, undefined, formData(values({ talkingPoints: "Old draft" })));
      await prisma.campaignBriefing.update({ where: { requestId: s.request.id }, data: { talkingPoints: "Newer briefing", updatedAt: new Date(Date.now() + 60_000) } });
      expect((await lib.briefingStartValues(s.request.id, s.brand.id))?.source).toBe("briefing");
    });

    it("can be discarded, and belongs to the brand that owns the request", async () => {
      const s = await brand();
      const other = await brand();
      as(s.brand);
      await actions.saveBriefingDraftAction(s.request.id, undefined, formData(values()));
      as(other.brand);
      expect((await actions.saveBriefingDraftAction(s.request.id, undefined, formData(values())))?.error).toBeTruthy();
      await actions.discardBriefingDraftAction(s.request.id);
      expect(await prisma.briefingDraft.count({ where: { requestId: s.request.id } })).toBe(1);
      as(s.brand);
      await actions.discardBriefingDraftAction(s.request.id);
      expect(await prisma.briefingDraft.count({ where: { requestId: s.request.id } })).toBe(0);
    });

    it("keeps only the known fields of what it is given", async () => {
      const s = await brand();
      as(s.brand);
      await actions.saveBriefingDraftAction(s.request.id, undefined, formData({ ...values(), evil: "x".repeat(10), talkingPoints: "y".repeat(9000) }));
      const row = await prisma.briefingDraft.findUniqueOrThrow({ where: { requestId: s.request.id } });
      const stored = row.values as Record<string, string>;
      expect(stored.evil).toBeUndefined();
      expect(stored.talkingPoints).toHaveLength(4000);
    });
  });

  describe("what the builder starts from", () => {
    it("is the defaults for a request with nothing, the default template when there is one, the saved briefing otherwise", async () => {
      const s = await brand({ noBriefing: true });
      expect((await lib.briefingStartValues(s.request.id, s.brand.id))?.source).toBe("defaults");
      as(s.brand);
      const id = (await save("Standard", { minLiveHours: "72" }))!.templateId!;
      await actions.setDefaultBriefingTemplateAction(id);
      const fromTemplate = await lib.briefingStartValues(s.request.id, s.brand.id);
      expect(fromTemplate).toMatchObject({ source: "template", templateId: id });
      expect(fromTemplate?.values.minLiveHours).toBe("72");
      // Not for somebody else's request.
      const other = await brand();
      expect(await lib.briefingStartValues(s.request.id, other.brand.id)).toBeNull();
      const withBriefing = await brand();
      expect((await lib.briefingStartValues(withBriefing.request.id, withBriefing.brand.id))?.source).toBe("briefing");
    });
  });

  describe("the account", () => {
    it("loses its templates and drafts when it is anonymised, and exports them before", async () => {
      const s = await brand();
      as(s.brand);
      await save("To export");
      await actions.saveBriefingDraftAction(s.request.id, undefined, formData(values()));

      const response = await exportRoute.GET();
      const exported = (await response.json()) as { briefingTemplates: { name: string }[]; briefingDrafts: unknown[] };
      expect(exported.briefingTemplates.map((t) => t.name)).toEqual(["To export"]);
      expect(exported.briefingDrafts).toHaveLength(1);

      await deletion.anonymiseAccount(s.brand.id, "STARTUP");
      expect(await prisma.briefingTemplate.count({ where: { userId: s.brand.id } })).toBe(0);
      expect(await prisma.briefingDraft.count({ where: { requestId: s.request.id } })).toBe(0);
    });

    it("loses its templates with the user row", async () => {
      const s = await brand();
      as(s.brand);
      await save("Gone with the user");
      await prisma.user.delete({ where: { id: s.brand.id } });
      expect(await prisma.briefingTemplate.count({ where: { userId: s.brand.id } })).toBe(0);
    });
  });
});
