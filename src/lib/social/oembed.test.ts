import { describe, expect, it, vi } from "vitest";
import { checkPostLive } from "@/lib/social/oembed";
import { parsePostUrl } from "@/lib/social/url";

function post(raw: string) {
  const result = parsePostUrl(raw);
  if (!result.ok) throw new Error(result.code);
  return result.post;
}

function respond(status: number, body: unknown): typeof fetch {
  return vi.fn(async () => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } })) as unknown as typeof fetch;
}

const youtube = post("https://youtu.be/dQw4w9WgXcQ");
const tiktok = post("https://www.tiktok.com/@mia/video/7412345678901234567");
const instagram = post("https://www.instagram.com/reel/C8aBcDeFgHi/");

describe("checkPostLive", () => {
  it("asks the platform's own endpoint and nothing else", async () => {
    const fetchImpl = respond(200, { title: "Werbung | Review" });
    await checkPostLive(youtube, {}, fetchImpl);
    await checkPostLive(tiktok, {}, fetchImpl);
    const urls = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls.map((c) => new URL(String(c[0])).host);
    expect(urls).toEqual(["www.youtube.com", "www.tiktok.com"]);
  });

  it("reports a live TikTok with its caption", async () => {
    expect(await checkPostLive(tiktok, {}, respond(200, { title: "Werbung | Meine Creme" }))).toEqual({
      state: "LIVE",
      caption: "Werbung | Meine Creme",
      metrics: null,
      source: "OEMBED",
    });
  });

  it("calls a 400 from TikTok and a 404 from YouTube gone, but never a 401", async () => {
    expect(await checkPostLive(tiktok, {}, respond(400, {}))).toEqual({ state: "GONE", reason: "not_found" });
    expect(await checkPostLive(youtube, {}, respond(404, {}))).toEqual({ state: "GONE", reason: "not_found" });
    expect(await checkPostLive(youtube, {}, respond(401, {}))).toEqual({ state: "UNKNOWN", reason: "http_401" });
  });

  it("treats outages and network errors as unknown, not as removal", async () => {
    expect((await checkPostLive(tiktok, {}, respond(503, {}))).state).toBe("UNKNOWN");
    const failing = vi.fn(async () => {
      throw new Error("down");
    }) as unknown as typeof fetch;
    expect(await checkPostLive(tiktok, {}, failing)).toEqual({ state: "UNKNOWN", reason: "network" });
  });

  it("reads views, description and privacy from the YouTube API when a key is set", async () => {
    const live = respond(200, {
      items: [{ snippet: { description: "Anzeige: Test" }, statistics: { viewCount: "1200", likeCount: "80", commentCount: "5" }, status: { privacyStatus: "public" } }],
    });
    expect(await checkPostLive(youtube, { YOUTUBE_API_KEY: "k" }, live)).toEqual({
      state: "LIVE",
      caption: "Anzeige: Test",
      metrics: { views: 1200, likes: 80, comments: 5 },
      source: "API",
    });
    expect(await checkPostLive(youtube, { YOUTUBE_API_KEY: "k" }, respond(200, { items: [] }))).toEqual({ state: "GONE", reason: "not_found" });
    expect(
      await checkPostLive(youtube, { YOUTUBE_API_KEY: "k" }, respond(200, { items: [{ status: { privacyStatus: "private" } }] })),
    ).toEqual({ state: "GONE", reason: "not_public" });
  });

  it("cannot judge Instagram without a Meta token", async () => {
    const fetchImpl = respond(200, {});
    expect(await checkPostLive(instagram, {}, fetchImpl)).toEqual({ state: "UNKNOWN", reason: "no_token" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads Instagram's answer when a token is set", async () => {
    expect((await checkPostLive(instagram, { META_OEMBED_TOKEN: "id|secret" }, respond(200, { title: "x" }))).state).toBe("LIVE");
    expect(await checkPostLive(instagram, { META_OEMBED_TOKEN: "id|secret" }, respond(400, { error: { code: 100 } }))).toEqual({ state: "GONE", reason: "not_found" });
    expect((await checkPostLive(instagram, { META_OEMBED_TOKEN: "id|secret" }, respond(400, { error: { code: 190 } }))).state).toBe("UNKNOWN");
  });
});
