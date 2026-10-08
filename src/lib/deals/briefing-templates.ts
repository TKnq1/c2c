import { Prisma, type BriefingTemplate, type UsageRightsType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validateBriefing, type BriefingInput } from "@/lib/compliance/briefing";
import { briefingToValues, cleanFormValues, parseBriefingForm, withoutWindow, type FormValues } from "@/lib/compliance/briefing-form";
import { saveBriefing } from "@/lib/deals/briefing-store";
import { hasErrors, type Issue } from "@/lib/deals/issues";
import { briefingRowToInput, defaultBriefingFor, type BriefingRow } from "@/lib/deals/terms";

// A brand's saved briefings ("templates") and the unfinished briefing of a request ("draft"). A template is a copy: applying
// it writes a briefing into a request, and changing the template later changes nothing that exists. Everything here takes the
// user whose templates or requests they are and refuses anything else, so the actions in front of it only have to sign in.

export const MAX_TEMPLATES = 20;
export const MAX_APPLY_REQUESTS = 25;
export const TEMPLATE_NAME_MIN = 2;
export const TEMPLATE_NAME_MAX = 60;

export function cleanTemplateName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

export function templateNameProblem(name: string): "NAME_TOO_SHORT" | "NAME_TOO_LONG" | null {
  if (name.length < TEMPLATE_NAME_MIN) return "NAME_TOO_SHORT";
  if (name.length > TEMPLATE_NAME_MAX) return "NAME_TOO_LONG";
  return null;
}

export type TemplateSummary = {
  id: string;
  name: string;
  isDefault: boolean;
  updatedAt: Date;
  lastUsedAt: Date | null;
  formats: string[];
  market: string;
  usageType: UsageRightsType;
};

export type TemplateFailure =
  | { ok: false; reason: "NOT_FOUND" | "NAME_TAKEN" | "LIMIT" | "NAME_TOO_SHORT" | "NAME_TOO_LONG" }
  | { ok: false; reason: "INVALID"; issues: Issue[] };

export type TemplateOutcome<T> = { ok: true; value: T } | TemplateFailure;

function summarise(row: BriefingTemplate): TemplateSummary {
  const input = parseBriefingForm(cleanFormValues(row.values));
  return {
    id: row.id,
    name: row.name,
    isDefault: row.isDefault,
    updatedAt: row.updatedAt,
    lastUsedAt: row.lastUsedAt,
    formats: input.contentFormats,
    market: input.targetMarket,
    usageType: input.usage.type,
  };
}

// What is stored of form values: normalised by reading them the way the builder does, and without the posting window.
function storedValues(raw: unknown): { values: FormValues; issues: Issue[] } {
  const input = parseBriefingForm(withoutWindow(cleanFormValues(raw)));
  return { values: withoutWindow(briefingToValues(input)), issues: validateBriefing(input, { budgetMaxCents: null }) };
}

// The briefing a template stands for on a request: the template's rules, with the request's own dates (those of its briefing,
// or the request's "post by" date when it has none yet).
export function inputFromTemplate(values: unknown, request: { platform: string | null; postBy: Date | null }, existing: BriefingInput | null): BriefingInput {
  const input = parseBriefingForm(withoutWindow(cleanFormValues(values)));
  const dates = existing ?? defaultBriefingFor(request);
  return { ...input, postingWindowStart: dates.postingWindowStart, postingWindowEnd: dates.postingWindowEnd };
}

async function nameTaken(userId: string, name: string, exceptId?: string): Promise<boolean> {
  const clash = await prisma.briefingTemplate.findFirst({
    where: { userId, name: { equals: name, mode: "insensitive" }, ...(exceptId ? { id: { not: exceptId } } : {}) },
    select: { id: true },
  });
  return clash !== null;
}

export async function listTemplates(userId: string): Promise<TemplateSummary[]> {
  const rows = await prisma.briefingTemplate.findMany({ where: { userId }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] });
  return rows.map(summarise);
}

export async function loadTemplate(userId: string, id: string): Promise<(TemplateSummary & { values: FormValues }) | null> {
  const row = await prisma.briefingTemplate.findFirst({ where: { id, userId } });
  return row ? { ...summarise(row), values: cleanFormValues(row.values) } : null;
}

export async function createTemplate(userId: string, rawName: string, rawValues: unknown): Promise<TemplateOutcome<TemplateSummary>> {
  const name = cleanTemplateName(rawName);
  const problem = templateNameProblem(name);
  if (problem) return { ok: false, reason: problem };
  const { values, issues } = storedValues(rawValues);
  if (hasErrors(issues)) return { ok: false, reason: "INVALID", issues };
  if ((await prisma.briefingTemplate.count({ where: { userId } })) >= MAX_TEMPLATES) return { ok: false, reason: "LIMIT" };
  if (await nameTaken(userId, name)) return { ok: false, reason: "NAME_TAKEN" };
  try {
    const row = await prisma.briefingTemplate.create({ data: { userId, name, values: values as Prisma.InputJsonValue } });
    return { ok: true, value: summarise(row) };
  } catch (err) {
    // Two saves at once with the same name: the unique index lets one of them through.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { ok: false, reason: "NAME_TAKEN" };
    throw err;
  }
}

// Renames a template, replaces its rules, or both.
export async function updateTemplate(userId: string, id: string, patch: { name?: string; values?: unknown }): Promise<TemplateOutcome<TemplateSummary>> {
  const current = await prisma.briefingTemplate.findFirst({ where: { id, userId } });
  if (!current) return { ok: false, reason: "NOT_FOUND" };
  const data: Prisma.BriefingTemplateUpdateInput = {};
  if (patch.name !== undefined) {
    const name = cleanTemplateName(patch.name);
    const problem = templateNameProblem(name);
    if (problem) return { ok: false, reason: problem };
    if (name !== current.name && (await nameTaken(userId, name, id))) return { ok: false, reason: "NAME_TAKEN" };
    data.name = name;
  }
  if (patch.values !== undefined) {
    const { values, issues } = storedValues(patch.values);
    if (hasErrors(issues)) return { ok: false, reason: "INVALID", issues };
    data.values = values as Prisma.InputJsonValue;
  }
  try {
    return { ok: true, value: summarise(await prisma.briefingTemplate.update({ where: { id }, data })) };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") return { ok: false, reason: "NAME_TAKEN" };
    throw err;
  }
}

export async function deleteTemplate(userId: string, id: string): Promise<boolean> {
  return (await prisma.briefingTemplate.deleteMany({ where: { id, userId } })).count > 0;
}

// The template new requests start from, or none (null). At most one per brand.
export async function setDefaultTemplate(userId: string, id: string | null): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    if (id !== null && !(await tx.briefingTemplate.findFirst({ where: { id, userId }, select: { id: true } }))) return false;
    await tx.briefingTemplate.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
    if (id !== null) await tx.briefingTemplate.update({ where: { id }, data: { isDefault: true } });
    return true;
  });
}

export type StartValues = {
  values: FormValues;
  // Where the form's starting values come from: an unfinished draft, the saved briefing, the brand's default template, or
  // the German defaults for the request.
  source: "draft" | "briefing" | "template" | "defaults";
  templateId?: string;
};

// What the briefing builder starts with for a request.
export async function briefingStartValues(requestId: string, userId: string): Promise<StartValues | null> {
  const request = await prisma.request.findFirst({
    where: { id: requestId, startup: { userId } },
    include: { briefing: true, briefingDraft: true },
  });
  if (!request) return null;
  // A draft counts while it is newer than the saved briefing.
  if (request.briefingDraft && (!request.briefing || request.briefingDraft.updatedAt > request.briefing.updatedAt)) {
    return { values: cleanFormValues(request.briefingDraft.values), source: "draft" };
  }
  if (request.briefing) return { values: briefingToValues(briefingRowToInput(request.briefing as BriefingRow)), source: "briefing" };
  const template = await prisma.briefingTemplate.findFirst({ where: { userId, isDefault: true } });
  if (template) return { values: briefingToValues(inputFromTemplate(template.values, request, null)), source: "template", templateId: template.id };
  return { values: briefingToValues(defaultBriefingFor(request)), source: "defaults" };
}

export type ApplyResult =
  | { requestId: string; title: string; ok: true; changed: boolean; staleOffers: number }
  | { requestId: string; title: string; ok: false; reason: "INVALID"; issues: Issue[] }
  | { requestId: string; title: string; ok: false; reason: "NOT_FOUND" };

// Writes a template's rules into the briefing of each of the brand's requests (at most MAX_APPLY_REQUESTS). A request the
// rules do not fit (a usage fee above its budget, say) is left as it is and reported.
export async function applyTemplateToRequests(userId: string, templateId: string, requestIds: string[]): Promise<TemplateOutcome<ApplyResult[]>> {
  const template = await prisma.briefingTemplate.findFirst({ where: { id: templateId, userId } });
  if (!template) return { ok: false, reason: "NOT_FOUND" };

  const wanted = [...new Set(requestIds)].slice(0, MAX_APPLY_REQUESTS);
  const requests = await prisma.request.findMany({ where: { id: { in: wanted }, startup: { userId } }, include: { briefing: true } });
  const byId = new Map(requests.map((r) => [r.id, r]));

  const results: ApplyResult[] = [];
  for (const requestId of wanted) {
    const request = byId.get(requestId);
    if (!request) {
      results.push({ requestId, title: "", ok: false, reason: "NOT_FOUND" });
      continue;
    }
    const existing = request.briefing ? briefingRowToInput(request.briefing as BriefingRow) : null;
    const input = inputFromTemplate(template.values, request, existing);
    const issues = validateBriefing(input, { budgetMaxCents: request.budgetMaxCents ?? request.budgetMinCents ?? null });
    if (hasErrors(issues)) {
      results.push({ requestId, title: request.title, ok: false, reason: "INVALID", issues });
      continue;
    }
    const saved = await saveBriefing(requestId, input);
    results.push({ requestId, title: request.title, ok: true, changed: saved.changed, staleOffers: saved.staleOffers });
  }
  await prisma.briefingTemplate.update({ where: { id: templateId }, data: { lastUsedAt: new Date() } });
  return { ok: true, value: results };
}

// A new request gets the brand's default template as its briefing. Never throws and never blocks the request: when the
// template does not fit the request, the request simply runs on the defaults until the brand writes a briefing.
export async function applyDefaultTemplateToNewRequest(requestId: string, userId: string): Promise<boolean> {
  try {
    const template = await prisma.briefingTemplate.findFirst({ where: { userId, isDefault: true } });
    if (!template) return false;
    const request = await prisma.request.findFirst({ where: { id: requestId, startup: { userId } }, include: { briefing: true } });
    if (!request || request.briefing) return false;
    const input = inputFromTemplate(template.values, request, null);
    if (hasErrors(validateBriefing(input, { budgetMaxCents: request.budgetMaxCents ?? request.budgetMinCents ?? null }))) return false;
    await saveBriefing(requestId, input);
    await prisma.briefingTemplate.update({ where: { id: template.id }, data: { lastUsedAt: new Date() } });
    return true;
  } catch (err) {
    console.error("Applying the default briefing template failed", { requestId, err });
    return false;
  }
}

// Copies the briefing of one of the brand's requests into another: the rules of the original, the dates of the target (those of
// its own briefing, or its "post by" date). With `overwrite` off a target that already has a briefing is left alone.
export async function copyBriefing(
  userId: string,
  sourceRequestId: string,
  targetRequestId: string,
  options: { overwrite: boolean },
): Promise<TemplateOutcome<{ changed: boolean; staleOffers: number }>> {
  const [source, target] = await Promise.all([
    prisma.request.findFirst({ where: { id: sourceRequestId, startup: { userId } }, include: { briefing: true } }),
    prisma.request.findFirst({ where: { id: targetRequestId, startup: { userId } }, include: { briefing: true } }),
  ]);
  if (!source?.briefing || !target) return { ok: false, reason: "NOT_FOUND" };
  if (target.briefing && !options.overwrite) return { ok: false, reason: "NOT_FOUND" };
  const dates = target.briefing ? briefingRowToInput(target.briefing as BriefingRow) : defaultBriefingFor(target);
  const input: BriefingInput = {
    ...briefingRowToInput(source.briefing as BriefingRow),
    postingWindowStart: dates.postingWindowStart,
    postingWindowEnd: dates.postingWindowEnd,
  };
  const issues = validateBriefing(input, { budgetMaxCents: target.budgetMaxCents ?? target.budgetMinCents ?? null });
  if (hasErrors(issues)) return { ok: false, reason: "INVALID", issues };
  const saved = await saveBriefing(targetRequestId, input);
  return { ok: true, value: { changed: saved.changed, staleOffers: saved.staleOffers } };
}

// A copy of a request starts with the briefing of the original. Never throws and never blocks the copy: when the briefing
// does not fit, the copy runs on the defaults until the brand writes one.
export async function copyBriefingToNewRequest(userId: string, sourceRequestId: string, targetRequestId: string): Promise<boolean> {
  try {
    return (await copyBriefing(userId, sourceRequestId, targetRequestId, { overwrite: false })).ok;
  } catch (err) {
    console.error("Copying the briefing to the new request failed", { sourceRequestId, targetRequestId, err });
    return false;
  }
}

// An unfinished briefing, kept apart from the saved one: it can hold errors and it changes no offer and no deal.
export async function saveBriefingDraft(requestId: string, userId: string, raw: unknown): Promise<boolean> {
  const request = await prisma.request.findFirst({ where: { id: requestId, startup: { userId } }, select: { id: true } });
  if (!request) return false;
  const values = cleanFormValues(raw) as Prisma.InputJsonValue;
  await prisma.briefingDraft.upsert({ where: { requestId }, create: { requestId, values }, update: { values } });
  return true;
}

export async function discardBriefingDraft(requestId: string, userId: string): Promise<boolean> {
  return (await prisma.briefingDraft.deleteMany({ where: { requestId, request: { startup: { userId } } } })).count > 0;
}
