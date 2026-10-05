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
  // A short line above the body, a step heavier than the paragraph.
  lead?: string;
  body: string;
  // The beats under the count: a black landing icon, a title, and what it means.
  steps?: { icon: string; title: string; text: string }[];
  aside?: string;
  // One quiet line under the button: what the click actually costs.
  hint?: string;
  // The live count from the other side: brands on a creator mail, creators on a brand mail.
  crowd?: { count: number; label: string };
  // The black panel uses the large faint mark instead of the small logo.
  watermark?: boolean;
  // A first-touch note: the company name in the panel, one wide button,
  // and no grey "paste this link" box. That box belongs on a verify mail.
  invite?: boolean;
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

// A marketing note for people who may never have opened comtor. The subject
// is whatever the admin typed. The body says what the product is, because
// the inbox is the first time many of them hear of it. Separate from
// welcomeEmail, which is the sign-up mail and carries the verify link.
// Cold outreach has no account yet, so the button opens onboarding with the
// side already chosen. /dashboard would only bounce them to the login page.
export function marketingEntryUrl(role: "CREATOR" | "STARTUP"): string {
  return `${SITE_URL}/onboarding?role=${role === "CREATOR" ? "creator" : "brand"}`;
}

function crowdLine(count: number, singular: string, plural: string) {
  const safe = Math.max(0, Math.floor(count));
  return { count: safe, label: `${safe === 1 ? singular : plural} already here` };
}

export function marketingWelcomeEmail(
  url: string,
  role: "CREATOR" | "STARTUP",
  subject: string,
  name: string,
  crowd: number,
): Email {
  const who = name.trim();
  if (role === "CREATOR") {
    return render({
      subject,
      preview: "Earn money posting TikToks.",
      heading: who ? `${who}, earn money posting TikToks.` : "Earn money posting TikToks.",
      body: "comtor is where brands post a paid deal and you swipe the ones you want. The budget is on the card, they pay before you post, and you keep 90%.",
      steps: [
        {
          icon: "swipe",
          title: "Swipe a deal.",
          text: "Right means you want it, left means you pass. The brand sees your profile and can message you.",
        },
        {
          icon: "money-bag",
          title: "The budget is on the card.",
          text: "No more DMs about your rate. Every request says what it pays, what to post, and whether the product comes with it.",
        },
        {
          icon: "locked",
          title: "Paid before you post.",
          text: "Accept the offer and the brand pays first. The money waits until your post is up.",
        },
        {
          icon: "money-wings",
          title: "You keep 90%.",
          text: "The brand has 3 days to approve your post. If they don't answer, it's released to you anyway.",
        },
      ],
      crowd: crowdLine(crowd, "brand", "brands"),
      hint: "About two minutes. No call. Your account comes at the end.",
      watermark: true,
      invite: true,
      action: { label: "See paid deals", url },
      note: "You're getting this because comtor has your email as a creator.",
    });
  }
  return render({
    subject,
    preview: "Grow your brand with content creators.",
    heading: who ? `${who}, grow your brand with content creators.` : "Grow your brand with content creators.",
    body: "comtor is where you post the product, the budget, and what to make. Creators who fit swipe right and come to you. You pay when you agree, and the money waits until the post is live.",
    steps: [
      {
        icon: "megaphone",
        title: "Post the product and the budget.",
        text: "Photos, the budget, the platform, and what to post. Creators get it as a card in their feed.",
      },
      {
        icon: "bell",
        title: "Creators come to you.",
        text: "Creators in your niche swipe right. You see their reach and reviews and pick who fits.",
      },
      {
        icon: "speech-balloon",
        title: "Agree on it in the chat.",
        text: "Send an offer. When they accept, you pay, and the money is held until the post is live.",
      },
      {
        icon: "camera-flash",
        title: "Then it's paid out.",
        text: "You check the live post first. No subscription: comtor keeps 10% of each payment, or 3% on Pro.",
      },
    ],
    crowd: crowdLine(crowd, "creator", "creators"),
    hint: "About two minutes. No call. Your account comes at the end.",
    watermark: true,
    invite: true,
    action: { label: "Post your first deal", url },
    note: "You're getting this because comtor has your email as a brand.",
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
  const night = `${SITE_URL}/email/${c.watermark ? "band-mark.jpg" : "band-dark.jpg"}`;
  const logo = c.watermark
    ? ""
    : `<img src="${SITE_URL}/email/mark-white.png" width="48" height="32" alt="comtor" style="display:block;width:48px;height:32px;border:0;">`;
  const wordmark = c.invite
    ? `<p style="margin:0;font-family:${FONT};font-size:15px;line-height:1;font-weight:900;letter-spacing:-0.03em;color:#ffffff;">comtor</p>`
    : logo;
  const headingSpace = c.invite ? "36px" : c.watermark ? "48px" : "88px";
  const headingSize = c.watermark ? "32px" : "42px";
  const headingClass = c.watermark ? "h1 h1-invite" : "h1";
  const button = c.invite
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="btn" align="center" style="border-radius:999px;background-color:${INK};mso-padding-alt:16px 28px;">
<a href="${url}" target="_blank" style="display:block;padding:16px 28px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;text-align:center;">${escapeHtml(c.action.label)}</a>
</td>
</tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="btn" style="border-radius:999px;background-color:${INK};mso-padding-alt:14px 28px;">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${escapeHtml(c.action.label)}</a>
</td>
</tr></table>`;
  const noteRow = c.invite
    ? ""
    : `<tr><td class="px" style="padding:24px 32px 0;">
<p class="muted" style="margin:0;font-family:${FONT};font-size:14px;line-height:1.55;color:${MUTED};">${escapeHtml(c.note)}</p>
</td></tr>`;
  const fallbackRow = c.invite
    ? ""
    : `<tr><td class="px" style="padding:24px 32px 0;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="panel" style="padding:14px 16px;border-radius:4px;background-color:${FOG};">
<p class="muted" style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.45;color:${MUTED};">Button not working? Paste this link into your browser:</p>
<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.45;word-break:break-all;"><a class="ink" href="${url}" target="_blank" style="color:${INK};text-decoration:underline;">${url}</a></p>
</td>
</tr></table>
</td></tr>`;
  const footerNote = c.invite
    ? `<p class="muted" style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:1.55;color:${MUTED};">${escapeHtml(c.note)}</p>`
    : "";
  const steps = (c.steps ?? [])
    .map((step, index) => {
      const last = index === (c.steps?.length ?? 0) - 1;
      return `<tr><td style="padding:0 0 ${last ? "0" : "10px"};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="panel" align="center" bgcolor="${FOG}" style="padding:22px 20px 20px;border-radius:4px;background-color:${FOG};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="bg" align="center" valign="middle" width="56" height="56" bgcolor="#ffffff" style="width:56px;height:56px;border-radius:999px;background-color:#ffffff;">
<img src="${SITE_URL}/landing/icons/${step.icon}.png" width="34" height="34" alt="" style="display:block;width:34px;height:34px;border:0;">
</td>
</tr></table>
<p class="ink" style="margin:14px 0 0;font-family:${FONT};font-size:16px;line-height:1.35;font-weight:700;color:${INK};text-align:center;">${escapeHtml(step.title)}</p>
<p class="text" style="margin:6px 0 0;font-family:${FONT};font-size:15px;line-height:1.5;color:${TEXT};text-align:center;">${escapeHtml(step.text)}</p>
</td>
</tr></table>
</td></tr>`;
    })
    .join("\n");
  const stepsTable = steps
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${steps}</table>`
    : "";
  const aside = c.aside
    ? `<p class="ink" style="margin:${steps ? "18px" : "0"} 0 0;font-family:${FONT};font-size:16px;line-height:1.5;font-weight:700;color:${INK};">${escapeHtml(c.aside)}</p>`
    : "";
  const crowdRow = c.crowd
    ? `<tr><td class="px" align="center" style="padding:28px 32px 0;">
<p class="ink" style="margin:0;font-family:${FONT};font-size:56px;line-height:1;font-weight:900;letter-spacing:-0.04em;color:${INK};text-align:center;">${c.crowd.count.toLocaleString("en-US")}</p>
<p class="text" style="margin:8px 0 0;font-family:${FONT};font-size:16px;line-height:1.4;color:${TEXT};text-align:center;">${escapeHtml(c.crowd.label)}</p>
</td></tr>`
    : "";
  const hintRow = c.hint
    ? `<tr><td class="px" align="center" style="padding:14px 32px 0;">
<p class="muted" style="margin:0;font-family:${FONT};font-size:14px;line-height:1.5;color:${MUTED};text-align:center;">${escapeHtml(c.hint)}</p>
</td></tr>`
    : "";

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
  .h1.h1-invite { font-size: 28px !important; }
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
${wordmark}
<h1 class="${headingClass}" style="margin:${headingSpace} 0 0;font-family:${FONT};font-size:${headingSize};line-height:1.08;font-weight:900;letter-spacing:-0.025em;color:#ffffff;">${escapeHtml(c.heading)}</h1>
</td>
</tr></table>
</td></tr>
${crowdRow}
<tr><td class="px" style="padding:28px 32px 0;">
${c.lead ? `<p class="ink" style="margin:0 0 10px;font-family:${FONT};font-size:18px;line-height:1.35;font-weight:700;color:${INK};">${escapeHtml(c.lead)}</p>` : ""}
${c.body ? `<p class="text" style="margin:0 0 ${stepsTable ? "22px" : "0"};font-family:${FONT};font-size:16px;line-height:1.55;color:${TEXT};">${escapeHtml(c.body)}</p>` : ""}
${stepsTable}
${aside}
</td></tr>
<tr><td class="px" style="padding:28px 32px 0;">
${button}
</td></tr>
${hintRow}
${noteRow}
${fallbackRow}
<tr><td class="px" style="padding:40px 32px 48px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="line" style="padding-top:20px;border-top:1px solid ${LINE};">
${footerNote}<p class="muted" style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};"><strong class="ink" style="font-weight:900;color:${INK};">comtor</strong> · Brands meet the right creators.<br><a class="muted" href="${imprint}" target="_blank" style="color:${MUTED};text-decoration:underline;">Imprint</a> · <a class="muted" href="${privacy}" target="_blank" style="color:${MUTED};text-decoration:underline;">Privacy</a></p>
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
    ...(c.crowd ? [`${c.crowd.count.toLocaleString("en-US")} ${c.crowd.label}`, ""] : []),
    ...(c.lead ? [c.lead, ""] : []),
    ...(c.body ? [c.body, ""] : []),
    ...(c.steps?.map((step, index) => `${index + 1}. ${step.title}\n${step.text}`) ?? []),
    ...(c.steps?.length ? [""] : []),
    ...(c.aside ? [c.aside, ""] : []),
    `${c.action.label}: ${c.action.url}`,
    "",
    ...(c.hint ? [c.hint, ""] : []),
    c.note,
    "",
    "-- ",
    "comtor · Brands meet the right creators.",
    `Imprint: ${imprint}`,
    `Privacy: ${privacy}`,
  ].join("\n");

  return { subject: c.subject, html, text };
}
