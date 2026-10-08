import { describe, expect, it } from "vitest";
import { berlinHour, daySummary, greetingFor, shortAgo } from "@/lib/admin-today";

describe("daySummary", () => {
  it("counts what came in and what waits", () => {
    expect(daySummary({ newUsers: 5, payments: 1, waiting: 3 })).toEqual({
      signups: "5 neue Anmeldungen",
      payments: "1 Zahlung",
      waiting: { count: "3 Dinge", rest: "warten auf dich" },
    });
  });

  it("says so when there is nothing", () => {
    expect(daySummary({ newUsers: 0, payments: 0, waiting: 0 })).toEqual({
      signups: "keine neue Anmeldung",
      payments: "keine Zahlung",
      waiting: { count: "Nichts", rest: "wartet auf dich" },
    });
  });

  it("uses the singular for one", () => {
    const s = daySummary({ newUsers: 1, payments: 2, waiting: 1 });
    expect(s.signups).toBe("1 neue Anmeldung");
    expect(s.payments).toBe("2 Zahlungen");
    expect(s.waiting).toEqual({ count: "1 Ding", rest: "wartet auf dich" });
  });
});

describe("shortAgo", () => {
  const now = new Date("2026-10-08T09:41:00+02:00");

  it("counts minutes and hours within the day", () => {
    expect(shortAgo(new Date("2026-10-08T09:41:00+02:00"), now)).toBe("gerade eben");
    expect(shortAgo(new Date("2026-10-08T09:29:00+02:00"), now)).toBe("vor 12 Min");
    expect(shortAgo(new Date("2026-10-08T06:00:00+02:00"), now)).toBe("vor 3 Std");
  });

  it("calls yesterday by its calendar day, not by 24 hours", () => {
    expect(shortAgo(new Date("2026-10-07T22:00:00+02:00"), now)).toBe("gestern");
    expect(shortAgo(new Date("2026-10-07T08:00:00+02:00"), now)).toBe("gestern");
  });

  it("names the weekday inside a week and the date after that", () => {
    expect(shortAgo(new Date("2026-10-05T06:00:00+02:00"), now)).toBe("Mo");
    expect(shortAgo(new Date("2026-10-01T06:00:00+02:00"), now)).toBe("1. Okt.");
  });
});

describe("berlinHour and greetingFor", () => {
  it("reads the hour on the clock in Berlin, summer and winter time", () => {
    expect(berlinHour(new Date("2026-10-08T09:41:00+02:00"))).toBe(9);
    expect(berlinHour(new Date("2026-10-08T12:25:00+02:00"))).toBe(12);
    expect(berlinHour(new Date("2026-01-08T00:05:00+01:00"))).toBe(0);
    expect(berlinHour(new Date("2026-01-08T23:59:00+01:00"))).toBe(23);
  });

  it("greets by the time of day", () => {
    expect(greetingFor(5)).toBe("Guten Morgen");
    expect(greetingFor(10)).toBe("Guten Morgen");
    expect(greetingFor(11)).toBe("Guten Tag");
    expect(greetingFor(17)).toBe("Guten Tag");
    expect(greetingFor(18)).toBe("Guten Abend");
    expect(greetingFor(0)).toBe("Guten Morgen");
  });
});
