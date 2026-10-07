import { describe, expect, it } from "vitest";
import { focusSummary, FOCUS_SHOWN } from "@/lib/admin-focus";

const t = (priority: "HIGH" | "MEDIUM" | "LOW") => ({ priority });

describe("focusSummary", () => {
  it("calls a day with nothing open quiet", () => {
    expect(focusSummary([])).toMatchObject({ tone: "calm", headline: "Alles ruhig", sub: "Nichts wartet auf dich.", shown: 0 });
  });

  it("does not count low tasks as something that needs the admin", () => {
    const summary = focusSummary([t("LOW"), t("LOW")]);
    expect(summary).toMatchObject({ tone: "calm", headline: "Alles ruhig", urgentTotal: 0, softTotal: 2 });
    expect(summary.sub).toContain("2 Kleinigkeiten");
    expect(focusSummary([t("LOW")]).sub).toContain("1 Kleinigkeit ");
  });

  it("counts medium and high tasks and takes its tone from the most urgent", () => {
    expect(focusSummary([t("MEDIUM")])).toMatchObject({ tone: "medium", headline: "1 Ding braucht dich" });
    expect(focusSummary([t("HIGH"), t("MEDIUM"), t("LOW")])).toMatchObject({ tone: "high", headline: "2 Dinge brauchen dich", urgentTotal: 2, softTotal: 1 });
  });

  it("shows at most the first few", () => {
    expect(focusSummary(Array.from({ length: 7 }, () => t("MEDIUM"))).shown).toBe(FOCUS_SHOWN);
  });
});
