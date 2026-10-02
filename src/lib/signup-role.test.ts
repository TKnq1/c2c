import { describe, expect, it } from "vitest";
import { parseSignupRole } from "@/lib/signup-role";

describe("parseSignupRole", () => {
  it("reads the two sides of the landing page", () => {
    expect(parseSignupRole("creator")).toBe("CREATOR");
    expect(parseSignupRole("brand")).toBe("STARTUP");
  });

  it("takes the plural and any casing", () => {
    expect(parseSignupRole("creators")).toBe("CREATOR");
    expect(parseSignupRole("Brands")).toBe("STARTUP");
  });

  it("uses the first value when the parameter is repeated", () => {
    expect(parseSignupRole(["brand", "creator"])).toBe("STARTUP");
  });

  it("leaves the choice open for anything else, admin included", () => {
    expect(parseSignupRole(undefined)).toBeNull();
    expect(parseSignupRole("")).toBeNull();
    expect(parseSignupRole("admin")).toBeNull();
    expect(parseSignupRole("STARTUP")).toBeNull();
  });
});
