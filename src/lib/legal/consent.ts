import { LEGAL_VERSION } from "@/lib/legal/version";

export const CONSENT_ERROR = "Please accept the terms and the privacy policy, and confirm that you are at least 18.";

// Both boxes are required, on the page and here, so a hand-made post without them creates nothing.
export function consentGiven(formData: FormData): boolean {
  return formData.get("terms") === "yes" && formData.get("age") === "yes";
}

// What is kept as proof of the agreement: when, and which version of the texts it was.
export function consentRecord(now: Date = new Date()) {
  return { termsAcceptedAt: now, termsVersion: LEGAL_VERSION, ageConfirmedAt: now };
}
