import type { CSSProperties, ReactNode } from "react";
import { Img, staticFile } from "remotion";
import { colors } from "../theme";
import { POST_WIDTH } from "../posts/kit";
import { IPhone, IPHONE_WIDTH } from "./iphone";
import { GREY, Night, SampleNote, TwoTone } from "./kit";

export const PHONE_SCALE = 1.38;
export const PHONE_TOP = 372;
export const PHONE_LEFT = (POST_WIDTH - IPHONE_WIDTH * PHONE_SCALE) / 2;

type Lines = { text: string; grey?: boolean }[];

// A slide like the covers, held still: the headline, the app's screen on the iPhone, one piece of it lifted out
// (`callout`, centred on `at` and tilted by `rotate`, scaled by `scale`).
export const PhoneSlide: React.FC<{
  lines: Lines;
  screen: ReactNode;
  callout?: ReactNode;
  at?: [number, number];
  rotate?: number;
  scale?: number;
  example?: boolean;
  children?: ReactNode;
}> = ({ lines, screen, callout, at = [0, 0], rotate = 0, scale = 1.55, example = true, children }) => (
  <Night>
    <TwoTone top={96} size={80} lines={lines} />
    <IPhone left={PHONE_LEFT} top={PHONE_TOP} scale={PHONE_SCALE}>
      {screen}
    </IPhone>
    {children}
    {callout && (
      <div style={{ position: "absolute", left: at[0], top: at[1], transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`, color: colors.ink }}>
        {callout}
      </div>
    )}
    {example && <SampleNote />}
  </Night>
);

// The last slide: no phone, the mark large behind the headline and the address as the button.
export const CtaSlide: React.FC<{ lines: Lines; note: string; extra?: ReactNode }> = ({ lines, note, extra }) => (
  <Night>
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 56 }}>
      <Img src={staticFile("logo.png")} style={{ width: 132, height: 132, filter: "invert(1)" }} />
      <div style={{ textAlign: "center", fontSize: 92, fontWeight: 900, lineHeight: 1.02, letterSpacing: "-0.03em" }}>
        {lines.map(({ text, grey }) => (
          <div key={text} style={{ whiteSpace: "nowrap", color: grey ? GREY : "#fff" }}>
            {text}
          </div>
        ))}
      </div>
      {extra}
      <div style={{ padding: "30px 72px", borderRadius: 999, backgroundColor: "#fff", color: colors.ink, fontSize: 52, fontWeight: 900, letterSpacing: "-0.01em" }}>comtor.app</div>
      <div style={{ fontSize: 34, color: GREY }}>{note}</div>
    </div>
  </Night>
);

export const pillStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  whiteSpace: "nowrap",
  borderRadius: 999,
  backgroundColor: "#fff",
  padding: "10px 18px",
  fontSize: 15,
  fontWeight: 700,
  boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)",
};
