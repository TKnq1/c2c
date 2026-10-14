import type { ParsedPostUrl } from "@/lib/social/url";

// Asks the platforms whether a post is still there. Only fixed, well-known endpoints are called, and the only part that
// comes from outside is the canonical address built by parsePostUrl (rebuilt from recognised pieces, then URL-encoded
// into a query parameter), so a creator cannot point the server anywhere else.

export type LiveMetrics = { views?: number; likes?: number; comments?: number };

export type LiveCheck =
  | { state: "LIVE"; caption: string | null; metrics: LiveMetrics | null; source: "OEMBED" | "API" }
  // The platform says the post does not exist (any more) or is not public.
  | { state: "GONE"; reason: string }
  // No answer worth a verdict: outage, rate limit, missing token, an answer we do not understand.
  | { state: "UNKNOWN"; reason: string };

const TIMEOUT_MS = 8_000;
const USER_AGENT = "comtor-post-verifier/1.0 (+https://comtor.app)";

type Env = Record<string, string | undefined>;

async function getJson(url: string, fetchImpl: typeof fetch): Promise<{ status: number; body: unknown } | null> {
  try {
    const response = await fetchImpl(url, {
      headers: { accept: "application/json", "user-agent": USER_AGENT },
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    const body = await response.json().catch(() => null);
    return { status: response.status, body };
  } catch {
    return null;
  }
}

function asNumber(value: unknown): number | undefined {
  const n = typeof value === "string" ? Number(value) : value;
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? Math.trunc(n) : undefined;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

async function checkYouTube(post: ParsedPostUrl, env: Env, fetchImpl: typeof fetch): Promise<LiveCheck> {
  const key = env.YOUTUBE_API_KEY?.trim();
  if (key) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,status&id=${encodeURIComponent(post.externalId)}&key=${encodeURIComponent(key)}`;
    const result = await getJson(url, fetchImpl);
    if (result && result.status === 200 && result.body && typeof result.body === "object") {
      const items = (result.body as { items?: unknown }).items;
      if (!Array.isArray(items) || items.length === 0) return { state: "GONE", reason: "not_found" };
      const item = items[0] as {
        snippet?: { description?: unknown; title?: unknown };
        statistics?: Record<string, unknown>;
        status?: { privacyStatus?: unknown };
      };
      if (item.status?.privacyStatus && item.status.privacyStatus !== "public") return { state: "GONE", reason: "not_public" };
      return {
        state: "LIVE",
        caption: str(item.snippet?.description) ?? str(item.snippet?.title),
        metrics: {
          views: asNumber(item.statistics?.viewCount),
          likes: asNumber(item.statistics?.likeCount),
          comments: asNumber(item.statistics?.commentCount),
        },
        source: "API",
      };
    }
    // Quota or key problems fall through to the key-less check below.
  }
  const result = await getJson(`https://www.youtube.com/oembed?url=${encodeURIComponent(post.canonicalUrl)}&format=json`, fetchImpl);
  if (!result) return { state: "UNKNOWN", reason: "network" };
  if (result.status === 200) {
    const title = result.body && typeof result.body === "object" ? str((result.body as { title?: unknown }).title) : null;
    return { state: "LIVE", caption: title, metrics: null, source: "OEMBED" };
  }
  // 401 is also what a video with embedding switched off answers, so only "not found" counts as gone.
  if (result.status === 404) return { state: "GONE", reason: "not_found" };
  return { state: "UNKNOWN", reason: `http_${result.status}` };
}

async function checkTikTok(post: ParsedPostUrl, fetchImpl: typeof fetch): Promise<LiveCheck> {
  const result = await getJson(`https://www.tiktok.com/oembed?url=${encodeURIComponent(post.canonicalUrl)}`, fetchImpl);
  if (!result) return { state: "UNKNOWN", reason: "network" };
  if (result.status === 200) {
    const title = result.body && typeof result.body === "object" ? str((result.body as { title?: unknown }).title) : null;
    return { state: "LIVE", caption: title, metrics: null, source: "OEMBED" };
  }
  if (result.status === 400 || result.status === 404) return { state: "GONE", reason: "not_found" };
  return { state: "UNKNOWN", reason: `http_${result.status}` };
}

async function checkInstagram(post: ParsedPostUrl, env: Env, fetchImpl: typeof fetch): Promise<LiveCheck> {
  const token = env.META_OEMBED_TOKEN?.trim();
  if (!token) return { state: "UNKNOWN", reason: "no_token" };
  const url = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(post.canonicalUrl)}&omitscript=true&access_token=${encodeURIComponent(token)}`;
  const result = await getJson(url, fetchImpl);
  if (!result) return { state: "UNKNOWN", reason: "network" };
  if (result.status === 200) {
    const title = result.body && typeof result.body === "object" ? str((result.body as { title?: unknown }).title) : null;
    return { state: "LIVE", caption: title, metrics: null, source: "OEMBED" };
  }
  const code = result.body && typeof result.body === "object" ? (result.body as { error?: { code?: unknown } }).error?.code : undefined;
  // 100: the URL does not point to a public post. 190 and friends are about our token and say nothing about the post.
  if (result.status === 400 && code === 100) return { state: "GONE", reason: "not_found" };
  return { state: "UNKNOWN", reason: `http_${result.status}` };
}

export async function checkPostLive(post: ParsedPostUrl, env: Env = process.env, fetchImpl: typeof fetch = fetch): Promise<LiveCheck> {
  switch (post.platform) {
    case "YouTube":
      return checkYouTube(post, env, fetchImpl);
    case "TikTok":
      return checkTikTok(post, fetchImpl);
    case "Instagram":
      return checkInstagram(post, env, fetchImpl);
  }
}
