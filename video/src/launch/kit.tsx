import type { CSSProperties, ReactNode } from "react";
import type { IconType } from "react-icons";
import { FiChevronDown } from "react-icons/fi";
import {
  IoAdd,
  IoCardOutline,
  IoChatbubbleOutline,
  IoCheckmark,
  IoHeartOutline,
  IoHome,
  IoNotificationsOutline,
  IoSearch,
  IoSearchOutline,
} from "react-icons/io5";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { NOKAR_AVATAR } from "../ads/brands";
import { Avatar } from "../components/ui";
import { colors, FONT } from "../theme";

// Building blocks of the 16:9 launch video (LAUNCH.md): three lights (paper, mist, night), typed lines with a caret,
// statements set large, and the web app's desktop view as a surface the camera moves over.

export const LAUNCH_WIDTH = 1920;
export const LAUNCH_HEIGHT = 1080;

export const SOFT_SHADOW = "0 60px 140px rgba(7,7,7,0.16), 0 14px 34px rgba(7,7,7,0.06)";

// ---------------------------------------------------------------------------------------------------------------
// Backgrounds

type Light = "paper" | "mist" | "night";

const BACKGROUNDS: Record<Light, string> = {
  paper: colors.paper,
  // The reference's blue glow in grey: white in the middle, fog and stone pooling in from the corners.
  mist: [
    "radial-gradient(ellipse 60% 70% at 50% 46%, #ffffff 0%, rgba(255,255,255,0.9) 40%, rgba(255,255,255,0) 100%)",
    "radial-gradient(ellipse 70% 90% at 100% 100%, rgba(162,162,169,0.75), rgba(162,162,169,0) 70%)",
    "radial-gradient(ellipse 60% 80% at 0% 0%, rgba(162,162,169,0.55), rgba(162,162,169,0) 70%)",
    colors.fog,
  ].join(", "),
  // Ink with a faint graphite glow rising from one corner.
  night: [
    "radial-gradient(ellipse 70% 90% at 100% 100%, rgba(121,121,121,0.42), rgba(121,121,121,0) 70%)",
    "radial-gradient(ellipse 50% 60% at 0% 0%, rgba(121,121,121,0.16), rgba(121,121,121,0) 70%)",
    colors.ink,
  ].join(", "),
};

export const Backdrop: React.FC<{ light: Light; children?: ReactNode }> = ({ light, children }) => (
  <AbsoluteFill style={{ background: BACKGROUNDS[light], color: light === "night" ? colors.paper : colors.ink, fontFamily: FONT, overflow: "hidden" }}>
    {children}
    {light === "night" && (
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile("grain/dark.png")})`, backgroundSize: "cover", mixBlendMode: "screen", opacity: 0.8 }} />
    )}
  </AbsoluteFill>
);

// Centres its children in the frame.
export const Center: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...style }}>{children}</AbsoluteFill>
);

// ---------------------------------------------------------------------------------------------------------------
// Type

// A line being typed: the first `shown` characters, then the caret. Without `shown` the whole line is there.
export const TypeLine: React.FC<{ text: string; shown?: number; size?: number; weight?: number; caret?: boolean; style?: CSSProperties }> = ({
  text,
  shown = text.length,
  size = 64,
  weight = 400,
  caret = true,
  style,
}) => (
  <div style={{ fontSize: size, fontWeight: weight, letterSpacing: -size * 0.015, lineHeight: 1.1, whiteSpace: "pre", ...style }}>
    {text.slice(0, shown)}
    {caret && <span style={{ display: "inline-block", width: size * 0.06, height: size * 0.95, marginLeft: size * 0.04, backgroundColor: "currentColor", verticalAlign: "-0.12em" }} />}
  </div>
);

// One part of a statement. `soft` sets it grey, `blur` out of focus (a word on its way in or out).
export type Part = { text: string; soft?: boolean; blur?: number; bold?: boolean };

export const Statement: React.FC<{ parts: Part[]; size?: number; dark?: boolean; style?: CSSProperties }> = ({ parts, size = 96, dark, style }) => (
  <div style={{ fontSize: size, lineHeight: 1.08, letterSpacing: -size * 0.03, textAlign: "center", ...style }}>
    {parts.map((part, i) => (
      <span
        key={i}
        style={{
          fontWeight: part.bold === false ? 400 : 900,
          color: part.soft ? (dark ? colors.graphite : colors.stone) : undefined,
          filter: part.blur ? `blur(${part.blur}px)` : undefined,
        }}
      >
        {part.text}
      </span>
    ))}
  </div>
);

// A word between square brackets that close in on it (the reference's "[ Reusable knowledge ]").
export const Bracketed: React.FC<{ children: ReactNode; size?: number; gap?: number; dark?: boolean }> = ({ children, size = 120, gap = 36, dark }) => {
  const bracket: CSSProperties = { fontWeight: 400, color: dark ? colors.graphite : colors.stone, fontSize: size * 1.25, lineHeight: 1 };
  return (
    <div style={{ display: "flex", alignItems: "center", gap, fontSize: size, fontWeight: 900, letterSpacing: -size * 0.03 }}>
      <span style={bracket}>[</span>
      {children}
      <span style={bracket}>]</span>
    </div>
  );
};

// Lato Black pulled wide, for the one word that lands like a stamp (the reference's "Auto-resolved").
export const WideWord: React.FC<{ children: ReactNode; size?: number; stretch?: number; style?: CSSProperties }> = ({ children, size = 200, stretch = 1.45, style }) => (
  <div style={{ fontSize: size, fontWeight: 900, letterSpacing: size * 0.02, transform: `scaleX(${stretch})`, whiteSpace: "nowrap", ...style }}>{children}</div>
);

export const SampleTag: React.FC<{ dark?: boolean }> = ({ dark }) => (
  <div style={{ position: "absolute", right: 48, bottom: 36, fontSize: 20, color: dark ? colors.graphite : colors.stone, fontFamily: FONT }}>Beispieldaten</div>
);

// ---------------------------------------------------------------------------------------------------------------
// The web app on a computer

export const VIEW_WIDTH = 1280;
export const VIEW_HEIGHT = 800;

type Side = "creator" | "brand";

const NAV: Record<Side, { label: string; icon: IconType; badge?: number }[]> = {
  creator: [
    { label: "Feed", icon: IoHome },
    { label: "Entdecken", icon: IoSearchOutline },
    { label: "Matches", icon: IoHeartOutline },
    { label: "Nachrichten", icon: IoChatbubbleOutline, badge: 2 },
    { label: "Deals", icon: IoCardOutline, badge: 1 },
    { label: "Mitteilungen", icon: IoNotificationsOutline },
  ],
  brand: [
    { label: "Anfragen", icon: IoHome },
    { label: "Entdecken", icon: IoSearchOutline },
    { label: "Nachrichten", icon: IoChatbubbleOutline },
    { label: "Deals", icon: IoCardOutline },
    { label: "Mitteilungen", icon: IoNotificationsOutline },
  ],
};

export const LogoMark: React.FC<{ size: number; dark?: boolean }> = ({ size, dark }) => (
  <Img
    src={staticFile("logo.png")}
    style={{ width: size * 1.25, height: size * 1.25, margin: -size * 0.12, filter: dark ? "invert(1)" : undefined, mixBlendMode: dark ? "screen" : "multiply" }}
  />
);

export const Wordmark: React.FC<{ size: number; dark?: boolean; mark?: boolean }> = ({ size, dark, mark = true }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.14 }}>
    {mark && <LogoMark size={size} dark={dark} />}
    <span style={{ fontSize: size, fontWeight: 900, letterSpacing: -size * 0.03 }}>comtor</span>
  </div>
);

// The app's sidebar (src/components/landing/mac-window.tsx DesktopSidebar), at the app's own sizes.
export const Sidebar: React.FC<{ side: Side; active: string }> = ({ side, active }) => (
  <div style={{ width: 248, flexShrink: 0, height: "100%", borderRight: `1px solid ${colors.line}`, padding: "20px 12px", display: "flex", flexDirection: "column" }}>
    <div style={{ height: 40, display: "flex", alignItems: "center", padding: "0 12px", marginBottom: 24 }}>
      <Wordmark size={24} />
    </div>
    <div style={{ height: 40, borderRadius: 4, border: `1px solid ${colors.line}`, display: "flex", alignItems: "center", gap: 12, padding: "0 12px", fontSize: 14, color: colors.graphite, marginBottom: 16 }}>
      <IoSearch size={20} />
      <span style={{ flex: 1 }}>Suche</span>
      <span style={{ fontSize: 11, border: "1px solid rgba(7,7,7,0.15)", borderRadius: 4, padding: "0 6px" }}>⌘K</span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {NAV[side].map(({ label, icon: Icon, badge }) => {
        const on = label === active;
        return (
          <div
            key={label}
            style={{
              height: 44,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "0 12px",
              fontSize: 14,
              fontWeight: on ? 700 : 400,
              color: on ? colors.ink : colors.graphite,
              backgroundColor: on ? colors.fog : undefined,
            }}
          >
            <Icon size={24} />
            <span style={{ flex: 1 }}>{label}</span>
            {badge && (
              <span style={{ minWidth: 20, height: 20, borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {badge}
              </span>
            )}
          </div>
        );
      })}
    </div>
    {side === "brand" && (
      <div style={{ marginTop: 20, height: 44, borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 14, fontWeight: 700 }}>
        <IoAdd size={20} />
        Neue Anfrage
      </div>
    )}
    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: 12, padding: "8px 12px", fontSize: 14, fontWeight: 700 }}>
      <Avatar name={side === "creator" ? "Mia Summers" : "Nokar"} image={side === "creator" ? undefined : NOKAR_AVATAR} size={32} />
      <span style={{ flex: 1 }}>{side === "creator" ? "Mia Summers" : "Nokar"}</span>
      <FiChevronDown size={16} color={colors.stone} />
    </div>
  </div>
);

// A page of the web app at its real size (VIEW_WIDTH x VIEW_HEIGHT), scaled into the frame by `scale`, with the
// Mac window around it. `tilt` lays it back in 3D like the reference's product shots.
export const DesktopApp: React.FC<{
  side: Side;
  active: string;
  scale?: number;
  tilt?: { x: number; y: number; z?: number };
  style?: CSSProperties;
  children: ReactNode;
}> = ({ side, active, scale = 1, tilt, style, children }) => (
  <div style={{ perspective: 2400, ...style }}>
    <div
      style={{
        width: VIEW_WIDTH * scale,
        height: (VIEW_HEIGHT + 44) * scale,
        transform: tilt ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${tilt.z ?? 0}deg)` : undefined,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        style={{
          width: VIEW_WIDTH,
          height: VIEW_HEIGHT + 44,
          transform: `scale(${scale})`,
          transformOrigin: "0 0",
          borderRadius: 14,
          overflow: "hidden",
          backgroundColor: colors.paper,
          color: colors.ink,
          fontFamily: FONT,
          boxShadow: SOFT_SHADOW + ", 0 0 0 1px rgba(7,7,7,0.08)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ height: 44, flexShrink: 0, backgroundColor: colors.fog, borderBottom: `1px solid ${colors.line}`, display: "flex", alignItems: "center", gap: 8, padding: "0 16px", position: "relative" }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 12, height: 12, borderRadius: 999, backgroundColor: c }} />
          ))}
          <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", backgroundColor: "rgba(7,7,7,0.06)", borderRadius: 6, padding: "4px 56px", fontSize: 12, color: colors.graphite }}>comtor.app</span>
        </div>
        <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
          <Sidebar side={side} active={active} />
          <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>{children}</div>
        </div>
      </div>
    </div>
  </div>
);

export const PageTitle: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: -0.6 }}>{children}</div>
);

// ---------------------------------------------------------------------------------------------------------------
// Form pieces, drawn after the app's inputs (rounded 4px, neutral-300 border)

export const Field: React.FC<{ label: string; value?: string; placeholder?: string; caret?: boolean; width?: number | string; size?: number; focused?: boolean }> = ({
  label,
  value,
  placeholder,
  caret,
  width = "100%",
  size = 14,
  focused,
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: size * 0.45, width }}>
    <div style={{ fontSize: size, fontWeight: 700 }}>{label}</div>
    <div
      style={{
        borderRadius: size * 0.3,
        border: `${Math.max(1, size / 14)}px solid ${focused ? colors.ink : "#d4d4d4"}`,
        boxShadow: focused ? `0 0 0 ${size * 0.2}px rgba(7,7,7,0.08)` : undefined,
        padding: `${size * 0.7}px ${size * 0.85}px`,
        fontSize: size * 1.05,
        color: value ? colors.ink : colors.stone,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {value ?? placeholder}
      {caret && <span style={{ display: "inline-block", width: Math.max(2, size * 0.08), height: size * 1.2, backgroundColor: colors.ink, marginLeft: 2, verticalAlign: "-0.2em" }} />}
    </div>
  </div>
);

export const Chip: React.FC<{ children: ReactNode; on?: boolean; size?: number }> = ({ children, on, size = 14 }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: size * 0.4,
      borderRadius: 999,
      padding: `${size * 0.5}px ${size * 1}px`,
      fontSize: size,
      fontWeight: on ? 700 : 400,
      backgroundColor: on ? colors.ink : colors.paper,
      color: on ? colors.paper : colors.ink,
      border: on ? `1px solid ${colors.ink}` : "1px solid #d4d4d4",
    }}
  >
    {children}
  </span>
);

export const Tick: React.FC<{ size?: number; dark?: boolean; done?: boolean }> = ({ size = 28, dark, done = true }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.2,
      flexShrink: 0,
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: done ? (dark ? colors.paper : colors.ink) : "transparent",
      color: dark ? colors.ink : colors.paper,
      border: done ? undefined : `2px solid ${dark ? colors.graphite : colors.stone}`,
    }}
  >
    {done && <IoCheckmark size={size * 0.8} />}
  </span>
);

// A screen-sized ghost: anything set in it is out of focus and faint, for the UI floating behind the opening lines.
export const Ghost: React.FC<{ x: number; y: number; blur?: number; opacity?: number; rotate?: number; children: ReactNode }> = ({ x, y, blur = 6, opacity = 0.55, rotate = 0, children }) => (
  <div style={{ position: "absolute", left: x, top: y, filter: `blur(${blur}px)`, opacity, transform: `rotate(${rotate}deg)` }}>{children}</div>
);
