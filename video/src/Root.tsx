import { Composition } from "remotion";
import { BrandVideo } from "./brand/BrandVideo";
import { CreatorVideo } from "./creator/CreatorVideo";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CreatorVideo" component={CreatorVideo} durationInFrames={45 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
    <Composition id="BrandVideo" component={BrandVideo} durationInFrames={35 * FPS} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
