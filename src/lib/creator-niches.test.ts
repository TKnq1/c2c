import { describe, expect, it } from "vitest";
import { creatorNicheColumns } from "@/lib/creator-niches";

describe("creatorNicheColumns", () => {
  it("keeps the deprecated single niche as the first pick", () => {
    expect(creatorNicheColumns(["Fitness", "Beauty", "Food"])).toEqual({
      niches: ["Fitness", "Beauty", "Food"],
      niche: "Fitness",
    });
  });

  it("falls back to the empty placeholder without picks", () => {
    expect(creatorNicheColumns([])).toEqual({ niches: [], niche: "" });
  });
});
