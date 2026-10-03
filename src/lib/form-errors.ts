import type { ZodError } from "zod";

// What the profile forms call their fields, so a rejected save can say which
// one it was ("Platforms & followers: Select at least one platform") instead
// of one generic line.
const FIELD_LABELS: Record<string, string> = {
  displayName: "Display name",
  niches: "Niches",
  contentLanguage: "Content language",
  bio: "About you",
  platforms: "Platforms & followers",
  companyName: "Company name",
  website: "Website",
  niche: "Niche",
  description: "Description",
  lookingFor: "What you're looking for",
  socialLinks: "Social links",
};

export const GENERIC_FORM_ERROR = "Please fill in all fields correctly.";

export function describeInvalidForm(error: ZodError): string {
  const issue = error.issues[0];
  const field = issue ? FIELD_LABELS[String(issue.path[0])] : undefined;
  return field ? `${field}: ${issue.message}` : GENERIC_FORM_ERROR;
}
