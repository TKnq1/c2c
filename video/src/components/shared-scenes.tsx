import type { CSSProperties } from "react";
import { ease, enterUp, popIn } from "../anim";
import { useFrame } from "../frame";
import { colors, GUTTER } from "../theme";
import { Logo, Stage, Subline } from "./ui";

// Black screen with the logo and one line under it, between the hook and the walkthrough.
export const LogoReveal: React.FC<{ line: string }> = ({ line }) => {
  const frame = useFrame();
  return (
    <Stage dark>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48 }}>
        <div style={popIn(ease(frame, 4, { stiffness: 120 }), 0.7)}>
          <Logo size={150} dark />
        </div>
        <div style={enterUp(ease(frame, 16), 30)}>
          <Subline dark style={{ fontSize: 46, textAlign: "center", padding: `0 ${GUTTER}px` }}>
            {line}
          </Subline>
        </div>
      </div>
    </Stage>
  );
};

export const UrlPill: React.FC<{ style?: CSSProperties }> = ({ style }) => (
  <div style={{ alignSelf: "center", padding: "30px 70px", borderRadius: 999, backgroundColor: colors.paper, color: colors.ink, fontSize: 54, fontWeight: 900, ...style }}>
    comtor.app
  </div>
);

// Mouse pointer, tip at (x, y). `pressed` 0..1 squeezes it for a click.
export const Cursor: React.FC<{ x: number; y: number; pressed?: number; opacity?: number }> = ({ x, y, pressed = 0, opacity = 1 }) => (
  <svg
    width={72}
    height={72}
    viewBox="0 0 24 24"
    style={{
      position: "absolute",
      left: x - 72 * (4 / 24),
      top: y - 72 * (2 / 24),
      transform: `scale(${1 - pressed * 0.15})`,
      transformOrigin: "17% 8%",
      filter: "drop-shadow(0 8px 12px rgba(0,0,0,0.3))",
      opacity,
      zIndex: 50,
    }}
  >
    <path d="M4 2 L4 19 L8.5 14.8 L11.5 21.5 L14.3 20.3 L11.3 13.7 L17.5 13.5 Z" fill={colors.ink} stroke={colors.paper} strokeWidth={1.4} strokeLinejoin="round" />
  </svg>
);

// 1 around a click frame, 0 elsewhere.
export function pressAt(frame: number, at: number) {
  const d = frame - at;
  return d < -3 || d > 4 ? 0 : 1 - Math.abs(d) / 4;
}
