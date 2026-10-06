import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { FiBell, FiChevronLeft, FiCheck, FiHeart } from "react-icons/fi";
import { IoGiftOutline, IoStar } from "react-icons/io5";
import { SiInstagram, SiTiktok } from "react-icons/si";
import { colors, FONT, PHOTOS, type PhotoKey } from "../theme";

// Building blocks for the Instagram posts: the landing page (src/components/landing) redrawn for a still image. The
// phone and the pieces on it are laid out in the app's own CSS pixels and scaled as a whole, so every proportion is
// the app's.

export const POST_WIDTH = 1080;
export const POST_HEIGHT = 1440;

const NEUTRAL = { 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3", 500: "#737373", 600: "#525252", 900: "#171717" } as const;
const SHADOW_XL = "0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)";
const SHADOW_MD = "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)";
const PHONE_SHADOW = "0 60px 110px -40px rgba(0,0,0,0.55), 0 30px 50px -30px rgba(0,0,0,0.35), inset 0 0 0 1.5px rgba(255,255,255,0.1)";
const HAIRLINE = "rgba(7,7,7,0.1)";

// Film grain over the colour, as on the landing page (.lp-grain).
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

// White page with the colour of one product photo washed over it: the photo blown up and blurred until only its
// colours are left, under a veil so the type stays black (.lp-backdrop). `zoom` blows it up further and `focus` is the
// point of the photo (0 to 1 across and down) that lands in the middle of the post: it picks which colours show where,
// and keeps the photo's dark parts out from behind the type.
export const Canvas: React.FC<{ photo: PhotoKey; zoom?: number; focus?: [number, number]; veil?: number; children: ReactNode }> = ({
  photo,
  zoom = 1.4,
  focus = [0.5, 0.5],
  veil = 0.38,
  children,
}) => {
  const width = POST_WIDTH * zoom;
  const height = POST_HEIGHT * zoom;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.paper, color: colors.ink, fontFamily: FONT, overflow: "hidden" }}>
      <AbsoluteFill>
        <Img
          src={staticFile(PHOTOS[photo])}
          style={{
            position: "absolute",
            left: POST_WIDTH / 2 - focus[0] * width,
            top: POST_HEIGHT / 2 - focus[1] * height,
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

// The landing page's nav pill: the mark, the name and the address as the button.
export const NavPill: React.FC = () => (
  <div
    style={{
      position: "absolute",
      top: 56,
      left: "50%",
      transform: "translateX(-50%)",
      height: 88,
      padding: "0 14px 0 34px",
      borderRadius: 999,
      display: "flex",
      alignItems: "center",
      gap: 56,
      backgroundColor: "rgba(255,255,255,0.55)",
      backdropFilter: "blur(24px)",
      boxShadow: "0 8px 30px rgba(0,0,0,0.07), inset 0 0 0 2px rgba(255,255,255,0.6)",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <Img src={staticFile("logo.png")} style={{ width: 46, height: 46, mixBlendMode: "multiply" }} />
      <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: -0.6 }}>comtor</span>
    </div>
    <span style={{ padding: "16px 34px", borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, fontSize: 30, fontWeight: 700 }}>comtor.app</span>
  </div>
);

// The big centred headline: Lato Black, tight, one block per line so the breaks are exactly as written.
export const Headline: React.FC<{ lines: ReactNode[]; size: number; top: number }> = ({ lines, size, top }) => (
  <div style={{ position: "absolute", top, left: 0, right: 0, textAlign: "center", fontSize: size, fontWeight: 900, lineHeight: 0.98, letterSpacing: "-0.035em" }}>
    {lines.map((line, i) => (
      <div key={i} style={{ whiteSpace: "nowrap" }}>
        {line}
      </div>
    ))}
  </div>
);

export const Lead: React.FC<{ top: number; width?: number; size?: number; children: ReactNode }> = ({ top, width = 800, size = 42, children }) => (
  <div style={{ position: "absolute", top, left: "50%", transform: "translateX(-50%)", width, textAlign: "center", fontSize: size, lineHeight: 1.28, textWrap: "balance" }}>
    {children}
  </div>
);

// "Beispiel" over a white fade at the bottom edge, for the posts that show made-up brands and prices.
export const ExampleNote: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      height: 120,
      background: "linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.75) 45%, rgba(255,255,255,0) 100%)",
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "center",
      paddingBottom: 30,
      fontSize: 24,
      color: NEUTRAL[600],
    }}
  >
    Beispiel: Marken, Preise und Bewertungen sind erfunden.
  </div>
);

// --- The phone (src/components/landing/phone-frame.tsx) -------------------------------------------------------

// A phone drawn in the app's pixels (`width` × `height`), scaled by `scale`, with its top-left at (left, top).
export const Phone: React.FC<{ left: number; top: number; scale: number; width?: number; height: number; children: ReactNode }> = ({
  left,
  top,
  scale,
  width = 320,
  height,
  children,
}) => (
  <div style={{ position: "absolute", left, top, width: width * scale, height: height * scale }}>
    <div
      style={{
        width,
        height,
        transform: `scale(${scale})`,
        transformOrigin: "0 0",
        boxSizing: "border-box",
        padding: 9,
        borderRadius: 48,
        backgroundColor: "#0c0c0d",
        boxShadow: PHONE_SHADOW,
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: 39.2,
          backgroundColor: colors.paper,
          color: colors.ink,
          textAlign: "left",
          fontSize: 16,
        }}
      >
        {/* The Dynamic Island in an iPhone's proportions: 31% of the screen's width, 3.4 times as wide as tall. */}
        <div style={{ position: "absolute", top: 7, left: "50%", transform: "translateX(-50%)", width: "31%", aspectRatio: "3.4 / 1", borderRadius: 999, backgroundColor: "#000", zIndex: 30 }} />
        <StatusBar />
        {children}
      </div>
    </div>
  </div>
);

const StatusBar: React.FC = () => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 31% 1fr", alignItems: "center", height: 40, flexShrink: 0, fontSize: 13, fontWeight: 700 }}>
    <span style={{ justifySelf: "center" }}>11:11</span>
    <span />
    <span style={{ display: "flex", alignItems: "center", gap: 3, justifySelf: "center" }}>
      <svg viewBox="0 0 18 12" style={{ height: 10, width: "auto" }} fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="1" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
        <rect x="10" y="3" width="3" height="9" rx="1" />
        <rect x="15" y="0" width="3" height="12" rx="1" />
      </svg>
      <svg viewBox="0 0 16 12" style={{ height: 10, width: "auto" }} fill="currentColor">
        <path d="M8 2.2c2.4 0 4.6.9 6.2 2.5l1.3-1.3A10.6 10.6 0 0 0 8 .3 10.6 10.6 0 0 0 .5 3.4l1.3 1.3A8.7 8.7 0 0 1 8 2.2Zm0 3.7c1.4 0 2.7.5 3.6 1.4l1.3-1.3A7 7 0 0 0 8 4a7 7 0 0 0-4.9 2l1.3 1.3c1-.9 2.2-1.4 3.6-1.4Zm0 3.6c.5 0 .9.2 1.2.5L8 11.2 6.8 10c.3-.3.7-.5 1.2-.5Z" />
      </svg>
      <svg viewBox="0 0 27 13" style={{ height: 11, width: "auto" }} fill="none">
        <rect x="0.5" y="0.5" width="22" height="12" rx="3.5" stroke="currentColor" opacity="0.4" />
        <rect x="2" y="2" width="17" height="9" rx="2" fill="currentColor" />
        <path d="M24.5 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2Z" fill="currentColor" opacity="0.4" />
      </svg>
    </span>
  </div>
);

// The app's own header: logo, the screen's name, matches and notifications.
export const AppHeader: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, padding: "0 16px 10px", borderBottom: `1px solid ${HAIRLINE}` }}>
    <Img src={staticFile("logo.png")} style={{ width: 28, height: 28 }} />
    <span style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", fontSize: 17, lineHeight: "22px", fontWeight: 700 }}>{title}</span>
    <span style={{ display: "flex", alignItems: "center", gap: 12, color: colors.graphite }}>
      <FiHeart size={18} />
      <FiBell size={18} />
    </span>
  </div>
);

export const ChatHeader: React.FC<{ name: string }> = ({ name }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, padding: "0 8px 8px", borderBottom: `1px solid ${HAIRLINE}` }}>
    <FiChevronLeft size={24} />
    <GreyAvatar name={name} size={28} />
    <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>{name}</span>
  </div>
);

// --- Pieces of the app ----------------------------------------------------------------------------------------

export const GreyAvatar: React.FC<{ name: string; size: number }> = ({ name, size }) => (
  <div
    style={{
      width: size,
      height: size,
      flexShrink: 0,
      boxSizing: "border-box",
      borderRadius: 999,
      backgroundColor: NEUTRAL[200],
      color: NEUTRAL[600],
      border: `1px solid ${HAIRLINE}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.4,
    }}
  >
    {name.charAt(0).toUpperCase()}
  </div>
);

const Stars: React.FC<{ rating: number; light?: boolean }> = ({ rating, light }) => (
  <span style={{ display: "inline-flex", gap: 1 }}>
    {[0, 1, 2, 3, 4].map((i) => (
      <IoStar key={i} size={12} color={i < Math.round(rating) ? (light ? "#fff" : NEUTRAL[900]) : light ? "rgba(255,255,255,0.4)" : NEUTRAL[300]} />
    ))}
  </span>
);

export const Rating: React.FC<{ average: number; count: number; light?: boolean }> = ({ average, count, light }) => (
  <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: light ? "rgba(255,255,255,0.9)" : NEUTRAL[600] }}>
    <Stars rating={average} light={light} />
    {average.toFixed(1)} ({count})
  </span>
);

const Chip: React.FC<{ filled?: boolean; children: ReactNode }> = ({ filled, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      borderRadius: 4,
      padding: "6px 10px",
      boxSizing: "border-box",
      ...(filled ? { backgroundColor: "rgba(255,255,255,0.25)" } : { border: "1px solid rgba(255,255,255,0.4)" }),
    }}
  >
    {children}
  </span>
);

export type FeedDeal = {
  photo: PhotoKey;
  budget: string;
  company: string;
  title: string;
  rating: [number, number];
  platform: "TikTok" | "Instagram";
  deliverables: string;
};

// The swipe card of the Feed: the photo full-bleed, the budget up top, brand, title and what the job is over the
// bottom (src/components/request-card-face.tsx).
export const FeedCard: React.FC<{ deal: FeedDeal; height: number }> = ({ deal, height }) => {
  const photo = staticFile(PHOTOS[deal.photo]);
  return (
    <div style={{ position: "relative", marginTop: 12, height, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: "0 0 28px 28px", boxShadow: SHADOW_XL }}>
        <div style={{ position: "relative", height: "100%", overflow: "hidden", borderRadius: "0 0 28px 28px", backgroundColor: colors.paper }}>
          <Img src={photo} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.03)" }} />
          <div
            style={{
              position: "absolute",
              top: 24,
              left: 16,
              display: "flex",
              alignItems: "baseline",
              gap: 4,
              borderRadius: 999,
              padding: "6px 12px",
              backgroundColor: "rgba(255,255,255,0.9)",
              color: NEUTRAL[900],
              boxShadow: SHADOW_MD,
            }}
          >
            <span style={{ fontSize: 16, fontWeight: 900 }}>{deal.budget}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: NEUTRAL[500] }}>Budget</span>
          </div>
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, overflow: "hidden" }}>
            <div
              style={{
                position: "absolute",
                inset: 0,
                maskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 100%)",
              }}
            >
              <Img src={photo} style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height, objectFit: "cover", filter: "blur(24px)" }} />
            </div>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }} />
            <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 16, padding: "24px 24px 32px", color: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <GreyAvatar name={deal.company} size={56} />
                <div>
                  <div style={{ fontSize: 16, lineHeight: "24px", color: "rgba(255,255,255,0.7)" }}>{deal.company}</div>
                  <div style={{ fontSize: 17, lineHeight: "22px", fontWeight: 700 }}>{deal.title}</div>
                  <Rating average={deal.rating[0]} count={deal.rating[1]} light />
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, fontSize: 14, lineHeight: "20px", color: "rgba(255,255,255,0.9)" }}>
                <Chip filled>
                  {deal.platform === "TikTok" ? <SiTiktok size={14} /> : <SiInstagram size={14} />}
                  {deal.deliverables}
                </Chip>
                <Chip>
                  <IoGiftOutline size={14} />
                  Produkt inklusive
                </Chip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const Bubble: React.FC<{ mine?: boolean; children: ReactNode }> = ({ mine, children }) => (
  <div style={{ display: "flex", justifyContent: mine ? "flex-end" : "flex-start" }}>
    <p
      style={{
        margin: 0,
        maxWidth: "80%",
        borderRadius: 18,
        padding: "8px 14px",
        fontSize: 14,
        lineHeight: "20px",
        backgroundColor: mine ? colors.ink : colors.fog,
        color: mine ? colors.paper : NEUTRAL[900],
      }}
    >
      {children}
    </p>
  </div>
);

// --- Pieces lifted out of the phone (src/components/landing/feature-grid.tsx) ----------------------------------

// Centred on (cx, cy) in the post, tilted a little, scaled with the phone it belongs to.
export const Floating: React.FC<{ cx: number; cy: number; scale: number; rotate?: number; children: ReactNode }> = ({ cx, cy, scale, rotate = 0, children }) => (
  <div style={{ position: "absolute", left: cx, top: cy, transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`, transformOrigin: "center" }}>{children}</div>
);

export const Toast: React.FC<{ children: ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      borderRadius: 4,
      border: `1px solid ${HAIRLINE}`,
      backgroundColor: colors.paper,
      padding: "12px 16px",
      fontSize: 14,
      lineHeight: "20px",
      whiteSpace: "nowrap",
      boxShadow: SHADOW_XL,
    }}
  >
    <FiCheck size={16} />
    {children}
  </div>
);

export const BudgetPill: React.FC<{ amount: string }> = ({ amount }) => (
  <span
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 6,
      borderRadius: 999,
      backgroundColor: "#fff",
      padding: "10px 20px",
      color: NEUTRAL[900],
      boxShadow: SHADOW_XL,
      whiteSpace: "nowrap",
    }}
  >
    <span style={{ fontSize: 30, lineHeight: 1, fontWeight: 900 }}>{amount}</span>
    <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 700, color: NEUTRAL[500] }}>Budget</span>
  </span>
);

// The chat's offer card (src/components/chat-offer.tsx).
export const OfferCard: React.FC<{ eyebrow: string; amount: string; detail: string; width?: number }> = ({ eyebrow, amount, detail, width = 290 }) => (
  <div style={{ width, boxSizing: "border-box", borderRadius: 18, border: `1px solid ${HAIRLINE}`, backgroundColor: colors.paper, padding: 12, textAlign: "left", boxShadow: SHADOW_XL }}>
    <p style={{ margin: 0, fontSize: 11, lineHeight: "16px", fontWeight: 400, letterSpacing: "0.025em", textTransform: "uppercase", color: NEUTRAL[500] }}>{eyebrow}</p>
    <p style={{ margin: 0, fontSize: 22, lineHeight: 1.25, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{amount}</p>
    <p style={{ margin: "2px 0 0", fontSize: 12, lineHeight: "16px", color: NEUTRAL[600] }}>{detail}</p>
  </div>
);

// "Zahlung freigegeben": what the brand paid, the fee, what the creator gets.
export const PayoutReceipt: React.FC<{ brand: string; amount: string; fee: string; feeRate: number; payout: string }> = ({ brand, amount, fee, feeRate, payout }) => (
  <div style={{ width: 228, boxSizing: "border-box", borderRadius: 4, border: `1px solid ${HAIRLINE}`, backgroundColor: colors.paper, padding: "12px 14px", textAlign: "left", boxShadow: SHADOW_XL }}>
    <p style={{ margin: 0, fontSize: 11, lineHeight: "16px", letterSpacing: "0.025em", textTransform: "uppercase", color: NEUTRAL[500] }}>Zahlung freigegeben</p>
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontSize: 14, lineHeight: "20px" }}>
      <span>{brand} hat gezahlt</span>
      <span>{amount}</span>
    </div>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, lineHeight: "20px", color: NEUTRAL[500] }}>
      <span>comtor-Gebühr ({feeRate} %)</span>
      <span>−{fee}</span>
    </div>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${HAIRLINE}` }}>
      <span style={{ fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>Du bekommst</span>
      <span style={{ fontSize: 26, lineHeight: 1, fontWeight: 900 }}>{payout}</span>
    </div>
  </div>
);

// The push notification a brand gets when a creator is interested, as iOS shows it.
export const PushNotification: React.FC<{ name: string; title: string; width?: number }> = ({ name, title, width = 248 }) => (
  <div
    style={{
      width,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "flex-start",
      gap: 10,
      borderRadius: 18,
      border: `1px solid ${HAIRLINE}`,
      backgroundColor: "rgba(255,255,255,0.97)",
      backdropFilter: "blur(24px)",
      padding: 10,
      textAlign: "left",
      boxShadow: SHADOW_XL,
    }}
  >
    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 36, height: 36, flexShrink: 0, borderRadius: 9, backgroundColor: colors.ink }}>
      <Img src={staticFile("logo.png")} style={{ width: 22, height: 22, filter: "invert(1)", mixBlendMode: "screen" }} />
    </span>
    <span style={{ flex: 1, minWidth: 0, fontSize: 13, lineHeight: 1.375 }}>
      <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <span style={{ fontWeight: 700 }}>comtor</span>
        <span style={{ fontSize: 11, color: NEUTRAL[500] }}>jetzt</span>
      </span>
      <span style={{ display: "block" }}>
        {name} interessiert sich für „{title}“
      </span>
    </span>
  </div>
);

// A list row of the app's grey groups: a creator with niche, platform and followers.
export const CreatorRow: React.FC<{ name: string; niche: string; platform: "TikTok" | "Instagram" | "YouTube"; followers: string; last?: boolean }> = ({ name, niche, platform, followers, last }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderBottom: last ? undefined : `1px solid ${HAIRLINE}` }}>
    <GreyAvatar name={name} size={32} />
    <div>
      <div style={{ fontSize: 14, lineHeight: "20px" }}>{name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: NEUTRAL[500] }}>
        {niche} ·
        {platform === "TikTok" ? <SiTiktok size={12} color="#000" /> : platform === "Instagram" ? <SiInstagram size={12} color="#E4405F" /> : <span style={{ fontWeight: 700, color: "#f00" }}>▶</span>}
        {followers}
      </div>
    </div>
  </div>
);

export const GreyGroup: React.FC<{ children: ReactNode; style?: CSSProperties }> = ({ children, style }) => (
  <div style={{ borderRadius: 4, backgroundColor: colors.fog, ...style }}>{children}</div>
);

export const palette = NEUTRAL;
