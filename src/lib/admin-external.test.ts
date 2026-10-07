import { describe, expect, it } from "vitest";
import { parseSentryIssues, sentryApiHost } from "@/lib/admin-external";

describe("sentryApiHost", () => {
  it("takes the region host from the ingest host of the DSN", () => {
    expect(sentryApiHost("https://abc@o123.ingest.de.sentry.io/456")).toBe("de.sentry.io");
    expect(sentryApiHost("https://abc@o123.ingest.sentry.io/456")).toBe("sentry.io");
    expect(sentryApiHost("https://abc@sentry.example.com/2")).toBe("sentry.example.com");
    expect(sentryApiHost("not a url")).toBeNull();
  });
});

describe("parseSentryIssues", () => {
  it("keeps the fields the page shows and drops rows without an id or title", () => {
    const issues = parseSentryIssues([
      { id: "1", title: "TypeError: x", culprit: "app/page", count: "42", userCount: 3, lastSeen: "2026-10-07T10:00:00Z", level: "error", permalink: "https://sentry.io/issues/1/" },
      { title: "no id" },
      { id: "2", title: "Other", permalink: "javascript:alert(1)" },
    ]);
    expect(issues).toHaveLength(2);
    expect(issues[0]).toMatchObject({ id: "1", count: 42, users: 3, link: "https://sentry.io/issues/1/" });
    expect(issues[1].link).toBe("");
  });

  it("returns nothing for an answer that is not a list", () => {
    expect(parseSentryIssues({ detail: "Invalid token" })).toEqual([]);
  });
});
