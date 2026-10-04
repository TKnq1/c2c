import { z } from "zod";
import { NICHES, MAX_CREATOR_NICHES, PLATFORMS, PRODUCT_CATEGORIES, LANGUAGES } from "@/lib/constants";

const nicheEnum = z.enum([...NICHES]);
const platformEnum = z.enum([...PLATFORMS]);
const productCategoryEnum = z.enum([...PRODUCT_CATEGORIES]);
const languageEnum = z.enum([...LANGUAGES]);
const optionalUrl = z.string().trim().url("Please enter a valid URL").or(z.literal(""));

// Dynamic-length rows (platforms, social links) are built client-side and
// submitted as a JSON string in one hidden field, since a plain <form> has
// no native way to post a variable-length list.
function jsonField<T extends z.ZodTypeAny>(schema: T) {
  return z
    .string()
    .transform((val, ctx) => {
      try {
        return JSON.parse(val);
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid selection" });
        return z.NEVER;
      }
    })
    .pipe(schema);
}

const platformEntrySchema = z.object({
  platform: platformEnum,
  followerCount: z.coerce.number().int().min(0),
  // Required: it's what a brand opens from the creator's profile.
  url: z
    .string({ error: "Add the link to each of your profiles." })
    .trim()
    .min(1, "Add the link to each of your profiles.")
    .url("Please enter a valid profile link"),
});

const platformsField = jsonField(
  z
    .array(platformEntrySchema)
    .min(1, "Select at least one platform")
    .refine(
      (entries) => new Set(entries.map((e) => e.platform)).size === entries.length,
      "Each platform can only be selected once",
    ),
);

const socialLinkEntrySchema = z.object({
  platform: platformEnum,
  url: z.string().trim().url("Please enter a valid URL"),
});

const socialLinksField = jsonField(
  z
    .array(socialLinkEntrySchema)
    .refine(
      (entries) => new Set(entries.map((e) => e.platform)).size === entries.length,
      "Each platform can only be added once",
    ),
);

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// Just enough to create the account — everything role-specific (company
// name, or display name/niche/platforms) is collected right after by the
// onboarding wizard, one field at a time, so the signup form itself stays
// this short.
export const signupSchema = z.object({
  role: z.enum(["STARTUP", "CREATOR"]),
  email: z.string().email(),
  password: z.string().min(8),
});

export const onboardingCompanyNameSchema = z.object({
  companyName: z.string().min(1).max(120),
});

export const onboardingDisplayNameSchema = z.object({
  displayName: z.string().min(1).max(120),
});

export const onboardingNicheSchema = z.object({
  niche: nicheEnum,
});

// A creator's niches post as one comma-joined hidden input, like languages
// below.
const nichesField = z
  .string()
  .transform((val) => val.split(",").filter(Boolean))
  .pipe(
    z
      .array(nicheEnum)
      .min(1, "Pick at least one niche.")
      .max(MAX_CREATOR_NICHES, `Pick up to ${MAX_CREATOR_NICHES} niches.`)
      .refine((niches) => new Set(niches).size === niches.length, "Each niche can only be picked once."),
  );

export const onboardingNichesSchema = z.object({
  niches: nichesField,
});

export const onboardingPlatformsSchema = z.object({
  platforms: platformsField,
});

// Guest onboarding: the account is created only after the profile answers
// exist, so this one submit writes both.
export const guestCreatorSignupSchema = signupSchema.extend({
  displayName: onboardingDisplayNameSchema.shape.displayName,
  niches: nichesField,
  platforms: platformsField,
});

export const guestBrandSignupSchema = signupSchema.extend({
  companyName: onboardingCompanyNameSchema.shape.companyName,
  niche: nicheEnum,
});

// The form posts languages as one comma-joined hidden input (same encoding
// the language filter already uses in the URL) rather than repeated form
// keys, so the existing Object.fromEntries(formData) call sites don't need
// to change to formData.getAll for this one field.
const languagesField = z
  .string()
  .transform((val) => val.split(",").filter(Boolean))
  .pipe(z.array(languageEnum).min(1, "Select at least one language"));

// Euros the way a brand types them ("250", "250.50", "250,50"), as cents.
const euros = z
  .string()
  .trim()
  .regex(/^\d{1,6}([.,]\d{1,2})?$/, "Enter the budget in euros, e.g. 250.")
  .transform((val) => Math.round(parseFloat(val.replace(",", ".")) * 100))
  .pipe(z.number().int().min(100, "The budget has to be at least 1 €.").max(10_000_000, "The budget can be at most 100.000 €."));

// A date input's "YYYY-MM-DD" as midnight UTC, or null when left empty
// (flexible). Yesterday still passes so a brand a timezone behind UTC isn't
// told their today is in the past.
const postByField = z
  .string()
  .trim()
  .transform((val, ctx) => {
    if (!val) return null;
    const date = new Date(`${val}T00:00:00Z`);
    const now = new Date();
    const yesterday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val) || Number.isNaN(date.getTime())) {
      ctx.addIssue({ code: "custom", message: "Pick a valid post-by date." });
      return z.NEVER;
    }
    if (date.getTime() < yesterday) {
      ctx.addIssue({ code: "custom", message: "The post-by date can't be in the past." });
      return z.NEVER;
    }
    if (date.getTime() > yesterday + 400 * 24 * 60 * 60 * 1000) {
      ctx.addIssue({ code: "custom", message: "Pick a post-by date within the next year." });
      return z.NEVER;
    }
    return date;
  });

export const createRequestSchema = z
  .object({
    title: z.string().trim().min(1, "Give the request a title.").max(120, "Keep the title under 120 characters."),
    description: z.string().trim().min(1, "Describe what you're looking for.").max(2000, "Keep the description under 2000 characters."),
    niche: nicheEnum,
    languages: languagesField,
    minFollowers: z.coerce.number().int().min(0),
    productCategory: productCategoryEnum,
    platform: z.enum([...PLATFORMS], { error: "Choose where it gets posted." }),
    deliverables: z
      .string()
      .trim()
      .min(1, "Say what should be posted, e.g. 1 Reel + 2 Stories.")
      .max(80, "Keep what should be posted under 80 characters."),
    budgetMin: euros,
    // Empty means a fixed price: the same as budgetMin.
    budgetMax: z
      .string()
      .trim()
      .pipe(z.union([z.literal("").transform(() => null), euros])),
    postBy: postByField,
    productIncluded: z
      .string()
      .optional()
      .transform((val) => val === "true"),
  })
  .refine((d) => d.budgetMax === null || d.budgetMax >= d.budgetMin, {
    error: "The top of the budget range can't be below the bottom.",
    path: ["budgetMax"],
  });

export const updateCreatorProfileSchema = z.object({
  displayName: z.string().min(1).max(120),
  niches: nichesField,
  contentLanguage: languageEnum,
  bio: z.string().max(2000).optional(),
  platforms: platformsField,
});

export const updateBrandProfileSchema = z.object({
  companyName: z.string().min(1).max(120),
  website: optionalUrl,
  niche: nicheEnum,
  description: z.string().max(2000),
  lookingFor: z.string().max(2000),
  socialLinks: socialLinksField,
});

// A human types euros; everything past this boundary is integer cents, so
// no action ever handles a raw euro string or a float.
const dollarsToCents = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount (e.g. 250 or 250.00)")
  .transform((val) => Math.round(parseFloat(val) * 100))
  .pipe(z.number().int().min(100, "Minimum payment is €1.00").max(10_000_000, "Maximum payment is €100,000.00"));

export const sendOfferSchema = z.object({
  amount: dollarsToCents,
});

// Required now — it's what the brand approves the payment against. http(s)
// only: new URL() happily accepts "javascript:" too, and this ends up as a
// link the brand clicks.
export const submitPostSchema = z.object({
  proofUrl: z
    .string()
    .trim()
    .min(1, "Paste the link to your post.")
    .url("That doesn't look like a link. Paste the full address of your post.")
    .refine((url) => /^https?:\/\//i.test(url), "Use the full link, starting with https://"),
});

export const reportProblemSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Tell us what's wrong in a sentence or two.")
    .max(1000, "Keep it under 1000 characters."),
});

export const requestDepositSchema = z.object({
  amount: dollarsToCents,
});

export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const totpCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app"),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Enter your current password"),
});

export const disableTwoFactorSchema = z.object({
  password: z.string().min(1, "Enter your current password"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
