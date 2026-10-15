import type { ReactNode } from "react";
import { FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoCheckmark, IoGiftOutline, IoLogoInstagram, IoLogoTiktok, IoLogoYoutube, IoStarOutline } from "react-icons/io5";
import { NOKAR_HOODIE, RAW_AVATAR, RAW_HOODIE, VINTAGE_DROP } from "../ads/brands";
import { Avatar, DealCard, Photo } from "../components/ui";
import { colors } from "../theme";
import { Chip, Field, PageTitle, SOFT_SHADOW } from "./kit";

// The app's screens and the fragments the launch video's scenes (scenes.tsx) are built from.

export const MONO = '"DejaVu Sans Mono", "Liberation Mono", Menlo, monospace';

// ---------------------------------------------------------------------------------------------------------------
// Fragments floating out of focus behind the opening lines

export const DmThread: React.FC<{ name: string; text: string; seen?: string }> = ({ name, text, seen = "Gesehen" }) => (
  <div style={{ width: 420, borderRadius: 14, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: 22, display: "flex", flexDirection: "column", gap: 14, fontSize: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 700 }}>
      <Avatar name={name} size={36} />
      {name}
    </div>
    <div style={{ alignSelf: "flex-end", maxWidth: 320, backgroundColor: colors.ink, color: colors.paper, borderRadius: 18, padding: "12px 16px", lineHeight: 1.35 }}>{text}</div>
    <div style={{ alignSelf: "flex-end", fontSize: 14, color: colors.stone }}>{seen}</div>
  </div>
);

export const MailRow: React.FC<{ subject: string; from: string }> = ({ subject, from }) => (
  <div style={{ width: 520, borderRadius: 10, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", fontSize: 17 }}>
    <span style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.ink }} />
    <span style={{ fontWeight: 700, width: 130 }}>{from}</span>
    <span style={{ color: colors.graphite }}>{subject}</span>
  </div>
);

export const SheetSnippet: React.FC<{ rows: [string, string][] }> = ({ rows }) => (
  <div style={{ width: 460, borderRadius: 10, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, overflow: "hidden", fontSize: 16 }}>
    {rows.map(([a, b], i) => (
      <div key={i} style={{ display: "flex", borderTop: i ? `1px solid ${colors.line}` : undefined, fontWeight: i ? 400 : 700, backgroundColor: i ? undefined : colors.fog }}>
        <span style={{ flex: 1, padding: "10px 14px", borderRight: `1px solid ${colors.line}` }}>{a}</span>
        <span style={{ width: 170, padding: "10px 14px", color: i ? colors.graphite : undefined }}>{b}</span>
      </div>
    ))}
  </div>
);

export const InvoiceSnippet: React.FC = () => (
  <div style={{ width: 380, borderRadius: 10, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: 24, display: "flex", flexDirection: "column", gap: 10, fontSize: 17 }}>
    <div style={{ fontWeight: 900, fontSize: 22 }}>Rechnung Nr. 017</div>
    <div style={{ color: colors.graphite }}>1 Reel + 2 Stories</div>
    <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 700 }}>
      <span>Betrag</span>
      <span>400,00 €</span>
    </div>
    <div style={{ alignSelf: "flex-start", fontSize: 14, fontWeight: 700, borderRadius: 999, border: `1px solid ${colors.ink}`, padding: "3px 10px" }}>Offen · seit 47 Tagen</div>
  </div>
);

// ---------------------------------------------------------------------------------------------------------------
// The creator's Feed on a computer (creator-desktop.tsx): the card stack with its buttons, the details next to it

const RoundButton: React.FC<{ size: number; filled?: boolean; children: ReactNode; faded?: boolean }> = ({ size, filled, children, faded }) => (
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
    }}
  >
    {children}
  </span>
);

const DetailsPanel: React.FC = () => (
  <div style={{ width: 400, display: "flex", flexDirection: "column", gap: 18, fontSize: 15 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <Avatar name="Raw Supplies" image={RAW_AVATAR} size={44} />
      <div>
        <div style={{ fontWeight: 700 }}>Raw Supplies</div>
        <div style={{ color: colors.graphite, fontSize: 13 }}>Fashion · Streetwear</div>
      </div>
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.5 }}>RAW Hoodie V2, erste Eindrücke</div>
    <div style={{ color: colors.graphite, lineHeight: 1.5 }}>
      Zeig den RAW Hoodie V2 in deinem Alltag. Ehrliche erste Eindrücke, kein Skript. Wir schicken dir den Hoodie in deiner Größe.
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <Chip>
        <IoLogoTiktok size={14} /> 1 Video
      </Chip>
      <Chip>
        <IoGiftOutline size={14} /> Produkt inklusive
      </Chip>
      <Chip>Min. 1.000 Follower</Chip>
    </div>
    <div style={{ borderTop: `1px solid ${colors.line}`, paddingTop: 16, display: "flex", justifyContent: "space-between" }}>
      <span style={{ color: colors.graphite }}>Budget</span>
      <span style={{ fontWeight: 900, fontSize: 20 }}>250 €</span>
    </div>
  </div>
);

export const CreatorFeed: React.FC = () => (
  <div style={{ padding: "28px 28px 0", display: "flex", flexDirection: "column", gap: 22 }}>
    <PageTitle>Feed</PageTitle>
    <div style={{ display: "flex", justifyContent: "center" }}>
      <div style={{ display: "flex", borderRadius: 999, backgroundColor: colors.fog, padding: 4, fontSize: 14 }}>
        <span style={{ padding: "6px 18px", borderRadius: 999, backgroundColor: colors.paper, fontWeight: 700, boxShadow: "0 1px 3px rgba(7,7,7,0.12)" }}>Für dich</span>
        <span style={{ padding: "6px 18px", color: colors.graphite }}>Alle</span>
      </div>
    </div>
    <div style={{ display: "flex", justifyContent: "center", gap: 48, alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ position: "relative", width: 340, height: 500 }}>
          <DealCard deal={{ ...VINTAGE_DROP, photo: "vintageJacket", photoPosition: undefined }} width={340} height={500} style={{ position: "absolute", transform: "translateY(14px) scale(0.94)", opacity: 0.6 }} />
          <DealCard deal={RAW_HOODIE} width={340} height={500} style={{ position: "absolute" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <RoundButton size={52}>
            <FiX size={22} />
          </RoundButton>
          <RoundButton size={38}>
            <IoStarOutline size={16} />
          </RoundButton>
          <RoundButton size={52} filled>
            <FiHeart size={22} />
          </RoundButton>
          <RoundButton size={38} faded>
            <FiRotateCcw size={16} />
          </RoundButton>
        </div>
      </div>
      <DetailsPanel />
    </div>
  </div>
);

// The brand's New request, the part a brand fills in (brand-desktop.tsx).
export const NewRequest: React.FC<{ published?: boolean }> = ({ published }) => (
  <div style={{ padding: "28px 36px", display: "flex", gap: 40 }}>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
      <PageTitle>Neue Anfrage</PageTitle>
      <Field label="Titel" value="Nokar Hoodie, Drop-Teaser" />
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
      <DealCard deal={NOKAR_HOODIE} width={300} height={440} />
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
        }}
      >
        {published && <IoCheckmark size={18} />}
        {published ? "Veröffentlicht" : "Anfrage veröffentlichen"}
      </div>
    </div>
  </div>
);
