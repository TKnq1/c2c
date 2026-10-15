import { AbsoluteFill, Easing, Html5Audio, interpolate, Sequence, staticFile } from "remotion";
import { mix, ramp } from "../anim";
import { Sfx, SfxEnabled, SfxGain } from "../audio";
import { useFrame } from "../frame";
import { LAUNCH_DURATION, LAUNCH_SCENES, OVERLAP, type TimedScene } from "./scenes";

// The launch video (LAUNCH.md), 16:9: the scenes end to end on the music's beat grid. Each one comes in over the last
// OVERLAP frames of the one before, out of a blur ("fade") or out of the previous scene's zoom ("zoom"); a scene with
// an `exit` leaves by zooming hard into that point, the reference's whip into a word, with a whoosh under it.
// The music (scripts/make-audio.py --launch) follows the same grid.
// The exit zoom starts a little before the next scene does, so the two overlap.
const EXIT = 14;
const MUSIC_VOLUME = 0.7;
// The reference's effects are minimal: quiet under the music, never on top of it.
const SFX_GAIN = 0.6;

export { LAUNCH_DURATION };

const Shell: React.FC<{ scene: TimedScene; first: boolean; children: React.ReactNode }> = ({ scene, first, children }) => {
  const frame = useFrame();
  const p = first ? 1 : ramp(frame, 0, OVERLAP);
  const zoomIn = scene.enter === "zoom";
  // Coming in: opacity and blur, plus a settle from slightly too big after a whip.
  let transform = zoomIn ? `scale(${mix(p, 1.5, 1)})` : undefined;
  let blur = (1 - p) * (zoomIn ? 22 : 16);
  if (scene.exit) {
    const out = interpolate(frame, [scene.duration - EXIT, scene.duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
    if (out > 0) {
      transform = `${transform ?? ""} scale(${mix(out, 1, scene.exitScale ?? 7)})`;
      blur = Math.max(blur, out * 30);
    }
  }
  return (
    <AbsoluteFill style={{ opacity: p, transform, transformOrigin: scene.exit ?? "50% 50%", filter: blur > 0.05 ? `blur(${blur}px)` : undefined }}>
      {/* The whip peaks on the cut (the next scene's start), 18 frames after it starts. */}
      {scene.exit && <Sfx name="whip" at={scene.duration - OVERLAP - 15} volume={0.5} />}
      {children}
    </AbsoluteFill>
  );
};

export const LaunchVideo: React.FC<{ music?: boolean; sfx?: boolean }> = ({ music = true, sfx = true }) => (
  <AbsoluteFill style={{ backgroundColor: "#070707" }}>
    {music && <Html5Audio src={staticFile("music/launch-bed.mp3")} volume={MUSIC_VOLUME} />}
    <SfxEnabled.Provider value={sfx}>
      <SfxGain.Provider value={SFX_GAIN}>
      {LAUNCH_SCENES.map((scene, i) => (
        <Sequence key={scene.id} from={scene.start} durationInFrames={scene.duration} name={scene.id}>
          <Shell scene={scene} first={i === 0}>
            <scene.component />
          </Shell>
        </Sequence>
      ))}
      </SfxGain.Provider>
    </SfxEnabled.Provider>
  </AbsoluteFill>
);
