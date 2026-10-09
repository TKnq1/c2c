import { describe, expect, it } from "vitest";
import { briefingProgress } from "@/lib/compliance/briefing-progress";

const defaults = { contentFormats: "INSTAGRAM_REEL", disclosureLabels: "Werbung,Anzeige", postingWindowEnd: "2026-11-07", talkingPoints: "" };

describe("briefingProgress", () => {
  it("starts with the defaults done and only the key message missing", () => {
    const p = briefingProgress(defaults, 0);
    expect(p.done).toBe(4);
    expect(p.percent).toBe(80);
    expect(p.milestones.message).toBe(false);
  });

  it("is complete once the key message is written and nothing is wrong", () => {
    const p = briefingProgress({ ...defaults, talkingPoints: "Show the texture." }, 0);
    expect(p.done).toBe(5);
    expect(p.percent).toBe(100);
  });

  it("counts an error against the last step and a missing format against the first", () => {
    const p = briefingProgress({ ...defaults, contentFormats: "", talkingPoints: "x" }, 2);
    expect(p.milestones).toMatchObject({ formats: false, message: true, clear: false });
    expect(p.done).toBe(3);
  });

  it("does not count blanks as a message or a deadline", () => {
    const p = briefingProgress({ ...defaults, talkingPoints: "   ", postingWindowEnd: " " }, 0);
    expect(p.milestones).toMatchObject({ message: false, deadline: false });
  });
});
