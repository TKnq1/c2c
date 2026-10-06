import type { ReactNode } from "react";
import { Easing, useCurrentFrame } from "remotion";
import { IoChatbubble, IoHeart, IoPlay, IoShareSocial } from "react-icons/io5";
import { ease, enterUp, path, pop, popIn, ramp } from "../anim";
import { MATCH_CUT_HEADER } from "../series";
import { Sfx } from "../audio";
import { Cursor, LogoReveal } from "../components/shared-scenes";
import { Avatar, Photo, PhoneOutline, SceneHeader, Stage } from "../components/ui";
import { colors, GUTTER, type PhotoKey } from "../theme";

// Three ads flicked past, then the feed stops on a creator's video. Frames of each flick [from, to].
const FLICKS = [
  [3, 13],
  [16, 26],
  [29, 42],
] as const;
// Height of one item in the feed: the phone's screen.
const ITEM = 1240;

const ADS = [
  { big: "SALE", small: "−20 %", button: "Jetzt kaufen" },
  { big: "NEU", small: "Kollektion", button: "Jetzt shoppen" },
  { big: "GRATIS", small: "Versand", button: "Zum Angebot" },
];

const AdCard: React.FC<{ big: string; small: string; button: string }> = ({ big, small, button }) => (
  <div style={{ height: ITEM, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <div
      style={{
        width: 560,
        height: 860,
        borderRadius: 12,
        backgroundColor: colors.fog,
        border: `2px solid ${colors.line}`,
        position: "relative",
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
      <span style={{ fontSize: 110, fontWeight: 900, color: colors.stone }}>{big}</span>
      <span style={{ fontSize: 56, fontWeight: 900, color: colors.stone }}>{small}</span>
      <span style={{ marginTop: 20, padding: "16px 40px", borderRadius: 4, backgroundColor: colors.stone, color: colors.paper, fontSize: 30, fontWeight: 700 }}>
        {button}
      </span>
    </div>
  </div>
);

// First second decides whether people keep watching: the feed is moving from frame 0, ad after ad flicked away,
// and it only stops for a creator's video. That video carries straight into the next scene (match cut).
export const B01Hook: React.FC = () => {
  const frame = useCurrentFrame();
  // Each flick moves the feed one screen; the last one lands with a small bounce.
  const scrolled = FLICKS.reduce((total, [from, to], i) => {
    const p = i === FLICKS.length - 1 ? ease(frame, from, { damping: 13, stiffness: 120 }) : ramp(frame, from, to, Easing.inOut(Easing.cubic));
    return total + p;
  }, 0);
  // The thumb swipes up for each flick and lets go after the last one.
  const flick = FLICKS.find(([from, to]) => frame >= from - 2 && frame <= to);
  const thumbY = flick ? path(frame, [flick[0] - 2, flick[1]], [860, 360]) : 860;
  const thumbOpacity = 1 - ramp(frame, FLICKS[2][1], FLICKS[2][1] + 8);

  return (
    <Stage>
      <SceneHeader parts={["Jeder scrollt", { mark: "an Werbung vorbei." }]} size={112} start={-6} />
      <PhoneOutline width={640} height={1240} style={{ position: "absolute", top: 600, left: 220 }}>
        <div style={{ position: "absolute", inset: 0, transform: `translateY(${-scrolled * ITEM}px)` }}>
          {ADS.map((ad) => (
            <AdCard key={ad.big} {...ad} />
          ))}
          <div style={{ height: ITEM, position: "relative" }}>
            <Photo photo="serum" />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 45%)" }} />
          </div>
        </div>
        <Cursor x={320} y={thumbY} pressed={flick ? 1 : 0} opacity={thumbOpacity} />
      </PhoneOutline>
      <Sfx name="hit" at={0} volume={0.45} />
      {FLICKS.map(([from], i) => (
        <Sfx key={from} name="swipe" at={from} volume={0.5 + i * 0.08} />
      ))}
      <Sfx name="pop-low" at={FLICKS[2][1]} volume={0.45} />
    </Stage>
  );
};

export const B01_BLUR: [number, number][] = [[0, FLICKS[2][1] + 4]];

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

// Comparison without numbers: the claim is "better than", nothing more precise.
const CONVERSION = [
  { label: "Klassische Anzeige", value: 0.3, ink: false },
  { label: "UGC", value: 0.92, ink: true },
];

export const B03Growth: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Stage>
      <SceneHeader parts={["UGC konvertiert besser", { mark: "als klassische Werbung." }]} size={88} start={0} />
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
          padding: "36px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 26,
          ...enterUp(ease(frame, 44), 120),
        }}
      >
        <div style={{ fontSize: 30, fontWeight: 700, color: colors.graphite }}>Conversion</div>
        {CONVERSION.map(({ label, value, ink }, i) => {
          const grow = ease(frame, 54 + i * 12, { stiffness: 90 });
          return (
            <div key={label} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontSize: 30, fontWeight: ink ? 900 : 400, color: ink ? colors.ink : colors.graphite }}>{label}</div>
              <div style={{ height: 40, borderRadius: 8, backgroundColor: colors.fog, overflow: "hidden" }}>
                <div style={{ width: `${value * grow * 100}%`, height: "100%", borderRadius: 8, backgroundColor: ink ? colors.ink : colors.stone }} />
              </div>
            </div>
          );
        })}
      </div>
      {GRID.map((p, i) => (
        <Sfx key={p} name="pop-low" at={TILE_DELAY(i)} volume={0.2} />
      ))}
      <Sfx name="swipe" at={44} volume={0.3} />
      <Sfx name="pop" at={66} volume={0.5} />
    </Stage>
  );
};

export const B04Logo: React.FC = () => <LogoReveal line="UGC-Creator finden. In Minuten." />;
