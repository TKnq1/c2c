import { SITE_URL } from "@/lib/site";

// The app's emails, in the launch video's look: the white comtor mark and
// a big white Lato Black headline (ending in a full stop, like the video's
// and the landing page's) on a near-black panel with film grain, then the
// text and one ink pill button on white, the fallback link on a fog panel
// like the app's cards.
//
// Built the way email has to be: layout tables and inline styles. Gmail
// drops <style> in some of its apps and Outlook on Windows renders with
// Word, so everything that matters is inline and the style blocks only add
// what can fail quietly: Lato (Apple Mail; everyone else gets their system
// font), narrower margins on phones and dark mode (Apple Mail; Gmail and
// Outlook darken on their own). One block each, because a client that
// chokes on one rule throws out its whole block. The panel's grain is a
// background image with a plain near-black underneath for clients without
// one. /dev-emails/<name> shows them locally (see that route for the names).

export type Email = { subject: string; html: string; text: string };

type Content = {
  subject: string;
  // The grey line an inbox shows after the subject.
  preview: string;
  heading: string;
  body: string;
  action: { label: string; url: string };
  // Under the button: how long the link works, what to do if this wasn't you.
  note: string;
};

// The first email after sign-up: a welcome with the verification link in
// it, so a new account gets one email rather than two. Asking for the link
// again later gets the plain verificationEmail below.
export function welcomeEmail(url: string, role: "CREATOR" | "STARTUP"): Email {
  return render({
    subject: "Welcome to comtor – verify your email",
    preview: "Thanks for signing up. One tap and your email is verified.",
    heading: "Welcome to comtor.",
    body:
      role === "CREATOR"
        ? "Thanks for signing up. Verify your email, then swipe through brand deals with the budget right on the card."
        : "Thanks for signing up. Verify your email, then post your first request. Creators come to you.",
    action: { label: "Verify email", url },
    note: "The link works for 24 hours. Didn't sign up for comtor? Then you can ignore this email.",
  });
}

// A marketing note to people who already have an account. Separate from
// welcomeEmail, which is the sign-up mail and carries the verify link.
export function marketingWelcomeEmail(url: string, role: "CREATOR" | "STARTUP"): Email {
  if (role === "CREATOR") {
    return render({
      subject: "You're in on comtor",
      preview: "Brands are posting deals. The budget is on the card.",
      heading: "You're in.",
      body: "Brands are already posting deals, with the budget on the card. Swipe right on the ones you want. The money is in before you post, and you keep 90%.",
      action: { label: "Open your feed", url },
      note: "You're getting this because you have a comtor creator account.",
    });
  }
  return render({
    subject: "Creators are on comtor",
    preview: "Post a request. Creators who fit come to you.",
    heading: "Creators are here.",
    body: "Post a request with the budget and what to post. Creators who fit swipe right, and your money stays held until you've approved the post.",
    action: { label: "Post a request", url },
    note: "You're getting this because you have a comtor brand account.",
  });
}

export function verificationEmail(url: string): Email {
  return render({
    subject: "Verify your comtor email",
    preview: "Confirm it's your address. The link works for 24 hours.",
    heading: "Verify your email.",
    body: "Confirm that this address belongs to your comtor account.",
    action: { label: "Verify email", url },
    note: "The link works for 24 hours. Didn't sign up for comtor? Then you can ignore this email.",
  });
}

export function passwordResetEmail(url: string): Email {
  return render({
    subject: "Reset your comtor password",
    preview: "Choose a new password. The link works for 1 hour.",
    heading: "Reset your password.",
    body: "Someone asked to reset your comtor password. If that was you, choose a new one.",
    action: { label: "Choose a new password", url },
    note: "The link works once, for 1 hour. A new password logs you out everywhere. Didn't ask for this? Then ignore this email and your password stays the same.",
  });
}

// After every password change and reset. The button is for when it wasn't
// them: a reset through their inbox logs out whoever changed it.
export function passwordChangedEmail(resetUrl: string): Email {
  return render({
    subject: "Your comtor password was changed",
    preview: "If that was you, you're all set.",
    heading: "Your password was changed.",
    body: "The password of your comtor account was just changed, and your other devices were logged out. If that was you, you're all set.",
    action: { label: "Reset password", url: resetUrl },
    note: "Wasn't you? Reset your password right away. That logs out whoever changed it.",
  });
}

// What /admin/email sends to check that mail gets out and looks right.
export function testEmail(url: string): Email {
  return render({
    subject: "comtor test email",
    preview: "If you can read this, email from comtor works.",
    heading: "It works.",
    body: "This is a test email from the admin area. If it's in your inbox, sign-up, verification and password emails reach people too.",
    action: { label: "Open comtor", url },
    note: "Sent by an admin from /admin/email. Nothing to do.",
  });
}

// The waitlist's double opt-in: nobody gets the launch email without
// clicking this first (see joinWaitlistAction).
export function waitlistConfirmationEmail(url: string): Email {
  return render({
    subject: "Confirm your spot on the comtor waitlist",
    preview: "One tap and you'll hear from us the day the apps are out.",
    heading: "Confirm your email.",
    body: "You asked to hear when the comtor apps are out on iOS and Android. Confirm that this address is yours and you're on the list.",
    action: { label: "Confirm email", url },
    note: "We'll send you one email, the day the apps are out. Didn't sign up? Then ignore this email and you won't hear from us.",
  });
}

// The app's tokens (globals.css) and Tailwind's neutral greys it uses for
// secondary text, light first, then dark.
const INK = "#070707";
const TEXT = "#404040";
const MUTED = "#737373";
const FOG = "#f2f2f2";
const LINE = "#e5e5e5";
const DARK = { paper: "#1e1e1e", fog: "#2d2d2d", text: "#d4d4d4", muted: "#a3a3a3" };
// The video's backdrop, under its grain image (public/email/band-dark.jpg).
const NIGHT = "#0b0b0b";

const FONT = "Lato, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

// Served from public/email, next to the images (Lato is SIL OFL, see the
// licence there). Only clients that support web fonts fetch them.
const FONT_FACES = (
  [
    [400, "Regular"],
    [700, "Bold"],
    [900, "Black"],
  ] as const
)
  .map(
    ([weight, file]) =>
      `@font-face { font-family: Lato; font-style: normal; font-weight: ${weight}; src: url(${SITE_URL}/email/fonts/Lato-${file}.ttf) format("truetype"); }`,
  )
  .join("\n");

// Keeps inboxes from padding the preview line out with the start of the
// body ("Verify your email. Confirm that…").
const PREVIEW_FILLER = "&#847;&zwnj;&nbsp;".repeat(90);

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function render(c: Content): Email {
  const url = escapeHtml(c.action.url);
  const imprint = `${SITE_URL}/legal/imprint`;
  const privacy = `${SITE_URL}/legal/privacy`;
  const night = `${SITE_URL}/email/band-dark.jpg`;

  const html = `<!doctype html>
<html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(c.subject)}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
${FONT_FACES}
</style>
<style>
@media (max-width: 600px) {
  .px { padding-left: 24px !important; padding-right: 24px !important; }
  .h1 { font-size: 36px !important; }
}
</style>
<style>
@media (prefers-color-scheme: dark) {
  .bg { background-color: ${DARK.paper} !important; }
  .ink { color: #ffffff !important; }
  .text { color: ${DARK.text} !important; }
  .muted { color: ${DARK.muted} !important; }
  .panel { background-color: ${DARK.fog} !important; }
  .line { border-color: ${DARK.fog} !important; }
  .btn { background-color: #ffffff !important; }
  .btn a { color: ${INK} !important; }
}
</style>
<!--[if mso]><style>h1, p, a, td { font-family: Arial, Helvetica, sans-serif !important; }</style><![endif]-->
</head>
<body class="bg" style="margin:0;padding:0;background-color:#ffffff;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(c.preview)}${PREVIEW_FILLER}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background-color:#ffffff;">
<tr><td align="center">
<!--[if mso]><table role="presentation" width="520" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;">
<tr><td class="px" style="padding:32px 32px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td bgcolor="${NIGHT}" background="${night}" style="padding:32px 28px 40px;border-radius:4px;background-color:${NIGHT};background-image:url(${night});background-size:cover;background-position:center;">
<img src="${SITE_URL}/email/mark-white.png" width="48" height="32" alt="comtor" style="display:block;width:48px;height:32px;border:0;">
<h1 class="h1" style="margin:88px 0 0;font-family:${FONT};font-size:42px;line-height:1.04;font-weight:900;letter-spacing:-0.025em;color:#ffffff;">${escapeHtml(c.heading)}</h1>
</td>
</tr></table>
</td></tr>
<tr><td class="px" style="padding:24px 32px 0;">
<p class="text" style="margin:0;font-family:${FONT};font-size:16px;line-height:1.55;color:${TEXT};">${escapeHtml(c.body)}</p>
</td></tr>
<tr><td class="px" style="padding:28px 32px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="btn" style="border-radius:999px;background-color:${INK};mso-padding-alt:14px 28px;">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(c.action.label)}</a>
</td>
</tr></table>
</td></tr>
<tr><td class="px" style="padding:24px 32px 0;">
<p class="muted" style="margin:0;font-family:${FONT};font-size:14px;line-height:1.55;color:${MUTED};">${escapeHtml(c.note)}</p>
</td></tr>
<tr><td class="px" style="padding:24px 32px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="panel" style="padding:14px 16px;border-radius:4px;background-color:${FOG};">
<p class="muted" style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.45;color:${MUTED};">Button not working? Paste this link into your browser:</p>
<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.45;word-break:break-all;"><a class="ink" href="${url}" target="_blank" style="color:${INK};text-decoration:underline;">${url}</a></p>
</td>
</tr></table>
</td></tr>
<tr><td class="px" style="padding:40px 32px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="line" style="padding-top:20px;border-top:1px solid ${LINE};">
<p class="muted" style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};"><strong class="ink" style="font-weight:900;color:${INK};">comtor</strong> · Brands meet the right creators.<br><a class="muted" href="${imprint}" target="_blank" style="color:${MUTED};text-decoration:underline;">Imprint</a> · <a class="muted" href="${privacy}" target="_blank" style="color:${MUTED};text-decoration:underline;">Privacy</a></p>
</td>
</tr></table>
</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>`;

  const text = [
    c.heading,
    "",
    c.body,
    "",
    `${c.action.label}: ${c.action.url}`,
    "",
    c.note,
    "",
    "-- ",
    "comtor · Brands meet the right creators.",
    `Imprint: ${imprint}`,
    `Privacy: ${privacy}`,
  ].join("\n");

  return { subject: c.subject, html, text };
}
