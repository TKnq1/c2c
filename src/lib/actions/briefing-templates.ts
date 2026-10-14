"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n/server";
import { emailIsVerified, VERIFY_EMAIL_MESSAGE } from "@/lib/verified";
import { DAY, takeToken } from "@/lib/rate-limit";
import { cleanFormValues, type FormValues } from "@/lib/compliance/briefing-form";
import { dealLocale, type DealLocale } from "@/lib/deals/copy";
import { dealsEnabled } from "@/lib/deals/flag";
import { failure, say, serializeIssues, type AppliedResult, type TemplateActionState } from "@/lib/deals/action-state";
import {
  MAX_APPLY_REQUESTS,
  MAX_TEMPLATES,
  TEMPLATE_NAME_MAX,
  TEMPLATE_NAME_MIN,
  applyTemplateToRequests,
  copyBriefing,
  createTemplate,
  deleteTemplate,
  discardBriefingDraft,
  saveBriefingDraft,
  setDefaultTemplate,
  updateTemplate,
  type TemplateFailure,
} from "@/lib/deals/briefing-templates";
import { briefingInputFor } from "@/lib/deals/create";
import { briefingToValues } from "@/lib/compliance/briefing-form";

// The brand's saved briefings ("templates") and unfinished briefings ("drafts"): the actions in front of
// src/lib/deals/briefing-templates.ts. Each one signs the brand in, checks the switch, the verified e-mail and a daily limit.

type Gate = { userId: string; locale: DealLocale } | { refusal: NonNullable<TemplateActionState> };

async function brandGate(limit: { bucket: string; max: number } = { bucket: "briefing-template", max: 60 }): Promise<Gate> {
  const session = await auth();
  const locale = dealLocale(await getLocale());
  if (!session || session.user.role !== "STARTUP") return { refusal: { error: say(locale, "Not authorized.", "Nicht berechtigt.") } };
  if (!dealsEnabled()) return { refusal: { error: say(locale, "Briefings are not available yet.", "Briefings sind noch nicht verfügbar.") } };
  if (!(await emailIsVerified(session.user.id))) return { refusal: { error: VERIFY_EMAIL_MESSAGE } };
  if (!(await takeToken(limit.bucket, session.user.id, limit.max, DAY))) {
    return { refusal: { error: say(locale, "You did that a lot today. Try again tomorrow.", "Das hast du heute sehr oft gemacht. Versuche es morgen erneut.") } };
  }
  return { userId: session.user.id, locale };
}

function failureState(failed: TemplateFailure, locale: DealLocale): NonNullable<TemplateActionState> {
  if (failed.reason === "INVALID") return failure(failed.issues, locale) ?? { error: say(locale, "The briefing has errors.", "Das Briefing hat Fehler.") };
  const text: Record<Exclude<TemplateFailure["reason"], "INVALID">, [string, string]> = {
    NOT_FOUND: ["This template could not be found.", "Diese Vorlage wurde nicht gefunden."],
    NAME_TAKEN: ["You already have a template with this name.", "Du hast schon eine Vorlage mit diesem Namen."],
    LIMIT: [`You can keep up to ${MAX_TEMPLATES} templates. Delete one first.`, `Du kannst bis zu ${MAX_TEMPLATES} Vorlagen behalten. Lösche zuerst eine.`],
    NAME_TOO_SHORT: [`Give the template a name (at least ${TEMPLATE_NAME_MIN} characters).`, `Gib der Vorlage einen Namen (mindestens ${TEMPLATE_NAME_MIN} Zeichen).`],
    NAME_TOO_LONG: [`The name can have at most ${TEMPLATE_NAME_MAX} characters.`, `Der Name darf höchstens ${TEMPLATE_NAME_MAX} Zeichen haben.`],
  };
  const [en, de] = text[failed.reason];
  return { error: say(locale, en, de) };
}

function formValues(formData: FormData): FormValues {
  return cleanFormValues(Object.fromEntries([...formData.entries()].filter(([, v]) => typeof v === "string")));
}

// Saves the briefing the builder shows as a template: a new one under `name`, or, with `templateId`, the rules of an existing
// one (and its name, when `name` is sent). The values are the builder's fields; they have to be free of errors, like a briefing
// that is saved on a request. The posting window is not kept.
export async function saveBriefingTemplateAction(_prev: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const gate = await brandGate();
  if ("refusal" in gate) return gate.refusal;
  const name = String(formData.get("name") ?? "");
  const templateId = String(formData.get("templateId") ?? "");
  const values = formValues(formData);

  const outcome = templateId
    ? await updateTemplate(gate.userId, templateId, { ...(name ? { name } : {}), values })
    : await createTemplate(gate.userId, name, values);
  if (!outcome.ok) return failureState(outcome, gate.locale);
  revalidatePath("/dashboard/startup");
  return { success: true, templateId: outcome.value.id };
}

// A template made from what a request has: its saved briefing, or the defaults it runs on.
export async function saveTemplateFromRequestAction(requestId: string, name: string): Promise<TemplateActionState> {
  const gate = await brandGate();
  if ("refusal" in gate) return gate.refusal;
  const request = await prisma.request.findFirst({ where: { id: requestId, startup: { userId: gate.userId } }, include: { briefing: true } });
  if (!request) return { error: say(gate.locale, "This request could not be found.", "Diese Anfrage wurde nicht gefunden.") };
  const outcome = await createTemplate(gate.userId, name, briefingToValues(briefingInputFor(request)));
  if (!outcome.ok) return failureState(outcome, gate.locale);
  return { success: true, templateId: outcome.value.id };
}

export async function renameBriefingTemplateAction(templateId: string, name: string): Promise<TemplateActionState> {
  const gate = await brandGate();
  if ("refusal" in gate) return gate.refusal;
  const outcome = await updateTemplate(gate.userId, templateId, { name });
  if (!outcome.ok) return failureState(outcome, gate.locale);
  return { success: true, templateId };
}

export async function deleteBriefingTemplateAction(templateId: string): Promise<TemplateActionState> {
  const gate = await brandGate();
  if ("refusal" in gate) return gate.refusal;
  if (!(await deleteTemplate(gate.userId, templateId))) return failureState({ ok: false, reason: "NOT_FOUND" }, gate.locale);
  return { success: true };
}

// The template new requests start from; null: none.
export async function setDefaultBriefingTemplateAction(templateId: string | null): Promise<TemplateActionState> {
  const gate = await brandGate();
  if ("refusal" in gate) return gate.refusal;
  if (!(await setDefaultTemplate(gate.userId, templateId))) return failureState({ ok: false, reason: "NOT_FOUND" }, gate.locale);
  return { success: true, ...(templateId ? { templateId } : {}) };
}

// Writes a template's rules into the briefing of several of the brand's requests at once (at most MAX_APPLY_REQUESTS). A
// request the rules do not fit is left as it is and reported with the reason. Open offers made under a briefing that
// changed are counted per request: they have to be confirmed again (refreshOpenOffersAction).
export async function applyBriefingTemplateAction(templateId: string, requestIds: string[]): Promise<TemplateActionState> {
  const gate = await brandGate();
  if ("refusal" in gate) return gate.refusal;
  if (!Array.isArray(requestIds) || requestIds.length === 0) {
    return { error: say(gate.locale, "Choose at least one request.", "Wähle mindestens eine Anfrage.") };
  }
  if (requestIds.length > MAX_APPLY_REQUESTS) {
    return { error: say(gate.locale, `Choose at most ${MAX_APPLY_REQUESTS} requests at a time.`, `Wähle höchstens ${MAX_APPLY_REQUESTS} Anfragen auf einmal.`) };
  }
  const outcome = await applyTemplateToRequests(gate.userId, templateId, requestIds.map(String));
  if (!outcome.ok) return failureState(outcome, gate.locale);

  const applied: AppliedResult[] = outcome.value.map((r) => {
    if (r.ok) return { requestId: r.requestId, title: r.title, ok: true, changed: r.changed, staleOffers: r.staleOffers };
    if (r.reason === "INVALID") {
      return { requestId: r.requestId, title: r.title, ok: false, issues: serializeIssues(r.issues, gate.locale), message: serializeIssues(r.issues, gate.locale).find((i) => i.severity === "error")?.message };
    }
    return { requestId: r.requestId, title: r.title, ok: false, message: say(gate.locale, "This request could not be found.", "Diese Anfrage wurde nicht gefunden.") };
  });
  for (const r of applied) if (r.ok) revalidatePath(`/dashboard/startup/requests/${r.requestId}`);
  return { success: applied.some((r) => r.ok), applied };
}

// Keeps what the brand has typed in the builder, errors and all, so it is there the next time. Not active: the request keeps
// the briefing it has until a save without errors replaces it.
export async function saveBriefingDraftAction(requestId: string, _prev: TemplateActionState, formData: FormData): Promise<TemplateActionState> {
  const gate = await brandGate({ bucket: "briefing-draft", max: 400 });
  if ("refusal" in gate) return gate.refusal;
  if (!(await saveBriefingDraft(requestId, gate.userId, formValues(formData)))) {
    return { error: say(gate.locale, "This request could not be found.", "Diese Anfrage wurde nicht gefunden.") };
  }
  return { success: true };
}

export async function discardBriefingDraftAction(requestId: string): Promise<TemplateActionState> {
  const gate = await brandGate({ bucket: "briefing-draft", max: 400 });
  if ("refusal" in gate) return gate.refusal;
  await discardBriefingDraft(requestId, gate.userId);
  return { success: true };
}

// Copies the briefing of another of the brand's requests into this one (replacing what it has), keeping this request's own
// dates. Open offers made under a briefing that changed have to be confirmed again (staleOffers).
export async function copyBriefingFromRequestAction(sourceRequestId: string, targetRequestId: string): Promise<TemplateActionState> {
  const gate = await brandGate();
  if ("refusal" in gate) return gate.refusal;
  const outcome = await copyBriefing(gate.userId, sourceRequestId, targetRequestId, { overwrite: true });
  if (!outcome.ok) {
    return outcome.reason === "NOT_FOUND"
      ? { error: say(gate.locale, "That request has no briefing to copy.", "Diese Anfrage hat kein Briefing zum Kopieren.") }
      : failureState(outcome, gate.locale);
  }
  revalidatePath(`/dashboard/startup/requests/${targetRequestId}`);
  return { success: true, ...(outcome.value.staleOffers > 0 ? { staleOffers: outcome.value.staleOffers } : {}) };
}
