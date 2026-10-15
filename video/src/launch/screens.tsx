import type { CSSProperties, ReactNode } from "react";
import { FiCheck, FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoCheckmark, IoGiftOutline, IoLogoInstagram, IoLogoTiktok, IoLogoYoutube, IoStarOutline } from "react-icons/io5";
import { NOKAR_HOODIE, RAW_AVATAR, RAW_HOODIE, VINTAGE_DROP, VS_AVATAR } from "../ads/brands";
import { mix } from "../anim";
import { Avatar, DealCard, type Deal, Photo } from "../components/ui";
import { colors } from "../theme";
import { Chip, Field, SOFT_SHADOW } from "./kit";

// The app's screens and the fragments the launch video's scenes (scenes.tsx) are built from. Everything that moves
// takes its state as props, so a scene drives it frame by frame.

export const MONO = '"DejaVu Sans Mono", "Liberation Mono", Menlo, monospace';

export const VINTAGE_JACKET: Deal = { ...VINTAGE_DROP, photo: "vintageJacket", photoPosition: undefined };

// ---------------------------------------------------------------------------------------------------------------
// Fragments floating out of focus behind the opening lines

// A DM the creator sent. `bubble` pops the message in (0..1), `seen` fades in the receipt under it.
export const DmThread: React.FC<{ name: string; text: string; seen?: string; bubble?: number; seenAt?: number }> = ({
  name,
  text,
  seen = "Gesehen",
  bubble = 1,
  seenAt = 1,
}) => (
  <div style={{ width: 420, borderRadius: 14, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: 22, display: "flex", flexDirection: "column", gap: 14, fontSize: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 700 }}>
      <Avatar name={name} size={36} />
      {name}
    </div>
    <div
      style={{
        alignSelf: "flex-end",
        maxWidth: 320,
        backgroundColor: colors.ink,
        color: colors.paper,
        borderRadius: 18,
        padding: "12px 16px",
        lineHeight: 1.35,
        opacity: Math.min(1, bubble * 2),
        transform: `scale(${mix(bubble, 0.6, 1)})`,
        transformOrigin: "100% 100%",
      }}
    >
      {text}
    </div>
    <div style={{ alignSelf: "flex-end", fontSize: 14, color: colors.stone, opacity: seenAt }}>{seen}</div>
  </div>
);

export const MailRow: React.FC<{ subject: string; from: string }> = ({ subject, from }) => (
  <div style={{ width: 520, borderRadius: 10, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", fontSize: 17 }}>
    <span style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.ink }} />
    <span style={{ fontWeight: 700, width: 130 }}>{from}</span>
    <span style={{ color: colors.graphite }}>{subject}</span>
  </div>
);

// A spreadsheet of brands written to; `rows` of them are filled in so far (fractional fades the next one in).
export const SheetSnippet: React.FC<{ rows: [string, string][]; shown?: number }> = ({ rows, shown = rows.length }) => (
  <div style={{ width: 460, borderRadius: 10, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, overflow: "hidden", fontSize: 16 }}>
    {rows.map(([a, b], i) => (
      <div
        key={i}
        style={{
          display: "flex",
          borderTop: i ? `1px solid ${colors.line}` : undefined,
          fontWeight: i ? 400 : 700,
          backgroundColor: i ? undefined : colors.fog,
          opacity: i === 0 ? 1 : Math.max(0, Math.min(1, shown - i + 1)),
        }}
      >
        <span style={{ flex: 1, padding: "10px 14px", borderRight: `1px solid ${colors.line}` }}>{a}</span>
        <span style={{ width: 170, padding: "10px 14px", color: i ? colors.graphite : undefined }}>{b}</span>
      </div>
    ))}
  </div>
);

export const InvoiceSnippet: React.FC<{ days?: number }> = ({ days = 47 }) => (
  <div style={{ width: 380, borderRadius: 10, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: 24, display: "flex", flexDirection: "column", gap: 10, fontSize: 17 }}>
    <div style={{ fontWeight: 900, fontSize: 22 }}>Rechnung Nr. 017</div>
    <div style={{ color: colors.graphite }}>1 Reel + 2 Stories</div>
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
      <span>Betrag</span>
      <span>400,00 €</span>
    </div>
    <div style={{ alignSelf: "flex-start", fontSize: 14, fontWeight: 700, borderRadius: 999, border: `1px solid ${colors.ink}`, padding: "3px 10px" }}>Offen · seit {days} Tagen</div>
  </div>
);

// ---------------------------------------------------------------------------------------------------------------
// The creator's Feed on a computer (creator-desktop.tsx): the card stack with its buttons, the details next to it

const RoundButton: React.FC<{ size: number; filled?: boolean; children: ReactNode; faded?: boolean; scale?: number }> = ({ size, filled, children, faded, scale = 1 }) => (
  <span
    style={{
      width: size,
      height: size,
      borderRadius: 999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: filled ? colors.ink : undefined,
      color: filled ? colors.paper : colors.graphite,
      border: filled ? undefined : `1px solid ${colors.line}`,
      opacity: faded ? 0.4 : 1,
      transform: `scale(${scale})`,
    }}
  >
    {children}
  </span>
);

type Details = { company: string; avatar: string; niche: string; title: string; text: string; platform: "TikTok" | "Instagram"; deliverables: string; budget: string };

const RAW_DETAILS: Details = {
  company: "Raw Supplies",
  avatar: RAW_AVATAR,
  niche: "Fashion · Streetwear",
  title: "RAW Hoodie V2, erste Eindrücke",
  text: "Zeig den RAW Hoodie V2 in deinem Alltag. Ehrliche erste Eindrücke, kein Skript. Wir schicken dir den Hoodie in deiner Größe.",
  platform: "TikTok",
  deliverables: "1 Video",
  budget: "250 €",
};

const VINTAGE_DETAILS: Details = {
  company: "vintagesteals.de",
  avatar: VS_AVATAR,
  niche: "Fashion · Vintage",
  title: "Catalogue Drop 2026, Haul-Video",
  text: "Zeig deine Lieblingsteile aus unserem neuen Katalog-Drop in einem Haul-Video, ein Reel und zwei Stories.",
  platform: "Instagram",
  deliverables: "1 Reel + 2 Stories",
  budget: "400 €",
};

const DetailsPanel: React.FC<{ details: Details; style?: CSSProperties }> = ({ details: d, style }) => (
  <div style={{ width: 400, display: "flex", flexDirection: "column", gap: 18, fontSize: 15, ...style }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar name={d.company} image={d.avatar} size={44} />
      <div>
        <div style={{ fontWeight: 700 }}>{d.company}</div>
        <div style={{ color: colors.graphite, fontSize: 13 }}>{d.niche}</div>
      </div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>{d.title}</div>
    <div style={{ color: colors.graphite, lineHeight: 1.5 }}>{d.text}</div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip>
        {d.platform === "TikTok" ? <IoLogoTiktok size={14} /> : <IoLogoInstagram size={14} />} {d.deliverables}
      </Chip>
      <Chip>
        <IoGiftOutline size={14} /> Produkt inklusive
      </Chip>
      <Chip>Min. 1.000 Follower</Chip>
    </div>
    <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: 16, display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: colors.graphite }}>Budget</span>
      <span style={{ fontWeight: 900, fontSize: 20 }}>{d.budget}</span>
    </div>
  </div>
);

// The top card being swiped, as swipe-card.tsx moves it: lifted while held, rotated by x / 18, the green wash once it
// is past the 100 px threshold. `out` 0..1 flies it off to the right.
export type SwipeState = { x: number; y: number; held: number; like: number; out: number };
export const NO_SWIPE: SwipeState = { x: 0, y: 0, held: 0, like: 0, out: 0 };

const CARD_W = 340;
const CARD_H = 500;

// Drawn above the details next to it, so a card swiped off to the right passes over them, as in the app.
export const CardStack: React.FC<{ swipe?: SwipeState; next?: number; heart?: number; scan?: number }> = ({ swipe = NO_SWIPE, next = 0, heart = 1, scan }) => {
  const x = swipe.x + swipe.out * 1100;
  const rotate = x / 18;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, position: "relative", zIndex: 2 }}>
      <div style={{ position: "relative", width: CARD_W, height: CARD_H }}>
        <DealCard
          deal={VINTAGE_JACKET}
          width={CARD_W}
          height={CARD_H}
          style={{ position: "absolute", transform: `translateY(${mix(next, 14, 0)}px) scale(${mix(next, 0.94, 1)})`, opacity: mix(next, 0.6, 1) }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `translate(${x}px, ${swipe.y}px) rotate(${rotate}deg) scale(${mix(swipe.held, 1, 1.03)})`,
            opacity: 1 - swipe.out,
          }}
        >
          <DealCard deal={RAW_HOODIE} width={CARD_W} height={CARD_H} />
          <div style={{ position: "absolute", inset: 0, borderRadius: 16 * (CARD_W / 600), backgroundColor: "#10b981", opacity: 0.35 * swipe.like }} />
          {scan !== undefined && (
            <div style={{ position: "absolute", left: -20, right: -20, top: `${scan * 100}%`, height: 3, background: colors.paper, boxShadow: "0 0 24px 8px rgba(255,255,255,0.7)" }} />
          )}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
        <RoundButton size={52}>
          <FiX size={22} />
        </RoundButton>
        <RoundButton size={38}>
          <IoStarOutline size={16} />
        </RoundButton>
        <RoundButton size={52} filled scale={heart}>
          <FiHeart size={22} />
        </RoundButton>
        <RoundButton size={38} faded>
          <FiRotateCcw size={16} />
        </RoundButton>
      </div>
    </div>
  );
};

export const CreatorFeed: React.FC<{ swipe?: SwipeState; next?: number; heart?: number; details?: number }> = ({ swipe, next = 0, heart, details = 1 }) => (
  <div style={{ padding: "28px 28px 0", display: "flex", flexDirection: "column", gap: 22 }}>
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", borderRadius: 999, backgroundColor: colors.fog, padding: 4, fontSize: 14 }}>
        <span style={{ padding: "6px 18px", borderRadius: 999, backgroundColor: colors.paper, fontWeight: 700, boxShadow: "0 1px 3px rgba(7,7,7,0.12)" }}>Für dich</span>
        <span style={{ padding: "6px 18px", color: colors.graphite }}>Alle</span>
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "center", gap: 48, alignItems: "flex-start" }}>
      <CardStack swipe={swipe} next={next} heart={heart} />
      {/* The details follow the top card: once it is swiped away they cross over to the next one. */}
      <div style={{ position: "relative", zIndex: 1, opacity: details }}>
        <DetailsPanel details={RAW_DETAILS} style={{ opacity: 1 - next }} />
        <DetailsPanel details={VINTAGE_DETAILS} style={{ position: "absolute", top: 0, left: 0, opacity: next }} />
      </div>
    </div>
  </div>
);

// The brand's New request (brand-desktop.tsx). `title` is what is typed into the title field so far.
export const NEW_REQUEST_TITLE = "Nokar Hoodie, Drop-Teaser";

export const NewRequest: React.FC<{ title?: string; caret?: boolean; published?: boolean; press?: number }> = ({ title = NEW_REQUEST_TITLE, caret, published, press = 0 }) => (
  <div style={{ padding: "28px 36px", display: "flex", gap: 40 }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
      <Field label="Titel" value={title} caret={caret} focused={caret} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Fotos</div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["nokarHoodie", "nokarPrint", "nokarBack"] as const).map((p, i) => (
            <div key={p} style={{ width: 64, height: 64, borderRadius: 4, overflow: "hidden", outline: i === 0 ? `2px solid ${colors.ink}` : undefined, outlineOffset: 2 }}>
              <Photo photo={p} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Plattform</div>
        <div style={{ display: "flex", gap: 8 }}>
          <Chip on>
            <IoLogoInstagram size={14} /> Instagram
          </Chip>
          <Chip>
            <IoLogoTiktok size={14} /> TikTok
          </Chip>
          <Chip>
            <IoLogoYoutube size={14} /> YouTube
          </Chip>
        </div>
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <Field label="Inhalt" value="1 Reel" width={200} />
        <Field label="Budget" value="300 €" width={160} />
        <Field label="Min. Follower" value="1.000" width={160} />
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Briefing</div>
        <div style={{ borderRadius: 4, border: "1px solid #d4d4d4", padding: "10px 12px", fontSize: 14.5, lineHeight: 1.5, color: colors.ink, height: 96 }}>
          Zeig den neuen Nokar Hoodie in einem Outfit-Reel, bevor der Drop startet. Wir schicken dir den Hoodie in deiner Größe.
        </div>
      </div>
    </div>
    <div style={{ width: 300, display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: colors.graphite, textTransform: "uppercase", letterSpacing: 1 }}>So sehen Creator deine Anfrage</div>
      <DealCard deal={{ ...NOKAR_HOODIE, title: title || NOKAR_HOODIE.title }} width={300} height={440} />
      <div
        style={{
          height: 44,
          borderRadius: 999,
          backgroundColor: published ? colors.paper : colors.ink,
          color: published ? colors.ink : colors.paper,
          border: `1px solid ${colors.ink}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontWeight: 700,
          fontSize: 15,
          transform: `scale(${1 - press * 0.05})`,
        }}
      >
        {published && <IoCheckmark size={18} />}
        {published ? "Veröffentlicht" : "Anfrage veröffentlichen"}
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------------------------------------------
// Why a request lands in "Für dich", drawn like the app's checklist (onboarding-checklist.tsx): a fog box, a count,
// round 20 px checks that fill ink with a white tick, text-sm. Everything at `k` times the app's size.

export type CheckRow = { label: string; value: string; ring: number; done: number };

export const MatchChecklist: React.FC<{ rows: CheckRow[]; k?: number; result?: number }> = ({ rows, k = 2, result = 0 }) => {
  const doneCount = rows.filter((r) => r.done > 0.5).length;
  return (
    <div style={{ width: 380 * k, borderRadius: 14 * k * 0.6, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW + ", 0 0 0 1px rgba(7,7,7,0.08)", padding: 20 * k, display: "flex", flexDirection: "column", gap: 16 * k }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 * k }}>
        <Avatar name="Raw Supplies" image={RAW_AVATAR} size={40 * k} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14 * k, fontWeight: 700 }}>RAW Hoodie V2, erste Eindrücke</div>
          <div style={{ fontSize: 12 * k, color: colors.graphite }}>Raw Supplies</div>
        </div>
        <span
          style={{
            borderRadius: 999,
            padding: `${2 * k}px ${10 * k}px`,
            fontSize: 12 * k,
            fontWeight: 700,
            backgroundColor: result > 0.5 ? colors.ink : colors.fog,
            color: result > 0.5 ? colors.paper : colors.graphite,
            transform: `scale(${1 + 0.15 * Math.sin(Math.PI * Math.min(1, result))})`,
          }}
        >
          Für dich
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 * k, borderRadius: 4 * k, backgroundColor: colors.fog, padding: 16 * k }}>
        <div style={{ fontSize: 14 * k, fontWeight: 700 }}>
          Passt zu dir ({doneCount}/{rows.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 * k }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 8 * k, fontSize: 14 * k }}>
              <span style={{ position: "relative", width: 20 * k, height: 20 * k, flexShrink: 0 }}>
                {/* The ring filling while the line is checked, then the filled circle with its tick. */}
                <span style={{ position: "absolute", inset: 0, borderRadius: 999, border: `${k}px solid #d4d4d4` }} />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    background: `conic-gradient(${colors.ink} ${r.ring * 360}deg, transparent 0deg)`,
                    WebkitMask: `radial-gradient(circle, transparent ${9 * k - k * 1.2}px, #000 ${9 * k - k * 1.2 + 0.5}px)`,
                    mask: `radial-gradient(circle, transparent ${9 * k - k * 1.2}px, #000 ${9 * k - k * 1.2 + 0.5}px)`,
                    opacity: r.done > 0.5 ? 0 : 1,
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 999,
                    backgroundColor: colors.ink,
                    color: colors.paper,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transform: `scale(${r.done})`,
                  }}
                >
                  <FiCheck size={12 * k} />
                </span>
              </span>
              <span style={{ flex: 1, color: r.done > 0.5 ? colors.ink : "#404040" }}>{r.label}</span>
              <span style={{ color: colors.graphite, opacity: Math.min(1, r.done) }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        style={{
          alignSelf: "flex-start",
          display: "flex",
          alignItems: "center",
          gap: 8 * k,
          borderRadius: 999,
          backgroundColor: colors.ink,
          color: colors.paper,
          padding: `${10 * k}px ${16 * k}px`,
          fontSize: 14 * k,
          fontWeight: 700,
          opacity: Math.min(1, result * 1.5),
          transform: `translateY(${(1 - Math.min(1, result)) * 10 * k}px)`,
        }}
      >
        <FiHeart size={14 * k} />
        Liegt in deinem Feed
      </div>
    </div>
  );
};
