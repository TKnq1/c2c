import { Resend } from "resend";
import type { Email } from "@/lib/email-templates";

// Production sets EMAIL_FROM to the sender on comtor.app, the domain
// verified in Resend. Without it (local dev) mail goes out from Resend's
// shared test sender, which only reaches the Resend account's own address,
// so test sign-ups with made-up addresses don't mail anyone. Trimmed like
// the key below: a line break pasted into a hosting dashboard would make
// every send fail.
const FROM_EMAIL = process.env.EMAIL_FROM?.trim() || "comtor <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html, text }: Email & { to: string }) {
  // Constructed here, not at module scope — the Resend constructor throws
  // immediately on a missing key, and Next.js evaluates this module while
  // statically analyzing routes at build time, not just at request time.
  // .trim() for the same reason as the Stripe client — a trailing newline
  // from a hosting dashboard paste breaks the Authorization header, not
  // the key itself.
  const resend = new Resend(process.env.RESEND_API_KEY?.trim());
  const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html, text });
  // Resend reports a failed send in the result instead of throwing, and the
  // callers deliberately respond the same either way (a reset request must
  // not reveal whether an address has an account), so the server log is
  // where a failure shows up.
  if (error) console.error(`Sending "${subject}" failed: ${error.name}: ${error.message}`);
}
