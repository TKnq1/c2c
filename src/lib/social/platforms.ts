// The content formats a deal can ask for, and how each one is verified. A format is the unit the brand books
// ("1 Instagram Reel") and the creator delivers (one DealPost per format).

export type SocialPlatform = "Instagram" | "TikTok" | "YouTube";

export type PostFormatInfo = {
  platform: SocialPlatform;
  label: string;
  // "video" and "image" can be opened by link. A story disappears after 24 hours, so it is shown by proof (a
  // screenshot / recording) that the brand confirms.
  kind: "video" | "image" | "story";
  verification: "link" | "proof";
  // How many characters of a caption are visible before the platform cuts it off ("... more"): the disclosure has to
  // stand inside them.
  visibleCaptionChars: number;
  // The platform has its own paid-partnership switch, named here.
  partnershipLabel: string | null;
  // Which kinds of link (see social/url.ts) belong to this format.
  linkKinds: ("reel" | "post" | "story" | "video" | "short")[];
};

export const POST_FORMATS = {
  INSTAGRAM_REEL: {
    platform: "Instagram",
    label: "Instagram Reel",
    kind: "video",
    verification: "link",
    visibleCaptionChars: 125,
    partnershipLabel: "Paid partnership",
    linkKinds: ["reel", "post"],
  },
  INSTAGRAM_POST: {
    platform: "Instagram",
    label: "Instagram Post",
    kind: "image",
    verification: "link",
    visibleCaptionChars: 125,
    partnershipLabel: "Paid partnership",
    linkKinds: ["post", "reel"],
  },
  INSTAGRAM_STORY: {
    platform: "Instagram",
    label: "Instagram Story",
    kind: "story",
    verification: "proof",
    visibleCaptionChars: 0,
    partnershipLabel: "Paid partnership",
    linkKinds: ["story"],
  },
  TIKTOK_VIDEO: {
    platform: "TikTok",
    label: "TikTok Video",
    kind: "video",
    verification: "link",
    visibleCaptionChars: 80,
    partnershipLabel: "Content disclosure setting (promotional content)",
    linkKinds: ["video"],
  },
  YOUTUBE_INTEGRATION: {
    platform: "YouTube",
    label: "YouTube Integration",
    kind: "video",
    verification: "link",
    visibleCaptionChars: 100,
    partnershipLabel: "Includes paid promotion",
    linkKinds: ["video"],
  },
  YOUTUBE_DEDICATED: {
    platform: "YouTube",
    label: "YouTube Dedicated Video",
    kind: "video",
    verification: "link",
    visibleCaptionChars: 100,
    partnershipLabel: "Includes paid promotion",
    linkKinds: ["video"],
  },
  YOUTUBE_SHORT: {
    platform: "YouTube",
    label: "YouTube Short",
    kind: "video",
    verification: "link",
    visibleCaptionChars: 100,
    partnershipLabel: "Includes paid promotion",
    linkKinds: ["short", "video"],
  },
} as const satisfies Record<string, PostFormatInfo>;

export type PostFormat = keyof typeof POST_FORMATS;

export const POST_FORMAT_CODES = Object.keys(POST_FORMATS) as PostFormat[];

export function isPostFormat(value: string): value is PostFormat {
  return Object.prototype.hasOwnProperty.call(POST_FORMATS, value);
}

export function formatInfo(format: PostFormat): PostFormatInfo {
  return POST_FORMATS[format];
}

// The format a request's single "platform" answer most plausibly means, for requests written before briefings existed.
export function defaultFormatsForPlatform(platform: string | null | undefined): PostFormat[] {
  switch (platform) {
    case "Instagram":
      return ["INSTAGRAM_REEL"];
    case "TikTok":
      return ["TIKTOK_VIDEO"];
    case "YouTube":
      return ["YOUTUBE_INTEGRATION"];
    default:
      return [];
  }
}
