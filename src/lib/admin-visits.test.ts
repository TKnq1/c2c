import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

import { visitRows } from "@/lib/admin-visits";

describe("visitRows", () => {
  it("orders by visits, shares them out and matches sign-ups by the same key", () => {
    const rows = visitRows(
      [
        { key: "google.com", views: 60 },
        { key: "instagram", views: 40 },
      ],
      new Map([["instagram", 4]]),
    );
    expect(rows.map((r) => r.key)).toEqual(["google.com", "instagram"]);
    expect(rows[0]).toMatchObject({ share: 0.6, signups: 0, rate: null });
    expect(rows[1]).toMatchObject({ share: 0.4, signups: 4, rate: 0.1 });
  });

  it("handles no visits", () => {
    expect(visitRows([], new Map())).toEqual([]);
  });
});
