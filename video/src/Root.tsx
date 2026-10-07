import { Composition, Folder } from "remotion";
import { BRAND_DURATION, BrandVideo } from "./brand/BrandVideo";
import { CREATOR_DURATION, CreatorVideo } from "./creator/CreatorVideo";
import "./fonts";
import { PINNED } from "./pinned";
import { POST_HEIGHT, POST_WIDTH } from "./posts/kit";
import { STYLEFRAMES } from "./styleframes";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CreatorVideo" component={CreatorVideo} defaultProps={{ music: true, sfx: true, voice: true }} durationInFrames={CREATOR_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="BrandVideo" component={BrandVideo} defaultProps={{ music: true, sfx: true, voice: true }} durationInFrames={BRAND_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="Styleframes">
      {STYLEFRAMES.map(({ id, component, keyframe }) => (
        <Composition key={id} id={id} component={component} durationInFrames={keyframe + 1} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
    <Folder name="Pinned">
      {PINNED.map(({ id, component, duration }) => (
        <Composition key={id} id={id} component={component} durationInFrames={duration} fps={FPS} width={POST_WIDTH} height={POST_HEIGHT} />
      ))}
    </Folder>
  </>
);
