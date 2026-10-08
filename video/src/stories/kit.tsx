import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { colors, FONT, HEIGHT, PHOTOS, WIDTH, type PhotoKey } from "../theme";
import { GRAIN } from "../posts/kit";
import { IPhone, IPHONE_WIDTH } from "../pinned/iphone";
import { GREY } from "../pinned/kit";

// Building blocks for Instagram stories, 1080 x 1920. Instagram lays its own controls over the top (profile, progress
// bar) and the bottom (reply field, link sticker), so everything that matters stays between SAFE_TOP and
// HEIGHT - SAFE_BOTTOM.
export const SAFE_TOP = 270;
export const SAFE_BOTTOM = 270;

const SOFT_ON_PAPER = "#737373";

// The dark look of the pinned posts: the night backdrop with the mark huge behind everything.
export const StoryNight: React.FC<{ children: ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ backgroundColor: "#0b0b0b", color: "#fff", fontFamily: FONT, overflow: "hidden" }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 75% 50% at 50% 46%, #1d1d1d 0%, #0b0b0b 100%)" }} />
    <Img
      src={staticFile("logo.png")}
      style={{ position: "absolute", left: "50%", top: HEIGHT / 2, width: 1740, height: 1740, transform: "translate(-50%, -50%)", filter: "invert(1)", opacity: 0.14 }}
    />
    <AbsoluteFill style={{ opacity: 0.22, mixBlendMode: "overlay", backgroundImage: GRAIN }} />
    {children}
  </AbsoluteFill>
);

// The light look of the landing page: white with the colour of one product photo washed over it (see Canvas in
// posts/kit.tsx), here for a full-height story. `focus` is the point of the photo (0 to 1 across and down) that lands
// in the middle.
export const StoryPaper: React.FC<{ photo: PhotoKey; zoom?: number; focus?: [number, number]; veil?: number; children: ReactNode }> = ({
  photo,
  zoom = 1.5,
  focus = [0.5, 0.5],
  veil = 0.38,
  children,
}) => {
  const width = WIDTH * zoom;
  const height = HEIGHT * zoom;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper, color: colors.ink, fontFamily: FONT, overflow: "hidden" }}>
      <AbsoluteFill>
        <Img
          src={staticFile(PHOTOS[photo])}
          style={{
            position: "absolute",
            left: WIDTH / 2 - focus[0] * width,
            top: HEIGHT / 2 - focus[1] * height,
            width,
            height,
            objectFit: "cover",
            filter: "blur(70px) saturate(1.6)",
          }}
        />
        <AbsoluteFill style={{ backgroundColor: `rgba(255,255,255,${veil})` }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.32, mixBlendMode: "soft-light", backgroundImage: GRAIN }} />
      {children}
    </AbsoluteFill>
  );
};

// The mark and the name, centred at the top of the safe area.
export const TopMark: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div style={{ position: "absolute", top: SAFE_TOP - 24, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 16 }}>
    <Img src={staticFile("logo.png")} style={{ width: 52, height: 52, filter: dark ? "invert(1)" : undefined, mixBlendMode: dark ? undefined : "multiply" }} />
    <span style={{ fontSize: 42, fontWeight: 700, letterSpacing: -0.6, color: dark ? "#fff" : colors.ink }}>comtor</span>
  </div>
);

// A small outlined (or, `solid`, filled) label that says what kind of story this is.
export const Eyebrow: React.FC<{ children: ReactNode; top: number; dark?: boolean; solid?: boolean; style?: CSSProperties }> = ({ children, top, dark, solid, style }) => {
  const main = dark ? "#fff" : colors.ink;
  return (
    <div style={{ position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", ...style }}>
      <span
        style={{
          padding: "12px 30px",
          borderRadius: 999,
          fontSize: 34,
          fontWeight: 900,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          border: `3px solid ${main}`,
          backgroundColor: solid ? main : "transparent",
          color: solid ? (dark ? colors.ink : "#fff") : main,
        }}
      >
        {children}
      </span>
    </div>
  );
};

export type Line = { text: ReactNode; soft?: boolean; strike?: boolean };

// Big centred type, one block per line so the breaks are exactly as written. `soft` lines are the second tone (grey),
// `strike` crosses a line out.
export const Type: React.FC<{ lines: Line[]; size: number; top: number; dark?: boolean; lineHeight?: number; style?: CSSProperties }> = ({
  lines,
  size,
  top,
  dark,
  lineHeight = 1.02,
  style,
}) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", fontSize: size, fontWeight: 900, lineHeight, letterSpacing: "-0.035em", ...style }}>
    {lines.map(({ text, soft, strike }, i) => (
      <div key={i} style={{ whiteSpace: "nowrap", color: soft ? (dark ? GREY : SOFT_ON_PAPER) : dark ? "#fff" : colors.ink }}>
        <span style={{ position: "relative", display: "inline-block" }}>
          {text}
          {strike && (
            <span
              style={{
                position: "absolute",
                left: -18,
                right: -18,
                top: "54%",
                height: Math.round(size * 0.09),
                borderRadius: 4,
                backgroundColor: dark ? "#fff" : colors.ink,
                transform: "rotate(-2deg)",
              }}
            />
          )}
        </span>
      </div>
    ))}
  </div>
);

// The address as a button.
export const AddressPill: React.FC<{ dark?: boolean; size?: number; style?: CSSProperties }> = ({ dark, size = 52, style }) => (
  <div
    style={{
      display: "inline-block",
      padding: `${Math.round(size * 0.58)}px ${Math.round(size * 1.38)}px`,
      borderRadius: 999,
      backgroundColor: dark ? "#fff" : colors.ink,
      color: dark ? colors.ink : "#fff",
      fontSize: size,
      fontWeight: 900,
      letterSpacing: "-0.01em",
      ...style,
    }}
  >
    comtor.app
  </div>
);

// "Beispiel" at the foot of the safe area, for the stories that show made-up brands and prices. `fade` first darkens
// the bottom of the story so the line reads over a phone.
export const StoryExample: React.FC<{ dark?: boolean; fade?: boolean }> = ({ dark, fade }) => (
  <>
    {fade && <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 700, background: "linear-gradient(to top, #0b0b0b 0%, rgba(11,11,11,0.97) 40%, rgba(11,11,11,0.7) 65%, rgba(11,11,11,0) 100%)" }} />}
    <div style={{ position: "absolute", top: HEIGHT - SAFE_BOTTOM - 48, left: 0, right: 0, textAlign: "center", fontSize: 26, color: dark ? "#8f8f8f" : "#525252" }}>
      Beispiel: Marken, Preise und Bewertungen sind erfunden.
    </div>
  </>
);

// The app on an iPhone, large and cut off by the bottom edge, under a headline in two tones. One piece of the app
// (`callout`) is lifted out and tilted, centred on `at`.
const PHONE_SCALE = 1.8;
const PHONE_LEFT = (WIDTH - IPHONE_WIDTH * PHONE_SCALE) / 2;

export const StoryPhone: React.FC<{
  lines: { text: string; soft?: boolean }[];
  screen: ReactNode;
  callout?: ReactNode;
  at?: [number, number];
  rotate?: number;
  scale?: number;
  phoneTop?: number;
  example?: boolean;
}> = ({ lines, screen, callout, at = [0, 0], rotate = 0, scale = 2.2, phoneTop = 660, example = true }) => (
  <StoryNight>
    <TopMark dark />
    <Type dark lines={lines} size={84} top={340} lineHeight={1.04} />
    <IPhone left={PHONE_LEFT} top={phoneTop} scale={PHONE_SCALE}>
      {screen}
    </IPhone>
    {callout && (
      <div style={{ position: "absolute", left: at[0], top: at[1], transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`, color: colors.ink }}>{callout}</div>
    )}
    {example && <StoryExample dark fade />}
  </StoryNight>
);
