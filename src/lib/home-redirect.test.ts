import { describe, expect, it } from "vitest";
import { loginUrlFor, safeReturnPath, signedInStartTarget } from "@/lib/home-redirect";

describe("safeReturnPath", () => {
  it("accepts paths inside the admin area and the app", () => {
    expect(safeReturnPath("/admin")).toBe("/admin");
    expect(safeReturnPath("/admin/geld")).toBe("/admin/geld");
    expect(safeReturnPath("/admin?z=30")).toBe("/admin?z=30");
    expect(safeReturnPath("/dashboard/startup")).toBe("/dashboard/startup");
  });

  it("refuses anything that could leave the site or is not a plain path", () => {
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "/admin/../login", "/adminx", "/login", "javascript:alert(1)", "/admin//x", "", "/admin%0d%0aSet-Cookie:x", 42, null, undefined]) {
      expect(safeReturnPath(bad)).toBeNull();
    }
    expect(safeReturnPath("/admin/" + "a".repeat(300))).toBeNull();
  });
});

describe("loginUrlFor", () => {
  it("remembers the admin page that was asked for", () => {
    expect(loginUrlFor("/admin", "")).toBe("/login?next=%2Fadmin");
    expect(loginUrlFor("/admin/geld", "?z=30")).toBe("/login?next=%2Fadmin%2Fgeld%3Fz%3D30");
  });

  it("sends other pages to a plain login", () => {
    expect(loginUrlFor("/dashboard/messages", "")).toBe("/login");
    expect(loginUrlFor("/admin/%", "")).toBe("/login?next=%2Fadmin%2F%25");
  });
});

describe("signedInStartTarget", () => {
  const admin = { role: "ADMIN" as const };
  const brandAdmin = { role: "STARTUP" as const, isAdmin: true };
  const brand = { role: "STARTUP" as const, isAdmin: false };

  it("goes to the page the sign-in was for", () => {
    expect(signedInStartTarget({ pathname: "/login", user: brandAdmin, homeCookie: undefined, next: "/admin/geld" })).toBe("/admin/geld");
  });

  it("opens an admin who also has an account in the area they used last", () => {
    expect(signedInStartTarget({ pathname: "/login", user: brandAdmin, homeCookie: "admin", next: null })).toBe("/admin");
    expect(signedInStartTarget({ pathname: "/login", user: brandAdmin, homeCookie: "app", next: null })).toBe("/dashboard");
    expect(signedInStartTarget({ pathname: "/login", user: admin, homeCookie: undefined, next: null })).toBe("/dashboard");
  });

  it("never sends an ordinary user to the admin area, and leaves the landing page alone", () => {
    expect(signedInStartTarget({ pathname: "/login", user: brand, homeCookie: "admin", next: null })).toBe("/dashboard");
    expect(signedInStartTarget({ pathname: "/", user: brandAdmin, homeCookie: "admin", next: null })).toBe("/dashboard");
  });
});
