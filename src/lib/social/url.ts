import { POST_FORMATS, type PostFormat, type SocialPlatform } from "@/lib/social/platforms";
import type { IssueCode } from "@/lib/deals/issues";

export type PostLinkKind = "reel" | "post" | "story" | "video" | "short";

export type ParsedPostUrl = {
  platform: SocialPlatform;
  kind: PostLinkKind;
  // Instagram shortcode / story id, TikTok video id, YouTube video id.
  externalId: string;
  handle: string | null;
  // The address rebuilt from the parts that were recognised: this, never the raw input, is stored and fetched.
  canonicalUrl: string;
};

export type ParseResult = { ok: true; post: ParsedPostUrl } | { ok: false; code: IssueCode };

const INSTAGRAM_HOSTS = new Set(["instagram.com", "www.instagram.com", "m.instagram.com", "instagr.am"]);
const TIKTOK_HOSTS = new Set(["tiktok.com", "www.tiktok.com", "m.tiktok.com"]);
const TIKTOK_SHORT_HOSTS = new Set(["vm.tiktok.com", "vt.tiktok.com"]);
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com"]);

const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,40}$/;
const INSTAGRAM_HANDLE = /^[A-Za-z0-9._]{1,30}$/;
const TIKTOK_HANDLE = /^@[A-Za-z0-9._]{1,40}$/;
const TIKTOK_ID = /^\d{8,25}$/;
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;
const STORY_ID = /^\d{5,25}$/;

function ok(post: ParsedPostUrl): ParseResult {
  return { ok: true, post };
}

// Takes what a creator pasted and returns the one post it points to, or why it is not accepted. Nothing here fetches
// anything: the checks that do (oembed.ts) only ever ask the platforms' own endpoints about the canonicalUrl built here.
// Share links ("instagram.com/share/...", "vm.tiktok.com/...") are refused because resolving them would mean following a
// redirect to a place the creator chose.
export function parsePostUrl(raw: string): ParseResult {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 500) return { ok: false, code: "POST_URL_INVALID" };

  let url: URL;
  try {
    url = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return { ok: false, code: "POST_URL_INVALID" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, code: "POST_URL_INVALID" };
  if (url.username || url.password || (url.port && url.port !== "443" && url.port !== "80")) {
    return { ok: false, code: "POST_URL_INVALID" };
  }

  const host = url.hostname.toLowerCase();
  const parts = url.pathname.split("/").filter(Boolean);

  if (INSTAGRAM_HOSTS.has(host)) {
    // /reel/CODE, /reels/CODE, /p/CODE, /tv/CODE and the same behind a profile: /USER/reel/CODE
    let rest = parts;
    let handle: string | null = null;
    if (rest.length >= 3 && INSTAGRAM_HANDLE.test(rest[0]) && !["p", "reel", "reels", "tv", "stories", "share"].includes(rest[0])) {
      handle = rest[0];
      rest = rest.slice(1);
    }
    if (rest[0] === "share") return { ok: false, code: "POST_URL_SHORT_LINK" };
    if (rest[0] === "stories" && rest.length >= 3 && INSTAGRAM_HANDLE.test(rest[1]) && STORY_ID.test(rest[2])) {
      return ok({
        platform: "Instagram",
        kind: "story",
        externalId: rest[2],
        handle: rest[1],
        canonicalUrl: `https://www.instagram.com/stories/${rest[1]}/${rest[2]}/`,
      });
    }
    if (["reel", "reels", "p", "tv"].includes(rest[0] ?? "") && INSTAGRAM_CODE.test(rest[1] ?? "")) {
      const kind: PostLinkKind = rest[0] === "p" ? "post" : "reel";
      const segment = kind === "post" ? "p" : "reel";
      return ok({
        platform: "Instagram",
        kind,
        externalId: rest[1],
        handle,
        canonicalUrl: `https://www.instagram.com/${segment}/${rest[1]}/`,
      });
    }
    return { ok: false, code: "POST_URL_INVALID" };
  }

  if (TIKTOK_SHORT_HOSTS.has(host)) return { ok: false, code: "POST_URL_SHORT_LINK" };
  if (TIKTOK_HOSTS.has(host)) {
    // /@USER/video/ID (and /photo/ID for photo posts)
    if (parts.length >= 3 && TIKTOK_HANDLE.test(parts[0]) && (parts[1] === "video" || parts[1] === "photo") && TIKTOK_ID.test(parts[2])) {
      return ok({
        platform: "TikTok",
        kind: "video",
        externalId: parts[2],
        handle: parts[0].slice(1),
        canonicalUrl: `https://www.tiktok.com/${parts[0]}/${parts[1]}/${parts[2]}`,
      });
    }
    if (parts[0] === "t") return { ok: false, code: "POST_URL_SHORT_LINK" };
    return { ok: false, code: "POST_URL_INVALID" };
  }

  if (host === "youtu.be") {
    if (parts.length === 1 && YOUTUBE_ID.test(parts[0])) {
      return ok({
        platform: "YouTube",
        kind: "video",
        externalId: parts[0],
        handle: null,
        canonicalUrl: `https://www.youtube.com/watch?v=${parts[0]}`,
      });
    }
    return { ok: false, code: "POST_URL_INVALID" };
  }
  if (YOUTUBE_HOSTS.has(host)) {
    if (parts[0] === "watch") {
      const id = url.searchParams.get("v") ?? "";
      if (YOUTUBE_ID.test(id)) {
        return ok({
          platform: "YouTube",
          kind: "video",
          externalId: id,
          handle: null,
          canonicalUrl: `https://www.youtube.com/watch?v=${id}`,
        });
      }
    }
    if ((parts[0] === "shorts" || parts[0] === "live" || parts[0] === "embed") && YOUTUBE_ID.test(parts[1] ?? "")) {
      const short = parts[0] === "shorts";
      return ok({
        platform: "YouTube",
        kind: short ? "short" : "video",
        externalId: parts[1],
        handle: null,
        canonicalUrl: short ? `https://www.youtube.com/shorts/${parts[1]}` : `https://www.youtube.com/watch?v=${parts[1]}`,
      });
    }
    return { ok: false, code: "POST_URL_INVALID" };
  }

  return { ok: false, code: "POST_URL_HOST_UNSUPPORTED" };
}

// Whether a link is the kind of post the deal asked for: a story link for a Reel, or a TikTok address for a YouTube
// Short, is a mistake the creator should hear about before the brand does.
export function urlFitsFormat(post: ParsedPostUrl, format: PostFormat): boolean {
  const info = POST_FORMATS[format];
  return info.platform === post.platform && (info.linkKinds as readonly PostLinkKind[]).includes(post.kind);
}

// The format a pasted link most plausibly is, out of the formats the deal asks for, so the form can pick it. A link that fits
// the format already chosen leaves it alone; otherwise the format named for exactly this kind of link wins (a /reel/ link is a
// Reel before it is a Post), then the first that fits. Null when the link is not a post address or fits none of them.
export function detectFormat(raw: string, allowed: PostFormat[], current?: PostFormat): PostFormat | null {
  const result = parsePostUrl(raw);
  if (!result.ok) return null;
  const fits = allowed.filter((format) => urlFitsFormat(result.post, format));
  if (fits.length === 0) return null;
  if (current && fits.includes(current)) return current;
  return fits.find((format) => POST_FORMATS[format].linkKinds[0] === result.post.kind) ?? fits[0];
}
