import type { Deal } from "../components/ui";

// The real brands of the ads: their product photos and profile pictures (public/photos/brands, public/brands) and the
// deals shown on their behalf. Budgets and deliverables are illustrative, hence the "Beispieldaten" note on screen.
export const RAW_AVATAR = "brands/raw-avatar.png";
export const VS_AVATAR = "brands/vs-avatar.png";
export const NOKAR_AVATAR = "brands/nokar-avatar.png";

export const RAW_HOODIE: Deal = {
  company: "Raw Supplies",
  title: "RAW Hoodie V2, erste Eindrücke",
  photo: "rawHoodie",
  avatar: RAW_AVATAR,
  budget: "250 €",
  platform: "TikTok",
  deliverables: "1 Video",
  productIncluded: true,
  rating: ["4,8", 23],
};

export const RAW_PANTS: Deal = {
  company: "Raw Supplies",
  title: "RAW Sweatpants, Outfit-Reel",
  photo: "rawPants",
  avatar: RAW_AVATAR,
  budget: "180 €",
  platform: "Instagram",
  deliverables: "1 Reel",
  productIncluded: true,
  rating: ["4,8", 23],
};

export const VINTAGE_DROP: Deal = {
  company: "vintagesteals.de",
  title: "Catalogue Drop 2026, Haul-Video",
  photo: "vsCatalog1",
  avatar: VS_AVATAR,
  photoPosition: "left center",
  budget: "400 €",
  platform: "Instagram",
  deliverables: "1 Reel + 2 Stories",
  productIncluded: true,
  rating: ["4,9", 41],
};

export const VINTAGE_EVISU: Deal = {
  company: "vintagesteals.de",
  title: "Evisu Jeans, Try-on",
  photo: "vsCatalog2",
  avatar: VS_AVATAR,
  budget: "320 €",
  platform: "TikTok",
  deliverables: "1 Video",
  productIncluded: true,
  rating: ["4,9", 41],
};

export const NOKAR_HOODIE: Deal = {
  company: "Nokar",
  title: "Nokar Hoodie, Drop-Teaser",
  photo: "nokarHoodie",
  avatar: NOKAR_AVATAR,
  budget: "300 €",
  platform: "Instagram",
  deliverables: "1 Reel",
  productIncluded: true,
  rating: ["4,7", 18],
};
