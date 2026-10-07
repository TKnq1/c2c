import type { ReactNode } from "react";
import { colors } from "../theme";
import { StatusBar } from "../posts/kit";

// An iPhone drawn in CSS around a screen of the app: titanium frame, black bezel, Dynamic Island, side buttons.
// Laid out in the app's pixels (a 320 x 692 screen) and scaled as a whole.
export const SCREEN_WIDTH = 320;
export const SCREEN_HEIGHT = 692;
const BEZEL = 11;
const FRAME = 4;
export const IPHONE_WIDTH = SCREEN_WIDTH + 2 * (BEZEL + FRAME);
export const IPHONE_HEIGHT = SCREEN_HEIGHT + 2 * (BEZEL + FRAME);

const TITANIUM = "linear-gradient(135deg, #626267 0%, #2c2c2f 20%, #1c1c1e 50%, #2c2c2f 80%, #626267 100%)";

const SideButton: React.FC<{ side: "left" | "right"; top: number; height: number }> = ({ side, top, height }) => (
  <div style={{ position: "absolute", [side]: -3, top, width: 4, height, borderRadius: 2, background: "linear-gradient(90deg, #3a3a3d, #5a5a5f, #3a3a3d)" }} />
);

export const IPhone: React.FC<{ left: number; top: number; scale: number; children: ReactNode }> = ({ left, top, scale, children }) => (
  <div style={{ position: "absolute", left, top, width: IPHONE_WIDTH * scale, height: IPHONE_HEIGHT * scale }}>
    <div style={{ position: "relative", width: IPHONE_WIDTH, height: IPHONE_HEIGHT, transform: `scale(${scale})`, transformOrigin: "0 0" }}>
      <SideButton side="left" top={112} height={30} />
      <SideButton side="left" top={166} height={56} />
      <SideButton side="left" top={234} height={56} />
      <SideButton side="right" top={190} height={92} />
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxSizing: "border-box",
          padding: FRAME,
          borderRadius: 58,
          background: TITANIUM,
          boxShadow: "0 0 0 1px rgba(255,255,255,0.07), 0 50px 90px rgba(0,0,0,0.65)",
        }}
      >
        <div style={{ width: "100%", height: "100%", boxSizing: "border-box", padding: BEZEL, borderRadius: 54, backgroundColor: "#000" }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              overflow: "hidden",
              borderRadius: 44,
              backgroundColor: colors.paper,
              color: colors.ink,
              textAlign: "left",
              fontSize: 16,
            }}
          >
            <div style={{ position: "absolute", top: 11, left: "50%", transform: "translateX(-50%)", width: "31%", aspectRatio: "3.4 / 1", borderRadius: 999, backgroundColor: "#000", zIndex: 30 }} />
            <StatusBar height={51} />
            {children}
          </div>
        </div>
      </div>
    </div>
  </div>
);
