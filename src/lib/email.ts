import { Resend } from "resend";

// Resend's shared onboarding sender only delivers to the Resend account's
// own address until a domain is verified — fine for now, but real users
// signing up with other addresses won't receive mail until FROM_EMAIL
// points at a verified domain (see README).
const FROM_EMAIL = process.env.EMAIL_FROM ?? "C2C <onboarding@resend.dev>";

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  // Constructed here, not at module scope — the Resend constructor throws
  // immediately on a missing key, and Next.js evaluates this module while
  // statically analyzing routes at build time, not just at request time.
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}
