import { describe, expect, it } from "vitest";
import { ACTION_NOTICES, EMAIL_NOTICES, NOTICE_SUBJECT, NOTICE_TEXT, noticeSubject, noticeText, type NoticeKey } from "@/lib/deals/notices";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]);

describe("the notices sent by e-mail", () => {
  const keys = Object.keys(NOTICE_SUBJECT) as NoticeKey[];

  it("have a subject in both languages", () => {
    for (const key of keys) {
      expect(NOTICE_SUBJECT[key]?.de.length, key).toBeGreaterThan(5);
      expect(NOTICE_SUBJECT[key]?.en.length, key).toBeGreaterThan(5);
    }
  });

  it("only use placeholders the notice itself fills", () => {
    for (const key of keys) {
      for (const language of ["de", "en"] as const) {
        const known = placeholders(NOTICE_TEXT[key][language]);
        for (const name of placeholders(NOTICE_SUBJECT[key]![language])) expect(known, `${key} (${language}): {${name}}`).toContain(name);
      }
    }
  });

  it("are the ones with a deadline, a cancellation, a dispute or money behind them", () => {
    for (const key of ["reminder_draft_due", "reminder_post_due", "deal_cancelled_refund_brand", "dispute_opened", "chargeback_lost", "payout_blocked", "payout_released_creator"] as NoticeKey[]) {
      expect(EMAIL_NOTICES.has(key), key).toBe(true);
    }
  });

  it("leave the routine steps in the app", () => {
    for (const key of ["draft_submitted", "draft_approved", "post_scheduled", "offer_reconfirmed", "invoice_issued_brand", "invoice_corrected"] as NoticeKey[]) {
      expect(EMAIL_NOTICES.has(key), key).toBe(false);
    }
  });

  it("mark only e-mail notices as asking for something", () => {
    for (const key of ACTION_NOTICES) expect(EMAIL_NOTICES.has(key), key).toBe(true);
  });
});

describe("noticeSubject", () => {
  it("fills the title in the reader's language", () => {
    expect(noticeSubject("reminder_draft_due", "de", { title: "Herbst-Launch" })).toBe("Erinnerung: Dein Entwurf für „Herbst-Launch“ ist fällig");
    expect(noticeSubject("reminder_draft_due", "en", { title: "Autumn launch" })).toBe("Reminder: your draft for “Autumn launch” is due");
  });

  it("falls back to English for the other app languages", () => {
    expect(noticeSubject("dispute_opened", "fr", { title: "X" })).toBe("Deal frozen: “X”");
  });

  it("is null for a notice that stays in the app", () => {
    expect(noticeSubject("draft_submitted", "de", { title: "X" })).toBeNull();
  });
});

describe("the notice catalog", () => {
  it("has the corrected-document notice with both numbers", () => {
    expect(noticeText("invoice_corrected", "de", { title: "Herbst", old: "RE-2026-000001", new: "RE-2026-000003" })).toBe(
      "Der Beleg RE-2026-000001 für „Herbst“ wurde korrigiert: Er ist storniert und durch RE-2026-000003 ersetzt.",
    );
  });
});
