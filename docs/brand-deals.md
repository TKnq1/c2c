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
| Screens | `/dashboard/deals`, `/dashboard/deals/[id]`, `/dashboard/startup/requests/[id]/briefing`, `/dashboard/business` |
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

## Environment

See `.env.example` (section "Brand deals"): `IMPRINT_VAT_ID` or `PLATFORM_TAX_NUMBER`, `PLATFORM_SMALL_BUSINESS`,
`SOCIAL_WEBHOOK_SECRET`, `META_OEMBED_TOKEN`, `YOUTUBE_API_KEY`, plus the existing `CRON_SECRET` and Stripe keys.

The social webhook (`POST /api/webhooks/social`) takes `{ eventId, type: post.metrics | post.removed | post.published,
platform, externalId, occurredAt?, metrics? }` signed as `x-comtor-signature: sha256=<hmac of the raw body>`.

Vercel Hobby only runs crons once a day. The 24-hour hold is then evaluated with up to a day of delay; an hourly schedule needs
Pro. A party can also press "Check now" on the deal page.

## Tests

`npm test` runs the unit tests (status table, deadline planner, advertising rules, exclusivity, usage rights, URL parser, VAT
IDs, VIES mapping, tax engine, invoices). The lifecycle test needs a database the migrations were applied to:

```bash
DEAL_TEST_DATABASE_URL=postgresql://user:pw@localhost:5432/scratch npx vitest run src/lib/deals/lifecycle.integration.test.ts
```

It runs offer, contract, escrow (Stripe faked), draft, post, verification, payout and invoices, and the failure paths (missed
deadline, removed post, rejected draft, dispute, usage rights, exclusivity). Use a scratch database: the deadline job looks at
every deal in it.

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
5. **Platform reporting (DAC7)** and the recapitulative statement (Zusammenfassende Meldung) for reverse-charge services.
6. **Advertising wording per market** (`MARKET_RULES` in `disclosure.ts`) is a technical check, not a legal opinion; have the
   non-German lists reviewed before advertising in those markets.
