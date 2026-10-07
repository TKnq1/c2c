import { describe, expect, it } from "vitest";
import { isBot, isPrefetch, visitSource } from "@/lib/visit-count";

const headers = (values: Record<string, string>) => ({ get: (name: string) => values[name.toLowerCase()] ?? null });

describe("isBot", () => {
  it("drops crawlers, previews and requests without a browser string", () => {
    expect(isBot(null)).toBe(true);
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe(true);
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot("Slackbot-LinkExpanding 1.0")).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1")).toBe(false);
    expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126.0 Safari/537.36")).toBe(false);
  });
});

describe("isPrefetch", () => {
  it("recognises a link being warmed up", () => {
    expect(isPrefetch(headers({ purpose: "prefetch" }))).toBe(true);
    expect(isPrefetch(headers({ "sec-purpose": "prefetch;prerender" }))).toBe(true);
    expect(isPrefetch(headers({ "next-router-prefetch": "1" }))).toBe(true);
    expect(isPrefetch(headers({}))).toBe(false);
  });
});

describe("visitSource", () => {
  const ownHost = "www.comtor.app";

  it("prefers the campaign's own source, cleaned", () => {
    expect(visitSource({ utmSource: "Instagram", referer: "https://l.instagram.com/?u=secret", ownHost })).toBe("instagram");
  });

  it("keeps only the name of the referring site", () => {
    expect(visitSource({ referer: "https://www.google.com/search?q=ugc+plattform", ownHost })).toBe("google.com");
    expect(visitSource({ referer: "https://t.co/abc?x=1", ownHost })).toBe("t.co");
  });

  it("calls its own pages intern and no referrer direct", () => {
    expect(visitSource({ referer: "https://comtor.app/signup", ownHost })).toBe("intern");
    expect(visitSource({ ownHost })).toBe("direkt");
    expect(visitSource({ referer: "not a url", ownHost })).toBe("direkt");
  });
});
