import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useFrame } from "../frame";
import { ease, enterUp, pop, popIn, ramp } from "../anim";
import { cameraDrift, HEADER_DEPTH, useCamera } from "../camera";
import { IoGiftOutline, IoLogoInstagram, IoLogoTiktok, IoStar } from "react-icons/io5";
import { colors, FONT, GUTTER, PHOTOS, type PhotoKey } from "../theme";

// Pivot of the camera's push-in: a little below the middle, where the content sits.
const CAMERA_ORIGIN = "50% 62%";

export const Stage: React.FC<{ dark?: boolean; children: ReactNode }> = ({ dark, children }) => {
  const { zoom } = useCamera();
  return (
    <AbsoluteFill
      style={{
        backgroundColor: dark ? colors.ink : colors.paper,
        color: dark ? colors.paper : colors.ink,
        fontFamily: FONT,
        overflow: "hidden",
      }}
    >
      <AbsoluteFill style={{ transform: `translateY(${cameraDrift(zoom)}px) scale(${zoom})`, transformOrigin: CAMERA_ORIGIN }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
};

// A plain string, or a word set on an inverted bar.
export type HeadlinePart = string | { mark: string };

// Frames between two words of an animated headline.
const WORD_STAGGER = 3;

export function headlineLength(parts: HeadlinePart[]) {
  return parts.reduce((n, part) => n + (typeof part === "string" ? part.split(" ").length : 1), 0) * WORD_STAGGER;
}

// With `start`, the words rise in one after another from that frame and each mark's bar wipes in before its text.
// Without it, the headline is simply there.
export const Headline: React.FC<{
  parts: HeadlinePart[];
  size?: number;
  dark?: boolean;
  align?: "left" | "center";
  start?: number;
  style?: CSSProperties;
}> = ({ parts, size = 104, dark, align = "left", start, style }) => {
  const frame = useFrame();
  const at = (delay: number) => (start === undefined ? 1 : ease(frame, start + delay, { stiffness: 140 }));
  const barAt = (delay: number) => (start === undefined ? 1 : ramp(frame, start + delay, start + delay + 9));
  let word = 0;

  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 900,
        lineHeight: 1.08,
        letterSpacing: -2,
        textAlign: align,
        ...style,
      }}
    >
      {parts.map((part, i) => {
        if (typeof part === "string") {
          return part.split(" ").map((text, j) => {
            const p = at(word++ * WORD_STAGGER);
            return (
              <span key={`${i}-${j}`}>
                <span style={{ display: "inline-block", ...enterUp(p, size * 0.5) }}>{text}</span>{" "}
              </span>
            );
          });
        }
        const delay = word++ * WORD_STAGGER;
        const ink = dark ? colors.paper : colors.ink;
        return (
          <span key={i}>
            <span
              style={{
                backgroundImage: `linear-gradient(${ink}, ${ink})`,
                backgroundRepeat: "no-repeat",
                backgroundSize: `${barAt(delay) * 100}% 100%`,
                color: dark ? colors.ink : colors.paper,
                padding: "0 18px",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
              }}
            >
              <span style={{ opacity: start === undefined ? 1 : ramp(frame, start + delay + 5, start + delay + 10) }}>{part.mark}</span>
            </span>{" "}
          </span>
        );
      })}
    </div>
  );
};

export const Subline: React.FC<{ children: ReactNode; dark?: boolean; style?: CSSProperties }> = ({ children, dark, style }) => (
  <div style={{ fontSize: 40, lineHeight: 1.3, color: dark ? colors.stone : colors.graphite, ...style }}>{children}</div>
);

// Top block of a scene: optional step pill, headline, optional subline. `start` animates it in (see Headline).
export const SceneHeader: React.FC<{
  step?: { n: number; label: string };
  parts: HeadlinePart[];
  sub?: ReactNode;
  size?: number;
  dark?: boolean;
  top?: number;
  start?: number;
}> = ({ step, parts, sub, size = 92, dark, top = 150, start }) => {
  const frame = useFrame();
  const headlineStart = start === undefined ? undefined : start + (step ? 5 : 0);
  const stepP = start === undefined ? 1 : pop(frame, start);
  const subP = headlineStart === undefined ? 1 : ease(frame, headlineStart + headlineLength(parts) + 4);
  // Depth: the headline takes back part of the camera's zoom and drift, so it moves less than the content.
  const { zoom } = useCamera();
  const back = 1 + (zoom - 1) * (1 - HEADER_DEPTH);
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: GUTTER,
        right: GUTTER,
        display: "flex",
        flexDirection: "column",
        gap: 28,
        transformOrigin: CAMERA_ORIGIN,
        transform: `translateY(${-cameraDrift(zoom) * (1 - HEADER_DEPTH)}px) scale(${zoom === 1 ? 1 : back / zoom})`,
      }}
    >
      {step && (
        <div style={{ alignSelf: "flex-start", transformOrigin: "left center", ...popIn(stepP, 0.5) }}>
          <StepLabel n={step.n} label={step.label} dark={dark} />
        </div>
      )}
      <Headline parts={parts} size={size} dark={dark} start={headlineStart} />
      {sub && (
        <div style={enterUp(subP, 30)}>
          <Subline dark={dark}>{sub}</Subline>
        </div>
      )}
    </div>
  );
};

export const StepLabel: React.FC<{ n: number; label: string; dark?: boolean }> = ({ n, label, dark }) => (
  <div
    style={{
      alignSelf: "flex-start",
      display: "flex",
      alignItems: "center",
      gap: 16,
      padding: "12px 30px 12px 12px",
      borderRadius: 999,
      backgroundColor: dark ? colors.paper : colors.ink,
      color: dark ? colors.ink : colors.paper,
      fontSize: 32,
      fontWeight: 700,
    }}
  >
    <span
      style={{
        width: 48,
        height: 48,
        borderRadius: 999,
        backgroundColor: dark ? colors.ink : colors.paper,
        color: dark ? colors.paper : colors.ink,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 900,
      }}
    >
      {n}
    </span>
    {label}
  </div>
);

export const SampleNote: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div
    style={{
      position: "absolute",
      bottom: 44,
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: 22,
      color: dark ? colors.graphite : colors.stone,
    }}
  >
    Beispieldaten
  </div>
);

export const Logo: React.FC<{ size?: number; dark?: boolean; wordmark?: boolean }> = ({ size = 120, dark, wordmark = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.12 }}>
    <Img
      src={staticFile("logo.png")}
      style={{ width: size * 1.25, height: size * 1.25, margin: -size * 0.12, filter: dark ? "invert(1)" : undefined, mixBlendMode: dark ? "screen" : "multiply" }}
    />
    {wordmark && <span style={{ fontSize: size, fontWeight: 900, letterSpacing: -size * 0.03 }}>comtor</span>}
  </div>
);

export const Photo: React.FC<{ photo: PhotoKey; style?: CSSProperties }> = ({ photo, style }) => (
  <Img src={staticFile(PHOTOS[photo])} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", ...style }} />
);

const AVATAR_COLORS = ["#f43f5e", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899"];

export const Avatar: React.FC<{ name: string; size?: number; color?: string; style?: CSSProperties }> = ({ name, size = 64, color, style }) => {
  const fallback = AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flexShrink: 0,
        backgroundColor: color ?? fallback,
        color: colors.paper,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 700,
        ...style,
      }}
    >
      {name.slice(0, 1)}
    </div>
  );
};

// The Mac window the landing page puts around the web app (src/components/landing/mac-window.tsx).
export const BrowserWindow: React.FC<{ width?: number; height: number; children: ReactNode; style?: CSSProperties }> = ({
  width = 1080 - GUTTER * 2,
  height,
  children,
  style,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: 28,
      overflow: "hidden",
      backgroundColor: colors.paper,
      color: colors.ink,
      boxShadow: "0 50px 100px rgba(7,7,7,0.18), 0 0 0 2px rgba(7,7,7,0.08)",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    <div
      style={{
        height: 76,
        flexShrink: 0,
        backgroundColor: colors.fog,
        borderBottom: `2px solid ${colors.line}`,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 30px",
        position: "relative",
      }}
    >
      {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
        <span key={c} style={{ width: 22, height: 22, borderRadius: 999, backgroundColor: c }} />
      ))}
      <span
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(7,7,7,0.06)",
          borderRadius: 12,
          padding: "8px 90px",
          fontSize: 24,
          color: colors.graphite,
        }}
      >
        comtor.app
      </span>
    </div>
    <div style={{ flex: 1, position: "relative", overflow: "hidden" }}>{children}</div>
  </div>
);

export const PlatformIcon: React.FC<{ platform: "Instagram" | "TikTok"; size?: number }> = ({ platform, size = 28 }) =>
  platform === "Instagram" ? <IoLogoInstagram size={size} /> : <IoLogoTiktok size={size} />;

export type Deal = {
  company: string;
  title: string;
  photo: PhotoKey;
  budget: string;
  platform: "Instagram" | "TikTok";
  deliverables: string;
  productIncluded: boolean;
  rating: [string, number];
};

export const ODD_BLOOM: Deal = {
  company: "Odd Bloom",
  title: "Serum-Launch, erste Eindrücke",
  photo: "serum",
  budget: "250 €",
  platform: "TikTok",
  deliverables: "1 Video",
  productIncluded: true,
  rating: ["4,8", 23],
};

export const KIEZ_GOODS: Deal = {
  company: "Kiez Goods",
  title: "Iced Matcha für die Sommerkarte",
  photo: "matcha",
  budget: "400 €",
  platform: "Instagram",
  deliverables: "1 Reel + 2 Stories",
  productIncluded: true,
  rating: ["4,9", 41],
};

// The face of a swipe card, after RequestCardFace in the app: full-bleed photo, budget pill, info over the bottom.
export const DealCard: React.FC<{ deal: Deal; width: number; height: number; style?: CSSProperties }> = ({ deal, width, height, style }) => {
  const scale = width / 600;
  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16 * scale,
        overflow: "hidden",
        position: "relative",
        boxShadow: "0 40px 80px rgba(7,7,7,0.25)",
        backgroundColor: colors.fog,
        ...style,
      }}
    >
      <Photo photo={deal.photo} style={{ position: "absolute", inset: 0 }} />
      <div
        style={{
          position: "absolute",
          top: 36 * scale,
          left: 28 * scale,
          display: "flex",
          alignItems: "baseline",
          gap: 8 * scale,
          backgroundColor: "rgba(255,255,255,0.92)",
          color: "#171717",
          borderRadius: 999,
          padding: `${10 * scale}px ${22 * scale}px`,
          boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
        }}
      >
        <span style={{ fontSize: 34 * scale, fontWeight: 900 }}>{deal.budget}</span>
        <span style={{ fontSize: 22 * scale, fontWeight: 700, color: "#737373" }}>Budget</span>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          padding: `${80 * scale}px ${36 * scale}px ${44 * scale}px`,
          background: "linear-gradient(to top, rgba(0,0,0,0.78), rgba(0,0,0,0.35) 70%, transparent)",
          color: colors.paper,
          display: "flex",
          flexDirection: "column",
          gap: 22 * scale,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 * scale }}>
          <Avatar name={deal.company} size={76 * scale} />
          <div>
            <div style={{ fontSize: 24 * scale, color: "rgba(255,255,255,0.75)" }}>{deal.company}</div>
            <div style={{ fontSize: 30 * scale, fontWeight: 700 }}>{deal.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 * scale, fontSize: 22 * scale, color: "rgba(255,255,255,0.85)" }}>
              <IoStar size={22 * scale} color="#fbbf24" />
              {deal.rating[0]} ({deal.rating[1]})
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 * scale, fontSize: 22 * scale }}>
          <Chip scale={scale} filled>
            <PlatformIcon platform={deal.platform} size={22 * scale} />
            {deal.deliverables}
          </Chip>
          {deal.productIncluded && (
            <Chip scale={scale}>
              <IoGiftOutline size={22 * scale} />
              Produkt inklusive
            </Chip>
          )}
        </div>
      </div>
    </div>
  );
};

const Chip: React.FC<{ scale: number; filled?: boolean; children: ReactNode }> = ({ scale, filled, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10 * scale,
      borderRadius: 6 * scale,
      padding: `${8 * scale}px ${16 * scale}px`,
      backgroundColor: filled ? "rgba(255,255,255,0.25)" : undefined,
      border: filled ? undefined : "1.5px solid rgba(255,255,255,0.45)",
    }}
  >
    {children}
  </span>
);

export const Bubble: React.FC<{ mine?: boolean; children: ReactNode; style?: CSSProperties }> = ({ mine, children, style }) => (
  <div
    style={{
      alignSelf: mine ? "flex-end" : "flex-start",
      maxWidth: "78%",
      padding: "20px 30px",
      borderRadius: 30,
      borderBottomRightRadius: mine ? 8 : 30,
      borderBottomLeftRadius: mine ? 30 : 8,
      backgroundColor: mine ? colors.ink : colors.fog,
      color: mine ? colors.paper : colors.ink,
      fontSize: 34,
      lineHeight: 1.3,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Toast: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 14,
      padding: "18px 32px",
      borderRadius: 999,
      backgroundColor: colors.ink,
      color: colors.paper,
      fontSize: 30,
      fontWeight: 700,
      boxShadow: "0 16px 40px rgba(7,7,7,0.3)",
      ...style,
    }}
  >
    {children}
  </div>
);

// Outline of a phone, drawn flat.
export const PhoneOutline: React.FC<{ width: number; height: number; children?: ReactNode; style?: CSSProperties; dark?: boolean }> = ({
  width,
  height,
  children,
  style,
  dark,
}) => (
  <div
    style={{
      width,
      height,
      borderRadius: width * 0.14,
      border: `${width * 0.024}px solid ${dark ? colors.paper : colors.ink}`,
      overflow: "hidden",
      position: "relative",
      backgroundColor: colors.paper,
      ...style,
    }}
  >
    <div
      style={{
        position: "absolute",
        top: width * 0.03,
        left: "50%",
        transform: "translateX(-50%)",
        width: width * 0.3,
        height: width * 0.06,
        borderRadius: 999,
        backgroundColor: colors.ink,
        zIndex: 5,
      }}
    />
    {children}
  </div>
);
