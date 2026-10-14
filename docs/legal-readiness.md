# Legal and privacy readiness

What the code does about privacy and marketing rules, which switches exist, and what is still open outside the
code. This is a technical record, not legal advice. The full audit lives with the project owner; the list below is
what a developer needs.

## Switches (environment variables)

| Variable | Effect |
|---|---|
| `OUTREACH_ENABLED` | `1` turns on `/admin/mailing` (adding addresses and sending). Off by default. Advertising email needs the recipient's prior, explicit consent (§ 7 UWG), also for businesses. |
| `IMPRINT_VAT_ID` | Shown in the imprint when set (§ 5 DDG). |
| `NEXT_PUBLIC_SENTRY_DSN` | Turns on error reporting to Sentry. When set, the privacy policy names Sentry automatically. Before switching on: use the EU region, enable *Prevent Storing of IP Addresses*, sign Sentry's DPA. |

## What the code does

- **Consent proof at sign-up:** `User.termsAcceptedAt`, `termsVersion` (`src/lib/legal/version.ts`) and
  `ageConfirmedAt`. Both boxes (adult, terms and privacy) are required on the page and in the server actions
  (`src/lib/legal/consent.ts`). Change `LEGAL_VERSION` and `LEGAL_UPDATED` with every substantive change of the
  terms or privacy policy, and edit both languages (`src/lib/legal/de.ts` for German, the pages under
  `src/app/legal/` for English).
- **Marketing mail (outreach):** off by default. An address can only be added with a note on how the person
  agreed; without it the address is never mailed. Everyone who unsubscribes (page or one-click `List-Unsubscribe`
  header) is removed from all lists, the record of what was sent to them is deleted, and a SHA-256 of the address is
  kept (`OutreachSuppression`) so it can't be added again. Send records older than 90 days are deleted by the
  daily cron. Opens and clicks are not tracked (the Resend webhook is a no-op).
- **Retention (daily cron, `src/app/api/cron/release-payments/route.ts`):** login log 90 days, sign-up IPs 7 days,
  rate-limit counters 24 hours, outreach send records 90 days, unconfirmed waitlist addresses 30 days. The privacy
  policy states these periods; keep both in step.
- **Accounts with payment records** are anonymised instead of deleted (`src/lib/account-deletion.ts`); the
  privacy policy says so (tax law: § 147 AO, § 257 HGB).
- **Suspensions** send the person an email with the reason and how to object (DSA Art. 17).
- **Brand deals** (`docs/brand-deals.md`): advertising-label checks (UWG / MStV / DDG), exclusivity and usage rights in the
  contract, escrow released only after the post stayed live, VAT (domestic / reverse charge, VIES-checked VAT IDs), invoices and
  self-billing credit notes, and the trader data (DSA Art. 30 / P2B) in `BusinessProfile`. The deal's drafts, posts and proof
  images are deleted when an account is anonymised; the contract, its trail and the invoices stay (§ 147 AO). Business details
  and deals are part of the data export.
- **No cookie banner needed:** only strictly necessary cookies and local storage are used. Adding analytics,
  advertising pixels or tracking requires a consent banner first, and the CSP in `next.config.ts` has to be
  adapted.

## Language

German is the default language (`DEFAULT_LOCALE` in `src/lib/i18n/locales.ts`): a first visit, a search engine and a
link preview all get German, and the landing page offers a switch to English. The landing page, the FAQ, the share
images, the German search pages under `/ugc`, the legal texts and the emails the app sends exist in German and
English. The other six app languages show the English landing page and the English emails until they are translated
(`landing` in `src/lib/i18n/messages/`, `src/lib/email-templates.ts`). An email is written in the account's stored
language (`User.locale`), or in the language cookie of a visitor without an account (waitlist). `/dev-emails/<name>`
shows them locally, `?lang=en` for English.

## Still open outside the code

1. **Resend:** switch open and click tracking **off** for the sending domain, and delete the webhook that points to
   `/api/webhooks/resend`.
2. **Payment model:** have the money flow (platform holds funds until the brand approves) checked against the
   payment services law (ZAG) with a lawyer or Stripe, and wording like "escrow" in the app (it is gone from public
   pages) decided after that.
3. **DAC7 / Plattform-Steuertransparenzgesetz:** ask a tax adviser whether and from when comtor must register
   and report.
4. **Terms of service:** have them reviewed by a lawyer (liability cap, indemnity, Pro, VAT).
5. **Pro subscription:** €10/month, sold to brands and to creators. Creators are often private persons, so Pro
   is now sold to consumers too and "Pro for businesses only" is no longer an option: check the consumer rules for
   an online subscription (the cancellation button under § 312k BGB, the pre-contract information, the 14-day
   withdrawal the app already offers) against the Settings flow, and the Stripe price's tax setting and invoices
   (VAT shown, reverse charge for businesses).
6. **Processors:** accept or sign the data processing agreements with Vercel, Neon, Resend, Stripe, Google
   (Firebase Cloud Messaging) and, if used, Sentry. File them.
7. **Records:** keep the record of processing activities (below) and the technical and organisational measures
   (`docs/security-setup.md`, the security audit) up to date; write down who handles a data breach (72 hours).
8. **Assets:** fill in `docs/assets.md` (photo sources, icon set, sounds). Replace sounds without a licence.
9. **Trademark:** check the name and logo "comtor" (DPMA, EUIPO).
10. **Other languages:** the legal texts exist only in German and English. Advertise in Germany (and English
    speaking markets) until the others are translated.
11. **App stores:** at launch add the current official badges, linked to the store pages; fill in Apple's App
    Privacy and Google's Data safety from the table below.

12. **Brand deals:** who contracts with whom (the terms say comtor is not a party, the invoicing treats it as one), the
    self-billing agreement, the terms for deadlines / automatic refunds / deemed approval / disputes, the recapitulative
    statement for reverse-charge services. See the end of `docs/brand-deals.md`.

## Record of processing activities (starting point, Art. 30 GDPR)

| Processing | Purpose | Data | Recipients | Basis | Retention |
|---|---|---|---|---|---|
| Account and sign-in | contract | email, password hash, role, 2FA secret (encrypted), consent proof | Vercel, Neon | Art. 6(1)(b), (f) | until account deletion |
| Profiles, requests, chat | matching | profile data, images, messages, offers | Vercel, Neon | Art. 6(1)(b) | until account deletion |
| Payments | contract, accounting | amounts, status, Stripe ids | Stripe | Art. 6(1)(b), (c) | 8 to 10 years, anonymised |
| Business details | trader transparency (DSA Art. 30), invoicing, VAT | legal name, address, tax number, VAT ID, VIES result | Vercel, Neon, EU VIES service | Art. 6(1)(b), (c), (f) | until account deletion; copies on invoices 10 years |
| Brand deals | contract performance, evidence | frozen terms, drafts, post links, proof screenshots, status trail | Vercel, Neon, Instagram / TikTok / YouTube (link check) | Art. 6(1)(b), (f) | contract and trail 10 years; drafts, posts and proofs until account deletion |
| Sign-in log | security | email, IP, browser, time | Vercel, Neon | Art. 6(1)(f) | 90 days |
| Sign-up IP, rate limits | abuse protection | IP | Neon | Art. 6(1)(f) | 7 days / 24 hours |
| Account emails | contract | email | Resend | Art. 6(1)(b) | at the provider |
| Waitlist | launch notice | email, role, confirmation time | Resend, Neon | Art. 6(1)(a) | 30 days unconfirmed / until launch mail |
| Push notifications | notifications | subscription or device token | Apple, Google, Mozilla | Art. 6(1)(a) | until withdrawn or account deletion |
| Onboarding events | product improvement | user id, step, time | Neon | Art. 6(1)(f) | until account deletion |
| "How did you hear about us?" (optional) | channel measurement | one answer code | Neon | Art. 6(1)(a) | until account deletion |
| Error reporting (if on) | stability | error data, maybe IP | Sentry | Art. 6(1)(f) | per Sentry setting |
| Marketing mail (if on) | advertising | name, email, consent note, send record | Resend, Neon | Art. 6(1)(a) | send record 90 days |
