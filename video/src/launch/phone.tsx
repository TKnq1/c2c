import type { CSSProperties, ReactNode } from "react";
import { FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import {
  IoCardOutline,
  IoChatbubbleOutline,
  IoGiftOutline,
  IoHeartOutline,
  IoHome,
  IoNotificationsOutline,
  IoSearchOutline,
  IoSettingsOutline,
  IoStar,
  IoStarOutline,
} from "react-icons/io5";
import { mix } from "../anim";
import { Avatar, Photo, PlatformIcon, type Deal } from "../components/ui";
import { colors, FONT } from "../theme";

// A phone for the launch video: an iPhone in black titanium drawn in CSS (screen 402 x 874 pt like the 16 Pro, the
// Dynamic Island, status bar, side buttons, a thickness of stacked layers behind it so it holds up when turned in 3D),
// and the creator's Feed as the app draws it on a phone (swipe-card-stack.tsx, nav.tsx): the card edge to edge under
// the header, its actions on the card, the tab bar floating as a pill.

export const SCREEN = { w: 402, h: 874 };
const BEZEL = 12;
const BAND = 5;
const SCREEN_R = 58;
const OUTER = { w: SCREEN.w + 2 * (BEZEL + BAND), h: SCREEN.h + 2 * (BEZEL + BAND), r: SCREEN_R + BEZEL + BAND };
// The whole phone, and where the screen sits in it.
export const PHONE = { w: OUTER.w, h: OUTER.h, inset: BEZEL + BAND };
const DEPTH = 9;

const TITANIUM = "linear-gradient(160deg, #6d6d72 0%, #2c2c2f 14%, #4a4a4f 30%, #1f1f22 52%, #3d3d41 74%, #2a2a2d 88%, #6a6a6f 100%)";

const SideButton: React.FC<{ side: "left" | "right"; top: number; height: number }> = ({ side, top, height }) => (
  <div
    style={{
      position: "absolute",
      top,
      [side]: -3.5,
      width: 5,
      height,
      borderRadius: 3,
      background: "linear-gradient(90deg, #232326, #5c5c61 45%, #2a2a2d)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.2)",
    }}
  />
);

const StatusBar: React.FC<{ dark?: boolean }> = ({ dark }) => {
  const ink = dark ? colors.paper : colors.ink;
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 54, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 34px 0 52px", zIndex: 40, color: ink }}>
      <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: -0.2, fontFamily: FONT, marginTop: 4 }}>9:41</span>
      <svg width={78} height={14} viewBox="0 0 78 14" style={{ marginTop: 4 }}>
        {[0, 1, 2, 3].map((k) => (
          <rect key={k} x={k * 5.4} y={10 - k * 2.6} width={3.4} height={3.6 + k * 2.6} rx={0.9} fill={ink} />
        ))}
        <path d="M33 4.6a8.6 8.6 0 0 1 11.8 0l-1.3 1.4a6.7 6.7 0 0 0-9.2 0Z M35.6 7.4a4.9 4.9 0 0 1 6.6 0l-1.3 1.4a3 3 0 0 0-4 0Z M38.9 12.6l-1.9-2a1.3 1.3 0 0 1 1.9-.1 1.3 1.3 0 0 1 1.9.1Z" fill={ink} />
        <rect x={52} y={1.5} width={22} height={11} rx={3.4} fill="none" stroke={ink} strokeOpacity={0.4} strokeWidth={1} />
        <rect x={54} y={3.5} width={17} height={7} rx={1.8} fill={ink} />
        <path d="M75.6 5.4v3.2a1.7 1.7 0 0 0 0-3.2Z" fill={ink} fillOpacity={0.45} />
      </svg>
    </div>
  );
};

// `glare` 0..1 runs a soft reflection across the glass.
export const IPhone: React.FC<{ children: ReactNode; glare?: number; style?: CSSProperties }> = ({ children, glare, style }) => (
  <div style={{ position: "relative", width: OUTER.w, height: OUTER.h, transformStyle: "preserve-3d", ...style }}>
    {/* The phone's thickness: the outline repeated behind it, darker towards the back. */}
    {Array.from({ length: DEPTH }, (_, k) => (
      <div
        key={k}
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: OUTER.r,
          background: k === DEPTH - 1 ? "#141416" : TITANIUM,
          filter: `brightness(${0.85 - k * 0.05})`,
          transform: `translateZ(${-(k + 1) * 1.1}px)`,
          boxShadow: k === DEPTH - 1 ? "0 60px 120px rgba(7,7,7,0.35), 0 20px 40px rgba(7,7,7,0.25)" : undefined,
        }}
      />
    ))}
    <SideButton side="left" top={178} height={32} />
    <SideButton side="left" top={242} height={62} />
    <SideButton side="left" top={318} height={62} />
    <SideButton side="right" top={262} height={96} />
    <SideButton side="right" top={560} height={48} />
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: OUTER.r,
        background: TITANIUM,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.22), inset 0 3px 2px rgba(255,255,255,0.18), inset 0 -3px 3px rgba(0,0,0,0.55)",
      }}
    />
    <div style={{ position: "absolute", inset: BAND, borderRadius: SCREEN_R + BEZEL, backgroundColor: "#040404", boxShadow: "inset 0 0 0 1.5px #000, 0 0 0 1px rgba(255,255,255,0.06)" }} />
    <div
      style={{
        position: "absolute",
        left: BAND + BEZEL,
        top: BAND + BEZEL,
        width: SCREEN.w,
        height: SCREEN.h,
        borderRadius: SCREEN_R,
        overflow: "hidden",
        backgroundColor: colors.paper,
        fontFamily: FONT,
        color: colors.ink,
      }}
    >
      {children}
      <StatusBar />
      {/* Dynamic Island with the camera's lens. */}
      <div style={{ position: "absolute", top: 11, left: (SCREEN.w - 124) / 2, width: 124, height: 36, borderRadius: 20, backgroundColor: "#000", zIndex: 50 }}>
        <div style={{ position: "absolute", right: 14, top: 11, width: 14, height: 14, borderRadius: 99, background: "radial-gradient(circle at 35% 35%, #2b3a55 0%, #0b1020 45%, #000 70%)", boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.05)" }} />
      </div>
      <div style={{ position: "absolute", bottom: 8, left: (SCREEN.w - 140) / 2, width: 140, height: 5, borderRadius: 3, backgroundColor: colors.ink, zIndex: 50 }} />
      {/* The glass: a faint sheen always, and a brighter reflection passing over it. */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(125deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 32%)", zIndex: 60, pointerEvents: "none" }} />
      {glare !== undefined && glare > 0 && glare < 1 && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 61,
            pointerEvents: "none",
            background: `linear-gradient(115deg, rgba(255,255,255,0) ${mix(glare, -40, 120)}%, rgba(255,255,255,0.28) ${mix(glare, -30, 130)}%, rgba(255,255,255,0) ${mix(glare, -18, 142)}%)`,
          }}
        />
      )}
    </div>
  </div>
);

// ---------------------------------------------------------------------------------------------------------------
// The Feed on a phone

export type PhoneSwipe = { x: number; y: number; held: number; like: number; out: number };

const HEADER_H = 59 + 63;
const CARD_TOP = HEADER_H + 8;
const PILL = { bottom: 28, h: 58 };
const CARD_H = SCREEN.h - CARD_TOP - (PILL.bottom + PILL.h + 12);

const GlassButton: React.FC<{ size: number; filled?: boolean; scale?: number; faded?: boolean; children: ReactNode }> = ({ size, filled, scale = 1, faded, children }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      justifySelf: "center",
      backgroundColor: filled ? colors.ink : "rgba(255,255,255,0.9)",
      color: filled ? colors.paper : "#262626",
      border: filled ? undefined : "1px solid rgba(0,0,0,0.1)",
      boxShadow: "0 10px 15px -3px rgba(0,0,0,0.18), 0 4px 6px -4px rgba(0,0,0,0.18)",
      transform: `scale(${scale})`,
      opacity: faded ? 0.55 : 1,
    }}
  >
    {children}
  </span>
);

// One card as the phone draws it (RequestCardFace on SwipeCard): the photo full-bleed, the budget top left, the brand
// and the job over the bottom, room left for the actions.
const PhoneCard: React.FC<{ deal: Deal; left?: string; style?: CSSProperties; children?: ReactNode }> = ({ deal, left, style, children }) => (
  <div style={{ position: "absolute", left: 0, top: CARD_TOP, width: SCREEN.w, height: CARD_H, ...style }}>
    <div style={{ position: "absolute", inset: 0, borderRadius: "0 0 28px 28px", overflow: "hidden", backgroundColor: colors.fog, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.12), 0 8px 10px -6px rgba(0,0,0,0.12)" }}>
      <Photo photo={deal.photo} style={{ position: "absolute", inset: 0, transform: "scale(1.03)", objectPosition: deal.photoPosition }} />
      <div style={{ position: "absolute", top: 24, left: 16, display: "flex", alignItems: "baseline", gap: 4, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.9)", color: "#171717", padding: "6px 12px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.15)" }}>
        <span style={{ fontSize: 16, fontWeight: 900 }}>{deal.budget}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: "#737373" }}>Budget</span>
      </div>
      {left && (
        <div style={{ position: "absolute", top: 24, right: 16, borderRadius: 999, backgroundColor: "rgba(0,0,0,0.45)", color: colors.paper, fontSize: 12, fontWeight: 600, padding: "4px 10px" }}>{left}</div>
      )}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: "24px 24px 104px", background: "linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.5) 60%, rgba(0,0,0,0))", color: colors.paper, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Avatar name={deal.company} image={deal.avatar} size={56} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 16, color: "rgba(255,255,255,0.72)" }}>{deal.company}</div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{deal.title}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>
              <IoStar size={13} color="#fbbf24" />
              {deal.rating[0]} ({deal.rating[1]})
            </div>
          </div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 14, color: "rgba(255,255,255,0.92)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 4, padding: "6px 10px", backgroundColor: "rgba(255,255,255,0.25)" }}>
            <PlatformIcon platform={deal.platform} size={14} />
            {deal.deliverables}
          </span>
          {deal.productIncluded && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 4, padding: "6px 10px", border: "1px solid rgba(255,255,255,0.4)" }}>
              <IoGiftOutline size={14} />
              Produkt inklusive
            </span>
          )}
        </div>
      </div>
      {children}
    </div>
  </div>
);

const TABS = [IoHome, IoSearchOutline, IoChatbubbleOutline, IoCardOutline, IoSettingsOutline];

// `swipe` moves the top card as swipe-card.tsx does (rotated by x / 18, the green wash past the threshold, `out` flings
// it off); `next` brings the card behind it up; `touch` is the finger on the glass (screen points), `heart` pulses
// the heart button.
export const PhoneFeed: React.FC<{
  top: Deal;
  under: Deal;
  swipe: PhoneSwipe;
  next: number;
  heart?: number;
  touch?: { x: number; y: number; pressed: number; opacity: number };
}> = ({ top, under, swipe, next, heart = 1, touch }) => {
  const x = swipe.x + swipe.out * 700;
  return (
    <div style={{ position: "absolute", inset: 0, backgroundColor: colors.paper }}>
      <PhoneCard deal={under} left="11 Anfragen übrig" style={{ transform: `scale(${mix(next, 0.95, 1)})`, transformOrigin: "50% 0%", opacity: mix(next, 0.7, 1) }} />
      <PhoneCard
        deal={top}
        left="12 Anfragen übrig"
        style={{ transform: `translate(${x}px, ${swipe.y}px) rotate(${x / 18}deg) scale(${mix(swipe.held, 1, 1.02)})`, transformOrigin: "50% 80%", opacity: 1 - swipe.out * 0.8 }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundColor: "#10b981", opacity: 0.35 * swipe.like }} />
      </PhoneCard>
      {/* The actions on the card's bottom edge: pass, save the brand, interested, undo. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: CARD_TOP + CARD_H - 16 - 56, display: "grid", gridTemplateColumns: "repeat(5, 1fr)", alignItems: "center" }}>
        <span />
        <GlassButton size={56}>
          <FiX size={24} />
        </GlassButton>
        <GlassButton size={44}>
          <IoStarOutline size={17} />
        </GlassButton>
        <GlassButton size={56} filled scale={heart}>
          <FiHeart size={24} />
        </GlassButton>
        <GlassButton size={44} faded>
          <FiRotateCcw size={17} />
        </GlassButton>
      </div>
      {/* The header, frosted, with the For you / All switch in the middle. */}
      <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: HEADER_H, backgroundColor: "rgba(255,255,255,0.86)", borderBottom: `1px solid ${colors.line}`, backdropFilter: "blur(20px)" }}>
        <div style={{ position: "absolute", top: 59, left: 0, right: 0, height: 63, display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 24px" }}>
          <span />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderRadius: 4, backgroundColor: colors.fog, padding: 4, fontSize: 14, fontWeight: 600 }}>
            <span style={{ padding: "4px 12px", borderRadius: 4, backgroundColor: colors.paper, color: "#171717", textAlign: "center", boxShadow: "0 1px 2px rgba(0,0,0,0.06)" }}>Für dich</span>
            <span style={{ padding: "4px 12px", color: "#737373", textAlign: "center" }}>Alle</span>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 16 }}>
            <IoHeartOutline size={24} />
            <IoNotificationsOutline size={24} />
          </div>
        </div>
      </div>
      {/* The tab bar: a long frosted pill above the bottom edge, the current tab on a soft pill of its own. */}
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: PILL.bottom,
          height: PILL.h,
          borderRadius: 999,
          border: `1px solid ${colors.line}`,
          backgroundColor: "rgba(255,255,255,0.92)",
          boxShadow: "0 10px 30px -8px rgba(0,0,0,0.28)",
          padding: 4,
          display: "flex",
          gap: 2,
        }}
      >
        {TABS.map((Icon, i) => (
          <span key={i} style={{ flex: 1, height: 48, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: i === 0 ? "rgba(7,7,7,0.08)" : undefined, color: i === 0 ? colors.ink : "#a3a3a3" }}>
            <Icon size={24} />
          </span>
        ))}
      </div>
      {touch && touch.opacity > 0 && (
        <div
          style={{
            position: "absolute",
            left: touch.x - 24,
            top: touch.y - 24,
            width: 48,
            height: 48,
            borderRadius: 99,
            backgroundColor: `rgba(255,255,255,${0.55 + 0.2 * touch.pressed})`,
            border: "2px solid rgba(255,255,255,0.95)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3), inset 0 0 8px rgba(255,255,255,0.6)",
            opacity: touch.opacity,
            transform: `scale(${mix(touch.pressed, 1.25, 0.9)})`,
            zIndex: 30,
          }}
        />
      )}
    </div>
  );
};
