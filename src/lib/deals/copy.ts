import type { Locale } from "@/lib/i18n/locales";
import type { Issue, IssueCode } from "@/lib/deals/issues";

// The words for everything the deal code reports. Only German and English exist for the deal screens; the other app
// languages show the English text (same rule as the landing page, see docs/legal-readiness.md).

export type DealLocale = "de" | "en";

export function dealLocale(locale: Locale | string): DealLocale {
  return locale === "de" ? "de" : "en";
}

type Text = { de: string; en: string };

export const ISSUE_TEXT: Record<IssueCode, Text> = {
  BRIEFING_FORMAT_REQUIRED: { en: "Pick at least one content format.", de: "Wähle mindestens ein Content-Format." },
  BRIEFING_FORMAT_UNKNOWN: { en: "Unknown content format: {format}.", de: "Unbekanntes Content-Format: {format}." },
  BRIEFING_MARKET_UNKNOWN: { en: "Unknown target market: {market}.", de: "Unbekannter Zielmarkt: {market}." },
  BRIEFING_HASHTAG_INVALID: {
    en: "“{tag}” is not a valid hashtag (letters, digits and underscores only).",
    de: "„{tag}“ ist kein gültiger Hashtag (nur Buchstaben, Ziffern und Unterstrich).",
  },
  BRIEFING_MENTION_INVALID: { en: "“{mention}” is not a valid account name.", de: "„{mention}“ ist kein gültiger Account-Name." },
  BRIEFING_WINDOW_INVALID: { en: "The posting window ends before it starts.", de: "Das Posting-Fenster endet vor seinem Beginn." },
  BRIEFING_WINDOW_PAST: { en: "The posting window is already over.", de: "Das Posting-Fenster liegt in der Vergangenheit." },
  BRIEFING_LIVE_HOURS_INVALID: { en: "Pick one of the offered live durations.", de: "Wähle eine der angebotenen Online-Dauern." },
  BRIEFING_WORKFLOW_RANGE: {
    en: "Draft lead time (1–30 days), review time (1–14 days) or revision rounds (0–5) are out of range.",
    de: "Vorlaufzeit für den Entwurf (1–30 Tage), Prüfzeit (1–14 Tage) oder Korrekturrunden (0–5) liegen außerhalb des erlaubten Bereichs.",
  },

  DISCLOSURE_LABEL_REQUIRED: {
    en: "Pick at least one advertising label for your market ({labels}).",
    de: "Wähle mindestens eine Werbekennzeichnung für deinen Markt ({labels}).",
  },
  DISCLOSURE_LABEL_UNKNOWN: {
    en: "“{label}” is not a recognised advertising label for this market.",
    de: "„{label}“ ist für diesen Markt keine anerkannte Werbekennzeichnung.",
  },
  DISCLOSURE_LABEL_INSUFFICIENT: {
    en: "{label} alone is not accepted as advertising disclosure in this market. Use the labels offered.",
    de: "{label} allein reicht in diesem Markt nicht als Werbekennzeichnung. Nutze die angebotenen Kennzeichnungen.",
  },
  DISCLOSURE_INSTRUCTION_FORBIDDEN: {
    en: "The briefing tells creators not to disclose the advertising. That is unlawful (§ 5a UWG, Annex No. 11) and not allowed on comtor.",
    de: "Das Briefing weist Creator an, die Werbung nicht zu kennzeichnen. Das ist rechtswidrig (§ 5a UWG, Anhang Nr. 11) und auf comtor nicht erlaubt.",
  },
  PAID_PARTNERSHIP_LABEL_RECOMMENDED: {
    en: "Require the platform's paid-partnership label as well. In Germany the safe route is the platform label together with “Werbung” or “Anzeige”.",
    de: "Verlange zusätzlich das Partnerschafts-Label der Plattform. In Deutschland ist das Plattform-Label zusammen mit „Werbung“ oder „Anzeige“ der sichere Weg.",
  },
  CAPTION_REQUIRED: { en: "Enter the caption of the post.", de: "Gib die Caption des Beitrags ein." },
  DISCLOSURE_LABEL_MISSING: {
    en: "The caption has to say {labels}, clearly visible.",
    de: "Die Caption muss deutlich sichtbar {labels} enthalten.",
  },
  DISCLOSURE_NOT_PROMINENT: {
    en: "The advertising label has to stand within the first {chars} characters of the caption, before the platform cuts it off.",
    de: "Die Werbekennzeichnung muss in den ersten {chars} Zeichen der Caption stehen, bevor die Plattform den Text abschneidet.",
  },
  DISCLOSURE_LABEL_NOT_AGREED: {
    en: "The brand asked for {labels}; the caption uses different wording.",
    de: "Die Marke wünscht {labels}; die Caption nutzt eine andere Formulierung.",
  },
  DISCLOSURE_IN_CONTENT_REQUIRED: {
    en: "Confirm that the content itself (spoken or on screen) marks the advertising.",
    de: "Bestätige, dass der Inhalt selbst (gesprochen oder eingeblendet) die Werbung kennzeichnet.",
  },
  PAID_PARTNERSHIP_LABEL_REQUIRED: {
    en: "Switch on the platform's label “{label}”.",
    de: "Schalte das Plattform-Label „{label}“ ein.",
  },
  REQUIRED_HASHTAG_MISSING: { en: "The caption has to contain {tag}.", de: "Die Caption muss {tag} enthalten." },
  REQUIRED_MENTION_MISSING: { en: "The caption has to mention {mention}.", de: "Die Caption muss {mention} erwähnen." },

  EXCLUSIVITY_SCOPE_REQUIRED: {
    en: "No categories or competitors named: the exclusivity then applies to this request's product category.",
    de: "Keine Kategorien oder Konkurrenten genannt: Die Exklusivität gilt dann für die Produktkategorie dieser Anfrage.",
  },
  EXCLUSIVITY_DAYS_REQUIRED: {
    en: "Set how many days before and/or after the post the exclusivity applies.",
    de: "Lege fest, wie viele Tage vor und/oder nach dem Post die Exklusivität gilt.",
  },
  EXCLUSIVITY_DAYS_TOO_LONG: {
    en: "Exclusivity can be at most {max} days before or after the post.",
    de: "Die Exklusivität darf höchstens {max} Tage vor oder nach dem Post gelten.",
  },
  EXCLUSIVITY_CONFLICT_EXISTING: {
    en: "An exclusivity period of {brand} covers this post.",
    de: "Eine Exklusivitätsfrist von {brand} deckt diesen Post ab.",
  },
  EXCLUSIVITY_CONFLICT_OTHER_DEAL: {
    en: "This deal's exclusivity would cover a post for {brand}.",
    de: "Die Exklusivität dieses Deals würde einen Post für {brand} abdecken.",
  },

  USAGE_CHANNEL_REQUIRED: { en: "Pick at least one usage channel.", de: "Wähle mindestens einen Nutzungskanal." },
  USAGE_CHANNEL_NOT_ALLOWED: {
    en: "The channel {channel} does not fit the chosen usage type.",
    de: "Der Kanal {channel} passt nicht zur gewählten Nutzungsart.",
  },
  USAGE_DURATION_REQUIRED: { en: "Set how many days the usage right lasts.", de: "Lege fest, wie viele Tage das Nutzungsrecht gilt." },
  USAGE_DURATION_TOO_LONG: { en: "Usage rights can last at most {max} days.", de: "Nutzungsrechte können höchstens {max} Tage gelten." },
  USAGE_FEE_REQUIRED: {
    en: "Paid usage (ads) needs its own fee; enter the part of the price that pays for it.",
    de: "Bezahlte Nutzung (Ads) braucht eine eigene Vergütung; trage den Teil des Preises dafür ein.",
  },
  USAGE_FEE_EXCEEDS_BUDGET: {
    en: "The usage fee is higher than the top of the budget.",
    de: "Die Nutzungsvergütung liegt über dem Budget.",
  },
  USAGE_FEE_UNEXPECTED: {
    en: "Usage details are ignored for organic posting on the creator's channel only.",
    de: "Angaben zur Nutzung werden ignoriert, wenn nur organisch auf dem Kanal des Creators gepostet wird.",
  },
  SPARK_CODE_REQUIRED: { en: "Enter the Spark Ads code.", de: "Trage den Spark-Ads-Code ein." },
  SPARK_CODE_INVALID: { en: "That does not look like a Spark Ads code.", de: "Das sieht nicht wie ein Spark-Ads-Code aus." },
  SPARK_CODE_EXPIRES_TOO_EARLY: {
    en: "The code expires before the agreed usage period ends. Issue it for longer.",
    de: "Der Code läuft vor dem Ende der vereinbarten Nutzungsdauer ab. Erzeuge ihn mit längerer Gültigkeit.",
  },
  USAGE_PERMISSION_REQUIRED: {
    en: "Confirm that you granted the partner-ad permission in the platform.",
    de: "Bestätige, dass du die Partner-Ad-Berechtigung in der Plattform erteilt hast.",
  },

  POST_URL_INVALID: { en: "That is not a link to a post.", de: "Das ist kein Link zu einem Beitrag." },
  POST_URL_HOST_UNSUPPORTED: {
    en: "Only Instagram, TikTok and YouTube links are accepted.",
    de: "Es werden nur Links von Instagram, TikTok und YouTube akzeptiert.",
  },
  POST_URL_SHORT_LINK: {
    en: "Use the full link of the post, not a share or short link.",
    de: "Nutze den vollständigen Link des Beitrags, keinen Share- oder Kurzlink.",
  },
  POST_URL_FORMAT_MISMATCH: {
    en: "The link does not match the booked format ({format}).",
    de: "Der Link passt nicht zum gebuchten Format ({format}).",
  },
  POST_URL_DUPLICATE: { en: "This post was already submitted for the deal.", de: "Dieser Beitrag wurde für den Deal bereits eingereicht." },
  POST_PROOF_REQUIRED: {
    en: "Stories can't be checked by link. Upload a screenshot that shows the story and the advertising label.",
    de: "Stories lassen sich nicht per Link prüfen. Lade einen Screenshot hoch, der die Story und die Werbekennzeichnung zeigt.",
  },
  POST_PROOF_INVALID: {
    en: "The proof has to be a JPEG, PNG or WebP image up to 4 MB.",
    de: "Der Nachweis muss ein JPEG-, PNG- oder WebP-Bild bis 4 MB sein.",
  },
  POST_DATE_INVALID: { en: "Pick a valid date and time in the future.", de: "Wähle ein gültiges Datum mit Uhrzeit in der Zukunft." },

  BUSINESS_PROFILE_INCOMPLETE: {
    en: "Complete your business details first.",
    de: "Vervollständige zuerst deine Geschäftsdaten.",
  },
  BUSINESS_TYPE_NOT_ALLOWED: {
    en: "Deals are for businesses, sole proprietors and freelancers. Choose the type that applies to you.",
    de: "Deals sind für Unternehmen, Einzelunternehmer und Freiberufler. Wähle die passende Art.",
  },
  VAT_ID_FORMAT_INVALID: { en: "That VAT ID has an invalid format.", de: "Diese USt-IdNr. hat ein ungültiges Format." },
  VAT_ID_COUNTRY_MISMATCH: {
    en: "The VAT ID does not belong to the country {country}.",
    de: "Die USt-IdNr. gehört nicht zum Land {country}.",
  },
  VAT_ID_REQUIRED: {
    en: "A valid EU VAT ID is required for businesses outside Germany.",
    de: "Für Unternehmen außerhalb Deutschlands ist eine gültige EU-USt-IdNr. erforderlich.",
  },
  VAT_ID_NOT_VERIFIED: {
    en: "The VAT ID has not been verified yet. Run the check (VIES) or try again later.",
    de: "Die USt-IdNr. wurde noch nicht bestätigt. Starte die Prüfung (VIES) oder versuche es später erneut.",
  },
  TAX_ID_REQUIRED: {
    en: "Enter your tax number or VAT ID: it has to appear on the credit note.",
    de: "Trage deine Steuernummer oder USt-IdNr. ein: Sie muss auf der Gutschrift stehen.",
  },
  TRADER_CERTIFICATION_REQUIRED: {
    en: "Confirm that you act exclusively in the course of your trade, business or profession.",
    de: "Bestätige, dass du ausschließlich im Rahmen deiner gewerblichen oder beruflichen Tätigkeit handelst.",
  },
  SELF_BILLING_CONSENT_REQUIRED: {
    en: "Agree that comtor issues credit notes in your name (self-billing).",
    de: "Stimme zu, dass comtor Gutschriften in deinem Namen ausstellt (Gutschriftsverfahren).",
  },
  PAYOUT_ACCOUNT_REQUIRED: {
    en: "Set up payouts first: the money needs somewhere to go.",
    de: "Richte zuerst die Auszahlung ein: Das Geld braucht ein Ziel.",
  },
  PLATFORM_INVOICE_DATA_MISSING: {
    en: "comtor's own tax details are not configured yet, so invoices can't be issued.",
    de: "Die Steuerdaten von comtor sind noch nicht hinterlegt, daher können keine Rechnungen ausgestellt werden.",
  },
};

export function fill(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => (params[name] === undefined ? `{${name}}` : String(params[name])));
}

export function issueMessage(issue: Issue, locale: DealLocale): string {
  return fill(ISSUE_TEXT[issue.code][locale], issue.params);
}

// The first error as one sentence, for a server action's `{ error }` result.
export function firstErrorMessage(issues: Issue[], locale: DealLocale): string | null {
  const first = issues.find((i) => i.severity === "error");
  return first ? issueMessage(first, locale) : null;
}
