import { CREATOR_SCENES } from "../creator/CreatorVideo";
import { B01Hook, B02Ugc, B03Growth, B04Logo, B05Request, B06Creators, B07Safe, B08Founding, B09Cta } from "./brand";
import LABELS from "./labels.json";

// Brand scenes are still static (no animation yet); any frame past their intro shows them complete.
const BRAND_FRAME = 60;

const BRAND: Record<string, React.FC> = {
  B01: B01Hook,
  B02: B02Ugc,
  B03: B03Growth,
  B04: B04Logo,
  B05: B05Request,
  B06: B06Creators,
  B07: B07Safe,
  B08: B08Founding,
  B09: B09Cta,
};

// One styleframe per storyboard scene (STORYBOARD.md): a short composition whose last frame is the scene's keyframe,
// so the render script takes that frame. Labels live in labels.json so the render script can read them.
export const STYLEFRAMES = (Object.keys(LABELS) as (keyof typeof LABELS)[]).map((id) => {
  const creator = CREATOR_SCENES.find((scene) => scene.id === id);
  return {
    id,
    label: LABELS[id],
    component: creator ? creator.component : BRAND[id],
    keyframe: creator ? creator.keyframe : BRAND_FRAME,
  };
});
