import { BRAND_COVER_DURATION, BrandCover } from "./BrandCover";
import { CREATOR_COVER_DURATION, CreatorCover } from "./CreatorCover";

// The two pinned carousels, slide by slide. The covers are short videos with sound.
export const PINNED = [
  { id: "PinCreator1", component: CreatorCover, duration: CREATOR_COVER_DURATION },
  { id: "PinBrand1", component: BrandCover, duration: BRAND_COVER_DURATION },
];
