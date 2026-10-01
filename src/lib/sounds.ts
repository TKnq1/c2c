// Small UI sounds — for now the two swipe sounds in the Feed (made with the
// launch video's own synth, so the app and the video sound the same).
// Web Audio rather than <audio>: decoded once, then they play instantly.
const SOURCES = {
  "swipe-right": "/sounds/swipe-right.mp3",
  "swipe-left": "/sounds/swipe-left.mp3",
} as const;
type Sound = keyof typeof SOURCES;

const STORAGE_KEY = "sounds";

// On unless turned off in Settings. Stored per device, like dark mode.
export function soundsEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundsEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Private mode and the like — the switch just won't stick.
  }
}

let context: AudioContext | null = null;
const buffers = new Map<Sound, Promise<AudioBuffer | null>>();

function getContext() {
  if (context) return context;
  const AudioContextClass =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  // Behave like a phone's own UI sounds: silent when the ringer is off, and
  // mixed under whatever else is playing rather than pausing it (Safari 17+).
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession;
  if (session) session.type = "ambient";
  context = new AudioContextClass();
  return context;
}

function load(name: Sound) {
  let buffer = buffers.get(name);
  if (!buffer) {
    const ctx = getContext();
    buffer = ctx
      ? fetch(SOURCES[name])
          .then((res) => res.arrayBuffer())
          .then((data) => ctx.decodeAudioData(data))
          .catch(() => null)
      : Promise.resolve(null);
    buffers.set(name, buffer);
  }
  return buffer;
}

// Fetches and decodes ahead of time — call it as a swipe starts, so the
// sound is ready the moment the card is let go.
export function prepareSounds() {
  if (!soundsEnabled()) return;
  void load("swipe-right");
  void load("swipe-left");
}

// Has to run inside the gesture that triggers it (a pointerup or a click):
// that's what lets a browser start audio at all.
export function playSound(name: Sound, volume = 0.55) {
  if (!soundsEnabled()) return;
  const ctx = getContext();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  void load(name).then((buffer) => {
    if (!buffer) return;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.connect(gain).connect(ctx.destination);
    source.start();
  });
}
