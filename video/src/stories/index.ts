import { Hook, HOOK_DURATION } from "./Hook";
import { Number90, NUMBER_DURATION } from "./Number";
import { BrandApprove, BrandFees, BrandRequest, Cta, Deal, Founding, Myth, Pays, Poll, Question, Quiz } from "./Stills";

// The stories, one composition each: two short videos with sound (the hook and the number), the rest still images
// (one frame). Rendered by scripts/render-stories.mjs; what to post when is in STORIES.md.
export const STORIES = [
  { id: "StoryHook", component: Hook, duration: HOOK_DURATION },
  { id: "StoryMyth", component: Myth, duration: 1 },
  { id: "StoryDeal", component: Deal, duration: 1 },
  { id: "StoryPays", component: Pays, duration: 1 },
  { id: "StoryQuiz", component: Quiz, duration: 1 },
  { id: "StoryNumber", component: Number90, duration: NUMBER_DURATION },
  { id: "StoryPoll", component: Poll, duration: 1 },
  { id: "StoryQuestion", component: Question, duration: 1 },
  { id: "StoryFounding", component: Founding, duration: 1 },
  { id: "StoryBrandRequest", component: BrandRequest, duration: 1 },
  { id: "StoryBrandApprove", component: BrandApprove, duration: 1 },
  { id: "StoryBrandFees", component: BrandFees, duration: 1 },
  { id: "StoryCta", component: Cta, duration: 1 },
];
