import { USAGE_CHANNELS, isUsageChannel } from "@/lib/compliance/usage-rights";
import type { TaxSnapshot } from "@/lib/deals/parties";
import type { DealTerms } from "@/lib/deals/terms";
import type { UiText } from "@/lib/deals/ui-copy";
import { formatCents } from "@/lib/format";
import { POST_FORMATS } from "@/lib/social/platforms";

// The contract as lines of text, in the language of the reader: what the deal page shows and what the contract PDF prints, so the
// two cannot say different things. The money a side sees is its own: the brand sees the price, the VAT and what it pays, the
// creator the fee and the payout; an admin sees both.

export type ContractRow = { kind: "row"; label: string; value: string } | { kind: "pending"; text: string };

export type ContractView = {
  rows: ContractRow[];
  // Free text of the briefing, which is longer than a line.
  notes: { label: string; value: string }[];
};

export function contractView(args: {
  terms: DealTerms;
  snapshot: TaxSnapshot | null;
  viewer: "STARTUP" | "CREATOR" | "ADMIN";
  // The figures as they stand now: a side that went Pro since the offer moved the fee down.
  payoutCents: number;
  feeCents: number;
  u: UiText;
}): ContractView {
  const { terms, snapshot, viewer, payoutCents, feeCents, u } = args;
  const rows: ContractRow[] = [];
  const row = (label: string, value: string) => rows.push({ kind: "row", label, value });
  const both = viewer === "ADMIN";

  row(u("contract.price"), formatCents(terms.amountCents));
  if (viewer !== "CREATOR") {
    if (snapshot) {
      row(u("contract.vat", { rate: snapshot.tax.brand.rateBp / 100 }), formatCents(snapshot.tax.brand.vatCents));
      row(both ? `${u("tax.treatment")} (${terms.brandName})` : u("tax.treatment"), u(`tax.${snapshot.tax.brand.treatment}`));
      row(u("contract.total"), formatCents(snapshot.tax.brand.totalCents));
    } else {
      rows.push({ kind: "pending", text: u("contract.vatPending") });
    }
  }
  if (viewer !== "STARTUP") {
    row(u("contract.fee"), `${formatCents(feeCents)} (${Math.round((feeCents / Math.max(terms.amountCents, 1)) * 1000) / 10} %)`);
    row(u("contract.payout"), formatCents(payoutCents));
    if (snapshot) row(both ? `${u("tax.treatment")} (${terms.creatorName})` : u("tax.treatment"), u(`tax.${snapshot.tax.creator.treatment}`));
  }

  const w = terms.workflow;
  const ex = terms.exclusivity;
  const us = terms.usage;
  const channels = us.channels.map((c) => (isUsageChannel(c) ? USAGE_CHANNELS[c].label : c)).join(", ");
  const exScope = [...(ex.categories.length > 0 ? ex.categories : [terms.productCategory]), ...ex.competitors].join(", ");

  row(u("contract.formats"), terms.contentFormats.map((f) => POST_FORMATS[f].label).join(", "));
  row(u("contract.market"), terms.targetMarket);
  row(u("contract.labels"), terms.disclosure.labels.join(" / "));
  if (terms.disclosure.requirePaidPartnershipLabel) row(u("contract.partnershipLabel"), "✓");
  if (terms.requiredHashtags.length > 0) row(u("contract.hashtags"), terms.requiredHashtags.map((t) => `#${t}`).join(" "));
  if (terms.requiredMentions.length > 0) row(u("contract.mentions"), terms.requiredMentions.map((m) => `@${m}`).join(" "));
  row(u("contract.workflow"), w.draftRequired ? u("contract.draftRequired", { days: w.brandReviewDays, rounds: w.maxRevisionRounds }) : u("contract.noDraft"));
  row(
    u("contract.window"),
    w.postingWindowEnd ? `${w.postingWindowStart ? `${w.postingWindowStart} – ` : "… – "}${w.postingWindowEnd}` : u("contract.windowFlexible", { days: 30 }),
  );
  row(u("contract.minLive"), w.minLiveHours >= 48 && w.minLiveHours % 24 === 0 ? u("contract.days", { count: w.minLiveHours / 24 }) : u("contract.hours", { count: w.minLiveHours }));
  row(u("contract.exclusivity"), ex.enabled ? u("contract.exclusivityScope", { scope: exScope, before: ex.daysBefore, after: ex.daysAfter }) : u("contract.exclusivityNone"));
  row(
    u("contract.usage"),
    us.type === "ORGANIC_ONLY"
      ? u("contract.usageOrganic")
      : us.type === "CROSS_POST"
        ? u("contract.usageCross", { days: us.durationDays ?? 0 })
        : u("contract.usagePaid", { days: us.durationDays ?? 0, channels, territory: us.territory, fee: formatCents(us.feeCents ?? 0) }),
  );

  const notes: ContractView["notes"] = [];
  if (terms.talkingPoints) notes.push({ label: u("contract.talkingPoints"), value: terms.talkingPoints });
  if (terms.doNots) notes.push({ label: u("contract.doNots"), value: terms.doNots });
  return { rows, notes };
}
