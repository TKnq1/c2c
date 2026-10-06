import type { ReactNode } from "react";
import {
  IoChatbubble,
  IoCheckmark,
  IoHeart,
  IoLink,
  IoLockClosed,
  IoLogoInstagram,
  IoLogoTiktok,
  IoPaperPlane,
  IoPlay,
  IoShareSocial,
  IoStar,
} from "react-icons/io5";
import { Avatar, BrowserWindow, DealCard, Headline, Logo, Photo, PhoneOutline, SampleNote, SceneHeader, Stage, Subline, Toast } from "../components/ui";
import { colors, GUTTER, type PhotoKey } from "../theme";
import { LogoReveal, UrlPill } from "./creator";

export const B01Hook: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Werbung wird", { mark: "weggewischt." }]} size={124} />
    <PhoneOutline width={640} height={1240} style={{ position: "absolute", top: 600, left: 220 }}>
      <div style={{ position: "absolute", inset: 0, paddingTop: 110, display: "flex", flexDirection: "column", gap: 30, alignItems: "center" }}>
        <div
          style={{
            width: 560,
            height: 760,
            borderRadius: 12,
            backgroundColor: colors.fog,
            border: `2px solid ${colors.line}`,
            position: "relative",
            transform: "translateX(-190px) rotate(-12deg)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          <span style={{ position: "absolute", top: 24, left: 24, fontSize: 24, fontWeight: 700, padding: "6px 14px", borderRadius: 4, backgroundColor: colors.stone, color: colors.paper }}>
            Anzeige
          </span>
          <span style={{ fontSize: 96, fontWeight: 900, color: colors.stone }}>SALE</span>
          <span style={{ fontSize: 56, fontWeight: 900, color: colors.stone }}>−20 %</span>
          <span style={{ marginTop: 20, padding: "16px 40px", borderRadius: 4, backgroundColor: colors.stone, color: colors.paper, fontSize: 30, fontWeight: 700 }}>Jetzt kaufen</span>
        </div>
      </div>
      {[300, 420, 540].map((top, i) => (
        <div key={top} style={{ position: "absolute", top: top + 200, left: 330 + i * 30, width: 200 - i * 40, height: 10, borderRadius: 999, backgroundColor: colors.stone }} />
      ))}
    </PhoneOutline>
  </Stage>
);

export const UgcPost: React.FC<{ photo: PhotoKey; name: string; handle: string; caption: string; width: number; height: number }> = ({
  photo,
  name,
  handle,
  caption,
  width,
  height,
}) => (
  <PhoneOutline width={width} height={height}>
    <Photo photo={photo} style={{ position: "absolute", inset: 0 }} />
    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 45%)" }} />
    <div style={{ position: "absolute", top: 110, left: 34, display: "flex", alignItems: "center", gap: 16, color: colors.paper }}>
      <Avatar name={name} size={72} style={{ border: `4px solid ${colors.paper}` }} />
      <div>
        <div style={{ fontSize: 30, fontWeight: 900 }}>{name}</div>
        <div style={{ fontSize: 24, opacity: 0.85 }}>{handle}</div>
      </div>
    </div>
    <div style={{ position: "absolute", right: 28, bottom: 230, display: "flex", flexDirection: "column", gap: 34, alignItems: "center", color: colors.paper, fontSize: 24, fontWeight: 700 }}>
      {[
        { icon: <IoHeart size={60} />, n: "12,4K" },
        { icon: <IoChatbubble size={54} />, n: "318" },
        { icon: <IoShareSocial size={54} />, n: "1,1K" },
      ].map(({ icon, n }) => (
        <div key={n} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          {icon}
          {n}
        </div>
      ))}
    </div>
    <div style={{ position: "absolute", left: 34, right: 130, bottom: 80 }}>
      <span style={{ backgroundColor: colors.paper, color: colors.ink, fontSize: 34, fontWeight: 900, lineHeight: 1.45, padding: "4px 12px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
        {caption}
      </span>
    </div>
  </PhoneOutline>
);

const Floating: React.FC<{ x: number; y: number; rotate: number; children: ReactNode }> = ({ x, y, rotate, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      transform: `rotate(${rotate}deg)`,
      width: 120,
      height: 120,
      borderRadius: 999,
      backgroundColor: colors.ink,
      color: colors.paper,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 18px 40px rgba(7,7,7,0.25)",
    }}
  >
    {children}
  </div>
);

export const B02Ugc: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Echte Creator. Echte Videos.", { mark: "Echtes Vertrauen." }]} size={92} />
    <div style={{ position: "absolute", top: 640, left: 220 }}>
      <UgcPost photo="serum" name="Lena" handle="@lena.glow" caption="ok, dieses Serum ist ehrlich gesagt mein neues Lieblingsteil" width={640} height={1180} />
    </div>
    <Floating x={90} y={820} rotate={-12}>
      <IoHeart size={60} />
    </Floating>
    <Floating x={880} y={1000} rotate={10}>
      <IoChatbubble size={54} />
    </Floating>
    <Floating x={70} y={1500} rotate={8}>
      <IoShareSocial size={54} />
    </Floating>
  </Stage>
);

const GRID: PhotoKey[] = ["serum", "matcha", "headphones", "glasses", "lipstick", "tote", "cream", "lotion", "flask"];

export const B03Growth: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Mehr Content. Mehr Reichweite.", { mark: "Schneller wachsen." }]} size={88} />
    <div style={{ position: "absolute", top: 600, left: GUTTER, right: GUTTER, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      {GRID.map((p) => (
        <div key={p} style={{ height: 260, borderRadius: 8, overflow: "hidden", position: "relative" }}>
          <Photo photo={p} />
          <IoPlay size={44} color={colors.paper} style={{ position: "absolute", left: 18, bottom: 16, filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.4))" }} />
        </div>
      ))}
    </div>
    <div
      style={{
        position: "absolute",
        top: 1450,
        left: GUTTER,
        right: GUTTER,
        height: 360,
        borderRadius: 16,
        backgroundColor: colors.paper,
        boxShadow: "0 40px 90px rgba(7,7,7,0.2), 0 0 0 2px rgba(7,7,7,0.06)",
        padding: 40,
      }}
    >
      <div style={{ fontSize: 30, fontWeight: 700, color: colors.graphite }}>Reichweite</div>
      <svg width="100%" height="240" viewBox="0 0 860 280" preserveAspectRatio="none" style={{ marginTop: 10 }}>
        {[70, 140, 210].map((y) => (
          <line key={y} x1="0" x2="860" y1={y} y2={y} stroke={colors.fog} strokeWidth="3" />
        ))}
        <path d="M0 250 C 160 245, 260 230, 380 200 S 600 120, 700 70 S 820 20, 860 10 L 860 280 L 0 280 Z" fill="rgba(7,7,7,0.06)" />
        <path d="M0 250 C 160 245, 260 230, 380 200 S 600 120, 700 70 S 820 20, 860 10" fill="none" stroke={colors.ink} strokeWidth="9" strokeLinecap="round" />
        <circle cx="852" cy="12" r="16" fill={colors.ink} />
      </svg>
    </div>
  </Stage>
);

export const B04Logo: React.FC = () => <LogoReveal line="UGC-Creator finden. In Minuten." />;

const Field: React.FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ fontSize: 24, fontWeight: 700, color: colors.graphite }}>{label}</div>
    {children}
  </div>
);

const Input: React.FC<{ children: ReactNode; active?: boolean }> = ({ children, active }) => (
  <div style={{ padding: "18px 24px", borderRadius: 8, border: `${active ? 3 : 2}px solid ${active ? colors.ink : colors.line}`, fontSize: 30 }}>{children}</div>
);

const Pill: React.FC<{ on?: boolean; children: ReactNode }> = ({ on, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "14px 24px",
      borderRadius: 999,
      fontSize: 26,
      fontWeight: 700,
      backgroundColor: on ? colors.ink : colors.paper,
      color: on ? colors.paper : colors.ink,
      border: `2px solid ${on ? colors.ink : colors.line}`,
    }}
  >
    {children}
  </span>
);

export const B05Request: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Anfrage in", { mark: "einer Minute." }]} size={110} />
    <BrowserWindow height={1180} style={{ position: "absolute", top: 520, left: GUTTER }}>
      <div style={{ padding: "40px 44px", display: "flex", flexDirection: "column", gap: 26, width: 500 }}>
        <div style={{ fontSize: 40, fontWeight: 900 }}>Neue Anfrage</div>
        <Field label="Titel">
          <Input>Unser neues Parfüm, erste Eindrücke</Input>
        </Field>
        <Field label="Foto">
          <div style={{ display: "flex", gap: 12 }}>
            {(["flask", "lotion", "cream"] as PhotoKey[]).map((p, i) => (
              <div key={p} style={{ width: 110, height: 140, borderRadius: 8, overflow: "hidden", outline: i === 0 ? `4px solid ${colors.ink}` : undefined, outlineOffset: 3 }}>
                <Photo photo={p} />
              </div>
            ))}
          </div>
        </Field>
        <Field label="Budget">
          <Input active>
            <b>300 €</b>
          </Input>
        </Field>
        <Field label="Plattform">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Pill on>
              <IoLogoInstagram size={28} /> Instagram
            </Pill>
            <Pill>
              <IoLogoTiktok size={26} /> TikTok
            </Pill>
          </div>
        </Field>
        <Field label="Inhalt">
          <Input>1 Reel</Input>
        </Field>
      </div>
      <div style={{ position: "absolute", top: 200, right: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: colors.graphite, textTransform: "uppercase", letterSpacing: 2 }}>Das sehen Creator</div>
        <DealCard
          deal={{
            company: "Deine Marke",
            title: "Unser neues Parfüm, erste Eindrücke",
            photo: "flask",
            budget: "300 €",
            platform: "Instagram",
            deliverables: "1 Reel",
            productIncluded: true,
            rating: ["5,0", 1],
          }}
          width={340}
          height={500}
          style={{ transform: "rotate(4deg)" }}
        />
      </div>
      <Toast style={{ position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
        <IoCheckmark size={32} /> Anfrage veröffentlicht.
      </Toast>
    </BrowserWindow>
    <SampleNote />
  </Stage>
);

const Push: React.FC<{ name: string; style?: React.CSSProperties }> = ({ name, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 22,
      padding: "24px 28px",
      borderRadius: 28,
      backgroundColor: "rgba(255,255,255,0.96)",
      boxShadow: "0 24px 60px rgba(7,7,7,0.18), 0 0 0 2px rgba(7,7,7,0.05)",
      ...style,
    }}
  >
    <div style={{ width: 84, height: 84, borderRadius: 20, backgroundColor: colors.paper, border: `2px solid ${colors.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Logo size={44} wordmark={false} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: colors.graphite }}>
        <span style={{ fontWeight: 700, color: colors.ink }}>comtor</span>
        <span>jetzt</span>
      </div>
      <div style={{ fontSize: 28, lineHeight: 1.3 }}>{name} interessiert sich für „Unser neues Parfüm“</div>
    </div>
  </div>
);

const CREATORS = [
  { name: "Lena", niche: "Beauty", reach: "48.000", rating: "4,9" },
  { name: "Mia", niche: "Beauty · Fitness", reach: "62.000", rating: "4,8" },
  { name: "Jonas", niche: "Lifestyle", reach: "21.000", rating: "5,0" },
];

export const B06Creators: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Passende Creator", { mark: "kommen zu dir." }]} size={100} />
    <BrowserWindow height={720} style={{ position: "absolute", top: 1060, left: GUTTER }}>
      <div style={{ padding: "36px 44px", display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 16 }}>Interessierte Creator</div>
        {CREATORS.map((c) => (
          <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 24, padding: "22px 0", borderBottom: `2px solid ${colors.fog}` }}>
            <Avatar name={c.name} size={88} />
            <div>
              <div style={{ fontSize: 34, fontWeight: 700 }}>{c.name}</div>
              <div style={{ fontSize: 26, color: colors.graphite }}>
                {c.niche} · {c.reach} Follower
              </div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 28, fontWeight: 700 }}>
              <IoStar size={28} color="#fbbf24" /> {c.rating}
            </div>
          </div>
        ))}
      </div>
    </BrowserWindow>
    <div style={{ position: "absolute", top: 440, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 20 }}>
      <Push name="Lena" />
      <Push name="Mia" style={{ opacity: 0.75 }} />
      <Push name="Jonas" style={{ opacity: 0.5 }} />
    </div>
    <SampleNote />
  </Stage>
);

const FLOW = [
  { icon: <IoPaperPlane size={40} />, title: "Angebot senden", sub: "300 € · 1 Reel" },
  { icon: <IoLockClosed size={40} />, title: "Zahlen", sub: "Das Geld wird zurückgehalten" },
  { icon: <IoLink size={42} />, title: "Post ist online", sub: "Link kommt im Chat" },
  { icon: <IoCheckmark size={46} />, title: "Freigeben", sub: "Erst dann wird ausgezahlt", final: true },
];

export const B07Safe: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Ausgezahlt wird erst,", { mark: "wenn der Post online ist." }]} size={88} />
    <div style={{ position: "absolute", top: 680, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
      {FLOW.map((step, i) => (
        <div key={step.title} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 30,
              padding: "34px 40px",
              borderRadius: 16,
              backgroundColor: step.final ? colors.ink : colors.paper,
              color: step.final ? colors.paper : colors.ink,
              boxShadow: step.final ? "0 30px 70px rgba(7,7,7,0.3)" : "0 0 0 2px rgba(7,7,7,0.1)",
            }}
          >
            <div
              style={{
                width: 96,
                height: 96,
                borderRadius: 999,
                flexShrink: 0,
                backgroundColor: step.final ? colors.paper : colors.ink,
                color: step.final ? colors.ink : colors.paper,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {step.icon}
            </div>
            <div>
              <div style={{ fontSize: 44, fontWeight: 900 }}>{step.title}</div>
              <div style={{ fontSize: 30, color: step.final ? colors.stone : colors.graphite }}>{step.sub}</div>
            </div>
          </div>
          {i < FLOW.length - 1 && <div style={{ width: 4, height: 44, backgroundColor: colors.stone }} />}
        </div>
      ))}
    </div>
    <SampleNote />
  </Stage>
);

const SLOTS = 50;
const TAKEN = 7;

export const SlotGrid: React.FC<{ cell: number; gap: number }> = ({ cell, gap }) => (
  <div style={{ display: "grid", gridTemplateColumns: `repeat(10, ${cell}px)`, gap }}>
    {Array.from({ length: SLOTS }, (_, i) => (
      <div
        key={i}
        style={{
          width: cell,
          height: cell,
          borderRadius: 4,
          backgroundColor: i < TAKEN ? colors.paper : "transparent",
          border: i < TAKEN ? undefined : `3px solid ${colors.graphite}`,
        }}
      />
    ))}
  </div>
);

export const B08Founding: React.FC = () => (
  <Stage dark>
    <div style={{ position: "absolute", top: 170, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ fontSize: 220, fontWeight: 900, lineHeight: 0.95, letterSpacing: -8 }}>50 Plätze</div>
      <Headline parts={["für", { mark: "Founding Brands." }]} size={84} dark />
    </div>
    <div style={{ position: "absolute", top: 640, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <SlotGrid cell={78} gap={16} />
    </div>
    <div style={{ position: "absolute", top: 1150, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 34 }}>
      <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.1 }}>Pro kostenlos. Solange dein Konto besteht.</div>
      {[
        <>
          <b>3 %</b> statt 10 % Gebühr auf jede Zahlung
        </>,
        <>
          <s style={{ color: colors.graphite }}>49 € im Monat</s> <b>0 €</b>
        </>,
        <>Kein Abo, nichts zu kündigen</>,
      ].map((perk, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 40 }}>
          <span style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: colors.paper, color: colors.ink, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <IoCheckmark size={34} />
          </span>
          <span>{perk}</span>
        </div>
      ))}
    </div>
  </Stage>
);

export const B09Cta: React.FC = () => (
  <Stage dark>
    <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Logo size={80} dark />
    </div>
    <div style={{ position: "absolute", top: 560, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 70 }}>
      <div style={{ fontSize: 130, fontWeight: 900, lineHeight: 1.05, letterSpacing: -3, textAlign: "center" }}>
        Sichere dir <span style={{ backgroundColor: colors.paper, color: colors.ink, padding: "0 18px" }}>deinen Platz.</span>
      </div>
      <UrlPill />
      <Subline dark style={{ textAlign: "center" }}>
        Die ersten 50 Marken bekommen Pro kostenlos.
      </Subline>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
        <SlotGrid cell={44} gap={10} />
      </div>
    </div>
  </Stage>
);
