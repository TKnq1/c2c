import { LAUNCH_HEIGHT, LAUNCH_WIDTH } from "./kit";
import { LAUNCH_SCENES } from "./scenes";

// One still per scene of the launch video: a composition that ends on the scene's keyframe, whose last frame the
// render script takes (like src/styleframes), to judge the look without playing it.
export const LAUNCH_STILLS = LAUNCH_SCENES.map(({ id, label, component, keyframe }) => ({ id, label, component, durationInFrames: keyframe + 1 }));

export { LAUNCH_HEIGHT, LAUNCH_WIDTH };
