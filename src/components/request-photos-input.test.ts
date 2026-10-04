import { describe, expect, it } from "vitest";
import { reorderPhotos } from "./request-photos-input";

describe("reorderPhotos", () => {
  const photos = ["red", "blue", "green"];

  it("moves a photo to a new index", () => {
    expect(reorderPhotos(photos, 2, 0)).toEqual(["green", "red", "blue"]);
    expect(reorderPhotos(photos, 0, 2)).toEqual(["blue", "green", "red"]);
  });

  it("leaves the list alone when the move goes nowhere", () => {
    expect(reorderPhotos(photos, 1, 1)).toBe(photos);
    expect(reorderPhotos(photos, -1, 0)).toBe(photos);
    expect(reorderPhotos(photos, 0, 3)).toBe(photos);
  });
});
