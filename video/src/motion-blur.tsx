import { Children, type ReactNode } from "react";
import { AbsoluteFill, Freeze, useCurrentFrame } from "remotion";
import { SfxEnabled } from "./audio";

// Motion blur by averaging the frame with copies frozen at nearby sub-frames, centred on the current frame (unlike
// @remotion/motion-blur, which samples ahead of it). Only `windows` get the extra samples, so the cost stays where
// things move fast. The copy at the exact frame is never frozen and is the only one that plays sound; it keeps its
// place in the tree, so nothing remounts when a window starts or ends.
export const MotionBlur: React.FC<{
  children: ReactNode;
  // Absolute frame ranges [from, to] that get blurred.
  windows: [number, number][];
  durationInFrames: number;
  // Odd, so one sample sits exactly on the frame.
  samples?: number;
  // Fraction of a frame the shutter stays open (0.5 = a film camera's 180°).
  shutter?: number;
}> = ({ children, windows, durationInFrames, samples = 7, shutter = 0.5 }) => {
  const frame = useCurrentFrame();
  const active = windows.some(([from, to]) => frame >= from && frame <= to);
  const n = active ? samples : 1;
  const half = (n - 1) / 2;
  const layer = n > 1 ? { mixBlendMode: "plus-lighter" as const, filter: `opacity(${1 / n})` } : undefined;
  const child = Children.only(children);

  return (
    <AbsoluteFill style={{ isolation: "isolate" }}>
      {Array.from({ length: n }, (_, i) => {
        const step = i - half;
        if (step === 0) {
          return (
            <AbsoluteFill key="sharp" style={layer}>
              {child}
            </AbsoluteFill>
          );
        }
        const at = Math.min(durationInFrames - 1, Math.max(0, frame + (step / n) * shutter));
        return (
          <AbsoluteFill key={`blur${step}`} style={layer}>
            <SfxEnabled.Provider value={false}>
              <Freeze frame={at}>{child}</Freeze>
            </SfxEnabled.Provider>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
