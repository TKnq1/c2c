import { createContext, useContext } from "react";
import { useCurrentFrame } from "remotion";

// How much faster than drawn the video plays the current scene (see fitToVoice in src/series.tsx). Not Remotion's
// Sequence playbackRate: that misplaces the sounds nested in a scene.
export const SceneSpeed = createContext(1);

// The frame as the scene was drawn. Scenes animate on this, so a faster scene simply moves through its frames faster.
export function useFrame() {
  return useCurrentFrame() * useContext(SceneSpeed);
}

export function useSceneSpeed() {
  return useContext(SceneSpeed);
}
