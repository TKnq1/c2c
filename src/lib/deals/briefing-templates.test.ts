import { describe, expect, it } from "vitest";
import { MAX_TEMPLATES, TEMPLATE_NAME_MAX, cleanTemplateName, inputFromTemplate, templateNameProblem } from "@/lib/deals/briefing-templates";
import { briefingToValues } from "@/lib/compliance/briefing-form";
import { defaultBriefingFor } from "@/lib/deals/terms";

describe("template names", () => {
  it("trims and collapses white space", () => {
    expect(cleanTemplateName("  Reel   +  Story \n")).toBe("Reel + Story");
  });

  it("wants two to sixty characters", () => {
    expect(templateNameProblem("")).toBe("NAME_TOO_SHORT");
    expect(templateNameProblem("A")).toBe("NAME_TOO_SHORT");
    expect(templateNameProblem("AB")).toBeNull();
    expect(templateNameProblem("x".repeat(TEMPLATE_NAME_MAX))).toBeNull();
    expect(templateNameProblem("x".repeat(TEMPLATE_NAME_MAX + 1))).toBe("NAME_TOO_LONG");
  });

  it("keeps a sane limit", () => {
    expect(MAX_TEMPLATES).toBeGreaterThanOrEqual(5);
  });
});

describe("a template on a request", () => {
  const base = defaultBriefingFor({ platform: "TikTok", postBy: null });
  const values = { ...briefingToValues(base), minLiveHours: "168", postingWindowStart: "2026-01-01", postingWindowEnd: "2026-01-31" };

  it("brings its rules and the request's own dates", () => {
    const postBy = new Date("2026-12-24T00:00:00Z");
    const input = inputFromTemplate(values, { platform: "TikTok", postBy }, null);
    expect(input.minLiveHours).toBe(168);
    // The window in the stored values (should there be one) is never used: the request's date is.
    expect(input.postingWindowStart).toBeNull();
    expect(input.postingWindowEnd).toEqual(postBy);
  });

  it("keeps the dates of the briefing the request already has", () => {
    const existing = { ...base, postingWindowStart: new Date("2026-11-01T00:00:00Z"), postingWindowEnd: new Date("2026-11-30T00:00:00Z") };
    const input = inputFromTemplate(values, { platform: "TikTok", postBy: new Date("2027-01-01T00:00:00Z") }, existing);
    expect(input.postingWindowStart).toEqual(existing.postingWindowStart);
    expect(input.postingWindowEnd).toEqual(existing.postingWindowEnd);
  });

  it("falls back to defaults for fields an older template does not have", () => {
    const input = inputFromTemplate({ targetMarket: "AT" }, { platform: null, postBy: null }, null);
    expect(input.targetMarket).toBe("AT");
    expect(input.minLiveHours).toBe(24);
    expect(input.draftRequired).toBe(false);
  });
});
