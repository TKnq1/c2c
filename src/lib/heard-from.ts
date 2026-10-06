// Answers to the optional "How did you hear about us?" question at the end of onboarding. Only these
// codes are stored (User.heardFrom), never free text.
export const HEARD_FROM = ["search", "social", "friend", "community", "newsletter", "event", "other"] as const;

export type HeardFrom = (typeof HEARD_FROM)[number];

export function isHeardFrom(value: unknown): value is HeardFrom {
  return typeof value === "string" && (HEARD_FROM as readonly string[]).includes(value);
}
