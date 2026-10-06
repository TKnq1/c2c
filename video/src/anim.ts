import type { CSSProperties } from "react";
import { Easing, interpolate, spring, type SpringConfig } from "remotion";
import { FPS, GUTTER } from "./theme";

// FPS is fixed instead of read from useVideoConfig, so timings don't depend on the composition a scene runs in.

// 0 → 1, settles without overshoot.
export function ease(frame: number, delay: number, config: Partial<SpringConfig> = {}) {
  return spring({ frame: frame - delay, fps: FPS, config: { damping: 200, ...config } });
}

// 0 → 1 with a bounce, for things that pop in.
export function pop(frame: number, delay: number) {
  return spring({ frame: frame - delay, fps: FPS, config: { damping: 11, stiffness: 170, mass: 0.8 } });
}

// Linear 0 → 1 between two frames (eased out), clamped.
export function ramp(frame: number, from: number, to: number, easing = Easing.out(Easing.cubic)) {
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });
}

export function mix(p: number, from: number, to: number) {
  return from + (to - from) * p;
}

// Fade in while rising into place.
export function enterUp(p: number, distance = 60): CSSProperties {
  return { opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * distance}px)` };
}

export function popIn(p: number, from = 0.6): CSSProperties {
  return { opacity: Math.min(1, p * 2), transform: `scale(${mix(p, from, 1)})` };
}

export function euro(value: number) {
  return `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

export function thousands(value: number) {
  return Math.round(value).toLocaleString("de-DE");
}

// The browser window rising into place from below the frame.
export function browserIn(frame: number, top: number, delay = 8): CSSProperties {
  return { position: "absolute", top, left: GUTTER, transform: `translateY(${(1 - ease(frame, delay, { stiffness: 80 })) * 1300}px)` };
}

// Interpolate with clamping and a soft in-out curve, for pointer paths.
export function path(frame: number, frames: number[], values: number[]) {
  return interpolate(frame, frames, values, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
}
