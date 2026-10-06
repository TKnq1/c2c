import { linearTiming, TransitionSeries, type TransitionPresentation } from "@remotion/transitions";
import { Fragment } from "react";
import { Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { Sfx, SfxEnabled } from "./audio";
import { SceneContext } from "./camera";
import { SceneSpeed } from "./frame";
import { MotionBlur } from "./motion-blur";
import { FPS } from "./theme";

// One beat of the music (120 BPM at 30 fps). Scene durations and the transition are whole beats, so every cut
// lands on a beat; scripts/make-audio.py reads the scene starts from src/voice/grid.json.
export const BEAT = 15;
const TRANSITION = BEAT;

// Music under the voice. It ducks further while a line is spoken.
const MUSIC_VOLUME = 0.5;
const MUSIC_UNDER_VOICE = 0.3;

// Every transition is blurred, plus the browser or phone rising in right after it.
const ENTER_BLUR = TRANSITION + 20;

// A scene entering by match cut (a fade over the same picture) starts its headline this late, when the previous
// headline is almost gone.
export const MATCH_CUT_HEADER = 10;

// Default camera: a slow 3 % push-in over the scene.
const ZOOM: [number, number] = [1, 1.03];

// Fitting the scenes to the voiceover: a line starts this many frames into its scene (the first one right away),
// and the next scene's transition starts no earlier than BREATH frames after the line ends. A scene that has to get
// shorter than drawn plays its animation faster, up to MAX_SPEED; the last scene holds a little after its line.
const VOICE_LEAD = 6;
const FIRST_LEAD = 2;
const BREATH = 6;
const LAST_HOLD = 30;
const MAX_SPEED = 1.5;

export type Scene = {
  id: string;
  component: React.FC;
  // Length as drawn, in frames. The video may shorten it to fit the voiceover (see fitToVoice).
  duration: number;
  // Frame (inside the scene, as drawn) its styleframe shows.
  keyframe: number;
  // How this scene comes in over the one before.
  enter?: TransitionPresentation<Record<string, unknown>>;
  // A whoosh under the transition. Off where the music has its own hit (logo, call to action) or the cut is a match.
  whoosh?: boolean;
  // Camera zoom at the first and last frame. A scene that continues the previous one's picture starts where it ended.
  zoom?: [number, number];
  // Frame ranges inside the scene (as drawn) with fast movement, for motion blur.
  blur?: [number, number][];
};

// One line of the voiceover (src/voice/*.json, written by scripts/make-voiceover.py).
export type VoiceLine = { file: string; seconds: number };

// A scene as it plays in the video: its length there, how much faster than drawn, and its line.
export type FittedScene = Scene & { speed: number; voice?: VoiceLine & { at: number; frames: number } };

export type VideoProps = {
  // Music bed.
  music: boolean;
  // UI sounds of the animations and transitions.
  sfx: boolean;
  // The voiceover.
  voice: boolean;
};

function toBeats(frames: number) {
  return Math.ceil(frames / BEAT) * BEAT;
}

// Each scene gets as long as its line needs (in whole beats), never so short that it plays more than MAX_SPEED
// times faster than drawn. A scene without a line keeps its length.
export function fitToVoice(scenes: Scene[], voice: Record<string, VoiceLine>): FittedScene[] {
  return scenes.map((scene, i) => {
    const line = voice[scene.id];
    if (!line) return { ...scene, speed: 1 };
    const frames = Math.ceil(line.seconds * FPS);
    const lead = i === 0 ? FIRST_LEAD : VOICE_LEAD;
    const last = i === scenes.length - 1;
    const needed = lead + frames + (last ? LAST_HOLD : TRANSITION + BREATH);
    const duration = Math.max(toBeats(needed), toBeats(scene.duration / MAX_SPEED));
    return { ...scene, duration, speed: Math.max(1, scene.duration / duration), voice: { ...line, at: lead, frames } };
  });
}

// Where each scene starts in the video: each transition overlaps two scenes by TRANSITION frames.
export function sceneStarts(scenes: Scene[]) {
  return scenes.map((_, i) => scenes.slice(0, i).reduce((total, scene) => total + scene.duration - TRANSITION, 0));
}

export function seriesDuration(scenes: Scene[]) {
  return sceneStarts(scenes)[scenes.length - 1] + scenes[scenes.length - 1].duration;
}

function blurWindows(scenes: FittedScene[]): [number, number][] {
  const starts = sceneStarts(scenes);
  return scenes.flatMap((scene, i) => [
    ...(scene.enter ? [[starts[i], starts[i] + ENTER_BLUR] as [number, number]] : []),
    ...(scene.blur ?? []).map(([from, to]) => [starts[i] + from / scene.speed, starts[i] + to / scene.speed] as [number, number]),
  ]);
}

// A scene with its camera, for the video and for its styleframe. `speed` > 1 when the video plays it faster:
// the scene's own frames (useFrame) then run that much faster, its length stays as drawn.
export const SceneFrame: React.FC<{ scene: Scene; speed?: number }> = ({ scene: { component: Component, duration, zoom = ZOOM }, speed = 1 }) => (
  <SceneSpeed.Provider value={speed}>
    <SceneContext.Provider value={{ duration: duration * speed, zoom }}>
      <Component />
    </SceneContext.Provider>
  </SceneSpeed.Provider>
);

// The music's volume: ducked a little more around each spoken line, with short ramps.
function musicVolume(lines: [number, number][]) {
  return (frame: number) => {
    let duck = 0;
    for (const [from, to] of lines) {
      duck = Math.max(duck, interpolate(frame, [from - 6, from, to, to + 10], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
    }
    return MUSIC_VOLUME * (1 - (1 - MUSIC_UNDER_VOICE / MUSIC_VOLUME) * duck);
  };
}

export const SceneSeries: React.FC<VideoProps & { scenes: FittedScene[]; bed: string }> = ({ scenes, bed, music, sfx, voice }) => {
  const starts = sceneStarts(scenes);
  const lines = scenes.flatMap((scene, i) => (scene.voice ? [[starts[i] + scene.voice.at, starts[i] + scene.voice.at + scene.voice.frames] as [number, number]] : []));
  return (
    <SfxEnabled.Provider value={sfx}>
      {music && <Html5Audio src={staticFile(bed)} volume={voice ? musicVolume(lines) : MUSIC_VOLUME} />}
      {voice &&
        scenes.map((scene, i) =>
          scene.voice ? (
            <Sequence key={scene.id} from={starts[i] + scene.voice.at} layout="none">
              <Html5Audio src={staticFile(scene.voice.file)} />
            </Sequence>
          ) : null,
        )}
      {scenes.map(({ id, enter, whoosh = true }, i) => (enter && whoosh ? <Sfx key={id} name="whoosh" at={starts[i]} volume={0.3} /> : null))}
      <MotionBlur windows={blurWindows(scenes)} durationInFrames={seriesDuration(scenes)}>
        <TransitionSeries>
          {scenes.map((scene) => (
            <Fragment key={scene.id}>
              {scene.enter && <TransitionSeries.Transition presentation={scene.enter} timing={linearTiming({ durationInFrames: TRANSITION })} />}
              <TransitionSeries.Sequence durationInFrames={scene.duration}>
                <SceneFrame scene={scene} speed={scene.speed} />
              </TransitionSeries.Sequence>
            </Fragment>
          ))}
        </TransitionSeries>
      </MotionBlur>
    </SfxEnabled.Provider>
  );
};
