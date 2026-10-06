import type { CSSProperties } from "react";
import { colors } from "../theme";
import { Canvas, Headline, Lead, NavPill, palette } from "./kit";

const CELL = 32;
const GAP = 7;

// A place is a square; the grid is as many squares as there are places.
const Places: React.FC<{ cols: number; rows: number }> = ({ cols, rows }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, gap: GAP }}>
    {Array.from({ length: cols * rows }, (_, i) => (
      <span key={i} style={{ width: CELL, height: CELL, boxSizing: "border-box", borderRadius: 6, border: `2.5px solid ${colors.ink}`, backgroundColor: "rgba(255,255,255,0.7)" }} />
    ))}
  </div>
);

const Column: React.FC<{ count: string; label: string; cols: number; rows: number; style?: CSSProperties }> = ({ count, label, cols, rows, style }) => (
  <div style={{ borderRadius: 4, backgroundColor: colors.fog, padding: "30px 30px 32px", ...style }}>
    <div style={{ fontSize: 112, lineHeight: 1, fontWeight: 900, letterSpacing: "-0.04em" }}>{count}</div>
    <div style={{ marginTop: 6, fontSize: 38, lineHeight: 1.1, fontWeight: 700 }}>{label}</div>
    <div style={{ marginTop: 22 }}>
      <Places cols={cols} rows={rows} />
    </div>
  </div>
);

// The founding places: the first 100 creators and the first 50 brands get Pro for free.
export const Post5: React.FC = () => (
  <Canvas photo="headphones" zoom={3.4} focus={[0.16, 0.15]}>
    <NavPill />
    <Headline lines={["Pro gratis", "für die Ersten."]} size={144} top={176} />
    <Lead top={486} width={900} size={38}>
      Die ersten 100 Creator und die ersten 50 Marken bekommen Pro kostenlos, solange ihr Konto besteht.
    </Lead>
    <div style={{ position: "absolute", top: 660, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24 }}>
      <Column count="100" label="Creator" cols={10} rows={10} />
      <Column count="50" label="Marken" cols={5} rows={10} />
    </div>
    <div style={{ position: "absolute", bottom: 44, left: 0, right: 0, textAlign: "center", fontSize: 30, color: palette[600] }}>
      Mit Pro: 3{" "}% statt 10{" "}% Gebühr. Sonst 10{" "}€ im Monat.
    </div>
  </Canvas>
);
