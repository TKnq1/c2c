import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { BEAT, type Scene, SceneSeries, seriesDuration, type VideoProps } from "../series";
import { B01Hook, B02Ugc, B03Growth, B04Logo } from "./intro";
import { B08Founding, B09Cta } from "./outro";
import { B05Request, B06Creators, B07Safe } from "./steps";

// Storyboard timings (STORYBOARD.md), in whole beats of the music.
export const BRAND_SCENES: Scene[] = [
  { id: "B01", component: B01Hook, duration: 8 * BEAT, keyframe: 62 },
  { id: "B02", component: B02Ugc, duration: 9 * BEAT, keyframe: 130, enter: slide({ direction: "from-right" }) },
  { id: "B03", component: B03Growth, duration: 8 * BEAT, keyframe: 110, enter: slide({ direction: "from-bottom" }) },
  { id: "B04", component: B04Logo, duration: 5 * BEAT, keyframe: 50, enter: wipe({ direction: "from-left" }), whoosh: false },
  { id: "B05", component: B05Request, duration: 11 * BEAT, keyframe: 160, enter: slide({ direction: "from-bottom" }) },
  { id: "B06", component: B06Creators, duration: 9 * BEAT, keyframe: 130, enter: slide({ direction: "from-right" }) },
  { id: "B07", component: B07Safe, duration: 8 * BEAT, keyframe: 110, enter: slide({ direction: "from-right" }) },
  { id: "B08", component: B08Founding, duration: 11 * BEAT, keyframe: 160, enter: wipe({ direction: "from-right" }), whoosh: false },
  { id: "B09", component: B09Cta, duration: 8 * BEAT, keyframe: 110, enter: slide({ direction: "from-bottom" }), whoosh: false },
];

export const BRAND_DURATION = seriesDuration(BRAND_SCENES);

export const BrandVideo: React.FC<VideoProps> = (props) => <SceneSeries scenes={BRAND_SCENES} bed="music/brand-bed.mp3" {...props} />;
