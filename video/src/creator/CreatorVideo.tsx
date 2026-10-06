import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Fragment } from "react";
import { C01Hook, C02Twist, C03Problem, C04Logo } from "./intro";
import { C10Payout, C11Cta } from "./outro";
import { C05Profile, C06Swipe, C07Chat, C08Paid, C09Post } from "./steps";

const TRANSITION = 14;

type Scene = {
  id: string;
  component: React.FC;
  duration: number;
  // Frame (inside the scene) its styleframe shows.
  keyframe: number;
  // How this scene comes in over the one before.
  enter?: TransitionPresentation<Record<string, unknown>>;
};

// Storyboard timings (STORYBOARD.md); each transition overlaps two scenes by TRANSITION frames.
export const CREATOR_SCENES: Scene[] = [
  { id: "C01", component: C01Hook, duration: 125, keyframe: 110 },
  { id: "C02", component: C02Twist, duration: 120, keyframe: 100, enter: slide({ direction: "from-right" }) },
  { id: "C03", component: C03Problem, duration: 125, keyframe: 82, enter: slide({ direction: "from-bottom" }) },
  { id: "C04", component: C04Logo, duration: 70, keyframe: 50, enter: wipe({ direction: "from-left" }) },
  { id: "C05", component: C05Profile, duration: 155, keyframe: 145, enter: slide({ direction: "from-bottom" }) },
  { id: "C06", component: C06Swipe, duration: 215, keyframe: 165, enter: slide({ direction: "from-right" }) },
  { id: "C07", component: C07Chat, duration: 155, keyframe: 148, enter: slide({ direction: "from-right" }) },
  { id: "C08", component: C08Paid, duration: 125, keyframe: 110, enter: slide({ direction: "from-right" }) },
  { id: "C09", component: C09Post, duration: 130, keyframe: 120, enter: slide({ direction: "from-right" }) },
  { id: "C10", component: C10Payout, duration: 100, keyframe: 90, enter: slide({ direction: "from-right" }) },
  { id: "C11", component: C11Cta, duration: 100, keyframe: 95, enter: wipe({ direction: "from-bottom" }) },
];

export const CREATOR_DURATION = CREATOR_SCENES.reduce((total, scene, i) => total + scene.duration - (i > 0 ? TRANSITION : 0), 0);

export const CreatorVideo: React.FC = () => (
  <TransitionSeries>
    {CREATOR_SCENES.map(({ id, component: Component, duration, enter }) => (
      <Fragment key={id}>
        {enter && <TransitionSeries.Transition presentation={enter} timing={linearTiming({ durationInFrames: TRANSITION })} />}
        <TransitionSeries.Sequence durationInFrames={duration}>
          <Component />
        </TransitionSeries.Sequence>
      </Fragment>
    ))}
  </TransitionSeries>
);
