import { describe, expect, it } from "vitest";
import { parsePostUrl, urlFitsFormat } from "@/lib/social/url";

function parsed(raw: string) {
  const result = parsePostUrl(raw);
  if (!result.ok) throw new Error(`expected ${raw} to parse, got ${result.code}`);
  return result.post;
}

describe("parsePostUrl", () => {
  it("reads Instagram reels and posts and rebuilds the canonical address", () => {
    expect(parsed("https://www.instagram.com/reel/C8aBcDeFgHi/?utm_source=ig_web_copy_link&igsh=abc")).toMatchObject({
      platform: "Instagram",
      kind: "reel",
      externalId: "C8aBcDeFgHi",
      canonicalUrl: "https://www.instagram.com/reel/C8aBcDeFgHi/",
    });
    expect(parsed("instagram.com/p/C8aBcDeFgHi")).toMatchObject({ kind: "post", canonicalUrl: "https://www.instagram.com/p/C8aBcDeFgHi/" });
    expect(parsed("https://www.instagram.com/glowco/reel/C8aBcDeFgHi/")).toMatchObject({ kind: "reel", handle: "glowco" });
  });

  it("reads Instagram stories", () => {
    expect(parsed("https://www.instagram.com/stories/mia.summers/3412345678901234567/")).toMatchObject({
      kind: "story",
      handle: "mia.summers",
      externalId: "3412345678901234567",
    });
  });

  it("reads TikTok videos and photo posts", () => {
    expect(parsed("https://www.tiktok.com/@mia.summers/video/7412345678901234567?is_from_webapp=1")).toMatchObject({
      platform: "TikTok",
      handle: "mia.summers",
      externalId: "7412345678901234567",
      canonicalUrl: "https://www.tiktok.com/@mia.summers/video/7412345678901234567",
    });
    expect(parsed("https://www.tiktok.com/@mia/photo/7412345678901234567").canonicalUrl).toContain("/photo/");
  });

  it("reads the YouTube address forms", () => {
    const canonical = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
    expect(parsed("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12s").canonicalUrl).toBe(canonical);
    expect(parsed("https://youtu.be/dQw4w9WgXcQ?si=xyz").canonicalUrl).toBe(canonical);
    expect(parsed("https://m.youtube.com/watch?v=dQw4w9WgXcQ").canonicalUrl).toBe(canonical);
    expect(parsed("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toMatchObject({ kind: "short", canonicalUrl: "https://www.youtube.com/shorts/dQw4w9WgXcQ" });
  });

  it("refuses share and short links instead of following redirects", () => {
    expect(parsePostUrl("https://vm.tiktok.com/ZMabc123/")).toEqual({ ok: false, code: "POST_URL_SHORT_LINK" });
    expect(parsePostUrl("https://www.instagram.com/share/reel/BAbc123/")).toEqual({ ok: false, code: "POST_URL_SHORT_LINK" });
  });

  it("refuses other hosts, look-alike hosts and addresses with credentials or ports", () => {
    expect(parsePostUrl("https://example.com/reel/C8aBcDeFgHi")).toEqual({ ok: false, code: "POST_URL_HOST_UNSUPPORTED" });
    expect(parsePostUrl("https://instagram.com.evil.example/reel/C8aBcDeFgHi")).toEqual({ ok: false, code: "POST_URL_HOST_UNSUPPORTED" });
    expect(parsePostUrl("https://user:pw@www.instagram.com/reel/C8aBcDeFgHi")).toEqual({ ok: false, code: "POST_URL_INVALID" });
    expect(parsePostUrl("https://www.instagram.com:8443/reel/C8aBcDeFgHi")).toEqual({ ok: false, code: "POST_URL_INVALID" });
    expect(parsePostUrl("javascript:alert(1)")).toEqual({ ok: false, code: "POST_URL_INVALID" });
    expect(parsePostUrl("ftp://www.instagram.com/reel/C8aBcDeFgHi")).toEqual({ ok: false, code: "POST_URL_INVALID" });
  });

  it("refuses profile pages and malformed ids", () => {
    expect(parsePostUrl("https://www.instagram.com/glowco/")).toEqual({ ok: false, code: "POST_URL_INVALID" });
    expect(parsePostUrl("https://www.tiktok.com/@glowco")).toEqual({ ok: false, code: "POST_URL_INVALID" });
    expect(parsePostUrl("https://www.youtube.com/watch?v=short")).toEqual({ ok: false, code: "POST_URL_INVALID" });
    expect(parsePostUrl("")).toEqual({ ok: false, code: "POST_URL_INVALID" });
    expect(parsePostUrl("x".repeat(600))).toEqual({ ok: false, code: "POST_URL_INVALID" });
  });
});

describe("urlFitsFormat", () => {
  it("matches the platform and kind of link to the booked format", () => {
    const reel = parsed("https://www.instagram.com/reel/C8aBcDeFgHi/");
    const story = parsed("https://www.instagram.com/stories/mia/3412345678901234567/");
    const tiktok = parsed("https://www.tiktok.com/@mia/video/7412345678901234567");
    const video = parsed("https://youtu.be/dQw4w9WgXcQ");
    const short = parsed("https://www.youtube.com/shorts/dQw4w9WgXcQ");

    expect(urlFitsFormat(reel, "INSTAGRAM_REEL")).toBe(true);
    expect(urlFitsFormat(reel, "INSTAGRAM_STORY")).toBe(false);
    expect(urlFitsFormat(story, "INSTAGRAM_STORY")).toBe(true);
    expect(urlFitsFormat(tiktok, "INSTAGRAM_REEL")).toBe(false);
    expect(urlFitsFormat(tiktok, "TIKTOK_VIDEO")).toBe(true);
    expect(urlFitsFormat(video, "YOUTUBE_INTEGRATION")).toBe(true);
    expect(urlFitsFormat(video, "YOUTUBE_SHORT")).toBe(true);
    expect(urlFitsFormat(short, "YOUTUBE_DEDICATED")).toBe(false);
    expect(urlFitsFormat(short, "YOUTUBE_SHORT")).toBe(true);
  });
});
