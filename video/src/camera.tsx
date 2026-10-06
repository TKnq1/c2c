import { createContext, useContext } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

// The scene a component is drawn in: its length and the camera's zoom from its first to its last frame.
export type SceneCamera = { duration: number; zoom: [number, number] };

export const SceneContext = createContext<SceneCamera | null>(null);

// A slow push-in over the whole scene. 0..1 progress plus the zoom at this frame; no scene, no movement.
export function useCamera() {
  const scene = useContext(SceneContext);
  const frame = useCurrentFrame();
  if (!scene) return { progress: 0, zoom: 1 };
  const progress = interpolate(frame, [0, scene.duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.sin),
  });
  return { progress, zoom: scene.zoom[0] + (scene.zoom[1] - scene.zoom[0]) * progress };
}

// How much less the headline layer moves than the content, for depth.
export const HEADER_DEPTH = 0.45;

// Upward drift that goes with the zoom (16 px per 3 %). Tied to the zoom, not the scene's progress, so a scene
// that picks up the previous one's zoom also picks up its position.
export function cameraDrift(zoom: number) {
  return -(zoom - 1) * 530;
}
