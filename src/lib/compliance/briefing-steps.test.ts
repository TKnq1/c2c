import { describe, expect, it } from "vitest";
import { BRIEFING_FORM_KEYS } from "@/lib/compliance/briefing-form";
import { BRIEFING_STEPS, countByStep, firstError, stepOfField } from "@/lib/compliance/briefing-steps";

const error = (field?: string) => ({ field, severity: "error" as const });
const warning = (field?: string) => ({ field, severity: "warning" as const });

describe("stepOfField", () => {
  it("puts every field of the form on a step", () => {
    for (const key of BRIEFING_FORM_KEYS) expect(BRIEFING_STEPS, key).toContain(stepOfField(key));
    expect(stepOfField("disclosureLabels")).toBe("rules");
    expect(stepOfField("usageFeeEuros")).toBe("rights");
    expect(stepOfField("contentFormats")).toBe("content");
  });

  it("keeps the fields where the form shows them", () => {
    // Exactly the three the builder lists under its steps: nothing is left to the fallback.
    const steps = new Set(BRIEFING_FORM_KEYS.map((key) => stepOfField(key)));
    expect([...steps].sort()).toEqual(["content", "rights", "rules"]);
  });

  it("shows a finding without a known field on the first step", () => {
    expect(stepOfField(undefined)).toBe("content");
    expect(stepOfField("somethingElse")).toBe("content");
  });
});

describe("countByStep", () => {
  it("counts the errors of each step, and warnings only when asked for", () => {
    const issues = [error("contentFormats"), error("disclosureLabels"), error("minLiveHours"), warning("exclusivityCategories")];
    expect(countByStep(issues)).toEqual({ content: 1, rules: 2, rights: 0 });
    expect(countByStep(issues, "warning")).toEqual({ content: 0, rules: 0, rights: 1 });
  });
});

describe("firstError", () => {
  it("is the first error in the order of the steps, not of the findings", () => {
    const issues = [error("usageFeeEuros"), error("disclosureLabels"), error("contentFormats")];
    expect(firstError(issues)).toMatchObject({ step: "content", field: "contentFormats" });
  });

  it("skips warnings and is null when nothing is wrong", () => {
    expect(firstError([warning("contentFormats")])).toBeNull();
    expect(firstError([])).toBeNull();
  });
});
