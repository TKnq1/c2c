import type { ReactNode } from "react";
import { FiHeart, FiRotateCcw, FiX } from "react-icons/fi";
import { IoGiftOutline, IoLogoInstagram, IoLogoTiktok, IoLogoYoutube, IoStarOutline } from "react-icons/io5";
import { NOKAR_HOODIE, RAW_AVATAR, RAW_HOODIE, VINTAGE_DROP } from "../ads/brands";
import { Avatar, DealCard, Photo } from "../components/ui";
import { Cursor } from "../components/shared-scenes";
import { colors } from "../theme";
import {
  Backdrop,
  Bracketed,
  Center,
  Chip,
  DesktopApp,
  Field,
  Ghost,
  LAUNCH_HEIGHT,
  LAUNCH_WIDTH,
  LogoMark,
  PageTitle,
  SampleTag,
  SOFT_SHADOW,
  Statement,
  Tick,
  TypeLine,
  WideWord,
  Wordmark,
} from "./kit";
import LABELS from "./labels.json";

// One still per scene of the launch video (LAUNCH.md), at the moment that carries the scene. They fix the look
// before anything moves; the animated scenes are built from the same pieces.

const MONO = '"DejaVu Sans Mono", "Liberation Mono", Menlo, monospace';

// ---------------------------------------------------------------------------------------------------------------
// Fragments floating out of focus behind the opening lines

const DmThread: React.FC<{ name: string; text: string; seen?: string }> = ({ name, text, seen = "Gesehen" }) => (
  <div style={{ width: 420, borderRadius: 14, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: 22, display: "flex", flexDirection: "column", gap: 14, fontSize: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, fontWeight: 700 }}>
      <Avatar name={name} size={36} />
      {name}
    </div>
    <div style={{ alignSelf: "flex-end", maxWidth: 320, backgroundColor: colors.ink, color: colors.paper, borderRadius: 18, padding: "12px 16px", lineHeight: 1.35 }}>{text}</div>
    <div style={{ alignSelf: "flex-end", fontSize: 14, color: colors.stone }}>{seen}</div>
  </div>
);

const MailRow: React.FC<{ subject: string; from: string }> = ({ subject, from }) => (
  <div style={{ width: 520, borderRadius: 10, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: "16px 20px", display: "flex", gap: 14, alignItems: "center", fontSize: 17 }}>
    <span style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.ink }} />
    <span style={{ fontWeight: 700, width: 130 }}>{from}</span>
    <span style={{ color: colors.graphite }}>{subject}</span>
  </div>
);

const SheetSnippet: React.FC<{ rows: [string, string][] }> = ({ rows }) => (
  <div style={{ width: 460, borderRadius: 10, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, overflow: "hidden", fontSize: 16 }}>
    {rows.map(([a, b], i) => (
      <div key={i} style={{ display: "flex", borderTop: i ? `1px solid ${colors.line}` : undefined, fontWeight: i ? 400 : 700, backgroundColor: i ? undefined : colors.fog }}>
        <span style={{ flex: 1, padding: "10px 14px", borderRight: `1px solid ${colors.line}` }}>{a}</span>
        <span style={{ width: 170, padding: "10px 14px", color: i ? colors.graphite : undefined }}>{b}</span>
      </div>
    ))}
  </div>
);

const InvoiceSnippet: React.FC = () => (
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

const CreatorFeed: React.FC = () => (
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
const NewRequest: React.FC<{ step?: number }> = ({ step = 4 }) => (
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
      <div style={{ height: 44, borderRadius: 999, backgroundColor: step >= 4 ? colors.ink : colors.stone, color: colors.paper, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 15 }}>
        Anfrage veröffentlichen
      </div>
    </div>
  </div>
);

// ---------------------------------------------------------------------------------------------------------------
// The scenes

// 1 · Problem: typed over DMs that never got an answer.
export const L01: React.FC = () => (
  <Backdrop light="paper">
    <Ghost x={110} y={90} blur={3} opacity={0.8} rotate={-3}>
      <DmThread name="Glow Lab" text="Hey! Ich liebe eure Produkte. Habt ihr Lust auf eine Kooperation? 🙂" />
    </Ghost>
    <Ghost x={1290} y={150} blur={5} opacity={0.65} rotate={2}>
      <MailRow from="Nordwerk" subject="Re: Re: Kooperation?" />
    </Ghost>
    <Ghost x={1270} y={680} blur={3} opacity={0.8} rotate={-2}>
      <SheetSnippet rows={[["Marke", "Status"], ["Glow Lab", "keine Antwort"], ["Nordwerk", "keine Antwort"], ["Kiez Goods", "keine Antwort"], ["Lumo Audio", "Absage"]]} />
    </Ghost>
    <Ghost x={160} y={720} blur={6} opacity={0.6} rotate={3}>
      <DmThread name="Lumo Audio" text="Hallo, ich wollte nochmal nachfragen …" seen="Gesendet vor 9 Tagen" />
    </Ghost>
    <Center>
      <TypeLine text="40 Marken angeschrieben. Eine Antwort." size={72} />
    </Center>
  </Backdrop>
);

// 2 · Problem: and then the money.
export const L02: React.FC = () => (
  <Backdrop light="paper">
    <Ghost x={140} y={120} blur={3} opacity={0.8} rotate={-2}>
      <InvoiceSnippet />
    </Ghost>
    <Ghost x={1300} y={160} blur={4} opacity={0.75} rotate={3}>
      <DmThread name="Nordwerk" text="Kannst du mir deine IBAN nochmal schicken?" seen="Gelesen" />
    </Ghost>
    <Ghost x={1240} y={740} blur={6} opacity={0.6} rotate={-3}>
      <MailRow from="Buchhaltung" subject="Zahlungsziel: 60 Tage nach Rechnung" />
    </Ghost>
    <Center>
      <TypeLine text="Und wann kommt das Geld?" size={72} />
    </Center>
  </Backdrop>
);

// 3 · Turn: one line pulling into focus, word by word.
export const L03: React.FC = () => (
  <Backdrop light="mist">
    <Center>
      <Statement size={104} parts={[{ text: "Schluss mit " }, { text: "Hinterher", blur: 0 }, { text: "schreiben.", blur: 10, soft: true }]} />
    </Center>
  </Backdrop>
);

// 4 · Reveal: one huge word.
export const L04: React.FC = () => (
  <Backdrop light="mist">
    <Center>
      <div style={{ fontSize: 400, fontWeight: 900, letterSpacing: -18, lineHeight: 1 }}>Das ist</div>
    </Center>
  </Backdrop>
);

// 5 · Reveal: the word shrinks back and the name lands next to it.
export const L05: React.FC = () => (
  <Backdrop light="mist">
    <Center>
      <div style={{ display: "flex", alignItems: "center", gap: 40, fontSize: 150, fontWeight: 900, letterSpacing: -5 }}>
        <span style={{ color: colors.graphite }}>Das ist</span>
        <Wordmark size={150} />
      </div>
    </Center>
  </Backdrop>
);

// 6 · Claim.
export const L06: React.FC = () => (
  <Backdrop light="mist">
    <Center>
      <Statement
        size={92}
        parts={[{ text: "Der Marktplatz für ", soft: true, bold: false }, { text: "Marken" }, { text: " und ", soft: true, bold: false }, { text: "Creator" }, { text: ".", soft: true, bold: false }]}
      />
    </Center>
  </Backdrop>
);

// 7 · Product: the creator's Feed rising in, laid back in 3D.
export const L07: React.FC = () => (
  <Backdrop light="mist">
    <div style={{ position: "absolute", right: 110, top: 96, textAlign: "right", fontSize: 44, lineHeight: 1.1, fontWeight: 900, letterSpacing: -1.2, color: colors.graphite }}>
      Für Creator
    </div>
    <DesktopApp side="creator" active="Feed" scale={1.08} tilt={{ x: 22, y: -14, z: 4 }} style={{ position: "absolute", left: 220, top: 210 }}>
      <CreatorFeed />
    </DesktopApp>
    <SampleTag />
  </Backdrop>
);

// 8 · Matching: the app on the left, the check running in the dark panel on the right.
export const L08: React.FC = () => {
  const rows: [string, string][] = [
    ["Nische passt", "Fashion"],
    ["Reichweite passt", "50.000 Follower"],
    ["Plattform passt", "TikTok"],
    ["Budget", "250 €"],
  ];
  return (
    <Backdrop light="mist">
      <div style={{ position: "absolute", left: -380, top: 60, filter: "blur(1.5px)" }}>
        <DesktopApp side="creator" active="Feed" scale={1.12}>
          <CreatorFeed />
        </DesktopApp>
      </div>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 860,
          background: "linear-gradient(180deg, #0b0b0b 0%, #070707 60%, #1b1b1d 100%)",
          color: colors.paper,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 26,
          padding: "0 90px",
          fontFamily: MONO,
          fontSize: 28,
        }}
      >
        <div style={{ fontSize: 20, color: colors.graphite, marginBottom: 6 }}>Anfrage · Raw Supplies</div>
        {rows.map(([label, value]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 22, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <Tick size={30} dark />
            <span style={{ flex: 1 }}>{label}</span>
            <span style={{ color: colors.stone }}>{value}</span>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 22, backgroundColor: colors.paper, color: colors.ink, borderRadius: 6, padding: "18px 22px", fontWeight: 700 }}>
          <Tick size={30} />
          <span style={{ flex: 1 }}>Passt zu dir</span>
          <span>Für dich</span>
        </div>
      </div>
      <SampleTag dark />
    </Backdrop>
  );
};

// 9 · One swipe: the reference's "{ learning }", here the button the creator presses.
export const L09: React.FC = () => (
  <Backdrop light="paper">
    <Center style={{ gap: 90 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 28, fontSize: 92, letterSpacing: -2.5 }}>
        <span style={{ fontWeight: 900 }}>Ein Swipe:</span>
        <span style={{ color: colors.stone, fontWeight: 400 }}>{"{"}</span>
        <span style={{ fontWeight: 900 }}>Interessiert</span>
        <span style={{ color: colors.stone, fontWeight: 400 }}>{"}"}</span>
      </div>
      <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 20, borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, padding: "26px 52px", fontSize: 34, fontWeight: 700, boxShadow: SOFT_SHADOW }}>
        <FiHeart size={34} />
        Interessiert
        <Cursor x={300} y={70} pressed={0.6} />
      </div>
    </Center>
  </Backdrop>
);

// 10 · Money: brackets closing in on the word that matters.
export const L10: React.FC = () => (
  <Backdrop light="night">
    <Center style={{ gap: 36 }}>
      <div style={{ fontSize: 48, color: colors.stone }}>Die Marke zahlt zuerst. Das Geld wird</div>
      <Bracketed size={130} dark>
        zurückgehalten
      </Bracketed>
      <div style={{ fontSize: 48, color: colors.stone }}>bis dein Post online ist.</div>
    </Center>
  </Backdrop>
);

// 11 · The payoff, stamped wide.
export const L11: React.FC = () => (
  <Backdrop light="night">
    <Center style={{ gap: 60 }}>
      <WideWord size={190}>Ausgezahlt.</WideWord>
      <div style={{ display: "flex", alignItems: "center", gap: 22, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", padding: "20px 30px", fontSize: 30 }}>
        <Avatar name="Raw Supplies" image={RAW_AVATAR} size={48} />
        <span style={{ color: colors.stone }}>Raw Supplies</span>
        <span style={{ fontWeight: 900 }}>+ 225,00 €</span>
      </div>
    </Center>
    <SampleTag dark />
  </Backdrop>
);

// 12 · Switch to brands.
export const L12: React.FC = () => (
  <Backdrop light="night">
    <Center style={{ gap: 26 }}>
      <div style={{ fontSize: 180, fontWeight: 900, letterSpacing: -7 }}>Und</div>
      <Statement size={64} dark parts={[{ text: "für Marken: ", soft: true, bold: false }, { text: "ein Briefing, alle passenden Creator." }]} />
    </Center>
  </Backdrop>
);

// 13 · Briefing: the camera right on the field being filled in.
export const L13: React.FC = () => (
  <Backdrop light="mist">
    <div style={{ position: "absolute", left: 150, top: 170, display: "flex", flexDirection: "column", gap: 90 }}>
      <Field label="Titel" value="Nokar Hoodie, Drop-Te" caret focused size={84} width={2100} />
      <div style={{ display: "flex", gap: 60, filter: "blur(7px)", opacity: 0.6 }}>
        <Field label="Inhalt" value="1 Reel" size={84} width={620} />
        <Field label="Budget" value="300 €" size={84} width={520} />
      </div>
    </div>
    <SampleTag />
  </Backdrop>
);

// 14 · Briefing: the whole New request, the card as creators will see it, the pointer on Publish.
export const L14: React.FC = () => (
  <Backdrop light="mist">
    <DesktopApp side="brand" active="Anfragen" scale={1.16} tilt={{ x: 10, y: 10, z: -2 }} style={{ position: "absolute", left: 190, top: 50 }}>
      <NewRequest />
    </DesktopApp>
    <Cursor x={1500} y={722} pressed={0.4} />
    <SampleTag />
  </Backdrop>
);

// 15 · The difference: the soft line out, the sharp one in.
export const L15: React.FC = () => (
  <Backdrop light="mist">
    <Center style={{ gap: 34 }}>
      <div style={{ fontSize: 78, fontWeight: 400, color: colors.graphite, letterSpacing: -2, filter: "blur(1.5px)" }}>Agenturen vermitteln Kontakte.</div>
      <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3.5 }}>comtor wickelt den Deal ab.</div>
    </Center>
  </Backdrop>
);

// 16 · End card.
export const L16: React.FC = () => (
  <Backdrop light="mist">
    <Center>
      <Wordmark size={140} />
    </Center>
  </Backdrop>
);

// 17 · Call to action, typed on black.
export const L17: React.FC = () => (
  <Backdrop light="night">
    <Center style={{ gap: 40 }}>
      <TypeLine text="Jetzt kostenlos starten." size={76} />
      <div style={{ fontSize: 36, color: colors.stone, textAlign: "center", lineHeight: 1.45 }}>
        Die ersten 50 Marken und 100 Creator
        <br />
        bekommen Pro kostenlos, solange ihr Konto besteht.
      </div>
    </Center>
    <div style={{ position: "absolute", bottom: 64, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 700 }}>
      <LogoMark size={30} dark />
      comtor.app
    </div>
  </Backdrop>
);

const COMPONENTS: Record<string, React.FC> = { L01, L02, L03, L04, L05, L06, L07, L08, L09, L10, L11, L12, L13, L14, L15, L16, L17 };

// Labels live in labels.json so the render script can read them.
export const LAUNCH_STILLS = LABELS.map(({ id, label }) => {
  const component = COMPONENTS[id];
  if (!component) throw new Error(`No still ${id} for its label`);
  return { id, label, component };
});

export { LAUNCH_HEIGHT, LAUNCH_WIDTH };
