import { BRAND_SCENES } from "../brand/BrandVideo";
import { CREATOR_SCENES } from "../creator/CreatorVideo";
import LABELS from "./labels.json";

const SCENES = [...CREATOR_SCENES, ...BRAND_SCENES];

// One styleframe per storyboard scene (STORYBOARD.md): a short composition whose last frame is the scene's keyframe,
// so the render script takes that frame. Labels live in labels.json so the render script can read them.
export const STYLEFRAMES = (Object.keys(LABELS) as (keyof typeof LABELS)[]).map((id) => {
  const scene = SCENES.find((s) => s.id === id);
  if (!scene) throw new Error(`No scene ${id} for its styleframe label`);
  return { id, label: LABELS[id], component: scene.component, keyframe: scene.keyframe };
});
