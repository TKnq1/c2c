import { passwordResetEmail, verificationEmail } from "@/lib/email-templates";
import { SITE_URL } from "@/lib/site";

// Local preview of the emails, as the HTML a mail client receives
// (/dev-emails/verify, /dev-emails/reset; add ?text for the plain-text
// part). The links carry a dummy token. Like the other /dev-* routes it's a
// 404 in production (see proxy.ts).
const TOKEN = "0".repeat(64);

const EMAILS = {
  verify: () => verificationEmail(`${SITE_URL}/verify-email/${TOKEN}`),
  reset: () => passwordResetEmail(`${SITE_URL}/reset-password/${TOKEN}`),
};

export async function GET(request: Request, ctx: RouteContext<"/dev-emails/[name]">) {
  const { name } = await ctx.params;
  const email = Object.hasOwn(EMAILS, name) ? EMAILS[name as keyof typeof EMAILS]() : null;
  if (!email) return new Response("Unknown email. Try /dev-emails/verify or /dev-emails/reset.", { status: 404 });

  const asText = new URL(request.url).searchParams.has("text");
  return new Response(asText ? email.text : email.html, {
    headers: { "Content-Type": `${asText ? "text/plain" : "text/html"}; charset=utf-8` },
  });
}
