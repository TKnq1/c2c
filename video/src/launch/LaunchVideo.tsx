import { AbsoluteFill, Easing, Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { mix } from "../anim";
import { Sfx, SfxEnabled, SfxGain } from "../audio";
import { SceneSpeed, useFrame } from "../frame";
import { LAUNCH_HEIGHT, LAUNCH_WIDTH, Stage, useStage, VERTICAL_HEIGHT, VERTICAL_WIDTH } from "./kit";
import { LAUNCH_DURATION, LAUNCH_SCENES, OVERLAP, type TimedScene, VERTICAL_DURATION, VERTICAL_SCENES } from "./scenes";

// The launch video (LAUNCH.md), 16:9, and its 9:16 cut: the scenes end to end on the music's beat grid, handed over so the camera seems
// to keep moving through one take (scenes.tsx, `exit`). A dive zooms hard into a point and the next scene comes up out
// of its own focus, from deep in and out of focus, with a shimmering whoosh; a pan slides the camera on and the next
// scene arrives from the other side, the two meeting edge to edge, motion-blurred along the move.
// The music (scripts/make-audio.py --launch) follows the same grid, a bed for each cut.
// The dive starts a little before the next scene does, so the two overlap.
const EXIT = 14;
const MUSIC_VOLUME = 0.7;
// The reference's effects are minimal: quiet under the music, never on top of it.
const SFX_GAIN = 0.6;
const EMERGE = 2.6;
const PAN_BLUR = 42;

export { LAUNCH_DURATION, VERTICAL_DURATION };

const clampEase = { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) } as const;

const Shell: React.FC<{ scene: TimedScene; first: boolean; children: React.ReactNode }> = ({ scene, first, children }) => {
  const frame = useFrame();
  const { width, height } = useStage();
  const transforms: string[] = [];
  let opacity = 1;
  let blur = 0;
  const motion = { x: 0, y: 0 };
  let origin = "50% 50%";
  // Coming in.
  const p = first ? 1 : interpolate(frame, [0, OVERLAP], [0, 1], clampEase);
  if (!first && p < 1) {
    const came = scene.came;
    if (came && "pan" in came) {
      if (came.pan === "left") transforms.push(`translateX(${(1 - p) * width}px)`);
      else transforms.push(`translateY(${(1 - p) * height}px)`);
      motion[came.pan === "left" ? "x" : "y"] = Math.sin(Math.PI * p) * PAN_BLUR;
    } else if (came) {
      transforms.push(`scale(${mix(p, EMERGE, 1)})`);
      origin = scene.focus ?? "50% 50%";
      blur = (1 - p) * 24;
      opacity = Math.min(1, p * 2.2);
    } else {
      opacity = p;
      blur = (1 - p) * 16;
    }
  }
  // Going out.
  const exit = scene.exit;
  if (exit && "pan" in exit) {
    const q = interpolate(frame, [scene.duration - OVERLAP, scene.duration], [0, 1], clampEase);
    if (q > 0) {
      transforms.push(exit.pan === "left" ? `translateX(${-q * width}px)` : `translateY(${-q * height}px)`);
      motion[exit.pan === "left" ? "x" : "y"] = Math.max(motion[exit.pan === "left" ? "x" : "y"], Math.sin(Math.PI * q) * PAN_BLUR);
    }
  } else if (exit) {
    const out = interpolate(frame, [scene.duration - EXIT, scene.duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
    if (out > 0) {
      transforms.push(`scale(${mix(out, 1, exit.scale ?? 7)})`);
      origin = exit.dive;
      blur = Math.max(blur, out * 30);
    }
  }
  const filterId = `move-${scene.id}`;
  const moving = motion.x > 0.3 || motion.y > 0.3;
  const filter = [moving ? `url(#${filterId})` : "", blur > 0.05 ? `blur(${blur.toFixed(1)}px)` : ""].join(" ").trim();
  return (
    <AbsoluteFill style={{ opacity, transform: transforms.join(" ") || undefined, transformOrigin: origin, filter: filter || undefined }}>
      {moving && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation={`${motion.x.toFixed(1)} ${motion.y.toFixed(1)}`} />
          </filter>
        </svg>
      )}
      {/* A dive's shimmer swells into the cut, peaking 23 frames after it starts; a pan gets a quick whoosh. */}
      {exit && "dive" in exit && <Sfx name="shimmer" at={scene.duration - OVERLAP - 23} volume={0.45} />}
      {exit && "pan" in exit && <Sfx name="swipe" at={scene.duration - OVERLAP - 5} volume={0.35} />}
      <SceneSpeed.Provider value={scene.speed ?? 1}>{children}</SceneSpeed.Provider>
    </AbsoluteFill>
  );
};

type CutProps = { music?: boolean; sfx?: boolean };

const Cut: React.FC<CutProps & { scenes: TimedScene[]; bed: string; width: number; height: number }> = ({ scenes, bed, width, height, music = true, sfx = true }) => (
  <Stage.Provider value={{ width, height }}>
    <AbsoluteFill style={{ backgroundColor: "#070707" }}>
      {music && <Html5Audio src={staticFile(bed)} volume={MUSIC_VOLUME} />}
      <SfxEnabled.Provider value={sfx}>
        <SfxGain.Provider value={SFX_GAIN}>
          {scenes.map((scene, i) => (
            <Sequence key={scene.id} from={scene.start} durationInFrames={scene.duration} name={scene.id}>
              <Shell scene={scene} first={i === 0}>
                <scene.component />
              </Shell>
            </Sequence>
          ))}
        </SfxGain.Provider>
      </SfxEnabled.Provider>
    </AbsoluteFill>
  </Stage.Provider>
);

export const LaunchVideo: React.FC<CutProps> = (props) => <Cut {...props} scenes={LAUNCH_SCENES} bed="music/launch-bed.mp3" width={LAUNCH_WIDTH} height={LAUNCH_HEIGHT} />;

export const LaunchVertical: React.FC<CutProps> = (props) => <Cut {...props} scenes={VERTICAL_SCENES} bed="music/vertical-bed.mp3" width={VERTICAL_WIDTH} height={VERTICAL_HEIGHT} />;
