import { createContext, useContext } from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";
import { useSceneSpeed } from "./frame";

// Synthesised by scripts/make-audio.py, except success (the app's own sound, scripts/make-success-sound.py).
const FILES = {
  whoosh: "sfx/whoosh.wav",
  swipe: "sfx/swipe.wav",
  pop: "sfx/pop.wav",
  "pop-low": "sfx/pop-low.wav",
  click: "sfx/click.wav",
  tick: "sfx/tick.wav",
  coin: "sfx/coin.wav",
  like: "sfx/like.wav",
  strike: "sfx/strike.wav",
  stamp: "sfx/stamp.wav",
  lock: "sfx/lock.wav",
  ding: "sfx/ding.wav",
  hit: "sfx/hit.wav",
  // The launch video's (scripts/make-audio.py --launch).
  "key-1": "sfx/key-1.wav",
  "key-2": "sfx/key-2.wav",
  "key-3": "sfx/key-3.wav",
  "key-del": "sfx/key-del.wav",
  whip: "sfx/whip.wav",
  slam: "sfx/slam.wav",
  select: "sfx/select.wav",
  boom: "sfx/boom.wav",
  shimmer: "sfx/shimmer.wav",
  success: "sounds/success.mp3",
} as const;

export type SfxName = keyof typeof FILES;

// Lets a render switch the sound effects off, e.g. for a music-only stem.
export const SfxEnabled = createContext(true);

// Scales every effect's volume under it, for a video whose effects sit lower in the mix (the launch video's).
export const SfxGain = createContext(1);

// One sound effect, `at` frames into the current scene as drawn: a scene the video plays faster has it sooner.
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.6 }) => {
  const speed = useSceneSpeed();
  const gain = useContext(SfxGain);
  if (!useContext(SfxEnabled)) return null;
  return (
    <Sequence from={Math.round(at / speed)} layout="none">
      <Html5Audio src={staticFile(FILES[name])} volume={volume * gain} />
    </Sequence>
  );
};

// The same sound repeated every `every` frames from `from` up to (not including) `to`, e.g. typing.
export const SfxRepeat: React.FC<{ name: SfxName; from: number; to: number; every: number; volume?: number }> = ({ name, from, to, every, volume = 0.3 }) => (
  <>
    {Array.from({ length: Math.ceil((to - from) / every) }, (_, i) => (
      <Sfx key={i} name={name} at={from + i * every} volume={volume * (0.8 + 0.2 * Math.sin(i * 2.3))} />
    ))}
  </>
);
