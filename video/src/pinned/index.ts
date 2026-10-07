import { BRAND_COVER_DURATION, BrandCover } from "./BrandCover";
import { CREATOR_COVER_DURATION, CreatorCover } from "./CreatorCover";
import { Brand2, Brand3, Brand4, Brand5, Brand6, Creator2, Creator3, Creator4, Creator5, Creator6 } from "./Slides";

// The two pinned carousels, slide by slide: the covers are short videos with sound, the rest still images
// (one frame). Rendered by scripts/render-posts.mjs.
export const PINNED = [
  { id: "PinCreator1", component: CreatorCover, duration: CREATOR_COVER_DURATION },
  { id: "PinCreator2", component: Creator2, duration: 1 },
  { id: "PinCreator3", component: Creator3, duration: 1 },
  { id: "PinCreator4", component: Creator4, duration: 1 },
  { id: "PinCreator5", component: Creator5, duration: 1 },
  { id: "PinCreator6", component: Creator6, duration: 1 },
  { id: "PinBrand1", component: BrandCover, duration: BRAND_COVER_DURATION },
  { id: "PinBrand2", component: Brand2, duration: 1 },
  { id: "PinBrand3", component: Brand3, duration: 1 },
  { id: "PinBrand4", component: Brand4, duration: 1 },
  { id: "PinBrand5", component: Brand5, duration: 1 },
  { id: "PinBrand6", component: Brand6, duration: 1 },
];
