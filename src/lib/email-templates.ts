import { SITE_URL } from "@/lib/site";
import {
  FOUNDING_BRAND_LIMIT,
  FOUNDING_CREATOR_LIMIT,
  PLATFORM_FEE_RATE,
  PRO_PLATFORM_FEE_RATE,
  PRO_SUBSCRIPTION_PRICE_CENTS,
  RELEASE_REVIEW_DAYS,
} from "@/lib/constants";
import { createT } from "@/lib/i18n/catalogs";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locales";

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
//
// Every email exists in all eight app languages. The texts live in the catalog (src/lib/i18n/messages/emails-*.ts,
// under "emails."); a key a language lacks falls back to English. German is the default, like everywhere else. Each
// function takes the recipient's language as its last argument: the account's stored language, or the visitor's
// language cookie for people without an account.

export type Email = { subject: string; html: string; text: string };

type Content = {
  locale: Locale;
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
  // A link that takes this address off the outreach list.
  optOut?: string;
};

// The first email after sign-up: a welcome with the verification link in
// it, so a new account gets one email rather than two. Asking for the link
// again later gets the plain verificationEmail below.
export function welcomeEmail(
  url: string,
  role: "CREATOR" | "STARTUP",
  locale: Locale = DEFAULT_LOCALE,
  // A brand or a creator that got one of the founding places: told right in the welcome.
  foundingNumber?: number | null,
): Email {
  const t = createT(locale);
  const creator = role === "CREATOR";
  const pro = Math.round(PRO_PLATFORM_FEE_RATE * 100);
  const standard = Math.round(PLATFORM_FEE_RATE * 100);
  const founding = !foundingNumber
    ? ""
    : " " +
      t(creator ? "emails.welcome.foundingCreator" : "emails.welcome.foundingBrand", {
        number: foundingNumber,
        pro,
        standard,
        keep: 100 - pro,
      });
  return render({
    locale,
    subject: t("emails.welcome.subject"),
    preview: t("emails.welcome.preview"),
    heading: t("emails.welcome.heading"),
    body: t(creator ? "emails.welcome.bodyCreator" : "emails.welcome.bodyBrand") + founding,
    action: { label: t("emails.welcome.action"), url },
    note: t("emails.welcome.note"),
  });
}

// Sent once to the brands and creators that were already on comtor when their side's founding places came: their
// account has Pro now. About their own plan, so no advert: no upsell, no opt-out link.
export function foundingNoticeEmail(
  foundingNumber: number,
  locale: Locale = DEFAULT_LOCALE,
  // The account also pays for Pro itself, from before.
  paysForPro = false,
  side: "brand" | "creator" = "brand",
): Email {
  const t = createT(locale);
  const pro = Math.round(PRO_PLATFORM_FEE_RATE * 100);
  const standard = Math.round(PLATFORM_FEE_RATE * 100);
  const creator = side === "creator";
  const subscription = paysForPro ? " " + t("emails.foundingNotice.subscription") : "";
  return render({
    locale,
    subject: t("emails.foundingNotice.subject"),
    preview: t(creator ? "emails.foundingNotice.previewCreator" : "emails.foundingNotice.previewBrand"),
    heading: t("emails.foundingNotice.heading"),
    body:
      t(creator ? "emails.foundingNotice.bodyCreator" : "emails.foundingNotice.bodyBrand", {
        limit: creator ? FOUNDING_CREATOR_LIMIT : FOUNDING_BRAND_LIMIT,
        number: foundingNumber,
        pro,
        standard,
        keep: 100 - pro,
      }) + subscription,
    action: {
      label: t("emails.foundingNotice.action"),
      url: `${SITE_URL}${creator ? "/dashboard/creator/settings#plan" : "/dashboard/startup/settings#plan"}`,
    },
    note: t("emails.foundingNotice.note"),
  });
}

// A marketing note for people who may never have opened comtor. The subject
// is whatever the admin typed. The body says what the product is, because
// the inbox is the first time many of them hear of it. Separate from
// welcomeEmail, which is the sign-up mail and carries the verify link.
// The button opens the landing page on the matching side (?for= is what the
// page itself uses to show creators or brands).
export function marketingEntryUrl(role: "CREATOR" | "STARTUP"): string {
  return `${SITE_URL}/?for=${role === "CREATOR" ? "creators" : "brands"}`;
}

function crowdLine(count: number, one: string, many: string) {
  const safe = Math.max(0, Math.floor(count));
  return { count: safe, label: safe === 1 ? one : many };
}

export function marketingWelcomeEmail(
  url: string,
  role: "CREATOR" | "STARTUP",
  subject: string,
  name: string,
  crowd: number,
  optOut?: string,
  // How the recipient agreed to hear from comtor: told to them as the reason for this mail (Art. 14 GDPR).
  consentNote?: string,
  locale: Locale = DEFAULT_LOCALE,
): Email {
  const t = createT(locale);
  const who = name.trim();
  const reason = consentNote?.trim();
  const note = reason ? t("emails.marketingWelcome.noteWithReason", { reason }) : t("emails.marketingWelcome.note");
  const fee = Math.round(PLATFORM_FEE_RATE * 100);
  const proFee = Math.round(PRO_PLATFORM_FEE_RATE * 100);
  const price = PRO_SUBSCRIPTION_PRICE_CENTS / 100;
  const hint = t("emails.marketingWelcome.hint");
  if (role === "CREATOR") {
    const vars = { keep: 100 - fee, proKeep: 100 - proFee, price, days: RELEASE_REVIEW_DAYS };
    return render({
      locale,
      subject,
      preview: t("emails.marketingWelcome.creator.preview"),
      heading: who ? t("emails.marketingWelcome.creator.headingNamed", { name: who }) : t("emails.marketingWelcome.creator.heading"),
      body: t("emails.marketingWelcome.creator.body", vars),
      steps: [
        {
          icon: "swipe",
          title: t("emails.marketingWelcome.creator.steps.swipe.title"),
          text: t("emails.marketingWelcome.creator.steps.swipe.text"),
        },
        {
          icon: "money-bag",
          title: t("emails.marketingWelcome.creator.steps.budget.title"),
          text: t("emails.marketingWelcome.creator.steps.budget.text"),
        },
        {
          icon: "locked",
          title: t("emails.marketingWelcome.creator.steps.paid.title"),
          text: t("emails.marketingWelcome.creator.steps.paid.text"),
        },
        {
          icon: "money-wings",
          title: t("emails.marketingWelcome.creator.steps.keep.title", vars),
          text: t("emails.marketingWelcome.creator.steps.keep.text", vars),
        },
      ],
      crowd: crowdLine(crowd, t("emails.marketingWelcome.creator.crowdOne"), t("emails.marketingWelcome.creator.crowdMany")),
      hint,
      watermark: true,
      invite: true,
      action: { label: t("emails.marketingWelcome.creator.action"), url },
      note,
      optOut,
    });
  }
  const vars = { fee, proFee, price };
  return render({
    locale,
    subject,
    preview: t("emails.marketingWelcome.brand.preview"),
    heading: who ? t("emails.marketingWelcome.brand.headingNamed", { name: who }) : t("emails.marketingWelcome.brand.heading"),
    body: t("emails.marketingWelcome.brand.body"),
    steps: [
      {
        icon: "megaphone",
        title: t("emails.marketingWelcome.brand.steps.post.title"),
        text: t("emails.marketingWelcome.brand.steps.post.text"),
      },
      {
        icon: "bell",
        title: t("emails.marketingWelcome.brand.steps.come.title"),
        text: t("emails.marketingWelcome.brand.steps.come.text"),
      },
      {
        icon: "speech-balloon",
        title: t("emails.marketingWelcome.brand.steps.chat.title"),
        text: t("emails.marketingWelcome.brand.steps.chat.text"),
      },
      {
        icon: "camera-flash",
        title: t("emails.marketingWelcome.brand.steps.paidOut.title"),
        text: t("emails.marketingWelcome.brand.steps.paidOut.text", vars),
      },
    ],
    crowd: crowdLine(crowd, t("emails.marketingWelcome.brand.crowdOne"), t("emails.marketingWelcome.brand.crowdMany")),
    hint,
    watermark: true,
    invite: true,
    action: { label: t("emails.marketingWelcome.brand.action"), url },
    note,
    optOut,
  });
}

export function verificationEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  const t = createT(locale);
  return render({
    locale,
    subject: t("emails.verification.subject"),
    preview: t("emails.verification.preview"),
    heading: t("emails.verification.heading"),
    body: t("emails.verification.body"),
    action: { label: t("emails.verification.action"), url },
    note: t("emails.verification.note"),
  });
}

export function passwordResetEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  const t = createT(locale);
  return render({
    locale,
    subject: t("emails.passwordReset.subject"),
    preview: t("emails.passwordReset.preview"),
    heading: t("emails.passwordReset.heading"),
    body: t("emails.passwordReset.body"),
    action: { label: t("emails.passwordReset.action"), url },
    note: t("emails.passwordReset.note"),
  });
}

// After every password change and reset. The button is for when it wasn't
// them: a reset through their inbox logs out whoever changed it.
export function passwordChangedEmail(resetUrl: string, locale: Locale = DEFAULT_LOCALE): Email {
  const t = createT(locale);
  return render({
    locale,
    subject: t("emails.passwordChanged.subject"),
    preview: t("emails.passwordChanged.preview"),
    heading: t("emails.passwordChanged.heading"),
    body: t("emails.passwordChanged.body"),
    action: { label: t("emails.passwordChanged.action"), url: resetUrl },
    note: t("emails.passwordChanged.note"),
  });
}

// Sent when an admin suspends an account, with the reason: the person is told why, and how to object
// (Digital Services Act, Art. 17).
export function accountSuspendedEmail(reason: string, locale: Locale = DEFAULT_LOCALE): Email {
  const t = createT(locale);
  return render({
    locale,
    subject: t("emails.accountSuspended.subject"),
    preview: t("emails.accountSuspended.preview"),
    heading: t("emails.accountSuspended.heading"),
    body: t("emails.accountSuspended.body", { reason: reason.trim() }),
    action: {
      label: t("emails.accountSuspended.action"),
      url: `mailto:info@comtor.app?subject=${encodeURIComponent(t("emails.accountSuspended.objectSubject"))}`,
    },
    note: t("emails.accountSuspended.note"),
  });
}

// A deal notice as an e-mail: the ones with a deadline, a cancellation, a dispute or money behind them (see NOTICE_SUBJECT in
// src/lib/deals/notices.ts). The text is the notice the person also sees in the app; the heading says whether it asks
// something of them.
export function dealNoticeEmail(args: { subject: string; text: string; url: string; actionNeeded: boolean }, locale: Locale = DEFAULT_LOCALE): Email {
  const t = createT(locale);
  return render({
    locale,
    subject: args.subject,
    preview: args.text.length > 110 ? `${args.text.slice(0, 107)}…` : args.text,
    heading: args.actionNeeded ? t("emails.dealNotice.headingAction") : t("emails.dealNotice.headingNews"),
    body: args.text,
    action: { label: t("emails.dealNotice.action"), url: args.url },
    note: t("emails.dealNotice.note"),
  });
}

// The documents of a deal as an e-mail, with the PDFs attached: a new invoice, a new credit note, or a correction (the cancelled
// document and its replacement). The PDFs are German like the documents; the mail is in the language of the account.
export function dealDocumentEmail(
  args: { kind: "invoice" | "credit" | "corrected"; title: string; number: string; replaces?: string; url: string },
  locale: Locale = DEFAULT_LOCALE,
): Email {
  const t = createT(locale);
  const vars = { title: args.title, number: args.number, replaces: args.replaces ?? "" };
  const subject = t(`emails.dealDocument.${args.kind}.subject`, vars);
  const heading = t(`emails.dealDocument.${args.kind}.heading`, vars);
  const body = t(`emails.dealDocument.${args.kind}.body`, vars);
  return render({
    locale,
    subject,
    preview: body.length > 110 ? `${body.slice(0, 107)}…` : body,
    heading,
    body,
    action: { label: t("emails.dealDocument.action"), url: args.url },
    note: t("emails.dealDocument.note"),
  });
}

// What /admin/email sends to check that mail gets out and looks right.
export function testEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  const t = createT(locale);
  return render({
    locale,
    subject: t("emails.test.subject"),
    preview: t("emails.test.preview"),
    heading: t("emails.test.heading"),
    body: t("emails.test.body"),
    action: { label: t("emails.test.action"), url },
    note: t("emails.test.note"),
  });
}

// Product news. The link opens a page; the button on that page is the
// consent (see confirmMarketingConsent). Opening the mail is not a yes.
export function marketingConsentEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  const t = createT(locale);
  return render({
    locale,
    subject: t("emails.marketingConsent.subject"),
    preview: t("emails.marketingConsent.preview"),
    heading: t("emails.marketingConsent.heading"),
    body: t("emails.marketingConsent.body"),
    action: { label: t("emails.marketingConsent.action"), url },
    note: t("emails.marketingConsent.note"),
  });
}

// The waitlist's double opt-in: nobody gets the launch email without
// clicking this first (see joinWaitlistAction).
export function waitlistConfirmationEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  const t = createT(locale);
  return render({
    locale,
    subject: t("emails.waitlistConfirmation.subject"),
    preview: t("emails.waitlistConfirmation.preview"),
    heading: t("emails.waitlistConfirmation.heading"),
    body: t("emails.waitlistConfirmation.body"),
    action: { label: t("emails.waitlistConfirmation.action"), url },
    note: t("emails.waitlistConfirmation.note"),
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
// One step off pure white. Gmail rewrites #ffffff on a heading to black.
const ON_NIGHT = "#fffffe";

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
  const t = createT(c.locale);
  const chrome = {
    pasteLink: t("emails.chrome.pasteLink"),
    stop: t("emails.chrome.stop"),
    tagline: t("emails.chrome.tagline"),
    imprint: t("emails.chrome.imprint"),
    privacy: t("emails.chrome.privacy"),
    number: t("emails.chrome.numberLocale"),
  };
  const url = escapeHtml(c.action.url);
  const imprint = `${SITE_URL}/legal/imprint`;
  const privacy = `${SITE_URL}/legal/privacy`;
  const night = `${SITE_URL}/email/${c.watermark ? "band-mark.jpg" : "band-dark.jpg"}`;
  const logo = c.watermark
    ? ""
    : `<img src="${SITE_URL}/email/mark-white.png" width="48" height="32" alt="comtor" style="display:block;width:48px;height:32px;border:0;">`;
  const wordmark = c.invite
    ? `<p class="on-night" style="margin:0;font-family:${FONT};font-size:15px;line-height:1;font-weight:900;letter-spacing:-0.03em;color:${ON_NIGHT};">comtor</p>`
    : logo;
  const headingSpace = c.invite ? "36px" : c.watermark ? "48px" : "88px";
  const headingSize = c.watermark ? "32px" : "42px";
  const headingClass = c.watermark ? "h1 h1-invite" : "h1";
  const button = c.invite
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="btn" align="center" style="border-radius:999px;background-color:${INK};mso-padding-alt:16px 28px;">
<a href="${url}" target="_blank" style="display:block;padding:16px 28px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:${ON_NIGHT};text-decoration:none;border-radius:999px;text-align:center;">${escapeHtml(c.action.label)}</a>
</td>
</tr></table>`
    : `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="btn" style="border-radius:999px;background-color:${INK};mso-padding-alt:14px 28px;">
<a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:16px;line-height:20px;font-weight:700;color:${ON_NIGHT};text-decoration:none;border-radius:999px;">${escapeHtml(c.action.label)}</a>
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
<p class="muted" style="margin:0 0 6px;font-family:${FONT};font-size:13px;line-height:1.45;color:${MUTED};">${chrome.pasteLink}</p>
<p style="margin:0;font-family:${FONT};font-size:13px;line-height:1.45;word-break:break-all;"><a class="ink" href="${url}" target="_blank" style="color:${INK};text-decoration:underline;">${url}</a></p>
</td>
</tr></table>
</td></tr>`;
  const footerNote = c.invite
    ? `<p class="muted" style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:1.55;color:${MUTED};">${escapeHtml(c.note)}</p>${
        c.optOut
          ? `<p class="muted" style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:1.55;color:${MUTED};"><a class="muted" href="${escapeHtml(c.optOut)}" target="_blank" style="color:${MUTED};text-decoration:underline;">${chrome.stop}</a></p>`
          : ""
      }`
    : "";
  const steps = (c.steps ?? [])
    .map((step, index) => {
      const last = index === (c.steps?.length ?? 0) - 1;
      return `<tr><td style="padding:0 0 ${last ? "0" : "10px"};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="panel" align="center" bgcolor="${FOG}" style="padding:22px 20px 20px;border-radius:4px;background-color:${FOG};">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td class="bg" align="center" valign="middle" width="56" height="56" bgcolor="#ffffff" style="width:56px;height:56px;border-radius:999px;background-color:#ffffff;">
<img src="${SITE_URL}/email/icons/${step.icon}.png" width="34" height="34" alt="" style="display:block;width:34px;height:34px;border:0;">
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
  const crowdBlock = c.crowd
    ? `<p class="ink" style="margin:0;font-family:${FONT};font-size:56px;line-height:1;font-weight:900;letter-spacing:-0.04em;color:${INK};text-align:center;">${c.crowd.count.toLocaleString(chrome.number)}</p>
<p class="text" style="margin:8px 0 ${stepsTable ? "22px" : "0"};font-family:${FONT};font-size:16px;line-height:1.4;color:${TEXT};text-align:center;">${escapeHtml(c.crowd.label)}</p>`
    : "";
  const hintRow = c.hint
    ? `<tr><td class="px" align="center" style="padding:14px 32px 0;">
<p class="muted" style="margin:0;font-family:${FONT};font-size:14px;line-height:1.5;color:${MUTED};text-align:center;">${escapeHtml(c.hint)}</p>
</td></tr>`
    : "";

  const html = `<!doctype html>
<html lang="${c.locale}" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
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
.on-night { color: ${ON_NIGHT} !important; }
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
  .on-night { color: ${ON_NIGHT} !important; }
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
<p class="${headingClass} on-night" style="margin:${headingSpace} 0 0;font-family:${FONT};font-size:${headingSize};line-height:1.08;font-weight:900;letter-spacing:-0.025em;color:${ON_NIGHT};">${escapeHtml(c.heading)}</p>
</td>
</tr></table>
</td></tr>
<tr><td class="px" style="padding:28px 32px 0;">
${c.lead ? `<p class="ink" style="margin:0 0 10px;font-family:${FONT};font-size:18px;line-height:1.35;font-weight:700;color:${INK};">${escapeHtml(c.lead)}</p>` : ""}
${c.body ? `<p class="text" style="margin:0 0 ${crowdBlock || stepsTable ? "22px" : "0"};font-family:${FONT};font-size:16px;line-height:1.55;color:${TEXT};">${escapeHtml(c.body)}</p>` : ""}
${crowdBlock}
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
${footerNote}<p class="muted" style="margin:0;font-family:${FONT};font-size:12px;line-height:1.6;color:${MUTED};"><strong class="ink" style="font-weight:900;color:${INK};">comtor</strong> · ${chrome.tagline}<br><a class="muted" href="${imprint}" target="_blank" style="color:${MUTED};text-decoration:underline;">${chrome.imprint}</a> · <a class="muted" href="${privacy}" target="_blank" style="color:${MUTED};text-decoration:underline;">${chrome.privacy}</a></p>
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
    ...(c.lead ? [c.lead, ""] : []),
    ...(c.body ? [c.body, ""] : []),
    ...(c.crowd ? [`${c.crowd.count.toLocaleString(chrome.number)} ${c.crowd.label}`, ""] : []),
    ...(c.steps?.map((step, index) => `${index + 1}. ${step.title}\n${step.text}`) ?? []),
    ...(c.steps?.length ? [""] : []),
    ...(c.aside ? [c.aside, ""] : []),
    `${c.action.label}: ${c.action.url}`,
    "",
    ...(c.hint ? [c.hint, ""] : []),
    c.note,
    ...(c.optOut ? [`${chrome.stop}: ${c.optOut}`] : []),
    "",
    "-- ",
    `comtor · ${chrome.tagline}`,
    `${chrome.imprint}: ${imprint}`,
    `${chrome.privacy}: ${privacy}`,
  ].join("\n");

  return { subject: c.subject, html, text };
}
