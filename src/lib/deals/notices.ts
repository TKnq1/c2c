import type { Locale } from "@/lib/i18n/locales";
import { dealLocale, fill, type DealLocale } from "@/lib/deals/copy";
import type { CancelReason } from "@/lib/deals/policy";

// What the people on a deal are told, in the language of their account. The wording is data so the deadline handler,
// the actions and the webhook all speak the same way.

type Text = { de: string; en: string };

export const NOTICE_TEXT = {
  deal_created: {
    en: "Offer accepted for “{title}”. Read the contract and confirm it to continue.",
    de: "Angebot für „{title}“ angenommen. Lies den Vertrag und bestätige ihn, damit es weitergeht.",
  },
  usage_delivered: {
    en: "{creator} handed over the ad usage rights for “{title}”.",
    de: "{creator} hat die Ads-Nutzungsrechte für „{title}“ übergeben.",
  },
  contract_sign: {
    en: "{who} confirmed the contract for “{title}”. Your confirmation is still missing.",
    de: "{who} hat den Vertrag für „{title}“ bestätigt. Deine Bestätigung fehlt noch.",
  },
  escrow_due: {
    en: "The contract for “{title}” is confirmed. Pay {amount} into escrow so the work can start.",
    de: "Der Vertrag für „{title}“ steht. Zahle {amount} ins Treuhandkonto ein, damit die Arbeit beginnt.",
  },
  escrow_funded_draft: {
    en: "{brand} funded the escrow for “{title}” ({amount}). Your draft is due {date}.",
    de: "{brand} hat das Treuhandkonto für „{title}“ gefüllt ({amount}). Dein Entwurf ist fällig am {date}.",
  },
  escrow_funded_direct: {
    en: "{brand} funded the escrow for “{title}” ({amount}). Post by {date}.",
    de: "{brand} hat das Treuhandkonto für „{title}“ gefüllt ({amount}). Poste bis {date}.",
  },
  draft_submitted: {
    en: "{creator} submitted draft {version} for “{title}”. Review it by {date}, otherwise it counts as approved.",
    de: "{creator} hat Entwurf {version} für „{title}“ eingereicht. Prüfe ihn bis {date}, sonst gilt er als freigegeben.",
  },
  draft_approved: {
    en: "{brand} approved your draft for “{title}”. You can schedule or publish the post now.",
    de: "{brand} hat deinen Entwurf für „{title}“ freigegeben. Du kannst den Post jetzt planen oder veröffentlichen.",
  },
  draft_auto_approved_creator: {
    en: "{brand} did not answer in time, so your draft for “{title}” counts as approved.",
    de: "{brand} hat nicht rechtzeitig geantwortet, daher gilt dein Entwurf für „{title}“ als freigegeben.",
  },
  draft_auto_approved_brand: {
    en: "You did not answer in time, so the draft for “{title}” counts as approved.",
    de: "Du hast nicht rechtzeitig geantwortet, daher gilt der Entwurf für „{title}“ als freigegeben.",
  },
  draft_changes: {
    en: "{brand} asked for changes to “{title}” (due {date}): {feedback}",
    de: "{brand} wünscht Änderungen an „{title}“ (fällig {date}): {feedback}",
  },
  draft_rejected: {
    en: "{brand} rejected the draft for “{title}”. The deal is on hold while we look into it.",
    de: "{brand} hat den Entwurf für „{title}“ abgelehnt. Der Deal ist pausiert, bis wir ihn prüfen.",
  },
  post_scheduled: {
    en: "{creator} scheduled the post for “{title}” for {date}.",
    de: "{creator} hat den Post für „{title}“ für den {date} geplant.",
  },
  post_submitted: {
    en: "{creator} reported the live post for “{title}”. We are checking it.",
    de: "{creator} hat den Live-Post für „{title}“ gemeldet. Wir prüfen ihn.",
  },
  post_confirm_needed: {
    en: "{creator} sent proof of the post for “{title}”. Please confirm it by {date}, otherwise it counts as confirmed.",
    de: "{creator} hat einen Nachweis für den Post zu „{title}“ geschickt. Bitte bestätige ihn bis {date}, sonst gilt er als bestätigt.",
  },
  post_verified_creator: {
    en: "Your post for “{title}” is verified. If it stays live until {date}, the payout is released.",
    de: "Dein Post für „{title}“ ist verifiziert. Bleibt er bis {date} online, wird die Auszahlung freigegeben.",
  },
  post_verified_brand: {
    en: "The post for “{title}” is verified live. It has to stay up until {date}; then the payout is released.",
    de: "Der Post für „{title}“ ist als online verifiziert. Er muss bis {date} online bleiben, dann wird die Auszahlung freigegeben.",
  },
  post_removed_creator: {
    en: "Your post for “{title}” can no longer be reached. Publish it again by {date}, otherwise the deal is frozen for review.",
    de: "Dein Post für „{title}“ ist nicht mehr erreichbar. Veröffentliche ihn bis {date} erneut, sonst wird der Deal zur Prüfung eingefroren.",
  },
  post_removed_brand: {
    en: "The post for “{title}” can no longer be reached. {creator} has until {date} to publish it again.",
    de: "Der Post für „{title}“ ist nicht mehr erreichbar. {creator} hat bis {date} Zeit, ihn erneut zu veröffentlichen.",
  },
  disclosure_warning: {
    en: "Check the caption of the post for “{title}”: it may be missing the advertising label ({labels}).",
    de: "Prüfe die Caption des Posts zu „{title}“: Es fehlt möglicherweise die Werbekennzeichnung ({labels}).",
  },
  payout_released_creator: {
    en: "The post for “{title}” stayed live. {payout} is on its way to you.",
    de: "Der Post für „{title}“ blieb online. {payout} ist auf dem Weg zu dir.",
  },
  payout_released_brand: {
    en: "The post for “{title}” stayed live and the payment was released to {creator}. Your invoice is under Invoices.",
    de: "Der Post für „{title}“ blieb online und die Zahlung wurde an {creator} freigegeben. Deine Rechnung findest du unter Rechnungen.",
  },
  payout_blocked: {
    en: "Your payout of {payout} for “{title}” is ready, but payouts are not set up yet. Finish the setup to receive it.",
    de: "Deine Auszahlung von {payout} für „{title}“ ist bereit, aber die Auszahlung ist noch nicht eingerichtet. Schließe die Einrichtung ab, um das Geld zu erhalten.",
  },
  usage_delivery_needed: {
    en: "Hand over the ad usage rights for “{title}” (Spark Ads code or partner-ad permission). The payout waits for it.",
    de: "Übergib die Ads-Nutzungsrechte für „{title}“ (Spark-Ads-Code oder Partner-Ad-Berechtigung). Die Auszahlung wartet darauf.",
  },
  deal_cancelled_refund_brand: {
    en: "“{title}” was cancelled: {reason}. Your payment was refunded.",
    de: "„{title}“ wurde abgebrochen: {reason}. Deine Zahlung wurde erstattet.",
  },
  deal_cancelled_creator: {
    en: "“{title}” was cancelled: {reason}.",
    de: "„{title}“ wurde abgebrochen: {reason}.",
  },
  deal_cancelled_brand: {
    en: "{creator} withdrew from “{title}”. Your payment was refunded.",
    de: "{creator} ist von „{title}“ zurückgetreten. Deine Zahlung wurde erstattet.",
  },
  deal_cancelled_by_brand: {
    en: "{brand} cancelled “{title}”.",
    de: "{brand} hat „{title}“ abgebrochen.",
  },
  dispute_opened: {
    en: "{who} opened a dispute on “{title}” ({reason}). The payment is frozen until our team decides.",
    de: "{who} hat zu „{title}“ einen Streitfall eröffnet ({reason}). Die Zahlung ist eingefroren, bis unser Team entscheidet.",
  },
  dispute_released: {
    en: "We reviewed “{title}” and released the payment to {creator}.",
    de: "Wir haben „{title}“ geprüft und die Zahlung an {creator} freigegeben.",
  },
  dispute_refunded: {
    en: "We reviewed “{title}” and refunded the payment to {brand}.",
    de: "Wir haben „{title}“ geprüft und die Zahlung an {brand} erstattet.",
  },
  dispute_resumed: {
    en: "We reviewed “{title}”: the deal continues.",
    de: "Wir haben „{title}“ geprüft: Der Deal läuft weiter.",
  },
  reminder_draft_due: {
    en: "Your draft for “{title}” was due {date}. Submit it within {hours} hours, otherwise the deal is cancelled and {brand} is refunded.",
    de: "Dein Entwurf für „{title}“ war fällig am {date}. Reiche ihn innerhalb von {hours} Stunden ein, sonst wird der Deal abgebrochen und {brand} erstattet.",
  },
  reminder_review_due: {
    en: "Review the draft for “{title}” by {date}, otherwise it counts as approved.",
    de: "Prüfe den Entwurf für „{title}“ bis {date}, sonst gilt er als freigegeben.",
  },
  reminder_revision_due: {
    en: "Your revised draft for “{title}” was due {date}. Submit it within {hours} hours, otherwise the deal is cancelled and {brand} is refunded.",
    de: "Dein überarbeiteter Entwurf für „{title}“ war fällig am {date}. Reiche ihn innerhalb von {hours} Stunden ein, sonst wird der Deal abgebrochen und {brand} erstattet.",
  },
  reminder_post_due: {
    en: "The posting deadline for “{title}” has passed. Publish within {hours} hours, otherwise the deal is cancelled and {brand} is refunded.",
    de: "Die Posting-Frist für „{title}“ ist abgelaufen. Veröffentliche innerhalb von {hours} Stunden, sonst wird der Deal abgebrochen und {brand} erstattet.",
  },
  reminder_scheduled_missed: {
    en: "You planned to post “{title}” on {date}. Report the link as soon as it is live.",
    de: "Du wolltest „{title}“ am {date} posten. Melde den Link, sobald der Post online ist.",
  },
  usage_expiring: {
    en: "The ad usage rights for “{title}” end on {date}. Agree an extension with {creator} if you want to keep running the ads.",
    de: "Die Ads-Nutzungsrechte für „{title}“ enden am {date}. Vereinbare mit {creator} eine Verlängerung, wenn du die Anzeigen weiter schalten willst.",
  },
  usage_expired: {
    en: "The ad usage rights for “{title}” have ended. The post must no longer be used as an ad.",
    de: "Die Ads-Nutzungsrechte für „{title}“ sind abgelaufen. Der Post darf nicht mehr als Anzeige genutzt werden.",
  },
  offer_reconfirm_needed: {
    en: "{who} wanted to accept your offer for “{title}”, but the campaign briefing changed after you made it. Confirm the offer again so it can be accepted.",
    de: "{who} wollte dein Angebot für „{title}“ annehmen, aber das Kampagnen-Briefing hat sich seit dem Angebot geändert. Bestätige das Angebot erneut, damit es angenommen werden kann.",
  },
  offer_reconfirmed: {
    en: "{who} confirmed the offer for “{title}” again under the updated briefing. Take a look at the briefing and accept if it suits you.",
    de: "{who} hat das Angebot für „{title}“ unter dem aktualisierten Briefing erneut bestätigt. Sieh dir das Briefing an und nimm das Angebot an, wenn es passt.",
  },
  chargeback_lost: {
    en: "The payment for “{title}” was reversed by the brand's bank (a chargeback). The deal is cancelled and nothing is paid out.",
    de: "Die Zahlung für „{title}“ wurde von der Bank der Marke zurückgebucht (Rückbuchung). Der Deal ist abgebrochen, es wird nichts ausgezahlt.",
  },
  refunded_outside: {
    en: "The payment for “{title}” was refunded to the brand outside comtor. The deal is cancelled.",
    de: "Die Zahlung für „{title}“ wurde außerhalb von comtor an die Marke erstattet. Der Deal ist abgebrochen.",
  },
  invoice_issued_brand: {
    en: "Your invoice {number} for “{title}” is ready. You find it under Deals, Invoices.",
    de: "Deine Rechnung {number} für „{title}“ liegt bereit. Du findest sie unter Deals, Rechnungen.",
  },
  invoice_issued_creator: {
    en: "Your credit note {number} for “{title}” is ready. You find it under Deals, Invoices.",
    de: "Deine Gutschrift {number} für „{title}“ liegt bereit. Du findest sie unter Deals, Rechnungen.",
  },
  invoice_corrected: {
    en: "The document {old} for “{title}” was corrected: it is cancelled and replaced by {new}.",
    de: "Der Beleg {old} für „{title}“ wurde korrigiert: Er ist storniert und durch {new} ersetzt.",
  },
} as const satisfies Record<string, Text>;

export type NoticeKey = keyof typeof NOTICE_TEXT;

// What a notice is sent as an e-mail for, and under which subject. These are the ones with a deadline, a cancellation, a
// dispute or money behind them: they are also not switched off by the "payments" notification setting, because missing one
// can cost a deal (an automatic cancellation with a refund). The rest stays in the app.
export const NOTICE_SUBJECT: Partial<Record<NoticeKey, Text>> = {
  reminder_draft_due: { en: "Reminder: your draft for “{title}” is due", de: "Erinnerung: Dein Entwurf für „{title}“ ist fällig" },
  reminder_review_due: { en: "Reminder: review the draft for “{title}”", de: "Erinnerung: Prüfe den Entwurf für „{title}“" },
  reminder_revision_due: { en: "Reminder: the changes for “{title}” are due", de: "Erinnerung: Die Änderungen für „{title}“ sind fällig" },
  reminder_post_due: { en: "Reminder: your post for “{title}” is due", de: "Erinnerung: Dein Post für „{title}“ ist fällig" },
  reminder_scheduled_missed: { en: "Your scheduled post for “{title}” is missing", de: "Dein geplanter Post für „{title}“ fehlt" },
  escrow_due: { en: "Payment due: “{title}”", de: "Zahlung fällig: „{title}“" },
  contract_sign: { en: "Confirm the contract for “{title}”", de: "Bestätige den Vertrag für „{title}“" },
  draft_auto_approved_creator: { en: "Your draft for “{title}” counts as approved", de: "Dein Entwurf für „{title}“ gilt als freigegeben" },
  draft_auto_approved_brand: { en: "A draft for “{title}” was approved automatically", de: "Ein Entwurf für „{title}“ wurde automatisch freigegeben" },
  post_removed_creator: { en: "Your post for “{title}” is no longer online", de: "Dein Post für „{title}“ ist nicht mehr online" },
  post_removed_brand: { en: "The post for “{title}” is no longer online", de: "Der Post für „{title}“ ist nicht mehr online" },
  payout_blocked: { en: "Set up payouts to receive your money for “{title}”", de: "Richte die Auszahlung ein, um dein Geld für „{title}“ zu erhalten" },
  usage_delivery_needed: { en: "Hand over the ad usage rights for “{title}”", de: "Übergib die Ads-Nutzungsrechte für „{title}“" },
  usage_expiring: { en: "The ad usage rights for “{title}” end soon", de: "Die Ads-Nutzungsrechte für „{title}“ enden bald" },
  deal_cancelled_refund_brand: { en: "Deal cancelled and refunded: “{title}”", de: "Deal abgebrochen und erstattet: „{title}“" },
  deal_cancelled_creator: { en: "Deal cancelled: “{title}”", de: "Deal abgebrochen: „{title}“" },
  deal_cancelled_brand: { en: "Deal cancelled: “{title}”", de: "Deal abgebrochen: „{title}“" },
  deal_cancelled_by_brand: { en: "Deal cancelled: “{title}”", de: "Deal abgebrochen: „{title}“" },
  dispute_opened: { en: "Deal frozen: “{title}”", de: "Deal eingefroren: „{title}“" },
  dispute_released: { en: "Dispute decided: payout for “{title}”", de: "Streitfall entschieden: Auszahlung für „{title}“" },
  dispute_refunded: { en: "Dispute decided: refund for “{title}”", de: "Streitfall entschieden: Erstattung für „{title}“" },
  dispute_resumed: { en: "Dispute resolved: “{title}” continues", de: "Streitfall geklärt: „{title}“ läuft weiter" },
  payout_released_creator: { en: "Your payout for “{title}” is on its way", de: "Deine Auszahlung für „{title}“ ist unterwegs" },
  payout_released_brand: { en: "Payout released: “{title}”", de: "Auszahlung freigegeben: „{title}“" },
  chargeback_lost: { en: "Payment reversed: “{title}”", de: "Zahlung zurückgebucht: „{title}“" },
  refunded_outside: { en: "Payment refunded: “{title}”", de: "Zahlung erstattet: „{title}“" },
};

export const EMAIL_NOTICES: ReadonlySet<NoticeKey> = new Set(Object.keys(NOTICE_SUBJECT) as NoticeKey[]);

// Of those, the ones that ask the person to do something (the e-mail's heading says so); the rest is news.
export const ACTION_NOTICES: ReadonlySet<NoticeKey> = new Set<NoticeKey>([
  "reminder_draft_due",
  "reminder_review_due",
  "reminder_revision_due",
  "reminder_post_due",
  "reminder_scheduled_missed",
  "escrow_due",
  "contract_sign",
  "post_removed_creator",
  "payout_blocked",
  "usage_delivery_needed",
  "usage_expiring",
]);

export function noticeSubject(key: NoticeKey, locale: Locale | string, params: NoticeParams): string | null {
  const text = NOTICE_SUBJECT[key];
  if (!text) return null;
  return fill(text[dealLocale(locale)], plainParams(params, dealLocale(locale)));
}

export const CANCEL_REASON_TEXT: Record<CancelReason, Text> = {
  CONTRACT_EXPIRED: { en: "the contract was not confirmed in time", de: "der Vertrag wurde nicht rechtzeitig bestätigt" },
  ESCROW_EXPIRED: { en: "the escrow was not funded in time", de: "das Treuhandkonto wurde nicht rechtzeitig gefüllt" },
  DRAFT_DEADLINE_MISSED: { en: "the draft deadline was missed", de: "die Frist für den Entwurf wurde verpasst" },
  REVISION_DEADLINE_MISSED: { en: "the requested changes were not delivered in time", de: "die gewünschten Änderungen kamen nicht rechtzeitig" },
  POST_DEADLINE_MISSED: { en: "the posting deadline was missed", de: "die Posting-Frist wurde verpasst" },
  CANCELLED_BY_BRAND: { en: "cancelled by the brand", de: "von der Marke abgebrochen" },
  CANCELLED_BY_CREATOR: { en: "the creator withdrew", de: "der Creator ist zurückgetreten" },
  DISPUTE_REFUND: { en: "a dispute was decided in favour of the brand", de: "ein Streitfall wurde zugunsten der Marke entschieden" },
  REFUNDED_IN_STRIPE: { en: "the payment was refunded outside comtor", de: "die Zahlung wurde außerhalb von comtor erstattet" },
  CHARGEBACK_LOST: { en: "the bank reversed the payment", de: "die Bank hat die Zahlung zurückgebucht" },
};

export function cancelReasonText(reason: CancelReason, locale: DealLocale): string {
  return CANCEL_REASON_TEXT[reason][locale];
}

export type NoticeParams = Record<string, string | number | Date>;

// Dates in the params are written out in the reader's language, so a caller does not have to know it.
function plainParams(params: NoticeParams, language: DealLocale) {
  return Object.fromEntries(Object.entries(params).map(([name, value]) => [name, value instanceof Date ? formatDealDate(value, language) : value]));
}

export function noticeText(key: NoticeKey, locale: Locale | string, params: NoticeParams): string {
  const language = dealLocale(locale);
  return fill(NOTICE_TEXT[key][language], plainParams(params, language));
}

// A date and time in Berlin, in the reader's language: deadlines are the same moment for everyone.
export function formatDealDate(date: Date, locale: DealLocale): string {
  return date.toLocaleString(locale === "de" ? "de-DE" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  });
}
