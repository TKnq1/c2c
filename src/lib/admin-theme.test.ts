import { describe, expect, it } from "vitest";
import { ACCENTS, accentCss, onAccent, parseAccent } from "@/lib/admin-theme";

describe("parseAccent", () => {
  it("keeps a known accent and falls back to blue", () => {
    expect(parseAccent("green")).toBe("green");
    expect(parseAccent("hotpink")).toBe("blue");
    expect(parseAccent(undefined)).toBe("blue");
  });
});

describe("onAccent", () => {
  it("picks the text colour that reads better on the fill", () => {
    expect(onAccent("#0b7d55")).toBe("#ffffff");
    expect(onAccent("#25a874")).toBe("#070707");
    expect(onAccent("#ffffff")).toBe("#070707");
    expect(onAccent("#000000")).toBe("#ffffff");
  });
});

describe("accentCss", () => {
  it("sets light and dark values from the fixed table only", () => {
    const css = accentCss("violet");
    expect(css).toContain(`--accent:${ACCENTS.violet.light}`);
    expect(css).toContain(`.dark .admin-shell{--accent:${ACCENTS.violet.dark}`);
  });
});
