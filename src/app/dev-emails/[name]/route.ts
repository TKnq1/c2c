import {
  passwordChangedEmail,
  passwordResetEmail,
  testEmail,
  verificationEmail,
  waitlistConfirmationEmail,
  marketingEntryUrl,
  marketingWelcomeEmail,
  welcomeEmail,
} from "@/lib/email-templates";
import { landingCrowd } from "@/lib/landing-crowd";
import { parseLocale, type Locale } from "@/lib/i18n/locales";
import { SITE_URL } from "@/lib/site";

// Local preview of the emails, as the HTML a mail client receives
// (/dev-emails/welcome, /welcome-brand, /marketing-creator, /marketing-brand,
// /verify, /reset, /changed, /waitlist, /test; add ?text for the plain-text
// part and ?lang=en for English, German otherwise). The links carry a dummy
// token. Like the other /dev-* routes it's a 404 in production (see
// proxy.ts).
const TOKEN = "0".repeat(64);

const EMAILS = {
  welcome: (l: Locale) => welcomeEmail(`${SITE_URL}/verify-email/${TOKEN}`, "CREATOR", l),
  "welcome-brand": (l: Locale) => welcomeEmail(`${SITE_URL}/verify-email/${TOKEN}`, "STARTUP", l),
  verify: (l: Locale) => verificationEmail(`${SITE_URL}/verify-email/${TOKEN}`, l),
  reset: (l: Locale) => passwordResetEmail(`${SITE_URL}/reset-password/${TOKEN}`, l),
  changed: (l: Locale) => passwordChangedEmail(`${SITE_URL}/forgot-password`, l),
  waitlist: (l: Locale) => waitlistConfirmationEmail(`${SITE_URL}/waitlist/confirm/${TOKEN}`, l),
  test: (l: Locale) => testEmail(SITE_URL, l),
};

export async function GET(request: Request, ctx: RouteContext<"/dev-emails/[name]">) {
  // Not only the proxy's rewrite: this route itself is a 404 outside development.
  if (process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const { name } = await ctx.params;
  // German unless ?lang=en.
  const locale = parseLocale(new URL(request.url).searchParams.get("lang"));
  const crowd = name === "marketing-creator" || name === "marketing-brand" ? await landingCrowd() : null;
  const email =
    name === "marketing-creator"
      ? marketingWelcomeEmail(marketingEntryUrl("CREATOR"), "CREATOR", "A note from comtor", "Mia", crowd?.brands ?? 0, undefined, undefined, locale)
      : name === "marketing-brand"
        ? marketingWelcomeEmail(marketingEntryUrl("STARTUP"), "STARTUP", "A note for brands", "Glow", crowd?.creators ?? 0, undefined, undefined, locale)
        : Object.hasOwn(EMAILS, name)
          ? EMAILS[name as keyof typeof EMAILS](locale)
          : null;
  if (!email) {
    const names = [...Object.keys(EMAILS), "marketing-creator", "marketing-brand"].join(", ");
    return new Response(`Unknown email. Try one of: ${names}.`, { status: 404 });
  }

  const asText = new URL(request.url).searchParams.has("text");
  return new Response(asText ? email.text : email.html, {
    headers: { "Content-Type": `${asText ? "text/plain" : "text/html"}; charset=utf-8` },
  });
}
