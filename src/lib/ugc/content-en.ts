import { PLATFORM_FEE_RATE, PLATFORMS, PRO_PLATFORM_FEE_RATE, PRO_SUBSCRIPTION_PRICE_CENTS, RELEASE_REVIEW_DAYS } from "@/lib/constants";
import type { UgcContent, UgcCreatorPage, UgcFaqItem, UgcNichePage } from "@/lib/ugc/types";

// English version of the UGC search pages (/en/ugc/...). Same structure as the German source in
// src/lib/seo-pages.ts: same niches, same number of questions. Slugs and `niche` values stay as in German
// (slugs are URLs). No invented numbers, quotes or testimonials, and no "escrow" wording on public pages
// until the payment model is cleared (see docs/legal-readiness.md).

const FEE = `${PLATFORM_FEE_RATE * 100}%`;
const PRO_FEE = `${PRO_PLATFORM_FEE_RATE * 100}%`;
const PRO_PRICE = `€${PRO_SUBSCRIPTION_PRICE_CENTS / 100}`;

// Questions every page answers the same way, because the answer is the same.
function sharedFaqs(): UgcFaqItem[] {
  return [
    {
      question: "How does payment work?",
      answer: `The brand pays through the platform, not directly to the creator. The money is held until the creator has posted and submitted the link, and the brand approves the post. The brand has ${RELEASE_REVIEW_DAYS} days to review and can report a problem in that time. If the brand does not respond, the payment is released automatically. Payments run through Stripe.`,
    },
    {
      question: "What does comtor cost?",
      answer: `Signing up is free and there is no base fee. comtor keeps ${FEE} of each payment. The fee is deducted from the creator's payout. The brand pays exactly the agreed amount. Brands and creators can book an optional Pro plan for ${PRO_PRICE} a month. Then the fee is ${PRO_FEE} on every payment where either side has Pro.`,
    },
    {
      question: "Do paid posts have to be labelled as advertising?",
      answer:
        "In Germany, paid posts usually have to be labelled as advertising. Agree on the labelling in the chat before you post. This is not legal advice.",
    },
    {
      question: "How are follower numbers checked?",
      answer:
        "Creators enter the numbers themselves. Every platform a creator adds is linked to the real account, so brands can check the number themselves before the first message. Brands set a minimum in their request. Only matching creators see it.",
    },
  ];
}

// The two questions about finding each other, for the pages that don't need a niche-specific answer.
function matchingFaqs(opts: {
  label: string;
  brandWho: string;
  creatorFrom: string;
  categories?: string;
}): UgcFaqItem[] {
  const hint = opts.categories ? ` (${opts.categories})` : "";
  return [
    {
      question: `How do I find the right creators as ${opts.brandWho}?`,
      answer: `You post a request: ${opts.label} niche, content language, minimum followers, product category${hint}, budget, platform and deliverables. Creators who picked ${opts.label} as a niche and fit your language and reach see it in their feed. If they are interested, they message you in the chat. comtor does not review requests manually.`,
    },
    {
      question: `Where do I find jobs ${opts.creatorFrom} as a creator?`,
      answer: `You set up your profile, pick up to three niches, for example ${opts.label}, and add each platform with its follower count. In your feed, "For you" shows requests from your niches. "All" shows everything that fits your language and reach, each with budget and requirements. Tap "Interested" to start the chat with the brand.`,
    },
  ];
}

const PLATFORM_LIST = `${PLATFORMS.slice(0, -1).join(", ")} and ${PLATFORMS[PLATFORMS.length - 1]}`;

const niches: UgcNichePage[] = [
  {
    slug: "beauty",
    niche: "Beauty",
    label: "Beauty",
    title: "Find UGC Creators for Beauty Brands",
    description:
      "Beauty brands find UGC creators for routine videos, unboxings and product photos. Creators find paid jobs in their niche. Start for free.",
    heading: "Find UGC creators for beauty brands",
    ogLines: ["Find UGC creators", "for beauty brands."],
    lead: "Skincare, make-up, hair care, fragrance: people buy beauty products when they see them on real faces. comtor connects beauty brands with creators who make exactly these videos and photos. Creators find paid jobs in their niche.",
    formats: [
      {
        title: "Routine video",
        text: "A morning or evening routine where the product appears step by step. Works organically and as an ad.",
      },
      {
        title: "Unboxing and first impressions",
        text: "Unpack it, try it, say honestly what stands out. Good for launches and sets.",
      },
      {
        title: "Application in detail",
        text: "How is it applied, how does it feel, how long does it last? Close-ups instead of a studio look.",
      },
      {
        title: "Everyday photos",
        text: "Product photos in the bathroom, at the vanity or on the go, for shop, social media and ads.",
      },
    ],
    faqs: [
      {
        question: "How do I find the right creators as a beauty brand?",
        answer:
          "You post a request: Beauty niche, content language, minimum followers, product category, budget, platform and deliverables. Creators who picked Beauty as a niche and fit your language and reach see it in their feed. If they are interested, they message you in the chat. comtor does not review requests manually.",
      },
      {
        question: "Where do I find jobs from beauty brands as a creator?",
        answer:
          "You set up your profile, pick up to three niches, for example Beauty, and add each platform with its follower count. In your feed, \"For you\" shows requests from your niches. \"All\" shows everything that fits your language and reach, each with budget and requirements. Tap \"Interested\" to open the chat with the brand.",
      },
      {
        question: "Do I get the product for free?",
        answer:
          "The brand decides in its request. It says there whether the product is included. You agree on everything else, such as what is sent and when, in the chat beforehand.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "fitness",
    niche: "Fitness",
    label: "Fitness",
    title: "Find UGC Creators for Fitness Brands",
    description:
      "Fitness brands find UGC creators for workout videos, product tests and app demos. Creators find paid jobs in their niche. Start for free.",
    heading: "Find UGC creators for fitness brands",
    ogLines: ["Find UGC creators", "for fitness brands."],
    lead: "Sportswear, equipment, supplements, fitness apps: in fitness, what people really use is what convinces. comtor connects fitness brands with creators who show training and daily life credibly. Creators find paid jobs in their niche.",
    formats: [
      {
        title: "Workout with the product",
        text: "One training session where clothing, equipment or accessories are in use.",
      },
      {
        title: "Product test after a few weeks",
        text: "An honest look back: fit, durability, handling. Helps buyers decide.",
      },
      {
        title: "Daily life and routine",
        text: "A training plan, meal prep or morning routine where the product is a natural part of the day.",
      },
      {
        title: "App and tracker demo",
        text: "A screen recording with commentary: how does a workout with the app go, what does the tracker show?",
      },
    ],
    faqs: [
      {
        question: "How do I find the right creators as a fitness brand?",
        answer:
          "You post a request: Fitness niche, content language, minimum followers, product category (for example sportswear, supplements or app), budget, platform and deliverables. Creators who picked Fitness as a niche and fit your language and reach see it in their feed. If they are interested, they message you in the chat.",
      },
      {
        question: "Where do I find jobs from fitness brands as a creator?",
        answer:
          "You set up your profile, pick up to three niches, for example Fitness, and add each platform with its follower count. In your feed, \"For you\" shows requests from your niches. \"All\" shows everything that fits your language and reach. Tap \"Interested\" to start the chat.",
      },
      {
        question: "What applies to supplements and health claims?",
        answer:
          "Strict rules apply to claims about health and effects. For dietary supplements, agree in the chat before the shoot what you may say and what you may not. This is not legal advice.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "food",
    niche: "Food",
    label: "Food",
    title: "Find UGC Creators for Food Brands",
    description:
      "Food brands find UGC creators for recipe videos, taste tests and food photos. Creators find paid jobs in their niche. Start for free.",
    heading: "Find UGC creators for food brands",
    ogLines: ["Find UGC creators", "for food brands."],
    lead: "Snacks, drinks, spices, meal kits, baking ingredients: with food and drink, what counts is whether people want to try it right away. comtor connects food brands with creators who cook, taste and show. Creators find paid jobs in their niche.",
    formats: [
      {
        title: "Recipe video",
        text: "A dish or drink step by step, with the product as an ingredient. Shows how to use it.",
      },
      {
        title: "Taste test and first impressions",
        text: "Try it and describe honestly what stands out. Fits launches, flavours and gift sets.",
      },
      {
        title: "Meal kit unboxing",
        text: "Unpack a meal kit, sample box or gift set and present it.",
      },
      {
        title: "Daily life and meal prep",
        text: "Breakfast, cooking ahead for the week or a snack in between: the product as a normal part of the day.",
      },
      {
        title: "Food photos",
        text: "Dishes and products photographed for shop, social media and ads.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Food",
        brandWho: "a food brand",
        creatorFrom: "from food brands",
        categories: "for example Food & Beverage",
      }),
      {
        question: "Who takes care of shipping the products?",
        answer:
          "You agree on that in the chat beforehand. The request only says whether the product is included. You settle how and when it arrives, especially for chilled or perishable goods, before you start.",
      },
      {
        question: "What applies to health claims?",
        answer:
          "Claims like \"healthy\" or \"boosts your immune system\" are strictly regulated for food. Agree in the chat beforehand what you may say. This is not legal advice.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "mode",
    niche: "Fashion",
    label: "Fashion",
    title: "Find UGC Creators for Fashion Brands",
    description:
      "Fashion brands find UGC creators for outfit videos, try-ons and styling photos. Creators find paid jobs in their niche. Start for free.",
    heading: "Find UGC creators for fashion brands",
    ogLines: ["Find UGC creators", "for fashion brands."],
    lead: "Clothing, shoes, accessories, jewellery: people buy fashion because they can picture themselves in it. comtor connects fashion brands with creators who wear pieces, combine them and show how they fit in daily life. Creators find paid jobs in their niche.",
    formats: [
      {
        title: "Outfit video",
        text: "One piece, several looks: how it combines for work, leisure and evenings out.",
      },
      {
        title: "Try-on with honest feedback",
        text: "Fit, fabric and size compared with the size chart, in your own words.",
      },
      {
        title: "Haul and unboxing",
        text: "Unpack the delivery and present the pieces one by one.",
      },
      {
        title: "Everyday styling photos",
        text: "Looks on the street, in a café or at home, for shop, social media and ads.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Fashion",
        brandWho: "a fashion brand",
        creatorFrom: "from fashion brands",
      }),
      {
        question: "What about size and fit?",
        answer:
          "You agree on the size in the chat first, so the piece fits and the post works. Whether the product is included is stated in the brand's request.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "tech",
    niche: "Tech",
    label: "Tech",
    title: "Find UGC Creators for Tech Brands",
    description:
      "Tech brands find UGC creators for unboxings, everyday tests and app demos. Creators find paid jobs in their niche. Start for free.",
    heading: "Find UGC creators for tech brands",
    ogLines: ["Find UGC creators", "for tech brands."],
    lead: "Gadgets, accessories, smart home, software and apps: with tech, buyers want to see how a product works in daily life. comtor connects tech brands with creators who unbox, set up and explain. Creators find paid jobs in their niche.",
    formats: [
      {
        title: "Unboxing and setup",
        text: "Unpack, switch on, set up: the first minutes with the product, as buyers experience them.",
      },
      {
        title: "Everyday test",
        text: "One week with the product: what works, what annoys, who is it worth it for?",
      },
      {
        title: "Feature demo",
        text: "A screen recording or close-up that explains a feature people usually miss.",
      },
      {
        title: "How-to",
        text: "A short tutorial: how do I solve a typical problem with the product?",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Tech",
        brandWho: "a tech brand",
        creatorFrom: "from tech brands",
        categories: "for example Electronics or Software/App",
      }),
      {
        question: "How do I get access to devices or software as a creator?",
        answer:
          "For devices, the brand states in its request whether the product is included. For software and apps, you agree in the chat how you get a test account or a full version.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "reisen",
    niche: "Travel",
    label: "Travel",
    title: "Find UGC Creators for Travel Brands",
    description:
      "Hotels, tour operators and travel brands find UGC creators for travel reels, property tours and photos. Start for free.",
    heading: "Find UGC creators for travel brands",
    ogLines: ["Find UGC creators", "for travel brands."],
    lead: "Hotels, holiday rentals, tour operators, luggage and travel apps: people book trips based on other people's photos and experiences. comtor connects travel brands with creators who show places and stays the way you experience them on site. Creators find paid jobs in their niche.",
    formats: [
      {
        title: "Travel reel",
        text: "A place in 30 seconds: arrival, the best moments, one tip to take away.",
      },
      {
        title: "Property tour",
        text: "Room, view, breakfast, details: how it really looks and feels.",
      },
      {
        title: "Three tips on site",
        text: "A short format with favourite spots, food and routes off the beaten track.",
      },
      {
        title: "Packing list and travel gear",
        text: "Suitcase, backpack, adapter: products in real use on the road.",
      },
      {
        title: "Photo series",
        text: "Pictures of the place and the stay, for website, social media and ads.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Travel",
        brandWho: "a travel brand",
        creatorFrom: "in travel",
      }),
      {
        question: "Who pays for travel and accommodation?",
        answer:
          "You agree on that in the chat beforehand and put it in writing. The request states the budget for the post. Whether travel, accommodation or services on site come on top, you agree explicitly.",
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "gaming",
    niche: "Gaming",
    label: "Gaming",
    title: "Find UGC Creators for Gaming Brands",
    description:
      "Gaming brands find UGC creators for gameplay clips, hardware tests and first impressions. Creators find paid jobs. Start for free.",
    heading: "Find UGC creators for gaming brands",
    ogLines: ["Find UGC creators", "for gaming brands."],
    lead: "Games, consoles, PC hardware, accessories and gaming apps: players trust people who play themselves. comtor connects gaming brands with creators who play, test and comment. Creators find paid jobs in their niche.",
    formats: [
      {
        title: "Gameplay clip",
        text: "One scene from the game with commentary: what makes it special, what stands out?",
      },
      {
        title: "First impressions",
        text: "The first hours in a new game, open and unscripted.",
      },
      {
        title: "Hardware test",
        text: "Mouse, headset, keyboard or controller in use: feel, quality, everyday fit.",
      },
      {
        title: "Highlights from a stream or session",
        text: "The best moments from a stream or a round of play, cut short.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Gaming",
        brandWho: "a gaming brand",
        creatorFrom: "from gaming brands",
      }),
      {
        question: "Which platforms can I post on?",
        answer: `Creators add each platform with its follower count: ${PLATFORM_LIST}. The brand states in its request where to post.`,
      },
      ...sharedFaqs(),
    ],
  },
  {
    slug: "lifestyle",
    niche: "Lifestyle",
    label: "Lifestyle",
    title: "Find UGC Creators for Lifestyle Brands",
    description:
      "Lifestyle brands find UGC creators for daily-life videos, home looks and product photos. Creators find paid jobs. Start for free.",
    heading: "Find UGC creators for lifestyle brands",
    ogLines: ["Find UGC creators", "for lifestyle brands."],
    lead: "Home, household, organisation, wellness, accessories: lifestyle products convince when you see them in real daily life. comtor connects lifestyle brands with creators who show their everyday lives. Creators find paid jobs in their niche.",
    formats: [
      {
        title: "A day with the product",
        text: "From morning to evening: where the product shows up in daily life and what it makes easier.",
      },
      {
        title: "Home look",
        text: "A flat, a corner or a shelf styled with the product. Shows how it looks in a real home.",
      },
      {
        title: "Unboxing and setup",
        text: "Unpack, set up, try it out, including the snags.",
      },
      {
        title: "Routines and habits",
        text: "A morning, evening or Sunday routine where the product fits in naturally.",
      },
      {
        title: "Everyday photos",
        text: "Product photos in real situations, for shop, social media and ads.",
      },
    ],
    faqs: [
      ...matchingFaqs({
        label: "Lifestyle",
        brandWho: "a lifestyle brand",
        creatorFrom: "from lifestyle brands",
      }),
      {
        question: "What if my content mixes several topics?",
        answer:
          "You can pick up to three niches, for example Lifestyle, Fashion and Food. In your feed, \"For you\" shows requests from these niches first. \"All\" shows everything that fits your language and reach.",
      },
      ...sharedFaqs(),
    ],
  },
];

// Questions for the overview page /ugc.
const hubFaqs: UgcFaqItem[] = [
  {
    question: "What is UGC?",
    answer:
      "UGC stands for user-generated content. In marketing, these are videos and photos that real people make for a brand: they try a product, film it, show it. The brand uses them on its channels, in its shop or in ads. The content counts, not the creator's reach.",
  },
  {
    question: "How is it different from influencer marketing?",
    answer:
      "Influencer marketing centres on one person's reach: the post appears on their channel. UGC centres on the content, and smaller creators can deliver great videos too. On comtor, the brand sets the platform and the minimum followers in its request, and can leave both open.",
  },
  {
    question: "How do I find UGC creators for my brand?",
    answer:
      "You create a brand profile for free and post a request: niche, language, product category, budget and deliverables. Matching creators see it in their feed and message you in the chat.",
  },
  ...sharedFaqs(),
];

const creator: UgcCreatorPage = {
  title: "Earn Money as a UGC Creator",
  description:
    "Find paid jobs from brands as a UGC creator: browse requests with budgets, agree details in the chat, get paid through the platform. Free.",
  heading: "Earn money as a UGC creator",
  ogLines: ["Earn money", "as a UGC creator."],
  lead: "UGC creators make videos and photos for brands, the way real customers would show a product. On comtor, you see paid requests with budget and requirements, tap to show interest and agree the rest in the chat. You get paid through the platform.",
  doing: [
    {
      title: "Product videos",
      text: "Try a product, film it and show honestly how it works in daily life.",
    },
    {
      title: "Unboxings and first impressions",
      text: "Unpack it, try it, say what stands out. No studio, but credible.",
    },
    {
      title: "Demos and tutorials",
      text: "Show step by step how a product is used and what it makes easier.",
    },
    {
      title: "Photos in real situations",
      text: "Product photos in daily life, for the brand's shop, social media and ads.",
    },
  ],
  steps: [
    "Set up your profile: Pick up to three niches, add each platform with its follower count and state the language of your content.",
    "Browse requests: In your feed you see budget, platform and deliverables before you get in touch.",
    "Show interest: Tap \"Interested\" to open the chat with the brand and agree details and deadline.",
    "Post and submit the link: After you post, you submit the link to your post.",
    `Get paid: The brand approves the post, at the latest after ${RELEASE_REVIEW_DAYS} days, and the payment is paid out to you.`,
  ],
  tips: [
    {
      title: "Show the product early",
      text: "In the first seconds, it should be clear what this is and what the product can do.",
    },
    {
      title: "Talk naturally",
      text: "Honest impressions in your own words usually convince more than a memorised script.",
    },
    {
      title: "Mind light and sound",
      text: "Daylight and a quiet spot are often enough. A good picture and clear sound stand out.",
    },
    {
      title: "Settle usage beforehand",
      text: "Agree in the chat where the brand may use your content before you shoot.",
    },
  ],
  faqs: [
    {
      question: "Do I need a lot of followers?",
      answer:
        "The brand decides: every request states a minimum number of followers, and some brands set no minimum. \"For you\" shows requests from your niches. \"All\" shows everything that fits your language and reach.",
    },
    {
      question: "Which platforms can I post on?",
      answer: `You add your platforms with their follower counts: ${PLATFORM_LIST}. The brand states in its request where to post.`,
    },
    {
      question: "How fast do I get my money?",
      answer: `As soon as the brand approves your post, the payment goes to you. The brand has ${RELEASE_REVIEW_DAYS} days to review. If it does not respond, the payment is released automatically. The payout runs through Stripe.`,
    },
    {
      question: "Do I have to register a business as a UGC creator?",
      answer:
        "That depends on your situation, for example how often and how much you earn. In Germany, you usually have to declare income for tax. If in doubt, ask a tax advisor. This is not tax or legal advice.",
    },
    ...sharedFaqs(),
  ],
};

export const ugcContentEn: UgcContent = {
  htmlLang: "en",
  ogLocale: "en_GB",
  ui: {
    hubTitle: "Find and Hire UGC Creators",
    hubDescription:
      "Brands find UGC creators for videos and photos, creators find paid jobs. Post a request, agree details in the chat, pay through the platform. Free.",
    hubIntro:
      "Brands need videos and photos from real people, and creators want to get paid for them. comtor connects both: the brand posts a request, matching creators get in touch, and payment runs through the platform.",
    signupNote: "Sign up for free. comtor runs in your browser, and you choose the language at the start.",
    creatorCardTitle: "Are you a creator?",
    creatorCardBody:
      "Here is how you find paid UGC jobs and get paid through the platform: earn money as a UGC creator.",
    byNicheTitle: "UGC by niche",
    howTitle: "How comtor works",
    forBrands: "For brands",
    forCreators: "For creators",
    hubBrandSteps: [
      "Post a request: niche, language, minimum followers, product category, budget and deliverables.",
      "Creators get in touch: those who fit see the request in their feed and message you in the chat.",
      "Pay and approve: you pay through the platform and approve the post when it fits.",
    ],
    hubCreatorSteps: [
      "Set up your profile: up to three niches and your platforms with their follower counts.",
      "Browse requests: in your feed you see budget and requirements before you get in touch.",
      "Post and get paid: after posting, you submit the link. Once the brand approves it (after {days} days at the latest), the payment is paid out.",
    ],
    faqTitle: "Frequently asked questions",
    formatsTitle: "These formats work in the \"{label}\" niche",
    nicheBrandSteps: [
      "Post a request: {label} niche, language, minimum followers, budget and deliverables.",
      "Creators get in touch: those who fit see the request in their feed and message you in the chat.",
      "Pay and approve: you pay through the platform and approve the post when it fits.",
    ],
    nicheCreatorSteps: [
      "Set up your profile: up to three niches, for example {label}, and your platforms with their follower counts.",
      "Browse requests: in your feed you see budget and requirements before you get in touch.",
      "Post and get paid: after posting, you submit the link. Once the brand approves it (after {days} days at the latest), the payment is paid out.",
    ],
    nicheReadyTitle: "Ready for your first job in the \"{label}\" niche?",
    overviewLead: "We explain what UGC is and how comtor works in the overview:",
    overviewLink: "Find UGC creators",
    creatorCrumb: "Become a creator",
    creatorFooterLink: "Become a creator",
    creatorDoingTitle: "What UGC creators do",
    creatorStartTitle: "How to start on comtor",
    creatorTipsTitle: "Tips for good UGC content",
    creatorReadyTitle: "Ready for your first paid job?",
    creatorBrandHint: "Looking for creators for your brand? We explain what UGC is and how comtor works in the overview:",
    nicheNavLabel: "UGC by niche",
  },
  niches,
  hubFaqs,
  creator,
};
