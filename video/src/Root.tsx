import { Composition, Folder } from "remotion";
import { BrandVideo } from "./brand/BrandVideo";
import { CREATOR_DURATION, CreatorVideo } from "./creator/CreatorVideo";
import "./fonts";
import { STYLEFRAMES } from "./styleframes";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CreatorVideo" component={CreatorVideo} defaultProps={{ music: true, sfx: true }} durationInFrames={CREATOR_DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="BrandVideo" component={BrandVideo} durationInFrames={35 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Folder name="Styleframes">
      {STYLEFRAMES.map(({ id, component, keyframe }) => (
        <Composition key={id} id={id} component={component} durationInFrames={keyframe + 1} fps={FPS} width={WIDTH} height={HEIGHT} />
      ))}
    </Folder>
  </>
);
