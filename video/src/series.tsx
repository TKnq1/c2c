import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { Fragment } from "react";
import { Html5Audio, staticFile } from "remotion";
import { Sfx, SfxEnabled } from "./audio";
import { SceneContext } from "./camera";
import { MotionBlur } from "./motion-blur";

// One beat of the music (120 BPM at 30 fps). Scene durations and the transition are whole beats, so every cut
// lands on a beat; scripts/make-audio.py lists the same scene starts in beats.
export const BEAT = 15;
const TRANSITION = BEAT;

// Music sits under a voiceover that gets added later, so it stays well below full level.
const MUSIC_VOLUME = 0.5;

// Every transition is blurred, plus the browser or phone rising in right after it.
const ENTER_BLUR = TRANSITION + 20;

// A scene entering by match cut (a fade over the same picture) starts its headline this late, when the previous
// headline is almost gone.
export const MATCH_CUT_HEADER = 10;

// Default camera: a slow 3 % push-in over the scene.
const ZOOM: [number, number] = [1, 1.03];

export type Scene = {
  id: string;
  component: React.FC;
  duration: number;
  // Frame (inside the scene) its styleframe shows.
  keyframe: number;
  // How this scene comes in over the one before.
  enter?: TransitionPresentation<Record<string, unknown>>;
  // A whoosh under the transition. Off where the music has its own hit (logo, call to action) or the cut is a match.
  whoosh?: boolean;
  // Camera zoom at the first and last frame. A scene that continues the previous one's picture starts where it ended.
  zoom?: [number, number];
  // Frame ranges inside the scene with fast movement, for motion blur.
  blur?: [number, number][];
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

function blurWindows(scenes: Scene[]): [number, number][] {
  const starts = sceneStarts(scenes);
  return scenes.flatMap((scene, i) => [
    ...(scene.enter ? [[starts[i], starts[i] + ENTER_BLUR] as [number, number]] : []),
    ...(scene.blur ?? []).map(([from, to]) => [starts[i] + from, starts[i] + to] as [number, number]),
  ]);
}

// A scene with its camera, for the video and for its styleframe.
export const SceneFrame: React.FC<{ scene: Scene }> = ({ scene: { component: Component, duration, zoom = ZOOM } }) => (
  <SceneContext.Provider value={{ duration, zoom }}>
    <Component />
  </SceneContext.Provider>
);

export const SceneSeries: React.FC<VideoProps & { scenes: Scene[]; bed: string }> = ({ scenes, bed, music, sfx }) => {
  const starts = sceneStarts(scenes);
  return (
    <SfxEnabled.Provider value={sfx}>
      {music && <Html5Audio src={staticFile(bed)} volume={MUSIC_VOLUME} />}
      {scenes.map(({ id, enter, whoosh = true }, i) => (enter && whoosh ? <Sfx key={id} name="whoosh" at={starts[i]} volume={0.3} /> : null))}
      <MotionBlur windows={blurWindows(scenes)} durationInFrames={seriesDuration(scenes)}>
        <TransitionSeries>
          {scenes.map((scene) => (
            <Fragment key={scene.id}>
              {scene.enter && <TransitionSeries.Transition presentation={scene.enter} timing={linearTiming({ durationInFrames: TRANSITION })} />}
              <TransitionSeries.Sequence durationInFrames={scene.duration}>
                <SceneFrame scene={scene} />
              </TransitionSeries.Sequence>
            </Fragment>
          ))}
        </TransitionSeries>
      </MotionBlur>
    </SfxEnabled.Provider>
  );
};
