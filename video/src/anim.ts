import type { CSSProperties } from "react";
import { Easing, interpolate, spring, type SpringConfig } from "remotion";
import { FPS } from "./theme";

// FPS is fixed instead of read from useVideoConfig, so a scene frozen inside a <Still> (fps 1) animates the same.

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
