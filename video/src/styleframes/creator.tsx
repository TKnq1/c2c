import type { ReactNode } from "react";
import {
  IoAirplane,
  IoArrowForward,
  IoBarbell,
  IoBookmarkOutline,
  IoChatbubbleOutline,
  IoCheckmark,
  IoCheckmarkCircle,
  IoClose,
  IoHardwareChip,
  IoHeart,
  IoHeartOutline,
  IoLink,
  IoLockClosed,
  IoLogoInstagram,
  IoLogoTiktok,
  IoPaperPlaneOutline,
  IoRestaurant,
  IoShirt,
  IoSparkles,
} from "react-icons/io5";
import {
  Avatar,
  BrowserWindow,
  Bubble,
  DealCard,
  KIEZ_GOODS,
  Logo,
  ODD_BLOOM,
  Photo,
  PhoneOutline,
  SampleNote,
  SceneHeader,
  Stage,
  Subline,
  Toast,
} from "../components/ui";
import { colors, GUTTER } from "../theme";

// A grey stand-in for a social post: header, image, action row.
const FeedPost: React.FC<{ width: number; liked?: boolean; likes?: string; image?: ReactNode }> = ({ width, liked, likes, image }) => (
  <div style={{ width, display: "flex", flexDirection: "column", gap: 18 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 24px" }}>
      <div style={{ width: 56, height: 56, borderRadius: 999, backgroundColor: colors.stone }} />
      <div style={{ width: 200, height: 18, borderRadius: 4, backgroundColor: colors.fog }} />
    </div>
    <div style={{ width, height: width, backgroundColor: colors.fog, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {image}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 22, padding: "0 24px", fontSize: 30 }}>
      {liked ? <IoHeart size={44} /> : <IoHeartOutline size={44} />}
      <IoChatbubbleOutline size={42} />
      <IoPaperPlaneOutline size={40} />
      <IoBookmarkOutline size={40} style={{ marginLeft: "auto" }} />
    </div>
    {likes && <div style={{ padding: "0 24px", fontSize: 30, fontWeight: 700 }}>{likes}</div>}
  </div>
);

export const C01Hook: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Du postest", { mark: "sowieso." }]} size={130} />
    <PhoneOutline width={640} height={1240} style={{ position: "absolute", top: 600, left: 220 }}>
      <div style={{ paddingTop: 110, display: "flex", flexDirection: "column", gap: 40 }}>
        <FeedPost width={610} liked likes="1.204 Gefällt mir" image={<IoHeart size={260} color={colors.paper} style={{ filter: "drop-shadow(0 10px 30px rgba(0,0,0,0.25))" }} />} />
        <FeedPost width={610} />
      </div>
    </PhoneOutline>
    <div
      style={{
        position: "absolute",
        top: 1290,
        left: 720,
        padding: "14px 26px",
        borderRadius: 999,
        backgroundColor: colors.ink,
        color: colors.paper,
        fontSize: 34,
        fontWeight: 900,
        display: "flex",
        alignItems: "center",
        gap: 10,
        boxShadow: "0 16px 40px rgba(7,7,7,0.3)",
      }}
    >
      <IoHeart size={34} /> +1
    </div>
  </Stage>
);

const Coin: React.FC<{ x: number; y: number; size: number; rotate: number }> = ({ x, y, size, rotate }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: size,
      height: size,
      borderRadius: 999,
      backgroundColor: colors.ink,
      color: colors.paper,
      border: `${size * 0.06}px solid ${colors.paper}`,
      boxShadow: `0 0 0 ${size * 0.03}px ${colors.ink}, 0 18px 40px rgba(7,7,7,0.25)`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: size * 0.5,
      fontWeight: 900,
      transform: `rotate(${rotate}deg)`,
    }}
  >
    €
  </div>
);

export const C02Twist: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Warum nicht dafür", { mark: "bezahlt" }, "werden?"]} size={110} />
    <div style={{ position: "absolute", top: 860, left: 210, boxShadow: "0 40px 80px rgba(7,7,7,0.15)", backgroundColor: colors.paper, paddingTop: 24, paddingBottom: 24, borderRadius: 16 }}>
      <FeedPost width={660} liked likes="€ statt nur Likes" />
    </div>
    <Coin x={110} y={780} size={150} rotate={-14} />
    <Coin x={800} y={720} size={190} rotate={12} />
    <Coin x={860} y={1240} size={120} rotate={-6} />
    <Coin x={90} y={1380} size={110} rotate={20} />
    <Coin x={470} y={1080} size={170} rotate={-4} />
  </Stage>
);

const StruckDm: React.FC<{ text: string; struck?: boolean; tilt: number }> = ({ text, struck, tilt }) => (
  <div style={{ position: "relative", alignSelf: "flex-start", opacity: struck ? 0.45 : 1, transform: `rotate(${tilt}deg)` }}>
    <Bubble style={{ fontSize: 44, maxWidth: "none", padding: "28px 40px" }}>{text}</Bubble>
    {struck && <div style={{ position: "absolute", left: -20, right: -20, top: "50%", height: 8, backgroundColor: colors.ink, transform: "rotate(-3deg)" }} />}
  </div>
);

export const C03Problem: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Schluss mit", { mark: "Preis-DMs" }, "und offenen Rechnungen."]} size={96} />
    <div style={{ position: "absolute", top: 820, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 56 }}>
      <StruckDm text="Was kostet ein Post bei dir?" struck tilt={-2} />
      <StruckDm text="Bezahlung dann nach dem Post?" struck tilt={1.5} />
      <StruckDm text="Schick mal deine Mediadaten 🙏" tilt={-1} />
    </div>
    <div style={{ position: "absolute", top: 1380, right: 110, fontSize: 300, fontWeight: 900, color: colors.stone, transform: "rotate(12deg)" }}>?</div>
  </Stage>
);

export const LogoReveal: React.FC<{ line: string }> = ({ line }) => (
  <Stage dark>
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48 }}>
      <Logo size={150} dark />
      <Subline dark style={{ fontSize: 46, textAlign: "center", padding: `0 ${GUTTER}px` }}>
        {line}
      </Subline>
    </div>
  </Stage>
);

export const C04Logo: React.FC = () => <LogoReveal line="Bezahlte Marken-Deals für Creator." />;

const NICHES = [
  { label: "Beauty", icon: IoSparkles, on: true },
  { label: "Fitness", icon: IoBarbell, on: true },
  { label: "Food", icon: IoRestaurant },
  { label: "Fashion", icon: IoShirt },
  { label: "Tech", icon: IoHardwareChip },
  { label: "Reisen", icon: IoAirplane },
];

export const C05Profile: React.FC = () => (
  <Stage>
    <SceneHeader step={{ n: 1, label: "Profil anlegen" }} parts={["Nische wählen,", { mark: "Plattformen" }, "verbinden."]} />
    <BrowserWindow height={1080} style={{ position: "absolute", top: 700, left: GUTTER }}>
      <div style={{ padding: "44px 48px", display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ display: "flex", gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: i < 2 ? colors.ink : colors.fog }} />
          ))}
        </div>
        <div style={{ fontSize: 44, fontWeight: 900 }}>Was ist deine Nische?</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {NICHES.map(({ label, icon: Icon, on }) => (
            <div
              key={label}
              style={{
                height: 140,
                borderRadius: 8,
                border: `2px solid ${on ? colors.ink : colors.line}`,
                backgroundColor: on ? colors.ink : colors.paper,
                color: on ? colors.paper : colors.ink,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                fontSize: 30,
                fontWeight: 700,
              }}
            >
              <Icon size={44} />
              {label}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 44, fontWeight: 900, marginTop: 10 }}>Deine Plattformen</div>
        {[
          { icon: IoLogoInstagram, name: "Instagram", count: "50.000" },
          { icon: IoLogoTiktok, name: "TikTok", count: "12.000" },
        ].map(({ icon: Icon, name, count }) => (
          <div key={name} style={{ display: "flex", alignItems: "center", gap: 20, padding: "22px 26px", borderRadius: 8, border: `2px solid ${colors.line}`, fontSize: 32 }}>
            <Icon size={44} />
            <span style={{ fontWeight: 700 }}>{name}</span>
            <span style={{ marginLeft: "auto", color: colors.graphite }}>
              <b style={{ color: colors.ink }}>{count}</b> Follower
            </span>
          </div>
        ))}
      </div>
    </BrowserWindow>
    <SampleNote />
  </Stage>
);

const RoundButton: React.FC<{ children: ReactNode; filled?: boolean }> = ({ children, filled }) => (
  <div
    style={{
      width: 120,
      height: 120,
      borderRadius: 999,
      backgroundColor: filled ? colors.ink : colors.paper,
      color: filled ? colors.paper : colors.ink,
      boxShadow: "0 16px 40px rgba(7,7,7,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}
  >
    {children}
  </div>
);

export const C06Swipe: React.FC = () => (
  <Stage>
    <SceneHeader step={{ n: 2, label: "Deals wischen" }} parts={["Das Budget steht", { mark: "auf der Karte." }]} />
    <BrowserWindow height={1100} style={{ position: "absolute", top: 680, left: GUTTER }}>
      <Photo photo="serum" style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", filter: "blur(70px) saturate(1.2)", opacity: 0.55 }} />
      <DealCard deal={KIEZ_GOODS} width={500} height={700} style={{ position: "absolute", top: 150, left: 190, transform: "rotate(-3deg) scale(0.95)", opacity: 0.9 }} />
      <DealCard deal={ODD_BLOOM} width={500} height={700} style={{ position: "absolute", top: 140, left: 300, transform: "rotate(10deg)" }} />
      <Toast style={{ position: "absolute", top: 34, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
        <IoHeart size={30} /> Interesse an Odd Bloom gesendet.
      </Toast>
      <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60 }}>
        <RoundButton>
          <IoClose size={60} />
        </RoundButton>
        <RoundButton filled>
          <IoHeart size={56} />
        </RoundButton>
      </div>
      <div style={{ position: "absolute", top: 480, right: 30, color: colors.ink, opacity: 0.8 }}>
        <IoArrowForward size={90} />
      </div>
    </BrowserWindow>
    <SampleNote />
  </Stage>
);

export const C07Chat: React.FC = () => (
  <Stage>
    <SceneHeader step={{ n: 3, label: "Angebot annehmen" }} parts={["Absprache", { mark: "direkt im Chat." }]} />
    <BrowserWindow height={1100} style={{ position: "absolute", top: 680, left: GUTTER }}>
      <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "26px 40px", borderBottom: `2px solid ${colors.line}` }}>
        <Avatar name="Odd Bloom" size={72} />
        <div>
          <div style={{ fontSize: 32, fontWeight: 700 }}>Odd Bloom</div>
          <div style={{ fontSize: 24, color: colors.graphite }}>Serum-Launch, erste Eindrücke</div>
        </div>
      </div>
      <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column", gap: 22 }}>
        <Bubble>Hey Mia, wir lieben deinen Content!</Bubble>
        <Bubble>Ein TikTok für 250 €?</Bubble>
        <Bubble mine>Deal! 🙌</Bubble>
        <div
          style={{
            alignSelf: "center",
            width: "88%",
            marginTop: 50,
            borderRadius: 12,
            border: `2px solid ${colors.line}`,
            padding: "34px 40px",
            display: "flex",
            flexDirection: "column",
            gap: 14,
            position: "relative",
            boxShadow: "0 20px 50px rgba(7,7,7,0.1)",
          }}
        >
          <div style={{ fontSize: 26, color: colors.graphite, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>Angebot</div>
          <div style={{ fontSize: 76, fontWeight: 900 }}>250,00 €</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, color: colors.graphite }}>
            <IoLogoTiktok size={30} /> TikTok · 1 Video
          </div>
          <Toast style={{ position: "absolute", right: -26, top: -30, transform: "rotate(6deg)", fontSize: 30 }}>
            <IoCheckmarkCircle size={36} /> Angebot angenommen
          </Toast>
        </div>
      </div>
    </BrowserWindow>
    <SampleNote />
  </Stage>
);

const StatusRow: React.FC<{ label: string; state: "done" | "active" | "todo"; icon?: ReactNode; last?: boolean }> = ({ label, state, icon, last }) => (
  <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 999,
          backgroundColor: state === "todo" ? colors.paper : colors.ink,
          border: `3px solid ${state === "todo" ? colors.stone : colors.ink}`,
          color: colors.paper,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: state === "active" ? `0 0 0 12px rgba(7,7,7,0.08)` : undefined,
        }}
      >
        {state === "done" ? <IoCheckmark size={38} /> : state === "active" ? icon : null}
      </div>
      {!last && <div style={{ width: 4, height: 70, backgroundColor: state === "done" ? colors.ink : colors.fog }} />}
    </div>
    <div style={{ fontSize: 38, fontWeight: state === "active" ? 900 : 400, color: state === "todo" ? colors.stone : colors.ink, paddingTop: 10 }}>{label}</div>
  </div>
);

export const C08Paid: React.FC = () => (
  <Stage>
    <SceneHeader step={{ n: 4, label: "Bezahlt, bevor du postest" }} parts={["Die Marke", { mark: "zahlt zuerst." }]} sub="Das Geld wird zurückgehalten, bis dein Post online ist." />
    <BrowserWindow height={960} style={{ position: "absolute", top: 820, left: GUTTER }}>
      <div style={{ padding: "40px 48px", display: "flex", flexDirection: "column", gap: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Avatar name="Odd Bloom" size={80} />
          <div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>Odd Bloom</div>
            <div style={{ fontSize: 26, color: colors.graphite }}>TikTok · 1 Video</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontSize: 56, fontWeight: 900 }}>
            <IoLockClosed size={44} />
            250 €
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <StatusRow label="Angebot angenommen" state="done" />
          <StatusRow label="Bezahlt · zurückgehalten" state="active" icon={<IoLockClosed size={32} />} />
          <StatusRow label="Post online" state="todo" />
          <StatusRow label="Ausgezahlt" state="todo" last />
        </div>
      </div>
    </BrowserWindow>
    <SampleNote />
  </Stage>
);

export const C09Post: React.FC = () => (
  <Stage>
    <SceneHeader
      step={{ n: 5, label: "Posten & Link einreichen" }}
      parts={["Post online,", { mark: "Link rein." }]}
      sub="Die Marke hat 3 Tage zum Freigeben. Sonst geht die Zahlung trotzdem an dich."
    />
    <BrowserWindow height={900} style={{ position: "absolute", top: 880, left: GUTTER }}>
      <div style={{ padding: "44px 48px", display: "flex", flexDirection: "column", gap: 30 }}>
        <div style={{ fontSize: 40, fontWeight: 900 }}>Link zu deinem Post</div>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "26px 28px", borderRadius: 8, border: `3px solid ${colors.ink}`, fontSize: 32 }}>
          <IoLink size={38} />
          tiktok.com/@mia/video/7342…
        </div>
        <div style={{ padding: "26px 0", borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, textAlign: "center", fontSize: 34, fontWeight: 700 }}>
          Post eingereicht
        </div>
        <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 30, padding: "34px 36px", borderRadius: 12, backgroundColor: colors.fog }}>
          <IoCheckmarkCircle size={110} />
          <div>
            <div style={{ fontSize: 46, fontWeight: 900 }}>Freigegeben</div>
            <div style={{ fontSize: 28, color: colors.graphite }}>Odd Bloom hat deinen Post geprüft.</div>
          </div>
        </div>
      </div>
    </BrowserWindow>
    <SampleNote />
  </Stage>
);

const CONFETTI = [
  [120, 820, 20, 50, 30],
  [920, 760, 24, 60, -25],
  [200, 1560, 18, 44, 60],
  [880, 1620, 22, 54, -50],
  [60, 1180, 16, 40, -15],
  [990, 1150, 20, 48, 35],
  [520, 740, 18, 46, 80],
  [600, 1740, 20, 50, 10],
] as const;

export const C10Payout: React.FC = () => (
  <Stage>
    <SceneHeader parts={["Du behältst", { mark: "90\u00a0%." }]} size={130} />
    {CONFETTI.map(([x, y, w, h, r], i) => (
      <div key={i} style={{ position: "absolute", left: x, top: y, width: w, height: h, backgroundColor: i % 2 ? colors.stone : colors.ink, transform: `rotate(${r}deg)`, borderRadius: 3 }} />
    ))}
    <div
      style={{
        position: "absolute",
        top: 820,
        left: GUTTER + 30,
        right: GUTTER + 30,
        padding: "56px 56px",
        borderRadius: 16,
        backgroundColor: colors.paper,
        boxShadow: "0 50px 100px rgba(7,7,7,0.18), 0 0 0 2px rgba(7,7,7,0.06)",
        display: "flex",
        flexDirection: "column",
        gap: 30,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 36, fontWeight: 900 }}>
        <IoCheckmarkCircle size={48} /> Zahlung freigegeben
      </div>
      <Row label="Odd Bloom hat gezahlt" value="250,00 €" />
      <Row label="comtor-Gebühr (10 %)" value="−25,00 €" muted />
      <div style={{ height: 3, backgroundColor: colors.ink }} />
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <span style={{ fontSize: 40, fontWeight: 700 }}>Du bekommst</span>
        <span style={{ fontSize: 120, fontWeight: 900, letterSpacing: -3 }}>225,00 €</span>
      </div>
    </div>
    <SampleNote />
  </Stage>
);

const Row: React.FC<{ label: string; value: string; muted?: boolean }> = ({ label, value, muted }) => (
  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 36, color: muted ? colors.graphite : colors.ink }}>
    <span>{label}</span>
    <span style={{ fontWeight: 700 }}>{value}</span>
  </div>
);

export const UrlPill: React.FC = () => (
  <div style={{ alignSelf: "center", padding: "30px 70px", borderRadius: 999, backgroundColor: colors.paper, color: colors.ink, fontSize: 54, fontWeight: 900 }}>comtor.app</div>
);

export const C11Cta: React.FC = () => (
  <Stage dark>
    <div style={{ position: "absolute", top: 200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Logo size={80} dark />
    </div>
    <div style={{ position: "absolute", top: 640, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 70 }}>
      <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1.05, letterSpacing: -3, textAlign: "center" }}>
        Wisch bezahlte Marken-Deals <span style={{ backgroundColor: colors.paper, color: colors.ink, padding: "0 18px" }}>nach rechts.</span>
      </div>
      <UrlPill />
      <Subline dark style={{ textAlign: "center" }}>
        Jetzt im Web · Bald für iOS & Android
      </Subline>
    </div>
  </Stage>
);
