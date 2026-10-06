import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { Fragment } from "react";
import { Html5Audio, staticFile } from "remotion";
import { Sfx, SfxEnabled } from "./audio";

// One beat of the music (120 BPM at 30 fps). Scene durations and the transition are whole beats, so every cut
// lands on a beat; scripts/make-audio.py lists the same scene starts in beats.
export const BEAT = 15;
const TRANSITION = BEAT;

// Music sits under a voiceover that gets added later, so it stays well below full level.
const MUSIC_VOLUME = 0.5;

export type Scene = {
  id: string;
  component: React.FC;
  duration: number;
  // Frame (inside the scene) its styleframe shows.
  keyframe: number;
  // How this scene comes in over the one before.
  enter?: TransitionPresentation<Record<string, unknown>>;
  // A whoosh under the transition. Off where the music has its own hit (logo, call to action).
  whoosh?: boolean;
};

export type VideoProps = {
  // Music bed.
  music: boolean;
  // UI sounds of the animations and transitions.
  sfx: boolean;
};

// Where each scene starts in the video: each transition overlaps two scenes by TRANSITION frames.
export function sceneStarts(scenes: Scene[]) {
  return scenes.map((_, i) => scenes.slice(0, i).reduce((total, scene) => total + scene.duration - TRANSITION, 0));
}

export function seriesDuration(scenes: Scene[]) {
  return sceneStarts(scenes)[scenes.length - 1] + scenes[scenes.length - 1].duration;
}

export const SceneSeries: React.FC<VideoProps & { scenes: Scene[]; bed: string }> = ({ scenes, bed, music, sfx }) => {
  const starts = sceneStarts(scenes);
  return (
    <SfxEnabled.Provider value={sfx}>
      {music && <Html5Audio src={staticFile(bed)} volume={MUSIC_VOLUME} />}
      {scenes.map(({ id, enter, whoosh = true }, i) => (enter && whoosh ? <Sfx key={id} name="whoosh" at={starts[i]} volume={0.3} /> : null))}
      <TransitionSeries>
        {scenes.map(({ id, component: Component, duration, enter }) => (
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
};
