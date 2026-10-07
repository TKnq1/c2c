import { describe, expect, it, vi } from "vitest";

// The digest module reads the database elsewhere; here only its pure parts are used.
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/email", () => ({ sendEmail: vi.fn() }));

import { composeDaily, composeWeekly, tileLine } from "@/lib/admin-digest";
import { adminNoticeEmail } from "@/lib/admin-digest-mail";
import type { KpiTileModel } from "@/lib/admin-kpis";

const tile = (over: Partial<KpiTileModel>): KpiTileModel => ({ key: "users", label: "Nutzer", value: "19", hint: "", href: "/admin/wachstum", ...over });

describe("tileLine", () => {
  it("writes the figure and how it moved", () => {
    expect(tileLine(tile({ delta: { amount: 4, label: "diese Woche" } }))).toBe("Nutzer: 19 (+4 diese Woche)");
    expect(tileLine(tile({ label: "Provision", value: "15,00 €", delta: { amount: -500, text: "5,00 €", label: "zur Woche davor" } }))).toBe("Provision: 15,00 € (−5,00 € zur Woche davor)");
    expect(tileLine(tile({ delta: { amount: 0, label: "diese Woche" } }))).toBe("Nutzer: 19 (±0 diese Woche)");
    expect(tileLine(tile({ label: "Reichweite des Geldes", value: "Über 5 Jahre" }))).toBe("Reichweite des Geldes: Über 5 Jahre");
  });
});

describe("composeDaily", () => {
  it("says it is quiet when nothing needs the admin", () => {
    const { title, body } = composeDaily({ tasks: [{ title: "Fixkosten eintragen", priority: "LOW" }], tiles: [tile({})], anomalies: [] });
    expect(title).toBe("Tagesbericht: alles ruhig");
    expect(body).toContain("# Was jetzt ansteht\nNichts Eiliges, nur 1 Kleinigkeit offen.");
    expect(body).not.toContain("Aufgefallen");
  });

  it("lists what needs the admin, the figures and what stands out", () => {
    const { title, body } = composeDaily({
      tasks: [
        { title: "2 offene Meldungen", priority: "HIGH" },
        { title: "AGB prüfen", priority: "MEDIUM" },
        { title: "Fixkosten eintragen", priority: "LOW" },
      ],
      tiles: [tile({ delta: { amount: 4, label: "diese Woche" } })],
      anomalies: [{ key: "signups", tone: "down", text: "Gestern keine Anmeldungen, sonst im Schnitt 3 am Tag" }],
    });
    expect(title).toBe("Tagesbericht: 2 Dinge brauchen dich");
    expect(body).toContain("# Was jetzt ansteht\n2 offene Meldungen\nAGB prüfen");
    expect(body).not.toContain("Fixkosten");
    expect(body).toContain("# Die Zahlen, 7 Tage\nNutzer: 19 (+4 diese Woche)");
    expect(body).toContain("# Aufgefallen\nGestern keine Anmeldungen");
  });
});

describe("composeWeekly", () => {
  it("names the week, the forecast and the open tasks", () => {
    const now = new Date("2026-10-12T06:00:00Z");
    const founding = tile({ key: "founding", label: "Founding-Plätze", value: "18 von 150", hint: "13 von 50 Marken · Bei diesem Tempo am 1. Mai 2027" });
    const { title, body } = composeWeekly({ now, tasks: [{ title: "x", priority: "HIGH" }, { title: "y", priority: "LOW" }], growth: [tile({}), founding], money: [tile({ label: "Provision", value: "0,00 €" })], anomalies: [] });
    expect(title).toBe("Wochenbericht 5. Okt. bis 12. Okt.");
    expect(body).toContain("# Ziel\n13 von 50 Marken · Bei diesem Tempo am 1. Mai 2027");
    expect(body).toContain("# Offen\n2 Aufgaben offen, davon 1 dringend");
  });
});

describe("adminNoticeEmail", () => {
  it("escapes the text, links to the dashboard and marks urgent mail in the subject", () => {
    const mail = adminNoticeEmail({ kind: "URGENT", title: "Streitfall <b>", body: "# Grund\nEr sagt \"nein\" & geht", href: "/admin/moderation" });
    expect(mail.subject).toBe("Dringend: Streitfall <b>");
    expect(mail.html).toContain("Streitfall &lt;b&gt;");
    expect(mail.html).toContain("Er sagt &quot;nein&quot; &amp; geht");
    expect(mail.html).not.toContain("<b>");
    expect(mail.html).toContain("/admin/moderation");
    expect(mail.text).toContain("Grund\nEr sagt \"nein\" & geht");
  });

  it("falls back to the inbox for a link that is not a path on this site", () => {
    expect(adminNoticeEmail({ kind: "DAILY", title: "t", body: "x", href: "https://evil.example" }).html).toContain("/admin/mitteilungen");
  });
});
