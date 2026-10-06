import type { ReactNode } from "react";
import { Easing, useCurrentFrame } from "remotion";
import { IoChatbubble, IoHeart, IoPlay, IoShareSocial } from "react-icons/io5";
import { ease, enterUp, path, pop, popIn, ramp } from "../anim";
import { MATCH_CUT_HEADER } from "../series";
import { Sfx } from "../audio";
import { Cursor, LogoReveal } from "../components/shared-scenes";
import { Avatar, Headline, Photo, PhoneOutline, SceneHeader, Stage } from "../components/ui";
import { colors, GUTTER, type PhotoKey } from "../theme";

// The flick that throws the ad out, and the creator video sliding up behind it.
const FLICK = 14;
const NEXT = 20;

// First second decides whether people keep watching: the ad and the question are there from frame 0, the flick
// follows half a second later.
export const B01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const drag = ramp(frame, 2, FLICK, Easing.inOut(Easing.quad));
  const thrown = ramp(frame, FLICK, FLICK + 12, Easing.in(Easing.quad));
  const dx = -50 * drag - 900 * thrown;
  const rotate = -4 * drag - 28 * thrown;
  const lines = ramp(frame, FLICK, FLICK + 6) * (1 - ramp(frame, FLICK + 16, FLICK + 26));
  const next = ease(frame, NEXT, { stiffness: 120 });
  // The thumb holds the ad's centre (phone coordinates) from the first frame and lets go on the flick.
  const cursorX = path(frame, [0, FLICK, FLICK + 8], [320, 320 - 50 * 0.9, 220]);
  const cursorY = path(frame, [0, FLICK, FLICK + 8], [490, 480, 520]);

  return (
    <Stage>
      <div style={{ position: "absolute", top: 150, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 10 }}>
        <Headline parts={["Deine", "Werbung?"]} size={124} start={-7} />
        <Headline parts={[{ mark: "Weggewischt." }]} size={124} start={FLICK} />
      </div>
      <PhoneOutline width={640} height={1240} style={{ position: "absolute", top: 600, left: 220 }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - next) * 1240}px)`, opacity: next > 0.001 ? 1 : 0 }}>
          <Photo photo="serum" />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 45%)" }} />
        </div>
        <div style={{ position: "absolute", inset: 0, paddingTop: 110, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: 560,
              height: 760,
              borderRadius: 12,
              backgroundColor: colors.fog,
              border: `2px solid ${colors.line}`,
              position: "relative",
              transform: `translateX(${dx}px) rotate(${rotate}deg)`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 20,
            }}
          >
            <span style={{ position: "absolute", top: 24, left: 24, fontSize: 24, fontWeight: 700, padding: "6px 14px", borderRadius: 4, backgroundColor: colors.stone, color: colors.paper }}>
              Anzeige
            </span>
            <span style={{ fontSize: 96, fontWeight: 900, color: colors.stone }}>SALE</span>
            <span style={{ fontSize: 56, fontWeight: 900, color: colors.stone }}>−20 %</span>
            <span style={{ marginTop: 20, padding: "16px 40px", borderRadius: 4, backgroundColor: colors.stone, color: colors.paper, fontSize: 30, fontWeight: 700 }}>Jetzt kaufen</span>
          </div>
        </div>
        {[300, 420, 540].map((top, i) => (
          <div
            key={top}
            style={{
              position: "absolute",
              top: top + 200,
              left: 330 + i * 30,
              width: 200 - i * 40,
              height: 10,
              borderRadius: 999,
              backgroundColor: colors.stone,
              opacity: lines,
              transform: `translateX(${(1 - lines) * 60}px)`,
            }}
          />
        ))}
        <Cursor x={cursorX} y={cursorY} pressed={frame < FLICK + 2 ? 1 : 0} opacity={1 - ramp(frame, FLICK + 2, FLICK + 10)} />
      </PhoneOutline>
      <Sfx name="hit" at={0} volume={0.55} />
      <Sfx name="swipe" at={FLICK} volume={0.8} />
      <Sfx name="whoosh" at={NEXT} volume={0.3} />
    </Stage>
  );
};

export const B01_BLUR: [number, number][] = [[FLICK - 4, NEXT + 22]];

const UgcPost: React.FC<{
  photo: PhotoKey;
  name: string;
  handle: string;
  caption: string;
  // Words of the caption shown so far, like burned-in subtitles.
  words: number;
  counts: [string, string, string];
  // 0..1: name and action column fading in over the photo.
  ui: number;
  width: number;
  height: number;
}> = ({ photo, name, handle, caption, words, counts, ui, width, height }) => (
  <PhoneOutline width={width} height={height}>
    <Photo photo={photo} style={{ position: "absolute", inset: 0 }} />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 45%)" }} />
    <div style={{ position: "absolute", top: 110, left: 34, display: "flex", alignItems: "center", gap: 16, color: colors.paper, ...enterUp(ui, 30) }}>
      <Avatar name={name} size={72} style={{ border: `4px solid ${colors.paper}` }} />
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>{name}</div>
        <div style={{ fontSize: 24, opacity: 0.85 }}>{handle}</div>
      </div>
    </div>
    <div style={{ position: "absolute", right: 28, bottom: 230, display: "flex", flexDirection: "column", gap: 34, alignItems: "center", color: colors.paper, fontSize: 24, fontWeight: 700, opacity: ui }}>
      {[<IoHeart key="h" size={60} />, <IoChatbubble key="c" size={54} />, <IoShareSocial key="s" size={54} />].map((icon, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {icon}
          {counts[i]}
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 34, right: 130, bottom: 80 }}>
      {words > 0 && (
        <span style={{ backgroundColor: colors.paper, color: colors.ink, fontSize: 34, fontWeight: 900, lineHeight: 1.45, padding: "4px 12px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
          {caption.split(" ").slice(0, words).join(" ")}
        </span>
      )}
    </div>
  </PhoneOutline>
);

const FLOATING = [
  { x: 90, y: 820, rotate: -12, delay: 40, icon: <IoHeart size={60} /> },
  { x: 880, y: 1000, rotate: 10, delay: 52, icon: <IoChatbubble size={54} /> },
  { x: 70, y: 1500, rotate: 8, delay: 64, icon: <IoShareSocial size={54} /> },
];

const Floating: React.FC<{ x: number; y: number; rotate: number; p: number; bob: number; children: ReactNode }> = ({ x, y, rotate, p, bob, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y + bob,
      transform: `rotate(${rotate}deg) scale(${p})`,
      opacity: Math.min(1, p * 2),
      width: 120,
      height: 120,
      borderRadius: 999,
      backgroundColor: colors.ink,
      color: colors.paper,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 18px 40px rgba(7,7,7,0.25)",
    }}
  >
    {children}
  </div>
);

const CAPTION = "ok, dieses Serum ist ehrlich gesagt mein neues Lieblingsteil";

function compact(value: number) {
  return value >= 1000 ? `${(value / 1000).toFixed(1).replace(".", ",")}K` : String(Math.round(value));
}

export const B02Ugc: React.FC = () => {
  const frame = useCurrentFrame();
  const counted = ramp(frame, 20, 75);
  const words = Math.floor(ramp(frame, 22, 70, Easing.linear) * CAPTION.split(" ").length);

  return (
    <Stage>
      {/* Starts once the match cut has faded the previous headline out. */}
      <SceneHeader parts={["Echte Creator. Echte Videos.", { mark: "Echtes Vertrauen." }]} size={92} start={MATCH_CUT_HEADER} />
      {/* Same phone, same place as at the end of the hook: the cut between the two is a match. */}
      <div style={{ position: "absolute", top: 600, left: 220 }}>
        <UgcPost
          photo="serum"
          name="Lena"
          handle="@lena.glow"
          caption={CAPTION}
          words={words}
          counts={[compact(12400 * counted), compact(318 * counted), compact(1100 * counted)]}
          ui={ease(frame, 10)}
          width={640}
          height={1240}
        />
      </div>
      {FLOATING.map(({ x, y, rotate, delay, icon }, i) => (
        <Floating key={delay} x={x} y={y} rotate={rotate} p={pop(frame, delay)} bob={Math.sin((frame + i * 20) / 12) * 10}>
          {icon}
        </Floating>
      ))}
      <Sfx name="like" at={40} volume={0.6} />
      <Sfx name="pop" at={52} volume={0.45} />
      <Sfx name="pop" at={64} volume={0.45} />
    </Stage>
  );
};

const GRID: PhotoKey[] = ["serum", "matcha", "headphones", "glasses", "lipstick", "tote", "cream", "lotion", "flask"];
const TILE_DELAY = (i: number) => 6 + i * 4;

export const B03Growth: React.FC = () => {
  const frame = useCurrentFrame();
  const draw = ramp(frame, 52, 92, Easing.inOut(Easing.cubic));
  const dot = pop(frame, 90);

  return (
    <Stage>
      <SceneHeader parts={["Mehr Content. Mehr Reichweite.", { mark: "Schneller wachsen." }]} size={88} start={0} />
      <div style={{ position: "absolute", top: 600, left: GUTTER, right: GUTTER, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {GRID.map((p, i) => (
          <div key={p} style={{ height: 260, borderRadius: 8, overflow: "hidden", position: "relative", ...popIn(pop(frame, TILE_DELAY(i)), 0.6) }}>
            <Photo photo={p} />
            <IoPlay size={44} color={colors.paper} style={{ position: "absolute", left: 18, bottom: 16, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }} />
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          top: 1450,
          left: GUTTER,
          right: GUTTER,
          height: 360,
          borderRadius: 16,
          backgroundColor: colors.paper,
          boxShadow: "0 40px 90px rgba(7,7,7,0.2), 0 0 0 2px rgba(7,7,7,0.06)",
          padding: 40,
          ...enterUp(ease(frame, 44), 120),
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: colors.graphite }}>Reichweite</div>
        <svg width="100%" height="240" viewBox="0 0 860 280" preserveAspectRatio="none" style={{ marginTop: 10 }}>
          {[70, 140, 210].map((y) => (
            <line key={y} x1="0" x2="860" y1={y} y2={y} stroke={colors.fog} strokeWidth="3" />
          ))}
          <path d="M0 250 C 160 245, 260 230, 380 200 S 600 120, 700 70 S 820 20, 860 10 L 860 280 L 0 280 Z" fill="rgba(7,7,7,0.06)" opacity={ramp(frame, 60, 92)} />
          <path
            d="M0 250 C 160 245, 260 230, 380 200 S 600 120, 700 70 S 820 20, 860 10"
            fill="none"
            stroke={colors.ink}
            strokeWidth="9"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={1 - draw}
          />
          <circle cx="852" cy="12" r={16 * dot} fill={colors.ink} />
        </svg>
      </div>
      {GRID.map((p, i) => (
        <Sfx key={p} name="pop-low" at={TILE_DELAY(i)} volume={0.2} />
      ))}
      <Sfx name="swipe" at={44} volume={0.3} />
      <Sfx name="pop" at={90} volume={0.5} />
    </Stage>
  );
};

export const B04Logo: React.FC = () => <LogoReveal line="UGC-Creator finden. In Minuten." />;
