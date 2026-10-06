import { describe, expect, it } from "vitest";
import { consentGiven, consentRecord } from "@/lib/legal/consent";
import { LEGAL_VERSION } from "@/lib/legal/version";

function form(fields: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
}

describe("consentGiven", () => {
  it("needs both the terms and the adult confirmation", () => {
    expect(consentGiven(form({ terms: "yes", age: "yes" }))).toBe(true);
    expect(consentGiven(form({ terms: "yes" }))).toBe(false);
    expect(consentGiven(form({ age: "yes" }))).toBe(false);
    expect(consentGiven(form({ terms: "on", age: "yes" }))).toBe(false);
  });
});

describe("consentRecord", () => {
  it("records when and which version was accepted", () => {
    const at = new Date("2026-10-06T10:00:00Z");
    expect(consentRecord(at)).toEqual({ termsAcceptedAt: at, termsVersion: LEGAL_VERSION, ageConfirmedAt: at });
  });
});
