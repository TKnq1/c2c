import type { FormValues } from "@/lib/compliance/briefing-form";

// How far a briefing is from being ready, as five things a brand can see tick over: the formats, the key message, the label, the
// deadline and a form with nothing wrong in it. A new briefing starts with most of them done (the defaults fill formats, label and
// deadline), which is the point: the person only has to add what is theirs.
export const MILESTONES = ["formats", "message", "label", "deadline", "clear"] as const;
export type Milestone = (typeof MILESTONES)[number];

function listed(value: string | undefined): boolean {
  return (value ?? "").split(",").some((s) => s.trim() !== "");
}

export function briefingMilestones(values: FormValues, errorCount: number): Record<Milestone, boolean> {
  return {
    formats: listed(values.contentFormats),
    message: (values.talkingPoints ?? "").trim() !== "",
    label: listed(values.disclosureLabels),
    deadline: (values.postingWindowEnd ?? "").trim() !== "",
    clear: errorCount === 0,
  };
}

export function briefingProgress(values: FormValues, errorCount: number): { done: number; total: number; percent: number; milestones: Record<Milestone, boolean> } {
  const milestones = briefingMilestones(values, errorCount);
  const done = MILESTONES.filter((m) => milestones[m]).length;
  return { done, total: MILESTONES.length, percent: Math.round((done / MILESTONES.length) * 100), milestones };
}
