import type { CSSProperties, ReactNode } from "react";
import { IoCheckmark } from "react-icons/io5";
import { Avatar, Logo } from "../components/ui";
import { colors, FONT } from "../theme";
import { SOFT_SHADOW } from "./kit";

// UI pieces the ads share, simplified from the web app.

// A modern phone: black body, thin bezel, dynamic island. Content fills the screen.
export const Phone: React.FC<{ width: number; height: number; children: ReactNode; style?: CSSProperties }> = ({ width, height, children, style }) => {
  const bezel = width * 0.035;
  return (
    <div style={{ width, height, borderRadius: width * 0.16, backgroundColor: "#1b1b1d", padding: bezel, boxShadow: `${SOFT_SHADOW}, inset 0 0 0 3px #3a3a3c`, ...style }}>
      <div style={{ position: "relative", width: "100%", height: "100%", borderRadius: width * 0.13, overflow: "hidden", backgroundColor: colors.paper }}>
        {children}
        <div style={{ position: "absolute", top: width * 0.035, left: "50%", transform: "translateX(-50%)", width: width * 0.3, height: width * 0.085, borderRadius: 999, backgroundColor: "#000", zIndex: 5 }} />
      </div>
    </div>
  );
};

// An incoming direct message: avatar, name, bubble.
export const Message: React.FC<{ name: string; text: string; style?: CSSProperties }> = ({ name, text, style }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 18, ...style }}>
    <Avatar name={name} size={80} />
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 28, color: colors.graphite, marginLeft: 8 }}>{name}</span>
      <div style={{ padding: "26px 36px", borderRadius: 38, borderBottomLeftRadius: 10, backgroundColor: colors.fog, fontSize: 42, lineHeight: 1.25 }}>{text}</div>
    </div>
  </div>
);

// A step of a status list: a circle that fills (check or icon) and a label.
export const StatusStep: React.FC<{ label: string; sub?: string; p: number; icon?: ReactNode; line?: number; current?: boolean }> = ({ label, sub, p, icon, line, current }) => (
  <div style={{ display: "flex", gap: 30 }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 999,
          flexShrink: 0,
          border: `3px solid ${p > 0.5 ? colors.ink : colors.stone}`,
          backgroundColor: p > 0.5 ? colors.ink : colors.paper,
          color: colors.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: current && p > 0.5 ? "0 0 0 12px rgba(7,7,7,0.07)" : undefined,
        }}
      >
        <span style={{ display: "flex", transform: `scale(${p})` }}>{icon ?? <IoCheckmark size={42} />}</span>
      </div>
      {line !== undefined && (
        <div style={{ width: 4, height: 64, backgroundColor: colors.fog, position: "relative" }}>
          <div style={{ position: "absolute", inset: 0, backgroundColor: colors.ink, transformOrigin: "top", transform: `scaleY(${line})` }} />
        </div>
      )}
    </div>
    <div style={{ paddingTop: 10 }}>
      <div style={{ fontSize: 40, fontWeight: p > 0.5 ? 900 : 400, color: p > 0.5 ? colors.ink : colors.stone }}>{label}</div>
      {sub && <div style={{ fontSize: 28, color: colors.graphite, opacity: p }}>{sub}</div>}
    </div>
  </div>
);

// A push notification from comtor.
export const Push: React.FC<{ text: string; style?: CSSProperties }> = ({ text, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 22,
      padding: "24px 28px",
      borderRadius: 34,
      backgroundColor: "rgba(255,255,255,0.97)",
      boxShadow: SOFT_SHADOW,
      fontFamily: FONT,
      ...style,
    }}
  >
    <div style={{ width: 84, height: 84, borderRadius: 20, backgroundColor: colors.paper, border: `2px solid ${colors.line}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
      <Logo size={44} wordmark={false} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: colors.graphite }}>
        <span style={{ fontWeight: 700, color: colors.ink }}>comtor</span>
        <span>jetzt</span>
      </div>
      <div style={{ fontSize: 30, lineHeight: 1.3 }}>{text}</div>
    </div>
  </div>
);

// A line of a receipt or invoice.
export const Line: React.FC<{ label: ReactNode; value: ReactNode; muted?: boolean; bold?: boolean; style?: CSSProperties }> = ({ label, value, muted, bold, style }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", fontSize: 38, color: muted ? colors.graphite : colors.ink, fontWeight: bold ? 900 : 400, ...style }}>
    <span>{label}</span>
    <span style={{ fontWeight: 700 }}>{value}</span>
  </div>
);

// Small status label.
export const Tag: React.FC<{ children: ReactNode; dark?: boolean; style?: CSSProperties }> = ({ children, dark, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "8px 20px",
      borderRadius: 999,
      fontSize: 26,
      fontWeight: 700,
      backgroundColor: dark ? colors.ink : colors.fog,
      color: dark ? colors.paper : colors.graphite,
      ...style,
    }}
  >
    {children}
  </span>
);
