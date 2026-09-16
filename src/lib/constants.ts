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
export const PRO_SUBSCRIPTION_PRICE_CENTS = 4900; // $49/month
