import { describe, expect, it } from "vitest";
import { contractView } from "@/lib/deals/contract-rows";
import { snapshotFixture, termsFixture } from "@/lib/deals/contract-fixture.test-helper";
import { uiText } from "@/lib/deals/ui-copy";
import { formatCents } from "@/lib/format";

const de = uiText("de");
const en = uiText("en");
const rowsOf = (view: ReturnType<typeof contractView>) => Object.fromEntries(view.rows.flatMap((r) => (r.kind === "row" ? [[r.label, r.value]] : [])));

const base = { terms: termsFixture(), snapshot: snapshotFixture(), payoutCents: 90_000, feeCents: 10_000, locale: "de" as const };

describe("contractView", () => {
  it("shows the brand its price, the VAT and what it pays, and not the fee or the payout", () => {
    const rows = rowsOf(contractView({ ...base, viewer: "STARTUP", u: de }));
    expect(rows["Preis (netto)"]).toBe(formatCents(100_000));
    expect(rows["USt. 19 %"]).toBe(formatCents(19_000));
    expect(rows["Marke zahlt"]).toBe(formatCents(119_000));
    expect(rows["Steuerbehandlung"]).toBe("Deutsche Umsatzsteuer");
    expect(rows["comtor-Gebühr"]).toBeUndefined();
    expect(rows["Creator erhält"]).toBeUndefined();
  });

  it("shows the creator the fee and the payout, and not the VAT the brand pays", () => {
    const rows = rowsOf(contractView({ ...base, viewer: "CREATOR", u: de }));
    expect(rows["comtor-Gebühr"]).toBe(`${formatCents(10_000)} (10 %)`);
    expect(rows["Creator erhält"]).toBe(formatCents(90_000));
    expect(rows["Steuerbehandlung"]).toBe("Kleinunternehmer, keine USt.");
    expect(rows["Marke zahlt"]).toBeUndefined();
  });

  it("shows an admin both, with the tax treatment of each side named", () => {
    const rows = rowsOf(contractView({ ...base, viewer: "ADMIN", u: de }));
    expect(rows["Marke zahlt"]).toBe(formatCents(119_000));
    expect(rows["Creator erhält"]).toBe(formatCents(90_000));
    expect(rows["Steuerbehandlung (Glow)"]).toBe("Deutsche Umsatzsteuer");
    expect(rows["Steuerbehandlung (Mia)"]).toBe("Kleinunternehmer, keine USt.");
  });

  it("says the VAT is not fixed yet until both sides have confirmed", () => {
    const view = contractView({ ...base, snapshot: null, viewer: "STARTUP", u: de });
    expect(view.rows).toContainEqual({ kind: "pending", text: de("contract.vatPending") });
    expect(Object.keys(rowsOf(view))).not.toContain("Marke zahlt");
  });

  it("uses the figures as they stand now, so a fee that went down shows", () => {
    const rows = rowsOf(contractView({ ...base, viewer: "CREATOR", payoutCents: 97_000, feeCents: 3_000, u: de }));
    expect(rows["comtor-Gebühr"]).toBe(`${formatCents(3_000)} (3 %)`);
    expect(rows["Creator erhält"]).toBe(formatCents(97_000));
  });

  it("marks the short form: price, what is paid or paid out, formats, labelling, window and usage, and nothing about tax or fees", () => {
    const core = (viewer: "STARTUP" | "CREATOR") =>
      contractView({ ...base, viewer, u: de }).rows.flatMap((r) => (r.kind === "row" && r.core ? [r.label] : []));
    expect(core("STARTUP")).toEqual(["Preis (netto)", "Marke zahlt", "Content", "Werbekennzeichnung", "Posting-Fenster", "Nutzungsrechte"]);
    expect(core("CREATOR")).toEqual(["Preis (netto)", "Creator erhält", "Content", "Werbekennzeichnung", "Posting-Fenster", "Nutzungsrechte"]);
  });

  it("lists the content, the labels, the workflow, the window and how long it stays live", () => {
    const rows = rowsOf(contractView({ ...base, viewer: "STARTUP", u: de }));
    expect(rows["Content"]).toBe("TikTok Video");
    expect(rows["Werbemarkt"]).toBe("DE");
    expect(rows["Werbekennzeichnung"]).toBe("Werbung / Anzeige");
    expect(rows["Partnerschafts-Label der Plattform erforderlich"]).toBe("✓");
    expect(rows["Pflicht-Hashtags"]).toBe("#glowco #herbst");
    expect(rows["Pflicht-Erwähnungen"]).toBe("@glowco");
    expect(rows["Ablauf"]).toBe("Erst Entwurf, 3 Tage Prüfzeit, 2 Korrekturrunden");
    expect(rows["Posting-Fenster"]).toBe("20. Okt. 2026 – 20. Nov. 2026");
    expect(rows["Bleibt online"]).toBe("24 Stunden");
    expect(rows["Exklusivität"]).toBe("Keine");
    expect(rows["Nutzungsrechte"]).toBe("Nur Posting auf dem Kanal des Creators");
  });

  it("speaks English to an English reader", () => {
    const rows = rowsOf(contractView({ ...base, viewer: "STARTUP", u: en }));
    expect(rows["Price (net)"]).toBe(formatCents(100_000));
    expect(rows["Stays live"]).toBe("24 hours");
  });

  it("leaves out what is not part of the contract", () => {
    const view = contractView({
      ...base,
      terms: termsFixture({ requiredHashtags: [], requiredMentions: [], talkingPoints: null, doNots: null, disclosure: { labels: ["Werbung"], requirePaidPartnershipLabel: false } }),
      viewer: "STARTUP",
      u: de,
    });
    const rows = rowsOf(view);
    expect(rows["Pflicht-Hashtags"]).toBeUndefined();
    expect(rows["Pflicht-Erwähnungen"]).toBeUndefined();
    expect(rows["Partnerschafts-Label der Plattform erforderlich"]).toBeUndefined();
    expect(view.notes).toEqual([]);
  });

  it("puts the free text of the briefing in the notes", () => {
    const view = contractView({ ...base, viewer: "STARTUP", u: de });
    expect(view.notes).toEqual([
      { label: "Kernbotschaften", value: "Show the texture and mention the code GLOW10." },
      { label: "Bitte vermeiden", value: "No claims about medical effects." },
    ]);
  });

  it("describes exclusivity, a flexible window and the kinds of usage rights", () => {
    const exclusive = rowsOf(
      contractView({ ...base, terms: termsFixture({ exclusivity: { enabled: true, categories: [], competitors: ["Rival"], daysBefore: 7, daysAfter: 30 } }), viewer: "STARTUP", u: de }),
    );
    expect(exclusive["Exklusivität"]).toBe("Cosmetics, Rival: 7 Tage vor, 30 Tage nach Veröffentlichung");

    const flexible = rowsOf(contractView({ ...base, terms: termsFixture({ workflow: { ...termsFixture().workflow, postingWindowEnd: null, postingWindowStart: null, minLiveHours: 168 } }), viewer: "STARTUP", u: de }));
    expect(flexible["Posting-Fenster"]).toBe("innerhalb von 30 Tagen nach Zahlung");
    expect(flexible["Bleibt online"]).toBe("7 Tage");

    const untilOnly = rowsOf(contractView({ ...base, terms: termsFixture({ workflow: { ...termsFixture().workflow, postingWindowStart: null, postingWindowEnd: "2026-11-07" } }), viewer: "STARTUP", u: de }));
    expect(untilOnly["Posting-Fenster"]).toBe("bis 7. Nov. 2026");
    const english = rowsOf(contractView({ ...base, terms: termsFixture({ workflow: { ...termsFixture().workflow, postingWindowStart: null, postingWindowEnd: "2026-11-07" } }), viewer: "STARTUP", u: en, locale: "en" }));
    expect(english["Posting window"]).toBe("until 7 Nov 2026");

    const cross = rowsOf(contractView({ ...base, terms: termsFixture({ usage: { type: "CROSS_POST", channels: [], durationDays: 30, feeCents: null, territory: "EU" } }), viewer: "STARTUP", u: de }));
    expect(cross["Nutzungsrechte"]).toBe("Repost auf den Kanälen der Marke für 30 Tage");

    const paid = rowsOf(contractView({ ...base, terms: termsFixture({ usage: { type: "PAID_ADS", channels: ["TIKTOK_SPARK_ADS"], durationDays: 60, feeCents: 5_000, territory: "EU" } }), viewer: "STARTUP", u: de }));
    expect(paid["Nutzungsrechte"]).toContain("Bezahlte Ads für 60 Tage");
    expect(paid["Nutzungsrechte"]).toContain(formatCents(5_000));
  });
});
