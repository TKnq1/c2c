import { describe, expect, it } from "vitest";
import { findAnomalies } from "@/lib/admin-anomalies";

const flat = (n: number, length = 15) => Array.from({ length }, () => n);
const none = { current: 0, before: 0 };

describe("findAnomalies", () => {
  it("says nothing on an ordinary day", () => {
    expect(findAnomalies({ signups: flat(4), requests: flat(3), active: { current: 20, before: 22 } })).toEqual([]);
  });

  it("notices a day far below the usual", () => {
    const signups = [...flat(5, 14), 1];
    const found = findAnomalies({ signups, requests: flat(0), active: none });
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ key: "signups", tone: "down" });
    expect(found[0].text).toBe("Gestern 1 Anmeldung, sonst im Schnitt 5 am Tag");
    expect(findAnomalies({ signups: [...flat(5, 14), 0], requests: flat(0), active: none })[0].text).toContain("keine Anmeldungen");
  });

  it("notices a spike, but only a real one", () => {
    expect(findAnomalies({ signups: [...flat(2, 14), 9], requests: flat(0), active: none })[0]).toMatchObject({ tone: "up" });
    // Three times nothing much is still not much.
    expect(findAnomalies({ signups: [...flat(1, 14), 3], requests: flat(0), active: none })).toEqual([]);
  });

  it("does not judge a quiet product by a single day", () => {
    expect(findAnomalies({ signups: [...flat(1, 14), 0], requests: flat(0), active: none })).toEqual([]);
  });

  it("compares active people week on week once there are enough of them", () => {
    expect(findAnomalies({ signups: flat(0), requests: flat(0), active: { current: 6, before: 20 } })[0]).toMatchObject({ key: "active", tone: "down" });
    expect(findAnomalies({ signups: flat(0), requests: flat(0), active: { current: 2, before: 4 } })).toEqual([]);
    expect(findAnomalies({ signups: flat(0), requests: flat(0), active: { current: 30, before: 10 } })[0]).toMatchObject({ tone: "up" });
  });

  it("needs two weeks of history", () => {
    expect(findAnomalies({ signups: [5, 0], requests: [], active: none })).toEqual([]);
  });
});
