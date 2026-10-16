import { createContext, type CSSProperties, type ReactNode, useContext } from "react";
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
import { AbsoluteFill, Easing, Img, interpolate, spring, staticFile } from "remotion";
import { NOKAR_AVATAR } from "../ads/brands";
import { mix } from "../anim";
import { Avatar } from "../components/ui";
import { useFrame } from "../frame";
import { colors, FONT, FPS } from "../theme";

// Building blocks of the 16:9 launch video (LAUNCH.md), after the reference's cut: three lights that never stand
// still (paper, mist, night), type that slams in and keeps drifting, a camera that pulls back as a line is typed,
// the app icon, and the web app's desktop view as a surface the camera moves over.

export const LAUNCH_WIDTH = 1920;
export const LAUNCH_HEIGHT = 1080;
// The 9:16 cut of the launch video, for Reels, TikTok and Shorts.
export const VERTICAL_WIDTH = 1080;
export const VERTICAL_HEIGHT = 1920;

// The frame the scenes are drawn into: 16:9 by default, 9:16 in the vertical cut, where the scenes lay themselves out
// for a tall frame (`tall`).
export const Stage = createContext({ width: LAUNCH_WIDTH, height: LAUNCH_HEIGHT });

export function useStage() {
  const stage = useContext(Stage);
  return { ...stage, tall: stage.height > stage.width };
}

export const SOFT_SHADOW = "0 60px 140px rgba(7,7,7,0.16), 0 14px 34px rgba(7,7,7,0.06)";

// ---------------------------------------------------------------------------------------------------------------
// Motion

// Springs with different characters, so not everything moves alike: some snap, some swing past and settle, some
// glide in slowly. Values over 1 are the overshoot.
export const SPRINGS = {
  snap: { damping: 14, stiffness: 260, mass: 0.7 },
  swing: { damping: 10, stiffness: 120, mass: 1 },
  glide: { damping: 22, stiffness: 50, mass: 1.1 },
  land: { damping: 16, stiffness: 160, mass: 0.85 },
} as const;

export function spr(frame: number, at: number, kind: keyof typeof SPRINGS) {
  return spring({ frame: frame - at, fps: FPS, config: SPRINGS[kind] });
}

// 0 → 1 that lands fast and rebounds a touch: for type slamming in.
export function slam(frame: number, at: number) {
  return spr(frame, at, "land");
}

// Something flying in from an offset (and a tilt, and a size), carried past its place by the spring and settling.
export function flyIn(p: number, from: { x?: number; y?: number; r?: number; s?: number }): CSSProperties {
  return {
    opacity: Math.min(1, Math.max(0, p) * 2.5),
    transform: `translate(${(1 - p) * (from.x ?? 0)}px, ${(1 - p) * (from.y ?? 0)}px) rotate(${(1 - p) * (from.r ?? 0)}deg) scale(${mix(p, from.s ?? 1, 1)})`,
  };
}

// Leaving: accelerating away towards an edge (0 → 1, eased in).
export function flyOut(frame: number, at: number, dur: number, to: { x?: number; y?: number; r?: number }): CSSProperties {
  const q = interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  if (q <= 0) return {};
  return { opacity: 1 - q * q, transform: `translate(${q * (to.x ?? 0)}px, ${q * (to.y ?? 0)}px) rotate(${q * (to.r ?? 0)}deg)` };
}

// When each letter of a line appears: about `every` frames apart, uneven like real typing, with a little pause after
// a space and a longer one after punctuation. Deterministic, so a scene and its key sounds agree.
export function typingTimes(text: string, start: number, every = 2): number[] {
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < text.length; i++) {
    const jitter = (((Math.sin((i + 1) * 12.9898 + text.length * 78.233) * 43758.5453) % 1) + 1) % 1;
    const prev = text[i - 1] ?? "";
    t += every * (0.55 + jitter * 0.9) + (text[i] === " " ? every * 0.6 : 0) + (/[.,!?:]/.test(prev) ? every * 2.5 : 0);
    times.push(Math.round(t));
  }
  return times;
}

export function typedCount(frame: number, times: number[]) {
  let n = 0;
  while (n < times.length && times[n] <= frame) n++;
  return n;
}

// A hand on a mouse: from `from` to `to` starting at `at`, along a gentle arc, quick in the middle and settling onto the
// target with a small overshoot. `speed` scales the spring (bigger is quicker).
export function pointer(frame: number, at: number, from: { x: number; y: number }, to: { x: number; y: number }, speed = 1, bend = 0.16) {
  const p = spring({ frame: frame - at, fps: FPS, config: { damping: 15, stiffness: 70 * speed * speed, mass: 1 } });
  const q = Math.min(1, Math.max(0, p));
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const c = { x: (from.x + to.x) / 2 - dy * bend, y: (from.y + to.y) / 2 + dx * bend };
  const bx = (1 - q) * (1 - q) * from.x + 2 * (1 - q) * q * c.x + q * q * to.x;
  const by = (1 - q) * (1 - q) * from.y + 2 * (1 - q) * q * c.y + q * q * to.y;
  // Past 1 the spring overshoots along the last direction of travel.
  const over = p - q;
  return { x: bx + over * dx * 0.6, y: by + over * dy * 0.6 };
}

// A word arriving from far too big and out of focus, the reference's "Meet" and "And".
export function slamStyle(p: number, from = 2.4, blur = 30): CSSProperties {
  return {
    opacity: Math.min(1, p * 3),
    transform: `scale(${mix(p, from, 1)})`,
    filter: p > 0.995 ? undefined : `blur(${(1 - p) * blur}px)`,
  };
}

// Linear-in-time progress 0..1 between two frames with a soft in-out, clamped.
export function glide(frame: number, from: number, to: number) {
  return interpolate(frame, [from, to], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
}

// The slow pull-back that keeps every text scene moving after it lands.
export function drift(frame: number, duration: number, from = 1, to = 0.9) {
  return mix(glide(frame, 0, duration), from, to);
}

// The camera fitting a typed line into the frame: a short line fills it, a long one sits back. `chars` may be
// fractional, so the camera moves continuously while typing.
export function fitScale(chars: number, size: number, width = 1500, max = 2.6, perChar = 0.5) {
  return Math.min(max, width / (Math.max(chars, 3) * size * perChar));
}

// ---------------------------------------------------------------------------------------------------------------
// Backgrounds

type Light = "paper" | "mist" | "night";

// The reference's glow, in grey: soft pools of stone (or graphite on black) wandering slowly around the edges.
function background(light: Light, t: number) {
  const a = 50 + 10 * Math.sin(t / 70);
  const b = 46 + 8 * Math.cos(t / 90);
  if (light === "paper") {
    return [
      `radial-gradient(ellipse 50% 60% at ${90 + 8 * Math.sin(t / 80)}% ${100 + 6 * Math.cos(t / 60)}%, rgba(162,162,169,0.16), rgba(162,162,169,0) 70%)`,
      colors.paper,
    ].join(", ");
  }
  if (light === "mist") {
    return [
      `radial-gradient(ellipse 60% 70% at ${a}% ${b}%, #ffffff 0%, rgba(255,255,255,0.92) 38%, rgba(255,255,255,0) 100%)`,
      `radial-gradient(ellipse 70% 90% at ${100 + 10 * Math.sin(t / 55)}% ${100 + 8 * Math.cos(t / 75)}%, rgba(150,150,158,0.8), rgba(150,150,158,0) 70%)`,
      `radial-gradient(ellipse 60% 80% at ${0 + 10 * Math.cos(t / 65)}% ${0 + 10 * Math.sin(t / 85)}%, rgba(162,162,169,0.6), rgba(162,162,169,0) 70%)`,
      colors.fog,
    ].join(", ");
  }
  return [
    `radial-gradient(ellipse 70% 90% at ${100 + 12 * Math.sin(t / 60)}% ${100 + 10 * Math.cos(t / 80)}%, rgba(140,140,148,0.5), rgba(140,140,148,0) 70%)`,
    `radial-gradient(ellipse 50% 60% at ${0 + 10 * Math.cos(t / 70)}% ${0 + 8 * Math.sin(t / 50)}%, rgba(121,121,121,0.18), rgba(121,121,121,0) 70%)`,
    colors.ink,
  ].join(", ");
}

// The reference's thin lines: a few very large circles, of which only a sweep of each crosses the frame, drifting and
// turning slowly. `seed` sets them differently per scene. They are there only now and then (a few scenes pass
// `lines`), and when they are, each one draws itself in.
export const Arcs: React.FC<{ dark?: boolean; seed?: number }> = ({ dark, seed = 0 }) => {
  const local = useFrame();
  const { width, height } = useStage();
  // Drawn for 16:9; in another frame the centres move with it.
  const sx = width / LAUNCH_WIDTH;
  const sy = height / LAUNCH_HEIGHT;
  const frame = local + seed * 37;
  const stroke = dark ? "rgba(255,255,255,0.1)" : "rgba(7,7,7,0.11)";
  const s = seed % 3;
  const arcs = [
    { cx: -520 + 60 * Math.sin(frame / 110) + s * 120, cy: 260 + 40 * Math.cos(frame / 140), r: 1150 + s * 90, w: 1.6 },
    { cx: 2480 - 50 * Math.cos(frame / 120) - s * 80, cy: 1420 + 50 * Math.sin(frame / 95), r: 1350, w: 1.3 },
    { cx: 960 + 260 * Math.sin(frame / 210 + s), cy: -1720, r: 1950, w: 1.1 },
  ];
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      {arcs.map((a, i) => (
        <circle key={i} cx={a.cx * sx} cy={a.cy * sy} r={a.r} fill="none" stroke={stroke} strokeWidth={a.w} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - glide(local, 4 + i * 10, 64 + i * 10)} />
      ))}
    </svg>
  );
};

export const Backdrop: React.FC<{ light: Light; lines?: number; children?: ReactNode }> = ({ light, lines, children }) => {
  const frame = useFrame();
  return (
    <AbsoluteFill style={{ background: background(light, frame), color: light === "night" ? colors.paper : colors.ink, fontFamily: FONT, overflow: "hidden" }}>
      {lines !== undefined && <Arcs dark={light === "night"} seed={lines} />}
      {children}
      {light === "night" && (
        <AbsoluteFill style={{ backgroundImage: `url(${staticFile("grain/dark.png")})`, backgroundSize: "cover", mixBlendMode: "screen", opacity: 0.8 }} />
      )}
    </AbsoluteFill>
  );
};

// A band of light sweeping diagonally across the frame between `from` and `to`, like the reference's light rays.
export const LightSweep: React.FC<{ from: number; to: number; opacity?: number }> = ({ from, to, opacity = 0.55 }) => {
  const frame = useFrame();
  if (frame < from || frame > to) return null;
  const x = mix(glide(frame, from, to), -60, 160);
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(115deg, rgba(255,255,255,0) ${x - 18}%, rgba(255,255,255,${opacity}) ${x - 4}%, rgba(255,255,255,${opacity * 0.4}) ${x}%, rgba(255,255,255,0) ${x + 10}%)`,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    />
  );
};

// Centres its children in the frame.
export const Center: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", ...style }}>{children}</AbsoluteFill>
);

// ---------------------------------------------------------------------------------------------------------------
// Type

export const Caret: React.FC<{ size: number; on?: boolean }> = ({ size, on = true }) => (
  <span
    style={{
      display: "inline-block",
      width: Math.max(3, size * 0.055),
      height: size * 0.95,
      marginLeft: size * 0.05,
      backgroundColor: "currentColor",
      verticalAlign: "-0.12em",
      opacity: on ? 1 : 0,
    }}
  />
);

// One part of a statement. `soft` sets it grey.
export type Part = { text: string; soft?: boolean; bold?: boolean };

// Horizontal-only blur, for the smear of a word whipping in (CSS blur() can only blur both ways).
export const SmearFilter: React.FC<{ id: string; amount: number }> = ({ id, amount }) => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={`${amount} 0`} />
    </filter>
  </svg>
);

// In the tall frame at the top, clear of the captions and buttons Reels and TikTok lay over the bottom and the right.
export const SampleTag: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const { tall } = useStage();
  return (
    <div style={{ position: "absolute", ...(tall ? { left: 56, top: 140, fontSize: 24 } : { right: 48, bottom: 36, fontSize: 20 }), color: dark ? colors.graphite : colors.stone, fontFamily: FONT }}>
      Beispieldaten
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// The brand

// The "cc" mark cropped tight (assets/mark-*.png, 800 x 531), the same artwork the app icon is drawn from.
const MARK_RATIO = 531 / 800;

export const Mark: React.FC<{ width: number; white?: boolean }> = ({ width, white }) => (
  <Img src={staticFile(white ? "mark-white.png" : "mark-black.png")} style={{ width, height: width * MARK_RATIO, display: "block" }} />
);

// The app icon as the home screen shows it (src/lib/og-images.tsx appIcon): the white mark on an ink square with
// rounded corners.
export const AppIcon: React.FC<{ size: number; style?: CSSProperties }> = ({ size, style }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: size * 0.22,
      backgroundColor: colors.ink,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: `0 ${size * 0.12}px ${size * 0.35}px rgba(7,7,7,0.18)`,
      flexShrink: 0,
      ...style,
    }}
  >
    <Mark width={size * 0.74} white />
  </div>
);

// Icon and name on one line. The icon is as tall as the name's x-height plus ascenders, centred on it, so both sit
// on the same level. `letters` types the name out.
export const Brand: React.FC<{ size: number; letters?: number; icon?: number; dark?: boolean }> = ({ size, letters = 6, icon = 1, dark }) => (
  <div style={{ display: "flex", alignItems: "center", gap: size * 0.22 * Math.min(1, letters), color: dark ? colors.paper : colors.ink }}>
    <AppIcon size={size * 0.92} style={{ transform: `scale(${icon})` }} />
    {letters > 0 && (
      <span style={{ fontSize: size, fontWeight: 900, letterSpacing: -size * 0.03, lineHeight: 1, transform: `translateY(${-size * 0.06}px)`, whiteSpace: "pre" }}>
        {"comtor".slice(0, Math.ceil(letters))}
      </span>
    )}
  </div>
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

// The app's sidebar (src/components/nav.tsx): the mark with the page's name, search, the sections, New request for
// brands, the account at the bottom.
export const Sidebar: React.FC<{ side: Side; active: string; title: string }> = ({ side, active, title }) => (
  <div style={{ width: 248, flexShrink: 0, height: "100%", borderRight: `1px solid ${colors.line}`, padding: "20px 12px", display: "flex", flexDirection: "column" }}>
    <div style={{ height: 48, display: "flex", alignItems: "center", gap: 12, padding: "0 8px", marginBottom: 24 }}>
      <Mark width={40} />
      <span style={{ fontSize: 20, fontWeight: 700 }}>{title}</span>
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

export type Tilt = { x: number; y: number; z?: number };

// A page of the web app at its real size (VIEW_WIDTH x VIEW_HEIGHT) in the Mac window, scaled by `scale`. `tilt`
// lays it back in 3D like the reference's product shots; without it (or at zero) the window stays flat, so text
// stays sharp in close-ups.
export const DesktopApp: React.FC<{
  side: Side;
  active: string;
  title: string;
  scale?: number;
  tilt?: Tilt;
  style?: CSSProperties;
  children: ReactNode;
}> = ({ side, active, title, scale = 1, tilt, style, children }) => {
  const tilted = tilt && (Math.abs(tilt.x) > 0.01 || Math.abs(tilt.y) > 0.01 || Math.abs(tilt.z ?? 0) > 0.01);
  return (
    <div style={{ perspective: tilted ? 2400 : undefined, ...style }}>
      <div
        style={{
          width: VIEW_WIDTH * scale,
          height: (VIEW_HEIGHT + 44) * scale,
          transform: tilted ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) rotateZ(${tilt.z ?? 0}deg)` : undefined,
          transformStyle: tilted ? "preserve-3d" : undefined,
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
            <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", backgroundColor: "rgba(7,7,7,0.06)", borderRadius: 6, padding: "4px 56px", fontSize: 12, color: colors.graphite }}>
              comtor.app
            </span>
          </div>
          <div style={{ flex: 1, display: "flex", minHeight: 0 }}>
            <Sidebar side={side} active={active} title={title} />
            <div style={{ flex: 1, minWidth: 0, position: "relative", overflow: "hidden" }}>{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// One part of the app in its own Mac window, without the sidebar: for close shots of a single panel (the chat).
export const AppPanel: React.FC<{ width: number; height: number; scale?: number; style?: CSSProperties; children: ReactNode }> = ({ width, height, scale = 1, style, children }) => (
  <div style={{ width: width * scale, height: (height + 44) * scale, ...style }}>
    <div
      style={{
        width,
        height: height + 44,
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
        <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", backgroundColor: "rgba(7,7,7,0.06)", borderRadius: 6, padding: "4px 56px", fontSize: 12, color: colors.graphite }}>
          comtor.app
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0, position: "relative" }}>{children}</div>
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
        minHeight: size * 1.05 * 1.25,
        boxSizing: "content-box",
        color: value ? colors.ink : colors.stone,
        whiteSpace: "pre",
        overflow: "hidden",
      }}
    >
      {value || placeholder}
      {caret && <span style={{ display: "inline-block", width: Math.max(1.5, size * 0.08), height: size * 1.2, backgroundColor: colors.ink, marginLeft: 1, verticalAlign: "-0.2em" }} />}
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

// The reference's soft white haze: the frame's edges fade into white and a few large, very soft clouds drift over the
// UI, so the modules sit in depth instead of on a flat page. Drawn above the UI and below the words.
const CLOUDS = [
  { x: 10, y: 96, w: 980, h: 420 },
  { x: 88, y: 94, w: 1100, h: 460 },
  { x: 46, y: -8, w: 1200, h: 380 },
  { x: -6, y: 44, w: 560, h: 980 },
  { x: 106, y: 52, w: 560, h: 980 },
];

export const Haze: React.FC<{ strength?: number }> = ({ strength = 1 }) => {
  const frame = useFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 72% 68% at 50% 50%, rgba(255,255,255,0) 52%, rgba(255,255,255,0.88) 100%)", opacity: strength }} />
      {CLOUDS.map((c, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `calc(${c.x + 3 * Math.sin(frame / 90 + i)}% - ${c.w / 2}px)`,
            top: `calc(${c.y + 2 * Math.cos(frame / 110 + i * 1.7)}% - ${c.h / 2}px)`,
            width: c.w,
            height: c.h,
            borderRadius: "50%",
            background: "radial-gradient(closest-side, rgba(255,255,255,0.92), rgba(255,255,255,0))",
            opacity: 0.8 * strength,
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// A macro close-up on a detail (a button being pressed): from 10 frames before `at` the camera closes in on x, y
// (frame pixels) by `zoom`, drawing it towards the middle, holds for `hold` frames and pulls back over 12; around the
// detail the frame goes soft (a backdrop blur, masked open at the focus).
export type MacroShot = { at: number; hold: number; x: number; y: number; zoom?: number };

export function macroAt(frame: number, shots: MacroShot[]) {
  let best = { e: 0, shot: shots[0] };
  for (const shot of shots) {
    const e = interpolate(frame, [shot.at - 10, shot.at, shot.at + shot.hold, shot.at + shot.hold + 12], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.inOut(Easing.cubic),
    });
    if (e > best.e) best = { e, shot };
  }
  return best;
}

export const Macro: React.FC<{ shots: MacroShot[]; children: ReactNode }> = ({ shots, children }) => {
  const frame = useFrame();
  const { width, height } = useStage();
  const { e, shot } = macroAt(frame, shots);
  if (!shot || e <= 0) return <AbsoluteFill>{children}</AbsoluteFill>;
  const tx = (width / 2 - shot.x) * e * 0.55;
  const ty = (height / 2 - shot.y) * e * 0.55;
  const fx = shot.x + tx;
  const fy = shot.y + ty;
  const mask = `radial-gradient(circle at ${fx.toFixed(0)}px ${fy.toFixed(0)}px, transparent 0px, transparent 170px, black 460px)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ transform: `translate(${tx}px, ${ty}px) scale(${1 + ((shot.zoom ?? 1.7) - 1) * e})`, transformOrigin: `${shot.x}px ${shot.y}px` }}>{children}</AbsoluteFill>
      <AbsoluteFill style={{ backdropFilter: `blur(${(9 * e).toFixed(1)}px)`, WebkitBackdropFilter: `blur(${(9 * e).toFixed(1)}px)`, maskImage: mask, WebkitMaskImage: mask, pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};

// UI floating out of focus behind the opening lines.
export const Ghost: React.FC<{ x: number; y: number; blur?: number; opacity?: number; rotate?: number; children: ReactNode }> = ({ x, y, blur = 6, opacity = 0.55, rotate = 0, children }) => (
  <div style={{ position: "absolute", left: x, top: y, filter: `blur(${blur}px)`, opacity, transform: `rotate(${rotate}deg)` }}>{children}</div>
);
