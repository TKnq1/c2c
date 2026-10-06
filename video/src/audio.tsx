import { createContext, useContext } from "react";
import { Html5Audio, Sequence, staticFile } from "remotion";

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
  success: "sounds/success.mp3",
} as const;

export type SfxName = keyof typeof FILES;

// Lets a render switch the sound effects off, e.g. for a music-only stem.
export const SfxEnabled = createContext(true);

// One sound effect, `at` frames into the current sequence.
export const Sfx: React.FC<{ name: SfxName; at: number; volume?: number }> = ({ name, at, volume = 0.6 }) => {
  if (!useContext(SfxEnabled)) return null;
  return (
    <Sequence from={at} layout="none">
      <Html5Audio src={staticFile(FILES[name])} volume={volume} />
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
