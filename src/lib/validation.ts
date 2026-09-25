import { z } from "zod";
import { NICHES, PLATFORMS, PRODUCT_CATEGORIES, LANGUAGES } from "@/lib/constants";

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
  // PlatformPicker omits this key entirely (not even "") when left blank,
  // since JSON.stringify drops undefined values — so the empty case here is
  // "key absent", not "key present with an empty string".
  url: optionalUrl.optional(),
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

export const onboardingPlatformsSchema = z.object({
  platforms: platformsField,
});

// The form posts languages as one comma-joined hidden input (same encoding
// the language filter already uses in the URL) rather than repeated form
// keys, so the existing Object.fromEntries(formData) call sites don't need
// to change to formData.getAll for this one field.
const languagesField = z
  .string()
  .transform((val) => val.split(",").filter(Boolean))
  .pipe(z.array(languageEnum).min(1, "Select at least one language"));

export const createRequestSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().min(1).max(2000),
  niche: nicheEnum,
  languages: languagesField,
  minFollowers: z.coerce.number().int().min(0),
  productCategory: productCategoryEnum,
});

export const updateCreatorProfileSchema = z.object({
  displayName: z.string().min(1).max(120),
  niche: nicheEnum,
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
    .url("That doesn't look like a link — paste the full address of your post.")
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
