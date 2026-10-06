import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { BEAT, type Scene, SceneSeries, seriesDuration, type VideoProps } from "../series";
import { C00Hook, HOOK_BLUR } from "./hook";
import { C01Hook, C02Twist, C03Problem, C04Logo } from "./intro";
import { C10Payout, C11Cta } from "./outro";
import { C05Profile, C06Swipe, C07Chat, C08Paid, C09Post } from "./steps";

// Storyboard timings (STORYBOARD.md), in whole beats of the music. scripts/make-audio.py has the same scene starts.
export const CREATOR_SCENES: Scene[] = [
  { id: "C00", component: C00Hook, duration: 5 * BEAT, keyframe: 70, blur: HOOK_BLUR },
  { id: "C01", component: C01Hook, duration: 7 * BEAT, keyframe: 100, enter: slide({ direction: "from-right" }), blur: [[14, 50]] },
  { id: "C02", component: C02Twist, duration: 7 * BEAT, keyframe: 100, enter: slide({ direction: "from-right" }), blur: [[20, 60]] },
  { id: "C03", component: C03Problem, duration: 8 * BEAT, keyframe: 82, enter: slide({ direction: "from-bottom" }), blur: [[90, 120]] },
  { id: "C04", component: C04Logo, duration: 5 * BEAT, keyframe: 50, enter: wipe({ direction: "from-left" }), whoosh: false },
  { id: "C05", component: C05Profile, duration: 10 * BEAT, keyframe: 145, enter: slide({ direction: "from-bottom" }) },
  { id: "C06", component: C06Swipe, duration: 14 * BEAT, keyframe: 165, enter: slide({ direction: "from-right" }), blur: [[52, 74], [160, 190]] },
  // Match cut: the swipe scene ends on this scene's first picture, so it only crossfades the headline.
  { id: "C07", component: C07Chat, duration: 10 * BEAT, keyframe: 148, enter: fade(), whoosh: false, zoom: [1.03, 1.06] },
  { id: "C08", component: C08Paid, duration: 8 * BEAT, keyframe: 110, enter: slide({ direction: "from-right" }) },
  { id: "C09", component: C09Post, duration: 9 * BEAT, keyframe: 120, enter: slide({ direction: "from-right" }) },
  { id: "C10", component: C10Payout, duration: 7 * BEAT, keyframe: 90, enter: slide({ direction: "from-right" }), blur: [[66, 80]] },
  { id: "C11", component: C11Cta, duration: 7 * BEAT, keyframe: 95, enter: wipe({ direction: "from-bottom" }), whoosh: false },
];

export const CREATOR_DURATION = seriesDuration(CREATOR_SCENES);

export const CreatorVideo: React.FC<VideoProps> = (props) => <SceneSeries scenes={CREATOR_SCENES} bed="music/creator-bed.mp3" {...props} />;
