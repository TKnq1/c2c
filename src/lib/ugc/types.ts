import type { NICHES } from "@/lib/constants";

type Niche = (typeof NICHES)[number];

export type UgcFaqItem = { question: string; answer: string };
export type UgcCard = { title: string; text: string };

export type UgcNichePage = {
  slug: string;
  niche: Niche;
  // The niche's name as people see it in the app in this language (messages/screens-<locale>.ts, `niches`).
  label: string;
  // <title> (the site adds " · comtor") and meta description.
  title: string;
  description: string;
  heading: string;
  // The heading split over two lines for the share image (the share images stay German).
  ogLines: [string, string];
  lead: string;
  formats: UgcCard[];
  // Niche-specific questions, followed by the shared ones.
  faqs: UgcFaqItem[];
};

export type UgcCreatorPage = {
  title: string;
  description: string;
  heading: string;
  ogLines: [string, string];
  lead: string;
  doing: UgcCard[];
  steps: string[];
  tips: UgcCard[];
  faqs: UgcFaqItem[];
};

// Page chrome. {label} is the niche name, {days} the review days (RELEASE_REVIEW_DAYS).
export type UgcUi = {
  // /ugc
  hubTitle: string;
  hubDescription: string;
  hubIntro: string;
  signupNote: string;
  creatorCardTitle: string;
  creatorCardBody: string;
  byNicheTitle: string;
  howTitle: string;
  forBrands: string;
  forCreators: string;
  hubBrandSteps: [string, string, string];
  hubCreatorSteps: [string, string, string];
  faqTitle: string;
  // /ugc/<niche>
  formatsTitle: string;
  nicheBrandSteps: [string, string, string];
  nicheCreatorSteps: [string, string, string];
  nicheReadyTitle: string;
  overviewLead: string;
  overviewLink: string;
  // /ugc/creator-werden
  creatorCrumb: string;
  creatorFooterLink: string;
  creatorDoingTitle: string;
  creatorStartTitle: string;
  creatorTipsTitle: string;
  creatorReadyTitle: string;
  creatorBrandHint: string;
  // Footer
  nicheNavLabel: string;
};

export type UgcContent = {
  // <html lang> of the page content and the Open Graph locale.
  htmlLang: string;
  ogLocale: string;
  ui: UgcUi;
  niches: UgcNichePage[];
  hubFaqs: UgcFaqItem[];
  creator: UgcCreatorPage;
};
