import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Fragment } from "react";
import { Html5Audio, staticFile } from "remotion";
import { Sfx, SfxEnabled } from "../audio";
import { C01Hook, C02Twist, C03Problem, C04Logo } from "./intro";
import { C10Payout, C11Cta } from "./outro";
import { C05Profile, C06Swipe, C07Chat, C08Paid, C09Post } from "./steps";

// One beat of the music (120 BPM at 30 fps). Scene durations and the transition are whole beats, so every cut
// lands on a beat; scripts/make-audio.py lists the same scene starts in beats.
const BEAT = 15;
const TRANSITION = BEAT;

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
  { id: "C01", component: C01Hook, duration: 8 * BEAT, keyframe: 110 },
  { id: "C02", component: C02Twist, duration: 8 * BEAT, keyframe: 100, enter: slide({ direction: "from-right" }) },
  { id: "C03", component: C03Problem, duration: 8 * BEAT, keyframe: 82, enter: slide({ direction: "from-bottom" }) },
  { id: "C04", component: C04Logo, duration: 5 * BEAT, keyframe: 50, enter: wipe({ direction: "from-left" }) },
  { id: "C05", component: C05Profile, duration: 10 * BEAT, keyframe: 145, enter: slide({ direction: "from-bottom" }) },
  { id: "C06", component: C06Swipe, duration: 14 * BEAT, keyframe: 165, enter: slide({ direction: "from-right" }) },
  { id: "C07", component: C07Chat, duration: 10 * BEAT, keyframe: 148, enter: slide({ direction: "from-right" }) },
  { id: "C08", component: C08Paid, duration: 8 * BEAT, keyframe: 110, enter: slide({ direction: "from-right" }) },
  { id: "C09", component: C09Post, duration: 9 * BEAT, keyframe: 120, enter: slide({ direction: "from-right" }) },
  { id: "C10", component: C10Payout, duration: 7 * BEAT, keyframe: 90, enter: slide({ direction: "from-right" }) },
  { id: "C11", component: C11Cta, duration: 7 * BEAT, keyframe: 95, enter: wipe({ direction: "from-bottom" }) },
];

// Where each scene starts in the video.
const SCENE_STARTS = CREATOR_SCENES.map((_, i) => CREATOR_SCENES.slice(0, i).reduce((total, scene) => total + scene.duration - TRANSITION, 0));

export const CREATOR_DURATION = SCENE_STARTS[SCENE_STARTS.length - 1] + CREATOR_SCENES[CREATOR_SCENES.length - 1].duration;

export type CreatorVideoProps = {
  // Music bed (public/music/creator-bed.mp3).
  music: boolean;
  // UI sounds of the animations and transitions.
  sfx: boolean;
};

// Music sits under a voiceover that gets added later, so it stays well below full level.
const MUSIC_VOLUME = 0.5;

export const CreatorVideo: React.FC<CreatorVideoProps> = ({ music, sfx }) => (
  <SfxEnabled.Provider value={sfx}>
    {music && <Html5Audio src={staticFile("music/creator-bed.mp3")} volume={MUSIC_VOLUME} />}
    {CREATOR_SCENES.map(({ id, enter }, i) =>
      // Wipes land on the music's own hits (logo, call to action); only the slides get a whoosh.
      enter && id !== "C04" && id !== "C11" ? <Sfx key={id} name="whoosh" at={SCENE_STARTS[i]} volume={0.3} /> : null,
    )}
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
  </SfxEnabled.Provider>
);
