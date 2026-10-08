import type { ReactNode } from "react";
import { FiArrowDown, FiArrowRight } from "react-icons/fi";
import { IoLockClosed } from "react-icons/io5";
import { Img, staticFile } from "remotion";
import { AppHeader, AppTabBar, DeckButtons, FeedCard, Toast, type FeedDeal } from "../posts/kit";
import { pillStyle } from "../pinned/layout";
import { IPhone } from "../pinned/iphone";
import { CreatorChatScreen, NewRequestScreen } from "../pinned/screens";
import { AddressPill, FadeOut, StoryDay, StoryExample, StoryPhone, TopMark, Type } from "./kit";

// The highlight "Was ist comtor?": a short introduction in seven cards and a cover, in the light look of the app (the
// same backdrop as the dark stories, white). The name stays at the top, the mark does not.

const SOFT = "#737373";
const HAIRLINE = "rgba(7,7,7,0.1)";

export const Frame: React.FC<{ children: ReactNode }> = ({ children }) => (
  <StoryDay>
    <TopMark icon={false} />
    {children}
  </StoryDay>
);

// The brands of the examples: their own photos and profile pictures (public/real/, cut from what was sent). The budgets
// are made up, so the cards say so; no ratings are shown for a brand that is real.
export const NOTE = "Beispiel: Die Deals und Budgets sind erfunden.";

export const RAW_DEAL: FeedDeal = {
  photo: "serum",
  photoSrc: "real/raw-hoodie.jpg",
  avatarSrc: "real/raw-logo.png",
  budget: "250 €",
  company: "Raw Supplies",
  title: "Hoodie, erste Eindrücke",
  rating: null,
  platform: "TikTok",
  deliverables: "1 Video",
};

export const NAKAR_DEAL: FeedDeal = {
  photo: "serum",
  photoSrc: "real/nakar-front.jpg",
  avatarSrc: "real/nakar-logo.png",
  budget: "300 €",
  company: "Nakar",
  title: "Hoodie, erste Eindrücke",
  rating: null,
  platform: "Instagram",
  deliverables: "1 Reel",
};

export const VINTAGE_DEAL: FeedDeal = {
  photo: "serum",
  photoSrc: "real/vintage-jacket.jpg",
  avatarSrc: "real/vintage-logo.png",
  budget: "200 €",
  company: "Vintage Steals",
  title: "Jacke, erste Eindrücke",
  rating: null,
  platform: "TikTok",
  deliverables: "1 Video",
};

const NAKAR_PHOTOS: [string, string, string] = ["real/nakar-front.jpg", "real/nakar-back.jpg", "real/nakar-print.jpg"];
const NAKAR_REQUEST = "Unser neuer Hoodie, erste Eindrücke";

// Height of the deck between the header and the buttons, in app pixels (as in the pinned cover).
const DECK = 451;

// The creator's Feed at rest: the header, one deal card, the buttons and the tab bar.
const FeedScreen: React.FC<{ deal: FeedDeal }> = ({ deal }) => (
  <>
    <AppHeader title="Feed" />
    <div style={{ position: "relative", height: DECK, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <FeedCard deal={deal} height={DECK - 12} />
      </div>
    </div>
    <DeckButtons />
    <AppTabBar />
  </>
);

// A deal card on its own, as it comes up in the Feed.
export const Card: React.FC<{ deal: FeedDeal; x: number; y: number; rotate: number; scale: number }> = ({ deal, x, y, rotate, scale }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: 296,
      height: 430,
      transform: `translate(-50%, -50%) rotate(${rotate}deg) scale(${scale})`,
      borderRadius: 28,
      overflow: "hidden",
      boxShadow: "0 40px 70px -20px rgba(0,0,0,0.35)",
    }}
  >
    <FeedCard deal={deal} height={430} marginTop={0} />
  </div>
);

// 1. The title is a video: see IntroTitle.tsx.

// 2. The idea: the brand's request on one side, the creator's Feed on the other.
const Side: React.FC<{ x: number; children: ReactNode }> = ({ x, children }) => (
  <div style={{ position: "absolute", top: 625, left: x, width: 420, textAlign: "center", fontSize: 40, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}>{children}</div>
);

export const IntroIdea: React.FC = () => (
  <Frame>
    <Type top={330} size={84} lineHeight={1.04} lines={[{ text: "Marken posten Deals." }, { text: "Creator wischen", soft: true }, { text: "nach rechts.", soft: true }]} />
    <Side x={100}>Marke</Side>
    <Side x={560}>Creator</Side>
    <FadeOut from={440}>
      <IPhone left={100} top={700} scale={1.2}>
        <NewRequestScreen title={NAKAR_REQUEST} photos={NAKAR_PHOTOS} />
      </IPhone>
      <IPhone left={560} top={700} scale={1.2}>
        <FeedScreen deal={NAKAR_DEAL} />
      </IPhone>
    </FadeOut>
    <div style={{ position: "absolute", left: 540, top: 1130, transform: "translate(-50%, -50%)", width: 96, height: 96, borderRadius: 999, backgroundColor: "#070707", color: "#fff", display: "grid", placeItems: "center", boxShadow: "0 12px 30px rgba(0,0,0,0.3)" }}>
      <FiArrowRight size={52} />
    </div>
    <StoryExample>{NOTE}</StoryExample>
  </Frame>
);

// 3. For creators.
export const IntroCreator: React.FC = () => (
  <StoryPhone
    light
    icon={false}
    lines={[{ text: "Wisch bezahlte" }, { text: "Marken-Deals." }]}
    size={100}
    top={340}
    phoneTop={610}
    phoneScale={1.5}
    fade={460}
    note={NOTE}
    screen={<FeedScreen deal={RAW_DEAL} />}
  />
);

// 4. Paid first.
export const IntroPays: React.FC = () => (
  <StoryPhone
    light
    icon={false}
    lines={[{ text: "Die Marke zahlt zuerst." }, { text: "Das Geld wartet,", soft: true }, { text: "bis du postest.", soft: true }]}
    size={80}
    note={NOTE}
    screen={<CreatorChatScreen paid brand="Vintage Steals" avatar="real/vintage-logo.png" product="Unser neuer Drop, ehrliche erste Eindrücke." />}
    callout={
      <span style={pillStyle}>
        <IoLockClosed size={16} />
        250 € zurückgehalten
      </span>
    }
    at={[800, 980]}
    rotate={-3}
    scale={2}
  />
);

// 5. For brands.
export const IntroBrand: React.FC = () => (
  <StoryPhone
    light
    icon={false}
    lines={[{ text: "Anfrage in einer Minute." }, { text: "Creator melden", soft: true }, { text: "sich bei dir.", soft: true }]}
    size={80}
    note={NOTE}
    screen={<NewRequestScreen title={NAKAR_REQUEST} photos={NAKAR_PHOTOS} />}
    callout={<Toast>Anfrage veröffentlicht.</Toast>}
    at={[850, 835]}
    rotate={-3}
    scale={2}
  />
);

// 6. What it costs.
const PriceCard: React.FC<{ who: string; rate: string; line: string; foot: string }> = ({ who, rate, line, foot }) => (
  <div style={{ width: 440, boxSizing: "border-box", padding: "32px 36px 36px", borderRadius: 4, backgroundColor: "#fff", border: `1px solid ${HAIRLINE}`, boxShadow: "0 30px 60px -30px rgba(0,0,0,0.25)" }}>
    <div style={{ fontSize: 36, fontWeight: 700, color: SOFT }}>{who}</div>
    <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.08 }}>{rate}</div>
    <div style={{ fontSize: 40, fontWeight: 700 }}>{line}</div>
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${HAIRLINE}`, fontSize: 32, lineHeight: 1.3, color: "#525252" }}>{foot}</div>
  </div>
);

export const IntroPrice: React.FC = () => (
  <Frame>
    <Type top={400} size={124} lines={[{ text: "Kostenlos" }, { text: "starten.", soft: true }]} />
    <div style={{ position: "absolute", top: 790, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24 }}>
      <PriceCard who="Creator" rate="90 %" line="bleiben bei dir." foot="Mit Pro 97 %." />
      <PriceCard who="Marken" rate="10 %" line="pro Zahlung." foot="Keine Grundgebühr. Mit Pro 3 %." />
    </div>
    <div style={{ position: "absolute", top: 1380, left: 0, right: 0, textAlign: "center", fontSize: 46, fontWeight: 900, lineHeight: 1.25 }}>
      Pro gratis für die ersten
      <br />
      100 Creator und 50 Marken.
    </div>
  </Frame>
);

// 7. Go.
export const IntroGo: React.FC = () => (
  <Frame>
    <Type top={500} size={108} lines={[{ text: "Jetzt kostenlos" }, { text: "im Web starten.", soft: true }]} />
    <div style={{ position: "absolute", top: 930, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <AddressPill />
    </div>
    <div style={{ position: "absolute", top: 1085, left: 0, right: 0, textAlign: "center", fontSize: 38, color: SOFT }}>Bald für iOS und Android</div>
    <div style={{ position: "absolute", top: 1270, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 42, fontWeight: 700 }}>
      Tipp auf den Link
      <FiArrowDown size={72} />
    </div>
  </Frame>
);

// The cover of the highlight: Instagram cuts it to a circle, so the mark sits in the middle.
export const IntroCover: React.FC = () => (
  <StoryDay mark={false}>
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Img src={staticFile("logo.png")} style={{ width: 560, height: 560 }} />
    </div>
  </StoryDay>
);
