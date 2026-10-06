import { getImageProps } from "next/image";
import type { SwipeRequest } from "@/components/swipe-card";
import type { Locale } from "@/lib/i18n/locales";

// Product shots from Unsplash (free licence, no logos), one per colour so
// the hero's background visibly changes with every card. The brands on the
// cards are made up.
export const PHOTOS = {
  serum: "/landing/serum-orange.jpg",
  matcha: "/landing/matcha.jpg",
  headphones: "/landing/watermelon-headphones.jpg",
  glasses: "/landing/glasses-lilac.jpg",
  lipstick: "/landing/lipstick-red.jpg",
  tote: "/landing/leather-tote.jpg",
  cream: "/landing/cream-lemon.jpg",
  lotion: "/landing/bottle-blue.jpg",
  flask: "/landing/flask-pastel.jpg",
} as const;

export type PhotoKey = keyof typeof PHOTOS;

// The cards draw their photos with a plain <img>, so the resized version
// comes from the image optimizer by hand: 640px wide covers a phone-sized
// card on a retina screen.
export function cardPhoto(key: PhotoKey) {
  return getImageProps({ src: PHOTOS[key], alt: "", width: 320, height: 480 }).props.src;
}

// Only its colours survive the blur, so a thumbnail is plenty.
export function backdropPhoto(key: PhotoKey) {
  return getImageProps({ src: PHOTOS[key], alt: "", width: 32, height: 48 }).props.src;
}

type MockRequest = {
  id: string;
  company: string;
  title: string;
  description: string;
  niche: string;
  productCategory: string;
  photo: PhotoKey;
  budget: number;
  platform: string;
  deliverables: string;
  productIncluded: boolean;
  rating: [number, number];
};

const MOCK_REQUESTS: MockRequest[] = [
  {
    id: "odd-bloom",
    company: "Odd Bloom",
    title: "Serum launch, first impressions",
    description: "Show our new glow serum in your morning routine. Honest first impressions in natural light, no script. We send two bottles.",
    niche: "Beauty",
    productCategory: "Cosmetics",
    photo: "serum",
    budget: 250,
    platform: "TikTok",
    deliverables: "1 Video",
    productIncluded: true,
    rating: [4.8, 23],
  },
  {
    id: "kiez-goods",
    company: "Kiez Goods",
    title: "Iced matcha for the summer menu",
    description: "Our Berlin café is putting iced matcha on the menu. Come by, film it being made and tell people what you think.",
    niche: "Food",
    productCategory: "Food & Beverage",
    photo: "matcha",
    budget: 400,
    platform: "Instagram",
    deliverables: "1 Reel + 2 Stories",
    productIncluded: true,
    rating: [4.9, 41],
  },
  {
    id: "lumo-audio",
    company: "Lumo Audio",
    title: "Headphones that don't take themselves seriously",
    description: "Our new over-ears in your weirdest setup. Fun beats polished here, as long as people hear the sound.",
    niche: "Tech",
    productCategory: "Electronics",
    photo: "headphones",
    budget: 500,
    platform: "YouTube",
    deliverables: "1 Short",
    productIncluded: true,
    rating: [4.7, 12],
  },
  {
    id: "vela-optics",
    company: "Vela Optics",
    title: "Glitter frames, first look",
    description: "Style our new glitter frames three ways. Close-ups of the details, please.",
    niche: "Fashion",
    productCategory: "Fashion",
    photo: "glasses",
    budget: 220,
    platform: "Instagram",
    deliverables: "1 Reel",
    productIncluded: true,
    rating: [4.6, 9],
  },
  {
    id: "rouge-atelier",
    company: "Rouge Atelier",
    title: "One lipstick, three looks",
    description: "Day, office and night with one shade. Two short videos, your own style.",
    niche: "Beauty",
    productCategory: "Cosmetics",
    photo: "lipstick",
    budget: 300,
    platform: "TikTok",
    deliverables: "2 Videos",
    productIncluded: true,
    rating: [4.9, 57],
  },
  {
    id: "linden-leather",
    company: "Linden Leather",
    title: "The tote you'd actually use every day",
    description: "Show what fits in our everyday tote and where it goes with you. One feed post.",
    niche: "Fashion",
    productCategory: "Fashion",
    photo: "tote",
    budget: 180,
    platform: "Instagram",
    deliverables: "1 Post",
    productIncluded: true,
    rating: [4.8, 16],
  },
  {
    id: "citrus-club",
    company: "Citrus Club",
    title: "Vitamin C cream in your morning routine",
    description: "Put our vitamin C cream into your real morning routine and tell people how your skin feels after two weeks.",
    niche: "Beauty",
    productCategory: "Cosmetics",
    photo: "cream",
    budget: 200,
    platform: "TikTok",
    deliverables: "1 Video",
    productIncluded: true,
    rating: [4.7, 30],
  },
  {
    id: "salt-shore",
    company: "Salt & Shore",
    title: "Body lotion for after the beach",
    description: "Three stories from a day by the water, with our after-sun lotion in at least one of them.",
    niche: "Lifestyle",
    productCategory: "Cosmetics",
    photo: "lotion",
    budget: 150,
    platform: "Instagram",
    deliverables: "3 Stories",
    productIncluded: true,
    rating: [4.5, 8],
  },
];

// The same requests in German, for the German page. Only the text people read changes: the content
// presets ("1 Reel + 2 Stories") stay as they are, the cards translate those themselves.
const GERMAN_TEXT: Record<string, { title: string; description: string }> = {
  "odd-bloom": {
    title: "Serum-Launch, erste Eindrücke",
    description:
      "Zeig unser neues Glow-Serum in deiner Morgenroutine. Ehrliche erste Eindrücke bei Tageslicht, ohne Skript. Wir schicken zwei Flaschen.",
  },
  "kiez-goods": {
    title: "Iced Matcha für die Sommerkarte",
    description:
      "Unser Berliner Café nimmt Iced Matcha auf die Karte. Komm vorbei, filme die Zubereitung und erzähl, wie er dir schmeckt.",
  },
  "lumo-audio": {
    title: "Kopfhörer, die sich nicht zu ernst nehmen",
    description:
      "Unsere neuen Over-Ears in deinem verrücktesten Setup. Spaß schlägt Hochglanz, Hauptsache, man hört den Sound.",
  },
  "vela-optics": {
    title: "Glitzerbrillen, erster Blick",
    description: "Style unsere neuen Glitzerbrillen auf drei Arten. Bitte mit Nahaufnahmen der Details.",
  },
  "rouge-atelier": {
    title: "Ein Lippenstift, drei Looks",
    description: "Tag, Büro und Abend mit einem Farbton. Zwei kurze Videos, in deinem eigenen Stil.",
  },
  "linden-leather": {
    title: "Die Tasche, die du wirklich jeden Tag nutzt",
    description:
      "Zeig, was in unsere Alltagstasche passt und wohin sie dich begleitet. Ein Feed-Post.",
  },
  "citrus-club": {
    title: "Vitamin-C-Creme in deiner Morgenroutine",
    description:
      "Bau unsere Vitamin-C-Creme in deine echte Morgenroutine ein und erzähl nach zwei Wochen, wie sich deine Haut anfühlt.",
  },
  "salt-shore": {
    title: "After-Sun-Lotion für den Strandtag",
    description:
      "Drei Stories von einem Tag am Wasser, unsere After-Sun-Lotion kommt in mindestens einer davon vor.",
  },
};

export function toSwipeRequest(r: MockRequest, round = 0, locale: Locale = "en"): SwipeRequest & { photoKey: PhotoKey } {
  const german = locale === "de" ? GERMAN_TEXT[r.id] : undefined;
  return {
    id: `${r.id}-${round}`,
    startupId: r.id,
    isBrandFavorited: false,
    photoKey: r.photo,
    title: german?.title ?? r.title,
    description: german?.description ?? r.description,
    niche: r.niche,
    languages: [locale === "de" ? "German" : "English"],
    minFollowers: 1000,
    productCategory: r.productCategory,
    companyName: r.company,
    companyAvatarUrl: null,
    rating: { average: r.rating[0], count: r.rating[1] },
    photos: [cardPhoto(r.photo)],
    budgetMinCents: r.budget * 100,
    budgetMaxCents: r.budget * 100,
    platform: r.platform,
    deliverables: r.deliverables,
    // No date: a fixed one would be in the past a few weeks after launch.
    postBy: null,
    productIncluded: r.productIncluded,
  };
}

export function deck(round: number, locale: Locale = "en") {
  return MOCK_REQUESTS.map((r) => toSwipeRequest(r, round, locale));
}

export const FIRST_PHOTO: PhotoKey = MOCK_REQUESTS[0].photo;
