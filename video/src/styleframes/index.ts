import { B01Hook, B02Ugc, B03Growth, B04Logo, B05Request, B06Creators, B07Safe, B08Founding, B09Cta } from "./brand";
import { C01Hook, C02Twist, C03Problem, C04Logo, C05Profile, C06Swipe, C07Chat, C08Paid, C09Post, C10Payout, C11Cta } from "./creator";
import LABELS from "./labels.json";

// One still per storyboard scene (STORYBOARD.md). Labels live in labels.json so the render script can read them.
const COMPONENTS: Record<keyof typeof LABELS, React.FC> = {
  C01: C01Hook,
  C02: C02Twist,
  C03: C03Problem,
  C04: C04Logo,
  C05: C05Profile,
  C06: C06Swipe,
  C07: C07Chat,
  C08: C08Paid,
  C09: C09Post,
  C10: C10Payout,
  C11: C11Cta,
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

export const STYLEFRAMES = (Object.keys(LABELS) as (keyof typeof LABELS)[]).map((id) => ({ id, label: LABELS[id], component: COMPONENTS[id] }));
