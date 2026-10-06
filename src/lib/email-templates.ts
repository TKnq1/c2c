import { SITE_URL } from "@/lib/site";
import {
  FOUNDING_BRAND_LIMIT,
  FOUNDING_CREATOR_LIMIT,
  PLATFORM_FEE_RATE,
  PRO_PLATFORM_FEE_RATE,
  PRO_SUBSCRIPTION_PRICE_CENTS,
} from "@/lib/constants";
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
// Every email exists in German and English. German is the default, like everywhere else; any other language
// gets the English text. Each function takes the recipient's language as its last argument: the account's
// stored language, or the visitor's language cookie for people without an account.

export type Email = { subject: string; html: string; text: string };

// One text per language. Anything that isn't German is English.
function pick<T>(locale: Locale, en: T, de: T): T {
  return locale === "de" ? de : en;
}

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
  const creator = role === "CREATOR";
  const pro = Math.round(PRO_PLATFORM_FEE_RATE * 100);
  const standard = Math.round(PLATFORM_FEE_RATE * 100);
  const founding = !foundingNumber
    ? ""
    : " " +
      (creator
        ? pick(
            locale,
            `You're founding creator no. ${foundingNumber}: Pro is free for you for as long as your account exists, so comtor keeps ${pro}% instead of ${standard}% of every payment and you keep ${100 - pro}%.`,
            `Du bist Founding Creator Nr. ${foundingNumber}: Pro ist für dich kostenlos, solange dein Konto besteht. Auf jede Zahlung behält comtor ${pro} % statt ${standard} %, du bekommst ${100 - pro} %.`,
          )
        : pick(
            locale,
            `You're founding brand no. ${foundingNumber}: Pro is free for you for as long as your account exists, so ${pro}% instead of ${standard}% goes to comtor on every payment.`,
            `Du bist Founding Brand Nr. ${foundingNumber}: Pro ist für dich kostenlos, solange dein Konto besteht. Auf jede Zahlung behält comtor ${pro} % statt ${standard} %.`,
          ));
  return render({
    locale,
    subject: pick(locale, "Welcome to comtor – verify your email", "Willkommen bei comtor – bestätige deine E-Mail-Adresse"),
    preview: pick(
      locale,
      "Thanks for signing up. One tap and your email is verified.",
      "Danke für deine Anmeldung. Ein Klick, und deine E-Mail-Adresse ist bestätigt.",
    ),
    heading: pick(locale, "Welcome to comtor.", "Willkommen bei comtor."),
    body: creator
      ? pick(
          locale,
          "Thanks for signing up. Verify your email, then swipe through brand deals with the budget right on the card.",
          "Danke für deine Anmeldung. Bestätige deine E-Mail-Adresse und wisch dann durch Marken-Deals, mit dem Budget direkt auf der Karte.",
        ) + founding
      : pick(
          locale,
          "Thanks for signing up. Verify your email, then post your first request. Creators come to you.",
          "Danke für deine Anmeldung. Bestätige deine E-Mail-Adresse und poste dann deine erste Anfrage. Creator melden sich bei dir.",
        ) + founding,
    action: { label: pick(locale, "Verify email", "E-Mail bestätigen"), url },
    note: pick(
      locale,
      "The link works for 24 hours. Didn't sign up for comtor? Then you can ignore this email.",
      "Der Link gilt 24 Stunden. Du hast dich nicht bei comtor angemeldet? Dann kannst du diese E-Mail ignorieren.",
    ),
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
  const pro = Math.round(PRO_PLATFORM_FEE_RATE * 100);
  const standard = Math.round(PLATFORM_FEE_RATE * 100);
  const creator = side === "creator";
  const subscription = paysForPro
    ? " " +
      pick(
        locale,
        "Your Pro subscription from before is still running and still billed. You can cancel it in Settings and keep Pro.",
        "Dein bisheriges Pro-Abo läuft weiter und wird weiter abgerechnet. Du kannst es in den Einstellungen kündigen und behältst trotzdem Pro.",
      )
    : "";
  return render({
    locale,
    subject: pick(locale, "Pro is free for you, for good", "Pro ist für dich dauerhaft kostenlos"),
    preview: creator
      ? pick(locale, "You are one of the first creators on comtor.", "Du gehörst zu den ersten Creatorn auf comtor.")
      : pick(locale, "You are one of the first brands on comtor.", "Du gehörst zu den ersten Marken auf comtor."),
    heading: pick(locale, "You have Pro, for good.", "Du hast Pro, dauerhaft kostenlos."),
    body:
      (creator
        ? pick(
            locale,
            `You are one of the first ${FOUNDING_CREATOR_LIMIT} creators on comtor (founding creator no. ${foundingNumber}). That's why Pro is free for you for as long as your account exists: comtor keeps ${pro}% instead of ${standard}% of every payment, so you keep ${100 - pro}%. There is nothing you need to do.`,
            `Du gehörst zu den ersten ${FOUNDING_CREATOR_LIMIT} Creatorn auf comtor (Founding Creator Nr. ${foundingNumber}). Darum ist Pro für dich kostenlos, solange dein Konto besteht: Auf jede Zahlung behält comtor ${pro} % statt ${standard} %, du bekommst ${100 - pro} %. Du musst nichts tun.`,
          )
        : pick(
            locale,
            `You are one of the first ${FOUNDING_BRAND_LIMIT} brands on comtor (founding brand no. ${foundingNumber}). That's why Pro is free for you for as long as your account exists: comtor keeps ${pro}% instead of ${standard}% of every payment. There is nothing you need to do.`,
            `Du gehörst zu den ersten ${FOUNDING_BRAND_LIMIT} Marken auf comtor (Founding Brand Nr. ${foundingNumber}). Darum ist Pro für dich kostenlos, solange dein Konto besteht: Auf jede Zahlung behält comtor ${pro} % statt ${standard} %. Du musst nichts tun.`,
          )) + subscription,
    action: {
      label: pick(locale, "See your plan", "Zu deinem Tarif"),
      url: `${SITE_URL}${creator ? "/dashboard/creator/settings#plan" : "/dashboard/startup/settings#plan"}`,
    },
    note: pick(
      locale,
      "You get this email because you have a comtor account. It is about your plan and is not an advert.",
      "Du bekommst diese E-Mail, weil du ein comtor-Konto hast. Sie betrifft deinen Tarif und ist keine Werbung.",
    ),
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

function marketingNote(locale: Locale, consentNote?: string): string {
  const reason = consentNote?.trim();
  return pick(
    locale,
    `You are getting this email because you agreed to hear from comtor${reason ? ` (${reason})` : ""}. You can stop it at any time with the link below.`,
    `Du bekommst diese E-Mail, weil du zugestimmt hast, E-Mails von comtor zu erhalten${reason ? ` (${reason})` : ""}. Du kannst das jederzeit mit dem Link unten beenden.`,
  );
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
  const who = name.trim();
  const note = marketingNote(locale, consentNote);
  const fee = Math.round(PLATFORM_FEE_RATE * 100);
  const proFee = Math.round(PRO_PLATFORM_FEE_RATE * 100);
  const price = PRO_SUBSCRIPTION_PRICE_CENTS / 100;
  const hint = pick(locale, "Have a look first. Signing up is on the page.", "Schau dich erst einmal um. Die Anmeldung findest du auf der Seite.");
  if (role === "CREATOR") {
    const headline = pick(locale, "earn money posting on social media.", "verdiene Geld mit Posts in sozialen Medien.");
    return render({
      locale,
      subject,
      preview: pick(locale, "Earn money posting on social media.", "Verdiene Geld mit Posts in sozialen Medien."),
      heading: who ? `${who}, ${headline}` : headline.charAt(0).toUpperCase() + headline.slice(1),
      body: pick(
        locale,
        "comtor is where brands post a paid deal and you swipe the ones you want. The budget is on the card, they pay before you post, and you keep 90%.",
        "Auf comtor posten Marken bezahlte Deals, und du wischst die, die du willst. Das Budget steht auf der Karte, die Marke zahlt, bevor du postest, und du behältst 90 %.",
      ),
      steps: [
        {
          icon: "swipe",
          title: pick(locale, "Swipe a deal.", "Wisch einen Deal."),
          text: pick(
            locale,
            "Right means you want it, left means you pass. The brand sees your profile and can message you.",
            "Rechts heißt: Du willst ihn, links: Du überspringst ihn. Die Marke sieht dein Profil und kann dir schreiben.",
          ),
        },
        {
          icon: "money-bag",
          title: pick(locale, "The budget is on the card.", "Das Budget steht auf der Karte."),
          text: pick(
            locale,
            "No more DMs about your rate. Every request says what it pays, what to post, and whether the product comes with it.",
            "Schluss mit DMs über deinen Preis. Jede Anfrage nennt die Bezahlung, was gepostet werden soll und ob das Produkt dabei ist.",
          ),
        },
        {
          icon: "locked",
          title: pick(locale, "Paid before you post.", "Bezahlt, bevor du postest."),
          text: pick(
            locale,
            "Accept the offer and the brand pays first. The money waits until your post is up.",
            "Nimmst du das Angebot an, zahlt die Marke zuerst. Das Geld wird zurückgehalten, bis dein Post online ist.",
          ),
        },
        {
          icon: "money-wings",
          title: pick(locale, `You keep ${100 - fee}%.`, `Du behältst ${100 - fee} %.`),
          text: pick(
            locale,
            `The brand has 3 days to approve your post. If they don't answer, it's released to you anyway. With Pro (€${price} a month) you keep ${100 - proFee}%.`,
            `Die Marke hat 3 Tage Zeit, deinen Post freizugeben. Antwortet sie nicht, geht die Zahlung trotzdem an dich. Mit Pro (${price} € im Monat) behältst du ${100 - proFee} %.`,
          ),
        },
      ],
      crowd: crowdLine(crowd, pick(locale, "brand already here", "Marke ist schon dabei"), pick(locale, "brands already here", "Marken sind schon dabei")),
      hint,
      watermark: true,
      invite: true,
      action: { label: pick(locale, "See paid deals", "Bezahlte Deals ansehen"), url },
      note,
      optOut,
    });
  }
  const headline = pick(locale, "grow your brand with content creators.", "bring deine Marke mit Creatorn voran.");
  return render({
    locale,
    subject,
    preview: pick(locale, "Grow your brand with content creators.", "Bring deine Marke mit Creatorn voran."),
    heading: who ? `${who}, ${headline}` : headline.charAt(0).toUpperCase() + headline.slice(1),
    body: pick(
      locale,
      "comtor is where you post the product, the budget, and what to make. Creators who fit swipe right and come to you. You pay when you agree, and the money waits until the post is live.",
      "Auf comtor stellst du Produkt, Budget und gewünschten Inhalt ein. Passende Creator wischen nach rechts und melden sich bei dir. Du zahlst, wenn ihr euch einig seid, und das Geld wird zurückgehalten, bis der Post online ist.",
    ),
    steps: [
      {
        icon: "megaphone",
        title: pick(locale, "Post the product and the budget.", "Poste Produkt und Budget."),
        text: pick(
          locale,
          "Photos, the budget, the platform, and what to post. Creators get it as a card in their feed.",
          "Fotos, Budget, Plattform und Inhalt. Creator bekommen die Anfrage als Karte in ihrem Feed.",
        ),
      },
      {
        icon: "bell",
        title: pick(locale, "Creators come to you.", "Creator melden sich bei dir."),
        text: pick(
          locale,
          "Creators in your niche swipe right. You see their reach and reviews and pick who fits.",
          "Creator aus deiner Nische wischen nach rechts. Du siehst Reichweite und Bewertungen und wählst, wer passt.",
        ),
      },
      {
        icon: "speech-balloon",
        title: pick(locale, "Agree on it in the chat.", "Sprich dich im Chat ab."),
        text: pick(
          locale,
          "Send an offer. When they accept, you pay, and the money is held until the post is live.",
          "Schick ein Angebot. Nimmt der Creator es an, zahlst du, und das Geld wird zurückgehalten, bis der Post online ist.",
        ),
      },
      {
        icon: "camera-flash",
        title: pick(locale, "Then it's paid out.", "Dann wird ausgezahlt."),
        text: pick(
          locale,
          `You check the live post first. No base fee: comtor keeps ${fee}% of each payment, or ${proFee}% with Pro (€${price} a month).`,
          `Du prüfst zuerst den Live-Post. Keine Grundgebühr: comtor behält ${fee} % jeder Zahlung, mit Pro (${price} € im Monat) nur ${proFee} %.`,
        ),
      },
    ],
    crowd: crowdLine(crowd, pick(locale, "creator already here", "Creator ist schon dabei"), pick(locale, "creators already here", "Creator sind schon dabei")),
    hint,
    watermark: true,
    invite: true,
    action: { label: pick(locale, "Post your first deal", "Ersten Deal posten"), url },
    note,
    optOut,
  });
}

export function verificationEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  return render({
    locale,
    subject: pick(locale, "Verify your comtor email", "Bestätige deine comtor-E-Mail-Adresse"),
    preview: pick(
      locale,
      "Confirm it's your address. The link works for 24 hours.",
      "Bestätige, dass die Adresse dir gehört. Der Link gilt 24 Stunden.",
    ),
    heading: pick(locale, "Verify your email.", "E-Mail bestätigen."),
    body: pick(
      locale,
      "Confirm that this address belongs to your comtor account.",
      "Bestätige, dass diese Adresse zu deinem comtor-Konto gehört.",
    ),
    action: { label: pick(locale, "Verify email", "E-Mail bestätigen"), url },
    note: pick(
      locale,
      "The link works for 24 hours. Didn't sign up for comtor? Then you can ignore this email.",
      "Der Link gilt 24 Stunden. Du hast dich nicht bei comtor angemeldet? Dann kannst du diese E-Mail ignorieren.",
    ),
  });
}

export function passwordResetEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  return render({
    locale,
    subject: pick(locale, "Reset your comtor password", "Setze dein comtor-Passwort zurück"),
    preview: pick(
      locale,
      "Choose a new password. The link works for 1 hour.",
      "Wähle ein neues Passwort. Der Link gilt 1 Stunde.",
    ),
    heading: pick(locale, "Reset your password.", "Passwort zurücksetzen."),
    body: pick(
      locale,
      "Someone asked to reset your comtor password. If that was you, choose a new one.",
      "Jemand hat darum gebeten, dein comtor-Passwort zurückzusetzen. Warst du das, wähle ein neues.",
    ),
    action: { label: pick(locale, "Choose a new password", "Neues Passwort wählen"), url },
    note: pick(
      locale,
      "The link works once, for 1 hour. A new password logs you out everywhere. Didn't ask for this? Then ignore this email and your password stays the same.",
      "Der Link lässt sich nur einmal verwenden und gilt 1 Stunde. Mit einem neuen Passwort wirst du überall abgemeldet. Du hast das nicht angefordert? Dann ignoriere diese E-Mail, dein Passwort bleibt, wie es ist.",
    ),
  });
}

// After every password change and reset. The button is for when it wasn't
// them: a reset through their inbox logs out whoever changed it.
export function passwordChangedEmail(resetUrl: string, locale: Locale = DEFAULT_LOCALE): Email {
  return render({
    locale,
    subject: pick(locale, "Your comtor password was changed", "Dein comtor-Passwort wurde geändert"),
    preview: pick(locale, "If that was you, you're all set.", "Warst du das, ist alles in Ordnung."),
    heading: pick(locale, "Your password was changed.", "Dein Passwort wurde geändert."),
    body: pick(
      locale,
      "The password of your comtor account was just changed, and your other devices were logged out. If that was you, you're all set.",
      "Das Passwort deines comtor-Kontos wurde gerade geändert, und deine anderen Geräte wurden abgemeldet. Warst du das, ist alles in Ordnung.",
    ),
    action: { label: pick(locale, "Reset password", "Passwort zurücksetzen"), url: resetUrl },
    note: pick(
      locale,
      "Wasn't you? Reset your password right away. That logs out whoever changed it.",
      "Warst du das nicht? Setze dein Passwort sofort zurück. Das meldet jeden ab, der es geändert hat.",
    ),
  });
}

// Sent when an admin suspends an account, with the reason: the person is told why, and how to object
// (Digital Services Act, Art. 17).
export function accountSuspendedEmail(reason: string, locale: Locale = DEFAULT_LOCALE): Email {
  return render({
    locale,
    subject: pick(locale, "Your comtor account was suspended", "Dein comtor-Konto wurde gesperrt"),
    preview: pick(locale, "Here is why, and how to object.", "Hier steht der Grund und wie du widersprechen kannst."),
    heading: pick(locale, "Your account was suspended.", "Dein Konto wurde gesperrt."),
    body: pick(
      locale,
      `We suspended your comtor account. Reason: ${reason.trim()} You can't sign in while it is suspended, and open requests of a brand account are closed.`,
      `Wir haben dein comtor-Konto gesperrt. Grund: ${reason.trim()} Solange es gesperrt ist, kannst du dich nicht anmelden, und offene Anfragen eines Marken-Kontos werden geschlossen.`,
    ),
    action: {
      label: pick(locale, "Object to this decision", "Der Entscheidung widersprechen"),
      url: pick(
        locale,
        "mailto:info@comtor.app?subject=Suspended%20account",
        "mailto:info@comtor.app?subject=Gesperrtes%20Konto",
      ),
    },
    note: pick(
      locale,
      "If you think this is a mistake, reply to this email or write to info@comtor.app. We will look at it again and answer you.",
      "Wenn du glaubst, dass das ein Irrtum ist, antworte auf diese E-Mail oder schreib an info@comtor.app. Wir sehen uns den Fall noch einmal an und antworten dir.",
    ),
  });
}

// What /admin/email sends to check that mail gets out and looks right.
export function testEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  return render({
    locale,
    subject: pick(locale, "comtor test email", "comtor-Test-E-Mail"),
    preview: pick(
      locale,
      "If you can read this, email from comtor works.",
      "Wenn du das lesen kannst, funktionieren E-Mails von comtor.",
    ),
    heading: pick(locale, "It works.", "Es funktioniert."),
    body: pick(
      locale,
      "This is a test email from the admin area. If it's in your inbox, sign-up, verification and password emails reach people too.",
      "Das ist eine Test-E-Mail aus dem Admin-Bereich. Wenn sie in deinem Posteingang ist, erreichen auch Anmelde-, Bestätigungs- und Passwort-E-Mails die Leute.",
    ),
    action: { label: pick(locale, "Open comtor", "comtor öffnen"), url },
    note: pick(
      locale,
      "Sent by an admin from /admin/email. Nothing to do.",
      "Von einem Admin über /admin/email gesendet. Du musst nichts tun.",
    ),
  });
}

// Product news. The link opens a page; the button on that page is the
// consent (see confirmMarketingConsent). Opening the mail is not a yes.
export function marketingConsentEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  return render({
    locale,
    subject: pick(locale, "Confirm news from comtor", "Bestätige Produkt-News von comtor"),
    preview: pick(
      locale,
      "One button, then we can send occasional news about comtor.",
      "Ein Klick, dann dürfen wir dir gelegentlich Neuigkeiten zu comtor schicken.",
    ),
    heading: pick(locale, "Confirm product news.", "Produkt-News bestätigen."),
    body: pick(
      locale,
      "You asked for occasional emails about comtor. Press the button on the next page to confirm. Until then, this address gets no product news.",
      "Du hast um gelegentliche E-Mails zu comtor gebeten. Klicke auf der nächsten Seite auf „Ja, schickt mir News“, um zuzustimmen. Bis dahin bekommt diese Adresse keine Produkt-News.",
    ),
    action: { label: pick(locale, "Review and confirm", "Prüfen und bestätigen"), url },
    note: pick(
      locale,
      "Didn't ask for this? Ignore the email. Nothing is turned on until you press the button.",
      "Du hast das nicht angefordert? Ignoriere die E-Mail. Es wird nichts aktiviert, bevor du auf der Seite zugestimmt hast.",
    ),
  });
}

// The waitlist's double opt-in: nobody gets the launch email without
// clicking this first (see joinWaitlistAction).
export function waitlistConfirmationEmail(url: string, locale: Locale = DEFAULT_LOCALE): Email {
  return render({
    locale,
    subject: pick(
      locale,
      "Confirm your spot on the comtor waitlist",
      "Bestätige deinen Platz auf der comtor-Warteliste",
    ),
    preview: pick(
      locale,
      "One tap and you'll hear from us the day the apps are out.",
      "Ein Klick, und du hörst von uns, sobald die Apps da sind.",
    ),
    heading: pick(locale, "Confirm your email.", "E-Mail bestätigen."),
    body: pick(
      locale,
      "You asked to hear when the comtor apps are out on iOS and Android. Confirm that this address is yours and you're on the list.",
      "Du wolltest erfahren, wann die comtor-Apps für iOS und Android erscheinen. Bestätige, dass diese Adresse dir gehört, dann stehst du auf der Liste.",
    ),
    action: { label: pick(locale, "Confirm email", "E-Mail bestätigen"), url },
    note: pick(
      locale,
      "We'll send you one email, the day the apps are out. Didn't sign up? Then ignore this email and you won't hear from us.",
      "Wir schicken dir eine einzige E-Mail, wenn die Apps erscheinen. Du hast dich nicht angemeldet? Dann ignoriere diese E-Mail, und du hörst nicht von uns.",
    ),
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

// The words around every email's content.
const CHROME = {
  en: {
    pasteLink: "Button not working? Paste this link into your browser:",
    stop: "Stop these emails",
    tagline: "Brands meet the right creators.",
    imprint: "Imprint",
    privacy: "Privacy",
    number: "en-US",
  },
  de: {
    pasteLink: "Button funktioniert nicht? Füge diesen Link in deinen Browser ein:",
    stop: "Diese E-Mails abbestellen",
    tagline: "Marken treffen die richtigen Creator.",
    imprint: "Impressum",
    privacy: "Datenschutz",
    number: "de-DE",
  },
} as const;

function render(c: Content): Email {
  const chrome = CHROME[c.locale === "de" ? "de" : "en"];
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
<html lang="${c.locale === "de" ? "de" : "en"}" xmlns:o="urn:schemas-microsoft-com:office:office">
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
