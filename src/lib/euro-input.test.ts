import { describe, expect, it } from "vitest";
import { parseEuroInput } from "@/lib/euro-input";

describe("parseEuroInput", () => {
  it("reads German and English notation", () => {
    expect(parseEuroInput("5.600")).toBe(5600);
    expect(parseEuroInput("1.234.567")).toBe(1234567);
    expect(parseEuroInput("5.600,50")).toBe(5600.5);
    expect(parseEuroInput("12,5")).toBe(12.5);
    expect(parseEuroInput("1234.56")).toBe(1234.56);
    expect(parseEuroInput("1.5")).toBe(1.5);
    expect(parseEuroInput("20")).toBe(20);
    expect(parseEuroInput(" 15,00 € ")).toBe(15);
  });

  it("gives NaN for empty or unreadable input", () => {
    expect(parseEuroInput("")).toBeNaN();
    expect(parseEuroInput("abc")).toBeNaN();
  });
});
