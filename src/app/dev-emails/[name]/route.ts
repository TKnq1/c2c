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
import { SITE_URL } from "@/lib/site";

// Local preview of the emails, as the HTML a mail client receives
// (/dev-emails/welcome, /welcome-brand, /marketing-creator, /marketing-brand,
// /verify, /reset, /changed, /waitlist, /test; add ?text for the plain-text
// part). The links carry a dummy
// token. Like the other /dev-* routes it's a 404 in production (see
// proxy.ts).
const TOKEN = "0".repeat(64);

const EMAILS = {
  welcome: () => welcomeEmail(`${SITE_URL}/verify-email/${TOKEN}`, "CREATOR"),
  "welcome-brand": () => welcomeEmail(`${SITE_URL}/verify-email/${TOKEN}`, "STARTUP"),
  verify: () => verificationEmail(`${SITE_URL}/verify-email/${TOKEN}`),
  reset: () => passwordResetEmail(`${SITE_URL}/reset-password/${TOKEN}`),
  changed: () => passwordChangedEmail(`${SITE_URL}/forgot-password`),
  waitlist: () => waitlistConfirmationEmail(`${SITE_URL}/waitlist/confirm/${TOKEN}`),
  test: () => testEmail(SITE_URL),
};

export async function GET(request: Request, ctx: RouteContext<"/dev-emails/[name]">) {
  const { name } = await ctx.params;
  const crowd = name === "marketing-creator" || name === "marketing-brand" ? await landingCrowd() : null;
  const email =
    name === "marketing-creator"
      ? marketingWelcomeEmail(marketingEntryUrl("CREATOR"), "CREATOR", "A note from comtor", "Mia", crowd?.brands ?? 0)
      : name === "marketing-brand"
        ? marketingWelcomeEmail(marketingEntryUrl("STARTUP"), "STARTUP", "A note for brands", "Glow", crowd?.creators ?? 0)
        : Object.hasOwn(EMAILS, name)
          ? EMAILS[name as keyof typeof EMAILS]()
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
