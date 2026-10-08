import { Resend } from "resend";
import { logMail } from "@/lib/mail-log";
import type { Email } from "@/lib/email-templates";

// Production sets EMAIL_FROM to the sender on comtor.app, the domain
// verified in Resend. Without it (local dev) mail goes out from Resend's
// shared test sender, which only reaches the Resend account's own address,
// so test sign-ups with made-up addresses don't mail anyone. Trimmed like
// the key below: a line break pasted into a hosting dashboard would make
// every send fail.
const FROM_EMAIL = process.env.EMAIL_FROM?.trim() || "comtor <onboarding@resend.dev>";

// What /admin/email shows: how mail is set up here, never the key itself.
export function emailSetup() {
  return {
    from: FROM_EMAIL,
    apiKeySet: Boolean(process.env.RESEND_API_KEY?.trim()),
    // Resend's shared test sender only delivers to the Resend account's own
    // address, so on the live site this means almost nobody gets anything.
    usesSharedTestSender: !process.env.EMAIL_FROM?.trim(),
  };
}

export type SendEmailResult = { ok: true; id: string } | { ok: false; error: string };

// A file that goes with the mail (an invoice as a PDF).
export type MailAttachment = { filename: string; content: Uint8Array };

type Outgoing = Email & { to: string; headers?: Record<string, string>; attachments?: MailAttachment[] };

export async function sendEmail(email: Outgoing): Promise<SendEmailResult> {
  // For local seeds and demos (prisma/seed-deals.ts): nothing leaves the machine, nothing is logged, so a developer's real key
  // never mails the demo accounts.
  if (process.env.EMAIL_DRY_RUN === "1") return { ok: true, id: "dry-run" };
  const result = await deliver(email);
  await logMail(email.subject, result);
  return result;
}

async function deliver({ to, subject, html, text, headers, attachments }: Outgoing): Promise<SendEmailResult> {
  try {
    // Constructed here, not at module scope — the Resend constructor throws
    // immediately on a missing key, and Next.js evaluates this module while
    // statically analyzing routes at build time, not just at request time.
    // .trim() for the same reason as the Stripe client — a trailing newline
    // from a hosting dashboard paste breaks the Authorization header, not
    // the key itself.
    const resend = new Resend(process.env.RESEND_API_KEY?.trim());
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
      html,
      text,
      ...(headers && { headers }),
      ...(attachments?.length && { attachments: attachments.map((a) => ({ filename: a.filename, content: Buffer.from(a.content) })) }),
    });
    if (error) return failed(subject, `${error.name}: ${error.message}`);
    return { ok: true, id: data?.id ?? "" };
  } catch (err) {
    // A missing key throws instead of reporting; no caller should go down
    // with it (see below), so it's a failed send like any other.
    return failed(subject, err instanceof Error ? err.message : String(err));
  }
}

// Resend reports a failed send in the result instead of throwing, and the
// callers deliberately respond the same either way (a reset request must
// not reveal whether an address has an account), so the server log is
// where a failure shows up for them, and /admin/email's test send for an
// admin.
function failed(subject: string, message: string): SendEmailResult {
  console.error(`Sending "${subject}" failed: ${message}`);
  return { ok: false, error: message };
}
