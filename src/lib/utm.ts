// The campaign a visitor came from, carried to sign-up in the link itself (no cookie, nothing stored on the device):
// the landing page adds the utm_* parameters it was opened with to its sign-up link, and the sign-up stores them.
export type Utm = { source: string | null; medium: string | null; campaign: string | null; content: string | null };

const MAX = 80;

// Only letters, digits and a few separators survive, so what is stored is a label and never markup or free text.
// Spaces become hyphens, so "Herbst Creator" in an ad manager and "herbst-creator" in a link are the same campaign.
export function cleanUtm(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9._\-+]/g, "").slice(0, MAX);
  return cleaned || null;
}

type Params = Record<string, string | string[] | undefined> | { get(name: string): string | null };

function pick(params: Params, key: string): unknown {
  if ("get" in params && typeof params.get === "function") return params.get(key);
  const value = (params as Record<string, string | string[] | undefined>)[key];
  return Array.isArray(value) ? value[0] : value;
}

export function readUtm(params: Params): Utm | null {
  const utm = {
    source: cleanUtm(pick(params, "utm_source")),
    medium: cleanUtm(pick(params, "utm_medium")),
    campaign: cleanUtm(pick(params, "utm_campaign")),
    content: cleanUtm(pick(params, "utm_content")),
  };
  return utm.source || utm.medium || utm.campaign || utm.content ? utm : null;
}

// Back into query parameters, for the sign-up link.
export function utmQuery(utm: Utm | null): string {
  if (!utm) return "";
  const query = new URLSearchParams();
  if (utm.source) query.set("utm_source", utm.source);
  if (utm.medium) query.set("utm_medium", utm.medium);
  if (utm.campaign) query.set("utm_campaign", utm.campaign);
  if (utm.content) query.set("utm_content", utm.content);
  return query.toString();
}

// The columns on User (see schema.prisma). Nothing set means all null.
export function utmColumns(utm: Utm | null) {
  return { utmSource: utm?.source ?? null, utmMedium: utm?.medium ?? null, utmCampaign: utm?.campaign ?? null, utmContent: utm?.content ?? null };
}

// Into form fields and back, for the sign-up form (the same four names as in the link).
export function utmFields(utm: Utm | null): Record<string, string> {
  return Object.fromEntries(new URLSearchParams(utmQuery(utm)).entries());
}

export function utmFromForm(formData: FormData): Utm | null {
  return readUtm({
    utm_source: formData.get("utm_source")?.toString(),
    utm_medium: formData.get("utm_medium")?.toString(),
    utm_campaign: formData.get("utm_campaign")?.toString(),
    utm_content: formData.get("utm_content")?.toString(),
  });
}
