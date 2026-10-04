import type { PlatformDraft } from "@/components/platform-chips";
import type { SignupRole } from "@/lib/signup-role";

// Answers collected before an account exists. sessionStorage so a refresh
// mid-funnel doesn't dump the person back to the first question. Cleared
// once the account is created.
const STORAGE_KEY = "comtor-onboarding-draft";

export type OnboardingDraft = {
  role: SignupRole;
  step: number;
  displayName: string;
  niches: string[];
  platforms: PlatformDraft[];
  companyName: string;
  niche: string;
  photoDataUrl: string | null;
  // Step keys the person skipped (photo, logo, swipe), so a refresh still
  // records the skip once the account exists.
  skipped: string[];
};

function isPlatform(value: unknown): value is PlatformDraft {
  if (!value || typeof value !== "object") return false;
  const row = value as PlatformDraft;
  return typeof row.platform === "string" && typeof row.followers === "string" && typeof row.url === "string";
}

export function parseOnboardingDraft(raw: string): OnboardingDraft | null {
  try {
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>;
    if (parsed.role !== "CREATOR" && parsed.role !== "STARTUP") return null;
    return {
      role: parsed.role,
      step: Number.isInteger(parsed.step) && (parsed.step ?? 0) >= 0 ? parsed.step! : 0,
      displayName: typeof parsed.displayName === "string" ? parsed.displayName : "",
      niches: Array.isArray(parsed.niches) ? parsed.niches.filter((n): n is string => typeof n === "string") : [],
      platforms: Array.isArray(parsed.platforms) ? parsed.platforms.filter(isPlatform) : [],
      companyName: typeof parsed.companyName === "string" ? parsed.companyName : "",
      niche: typeof parsed.niche === "string" ? parsed.niche : "",
      photoDataUrl: typeof parsed.photoDataUrl === "string" && parsed.photoDataUrl.startsWith("data:image/") ? parsed.photoDataUrl : null,
      skipped: Array.isArray(parsed.skipped) ? parsed.skipped.filter((s): s is string => typeof s === "string") : [],
    };
  } catch {
    return null;
  }
}

export function readOnboardingDraft(): OnboardingDraft | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? parseOnboardingDraft(raw) : null;
  } catch {
    return null;
  }
}

export function writeOnboardingDraft(draft: OnboardingDraft) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
    // A photo can blow the quota. Keep the answers and drop the picture.
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...draft, photoDataUrl: null }));
    } catch {
      // The wizard still holds the answers in memory for this visit.
    }
  }
}

export function clearOnboardingDraft() {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
