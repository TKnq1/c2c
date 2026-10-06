// Marketing email to addresses nobody has agreed to be mailed at is not allowed (§ 7 UWG, Art. 13 ePrivacy
// Directive), so the whole outreach feature stays off until it is switched on on purpose:
// OUTREACH_ENABLED=1 in the environment. Even then only addresses with a documented consent are mailed.
export function outreachEnabled(): boolean {
  return process.env.OUTREACH_ENABLED === "1";
}

export const OUTREACH_PAUSED_MESSAGE =
  "Outreach is switched off. Set OUTREACH_ENABLED=1 to turn it on, and only mail people who agreed to it.";
