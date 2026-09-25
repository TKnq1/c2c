export const NICHES = [
  "Beauty",
  "Fitness",
  "Food",
  "Fashion",
  "Tech",
  "Travel",
  "Gaming",
  "Lifestyle",
] as const;

export const PLATFORMS = ["Instagram", "TikTok", "YouTube", "Twitch", "X"] as const;

export const LANGUAGES = [
  "English",
  "German",
  "Spanish",
  "French",
  "Italian",
  "Portuguese",
  "Dutch",
] as const;

export const PRODUCT_CATEGORIES = [
  "Cosmetics",
  "Supplements",
  "Sportswear",
  "Electronics",
  "Fashion",
  "Food & Beverage",
  "Software/App",
] as const;

// The platform's cut of every escrow payment (see src/lib/actions/payments.ts).
export const PLATFORM_FEE_RATE = 0.1;

// Pro subscription: a flat monthly fee for a reduced cut on every payment
// instead of the standard rate above.
export const PRO_PLATFORM_FEE_RATE = 0.03;
export const PRO_SUBSCRIPTION_PRICE_CENTS = 4900; // €49/month — must match STRIPE_PRO_PRICE_ID's actual price

// How long a brand has to approve a creator's submitted post (or report a
// problem) before the payment is released automatically.
export const RELEASE_REVIEW_DAYS = 3;
export const RELEASE_REVIEW_MS = RELEASE_REVIEW_DAYS * 24 * 60 * 60 * 1000;

// Deposits are switched off until they run through Stripe for real — so
// far "paying" one only flipped a status and moved no money, which is a
// promise of protection the platform couldn't keep. Hides every way into
// them and makes requestDepositAction refuse new ones.
export const DEPOSITS_ENABLED = false;
