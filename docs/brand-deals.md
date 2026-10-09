# Brand deals

How a sponsored collaboration runs on comtor, from the brief to the payout, and where each rule lives in the code. This is
a technical record. It is not legal or tax advice; the points that need a lawyer or a tax adviser are listed at the end.

## The idea

A request is the brief. A creator's interest is the application. When an offer is accepted, the accepted offer becomes a
**Deal**: a frozen copy of the brief (the contract), a state machine, the posts and proofs, the checks, the tax treatment and
the invoices. The money stays on the `Interest` row (Stripe separate charges and transfers, unchanged); the deal decides
when it may move.

```
Briefing (Request + CampaignBriefing)  ->  Application (Interest)  ->  Offer accepted = Deal created
  CONTRACT_PENDING   both sides confirm the frozen terms (needs complete business details)
  AWAITING_ESCROW    the brand pays net price + VAT through Stripe Checkout
  IN_PRODUCTION      escrow funded; draft deadline and posting window start running
  DRAFT_SUBMITTED    brand reviews (or: deemed approved after the review time)   <-> CHANGES_REQUESTED (max rounds)
  DRAFT_APPROVED     creator schedules the post and/or reports the live link   -> POST_SCHEDULED
  POST_SUBMITTED     link / proof checked on the platform
  VERIFYING          post verified live; hold window runs (24 h .. 30 days)     -> REPOST_REQUIRED (48 h grace)
  PAYOUT_PENDING     hold over, post still live, ad usage rights handed over
  COMPLETED          payout released, invoices issued
  DISPUTED           frozen for an admin decision        CANCELLED   refunded / lapsed
```

**The switch.** Brand deals are off until `BRAND_DEALS_ENABLED=1` is set (`src/lib/deals/flag.ts`; `next.config.ts` copies it to
`NEXT_PUBLIC_BRAND_DEALS_ENABLED` so the tabs hide too). Off means the app behaves as before: no Deals tab, no briefing card, offers
are accepted the old way. Deals that already exist stay reachable (`canUseDeals`). Turn it on for Preview and Development first.

Collabs from before deals existed have no `Deal` row and keep the old approve / auto-release flow. A deal-backed payment can
**not** be released by the old paths (`payment-release.ts` refuses them), and the old buttons on the payment pages and in the
chat are replaced by a link to the deal.

## Where things are

| What | Where |
|---|---|
| Data model | `prisma/schema.prisma` (Deal, CampaignBriefing, DealDraft, DealPost, DealProof, DealPostMetric, DealEvent, DealDispute, BusinessProfile, Invoice, InvoiceSequence) |
| State machine | `src/lib/deals/status.ts` (one table: which status follows which, by whom) |
| Contract terms | `src/lib/deals/terms.ts` (frozen copy + SHA-256), `create.ts` (made inside the accept transaction) |
| Policy numbers | `src/lib/deals/policy.ts` |
| Deadline planner | `src/lib/deals/deadlines.ts` (pure), executor `handlers.ts`, route `/api/cron/deal-deadlines` (daily) |
| Verification of posts | `src/lib/deals/verification.ts`, `src/lib/social/*` (URL parser, oEmbed checks, signed webhook) |
| Payout, cancel, disputes | `src/lib/deals/payout.ts`, admin decision `src/lib/actions/deal-admin.ts`, screen `/admin/deals` |
| Advertising rules | `src/lib/compliance/disclosure.ts`, `briefing.ts` |
| Exclusivity | `src/lib/compliance/exclusivity.ts`, `src/lib/deals/exclusivity.ts` |
| Usage rights | `src/lib/compliance/usage-rights.ts` |
| Business data (DSA / VAT) | `src/lib/tax/business.ts`, `/dashboard/business` |
| VAT ID check | `src/lib/tax/vat-id.ts`, `vies.ts`, `verify-profile.ts` |
| Tax treatment | `src/lib/tax/engine.ts` |
| Invoices | `src/lib/billing/invoice.ts` (pure), `issue.ts` (numbering), `/dashboard/invoices` |
| Corrections (Storno) | `src/lib/billing/correct.ts`, admin form on `/admin/deals` (section "Belege") |
| PDF documents | `src/lib/pdf-kit.ts` (page builder), `billing/pdf.ts` (invoice), `deals/contract-pdf.ts` (contract), mail `billing/deliver.ts` |
| Stripe events (refund, chargeback) | `src/lib/deals/stripe-events.ts`, called from `src/app/api/webhooks/stripe/route.ts` |
| Money safety, admin alerts | `src/lib/payment-release.ts` (`reconcileRelease`), `deals/payout.ts`, `deals/alerts.ts`, checks in `deals/admin-checks.ts` |
| Briefing versions and templates | `deals/briefing-store.ts`, `deals/briefing-templates.ts`, actions in `lib/actions/briefing*.ts` |
| Notices by e-mail | `deals/notices.ts` (`NOTICE_SUBJECT`), `deals/notify.ts`, template `dealNoticeEmail` in `email-templates.ts` |
| Tax advisor exports | `/api/admin/export/invoices` (`lib/export-invoices.ts`), linked on `/admin/geld` |
| Retention | `src/lib/deals/retention.ts`, `DEAL_POLICY.proofRetentionDays` |
| Screens | `/dashboard/deals` (tabs Deals, Payments, Invoices), `/dashboard/deals/[id]`, `/dashboard/startup/requests/[id]/briefing`, `/dashboard/startup/templates`, `/dashboard/business` |
| Navigation | `src/lib/nav-links.ts` (which tabs, which badge, which tab is current), `components/nav.tsx`, `components/deals/deals-tabs.tsx` |
| Deal page layout | `src/lib/deals/page-plan.ts` (what comes first for a state, what folds), `components/deals/panels.tsx`, `ui.tsx` (`Folded`) |
| Words (German, English) | `src/lib/deals/copy.ts` (findings), `notices.ts` (notifications), `ui-copy*.ts` (screens) |

## Rules the code enforces

**Advertising label (UWG § 5a (4), MStV § 8, DDG § 6).** A briefing cannot be saved without an accepted label for its market
("Werbung" / "Anzeige" in DE, AT, CH; wording per market in `disclosure.ts`), "#ad" alone is refused, and an instruction to
leave the label out is refused outright. A draft caption and the live post are checked the same way: the label has to stand
within the visible part of the caption, the content itself (spoken or on screen) has to carry it for videos and stories, the
platform's paid-partnership switch has to be on when the brand asks for it, and required hashtags and mentions have to be
there. Where the platform shows the caption (TikTok oEmbed, YouTube API), it is checked again after publication.

**Exclusivity.** `exclusivityEnabled` plus categories / competitor names and days before / after publication. Windows of the
creator's other deals are compared: errors once a date is chosen, warnings while only posting windows are known.

**Usage rights.** `ORGANIC_ONLY`, `CROSS_POST` or `PAID_ADS` (Meta Partnership Ads, TikTok Spark Ads, YouTube Partnership
Ads, whitelisting), with a duration, a fee (its own invoice line) and a territory. The right starts when the post is verified
live. For `PAID_ADS` the creator has to hand over the Spark Ads code and / or confirm the partner-ad permission before the
payout; a code that expires before the right ends is refused. A week before the right ends, and when it has ended, both sides
are told.

**Verification.** The creator reports the link (Instagram Reel / Post, TikTok, YouTube integration / dedicated / Short) or a
screenshot (Stories, and Instagram when `META_OEMBED_TOKEN` is not set). Links are checked through the platforms' own oEmbed /
API endpoints only (the canonical address is rebuilt from recognised parts; share and short links are refused). Two failed
checks in a row count as removed. A removed post gives 48 hours to republish, then the deal is frozen as a dispute. Every format
booked in the briefing has to be live before the hold window starts.

**Deadlines.** Reminders, deemed approval of an unanswered draft, cancellation with refund after a missed draft / revision /
posting deadline (grace periods in `policy.ts`), expiry of an unsigned contract (7 days) or an unfunded escrow (7 days).

**Money.** The brand pays net price + VAT (two Checkout lines). The creator's payout is `Interest.payoutCents` and does not
change with tax status. The platform keeps its fee and the VAT it owes. Release needs: deal in `PAYOUT_PENDING`, no dispute,
payout account ready. Refunds return the full charge including VAT.

**VAT** (`tax/engine.ts`, platform is German):

| Party | Case | Treatment |
|---|---|---|
| Brand | Germany | 19 % on top |
| Brand | other EU state, VAT ID confirmed by VIES | reverse charge, 0 % |
| Brand | other EU state, no confirmed VAT ID | cannot sign |
| Brand | outside the EU | not taxable in Germany, 0 % |
| Creator | Germany, regular | 19 % inside the payout (credit note shows net + VAT) |
| Creator | Germany, small business (§ 19 UStG) | no VAT |
| Creator | other EU state with VAT ID | reverse charge |
| Creator | other EU state, small business without VAT ID | no VAT |
| Creator | outside the EU | § 13b UStG |

Treatment and both parties' details are frozen into `Deal.taxSnapshot` when the second side signs; invoices are built from
that snapshot, never from the current profiles. VAT IDs are re-checked with VIES every 90 days; a number VIES has confirmed
is not downgraded because VIES is down.

**Invoices.** Two documents per completed deal, gapless per kind and year (`RE-2026-000001`, `GS-2026-000001`): the brand
invoice (platform to brand) and the creator's self-billing credit note (§ 14 (2) UStG, issued in the creator's name; the
creator accepts the arrangement in the business details). Both need the platform's `IMPRINT_VAT_ID` or `PLATFORM_TAX_NUMBER`;
without it they are written later by the daily job or from `/admin/deals`.

**Trader data (DSA Art. 30 / P2B).** `BusinessProfile`: legal name, type (private persons are refused), address, country, tax
number or VAT ID, register number, and the self-certification that the person acts in the course of a trade, business or
profession, with the version of the wording that was confirmed.

## Briefings, versions and templates

A briefing has a `version`, raised only when its content really changed. An offer remembers the version it was made under
(`Interest.offerBriefingVersion`; null for offers from before versions, which are not checked). If the brand changes the briefing
after offering, accepting the old offer fails inside the accept transaction (`StaleBriefingError`): the creator gets an error, the
brand a notice (`offer_reconfirm_needed`), and the brand re-confirms from the request page (`refreshOfferAction`,
`refreshOpenOffersAction`). The frozen contract is never touched by a later edit.

Templates (`BriefingTemplate`, per brand, at most 20, name unique ignoring case) are copies, not links: changing a template changes
no request. A template can be saved from a request or from the builder, renamed, deleted, marked as the default (new requests start
from it) and applied to up to 25 requests at once. The posting window is never part of a template (it belongs to the campaign).
An incomplete form can be kept as a draft (`BriefingDraft`, one per request, errors allowed); a valid save replaces it. The builder
starts from the draft, else the saved briefing, else the default template, else the German defaults. Duplicating a request copies
its briefing.

## The screens

With `BRAND_DEALS_ENABLED` off nothing below shows; for a person who already has deals the Deals tab stays reachable (see `flag.ts`).

- **Navigation.** On the phone the tab bar has four entries where deals are on: home (Feed / Requests), Messages, Deals, Account.
  Discover is a magnifier in the header; Payments and Invoices are tabs on the Deals pages. One badge per tab: Messages counts
  unread, Deals everything that waits for the person (deals and payments), and then opens `?filter=mine`.
- **Deal page.** `planPanels` puts the part the deal is in right under the "next step" card (with a button to its form), folds the
  parts behind the deal to one-line summaries and keeps everything open in a dispute or after a cancellation. The stepper is one
  line with a bar on phones. Report-a-problem and cancel live in a menu in the header. The contract shows a short form (rows with
  `core` in `contract-rows.ts`) and "All terms"; open for whoever still has to confirm. Links with a section (`#drafts`) open
  folded parts (`ScrollToHash`).
- **Lists and home.** `/dashboard/deals?filter=mine|active|done` with chips and counts; a brand with six or more deals sees them
  grouped by campaign. A card on both home screens says how many deals wait.
- **Briefing builder.** Three steps (`briefing-steps.ts` maps every field to a step), findings next to the fields, a bar that says
  how many errors there are and goes to the first one, an automatic draft after two seconds, templates and "take over from an
  earlier request" (they fill the form; nothing is saved until the briefing is), "save as template", and a card with a button when
  the brand's own open offers were made under an older version (`countStaleOffers`, `refreshOpenOffersAction`). The form starts in
  the market of the brand's business country (`marketForCountry`).
- **Templates.** `/dashboard/startup/templates`: default, rename, delete, apply to several requests with a result for each.
- **Creator forms.** A checklist for the draft and the post (`post-checklist.ts`, the checks the server runs), a pasted link picks
  the format (`detectFormat`), the proof screenshot has a preview. **Business details**: a button asks VIES for name and address
  (`lookupVatIdAction`, `vies-address.ts`; nothing is saved until the form is).
- The deal screens say "sicher hinterlegt" / "held safely" where they used to say Treuhandkonto / escrow. The contract text
  itself is unchanged and goes to the lawyer as it is.

The list of what is built and what is not is `docs/ux-backlog.md`.

## Money that moves in Stripe without the app asking

`/api/webhooks/stripe` also handles `charge.refunded`, `charge.dispute.created` and `charge.dispute.closed` (the endpoint has to be
subscribed to them, see `docs/security-setup.md`). Every handler can run again for the same event.

- **Full refund made in the Dashboard** while the money is held: the payment is marked refunded, the deal is cancelled
  (`FORCE_CANCEL`, reason `REFUNDED_IN_STRIPE`), an open dispute is settled, both sides are told, the admins get an alert. A partial
  refund, or one after the payout, only alerts the admins and writes a deal event. A refund the app made itself is recognised and
  ignored.
- **Chargeback** on a funded deal: the deal and the money freeze as a dispute of its own kind (`CHARGEBACK`, with the Stripe dispute
  id and the date the evidence is due). A dispute a person had opened already is joined. The evidence itself is only ever submitted
  in the Stripe Dashboard. Won (or warning closed): the deal carries on where it stood. Lost: the payment counts as refunded, the
  deal ends (`CHARGEBACK_LOST`), nobody is paid out. After the payout it is only an alert (the amount comes out of the platform's
  balance).

Review fixes on the money paths:

- A transfer call that gets no clear answer used to let the deal complete. Now the payout asks Stripe for the transfer
  (`reconcileRelease`, matching the charge at the creator's account), records it and completes, or waits and alerts the admins
  each day. Only when Stripe has no trace 36 hours after the call (its idempotency key lasts 24 hours) is the payment paid again.
  The report "Payout needs reconciliation" closes itself once the transfer is known.
- `cancelDeal` and a REFUND decision continue when the refund already went through before something else failed.
- The daily job starts paid deals that still wait for their payment (a webhook cut off between the two writes), alerts on failing
  payouts and invoices, and catches up missing invoices.

Admin visibility: `alertAdmins` (dashboard notice, e-mail to those who want it, once per key and day) and self-closing checks on
the Open page: disputes open, payouts stuck for a day, transfers Stripe has not confirmed, completed deals without invoices,
VAT IDs VIES did not confirm.

## Notices and e-mail

Every notice is in the app. The ones with a deadline, a cancellation, a dispute or money behind them (`NOTICE_SUBJECT`) also go out
as an e-mail to a confirmed address of an account that is not suspended or deleted, and are not switched off by the payment
notification setting: missing one can cost a deal. A link to a deal opens at the part of the page the notice is about
(`sections.ts`: `#contract`, `#escrow`, `#drafts`, `#posts`, `#usage`, `#dispute`, `#invoices`, `#timeline`). The deals list takes
`?filter=mine|active|done`.

## Documents

- **PDF.** Invoices, credit notes and cancellations render from the stored document (`/api/invoices/[id]/pdf`, recipient and admins,
  60 downloads an hour). They are mailed with the PDF attached when issued or corrected; that mail is transactional and does not
  depend on a notification setting. The contract renders as a PDF too (`/api/deals/[id]/contract`) with the SHA-256 of the frozen
  terms and the confirmation times; each side sees its own money, the counterpart's name only. The documents are German.
- **Corrections.** An issued document is never edited. `correctInvoice` cancels it with a document that repeats it with every amount
  reversed (own number, same series, `cancelsInvoiceId`) and issues a replacement with the corrected name, address, VAT ID or tax
  number of the other side (`revision` 1 and 2, then 3 and 4 and so on). Both documents take the next numbers in one transaction,
  so the series stays gapless; two simultaneous corrections of the same document cannot both succeed. Amounts and tax treatment are
  not correctable here: they were derived from the frozen deal. Admin only, behind the password, with an audit line.
- **Exports.** `/admin/geld` offers the month's invoices, credit notes and cancellations as CSV (tax treatment, sums, a cancelled
  document and its cancellation net out), and the quarterly summary of services to EU businesses (Zusammenfassende Meldung: per
  customer VAT ID, amount rounded to whole euros) for the tax adviser. Every download is logged.

## Retention and limits

- Proof images (screenshots a creator uploads) are deleted 90 days after a deal ended (completed or cancelled) when no dispute is
  open; the row keeps the hash and the verification result, the image route answers 410 (`purgeOldProofs`, daily job).
  Invoices stay as long as tax law requires.
- Per person and day: 60 contract confirmations, 20 cancellations, 30 drafts, 60 reviews, 30 schedulings, 60 post and 30 usage
  confirmations, 20 usage hand-overs; 30 saves of the business details an hour; 60 briefing saves; 100 offers (existing).

## Environment

See `.env.example` (section "Brand deals"): `BRAND_DEALS_ENABLED`, `IMPRINT_VAT_ID` or `PLATFORM_TAX_NUMBER`, `PLATFORM_SMALL_BUSINESS`,
`SOCIAL_WEBHOOK_SECRET`, `META_OEMBED_TOKEN`, `YOUTUBE_API_KEY`, plus the existing `CRON_SECRET`, Stripe keys and `RESEND_API_KEY`
(notices and documents go out through Resend).

The social webhook (`POST /api/webhooks/social`) takes `{ eventId, type: post.metrics | post.removed | post.published,
platform, externalId, occurredAt?, metrics? }` signed as `x-comtor-signature: sha256=<hmac of the raw body>`.

Vercel Hobby only runs crons once a day. The 24-hour hold is then evaluated with up to a day of delay; an hourly schedule needs
Pro. A party can also press "Check now" on the deal page.

## Tests

`npm test` runs the unit tests (status table, deadline planner, advertising rules, exclusivity, usage rights, URL parser, VAT IDs,
VIES mapping and address reading, tax engine, invoices, corrections, PDF layout, exports, notices, navigation, the deal page plan,
the briefing steps, the post checklist). The integration suites run against a real Postgres with
Stripe, the session, the platforms and the mail sender faked; they are skipped without `DEAL_TEST_DATABASE_URL`:

```bash
DEAL_TEST_DATABASE_URL=postgresql://user:pw@localhost:5432/scratch npm test
```

They cover the lifecycle (offer, contract, escrow, draft, post, verification, payout, invoices and the failure paths), offers and
briefing versions, templates, the money around a deal (Stripe refunds and chargebacks, unknown transfers, healing, checks, proof
retention) and documents (mail, PDFs, corrections, exports, admin action). Use a scratch database: the deadline job looks at every
deal in it. CI runs them against a Postgres service after `prisma migrate deploy`. `npm run db:seed:deals` builds one demo deal per
status in a local database for looking at the screens.

## Needs a lawyer or a tax adviser before launch

1. **Who contracts with whom.** The invoicing here (platform invoices the brand, platform self-bills the creator) treats comtor
   as the party that buys the creator's service and resells it to the brand. The terms of service currently say comtor is only
   the platform and not party to the collaboration (`src/lib/legal/de.ts`). One of the two has to change, and the tax adviser
   decides which model is right (including VAT on the platform fee if comtor is an intermediary instead).
2. **Escrow and payment services law (ZAG)**, as already noted in `docs/legal-readiness.md`.
3. **Self-billing (§ 14 (2) UStG).** The wording of the agreement (`SELF_BILLING_VERSION` in `tax/business.ts`) and the
   process for objecting to a credit note.
4. **Terms of service** for deals: deadlines and automatic refunds, deemed approval of drafts, the hold period, disputes, the
   admin's decision right.
5. **Platform reporting (DAC7)** and the recapitulative statement (Zusammenfassende Meldung) for reverse-charge services; the export
   exists, the filing and its scope are the tax adviser's call.
6. **Advertising wording per market** (`MARKET_RULES` in `disclosure.ts`) is a technical check, not a legal opinion; have the
   non-German lists reviewed before advertising in those markets.
7. **E-invoicing.** From 1 January 2027 a German business has to issue structured e-invoices (XRechnung / ZUGFeRD) to other German
   businesses; PDF invoices are only tolerated until then (and until the end of 2027 for small businesses). The documents here are
   PDF and in the app. Whether and when to add a structured format, and whether the PDF mail needs the recipient's consent
   (§ 14 (1) UStG), is for the tax adviser.
8. **Privacy policy and retention.** `src/lib/legal/de.ts` does not describe brand deals yet (business details, post checks through
   the platforms, VIES, proof images with their 90-day deletion, invoices). The retention period for proof images is a decision made
   here, not a legal finding.
9. **Corrections.** Cancelling an invoice and issuing a replacement is the usual route; whether a correction notice would do, and
   how to treat a credit note the creator disputes, is for the tax adviser.
