import { FiCheck } from "react-icons/fi";
import { IoLockClosed } from "react-icons/io5";
import { BudgetPill, PayoutReceipt, PushNotification, Toast } from "../posts/kit";
import { POSTS, PostTile } from "./BrandCover";
import { CtaSlide, PhoneSlide, pillStyle } from "./layout";
import { GREY } from "./kit";
import {
  ApproveChatScreen,
  CreatorChatScreen,
  CreatorProfileScreen,
  DealDetailsScreen,
  LivePostsScreen,
  NewRequestScreen,
  PaymentsScreen,
} from "./screens";

// Slides 2 to 6 of the two pinned carousels (slide 1 is the animated cover).

export const Creator2: React.FC = () => (
  <PhoneSlide
    lines={[{ text: "Keine Preis-DMs mehr." }, { text: "Das Budget steht", grey: true }, { text: "auf der Karte.", grey: true }]}
    screen={<DealDetailsScreen />}
    callout={<BudgetPill amount={"250 €"} />}
    at={[836, 640]}
    rotate={4}
    scale={1.6}
  />
);

export const Creator3: React.FC = () => (
  <PhoneSlide
    lines={[{ text: "Im Chat klarmachen." }, { text: "Die Marke schickt", grey: true }, { text: "dir ein Angebot.", grey: true }]}
    screen={<CreatorChatScreen />}
    callout={<Toast>Angebot angenommen.</Toast>}
    at={[790, 610]}
    rotate={-3}
    scale={1.6}
  />
);

export const Creator4: React.FC = () => (
  <PhoneSlide
    lines={[{ text: "Die Marke zahlt zuerst." }, { text: "Das Geld wartet,", grey: true }, { text: "bis du postest.", grey: true }]}
    screen={<CreatorChatScreen paid />}
    callout={
      <span style={pillStyle}>
        <IoLockClosed size={16} />
        250 € zurückgehalten
      </span>
    }
    at={[810, 610]}
    rotate={-3}
    scale={1.7}
  />
);

export const Creator5: React.FC = () => (
  <PhoneSlide
    lines={[{ text: "Du behältst 90 %." }, { text: "Mit Pro 97 %, für die", grey: true }, { text: "ersten 100 Creator gratis.", grey: true }]}
    screen={<PaymentsScreen />}
    callout={<PayoutReceipt brand="Odd Bloom" amount="250,00 €" fee="25,00 €" feeRate={10} payout="225,00 €" />}
    at={[800, 1150]}
    rotate={2}
    scale={1.55}
  />
);

export const Creator6: React.FC = () => (
  <CtaSlide lines={[{ text: "Jetzt starten." }, { text: "Kostenlos im Web.", grey: true }]} note="Link in der Bio · Bald für iOS und Android" />
);

export const Brand2: React.FC = () => (
  <PhoneSlide
    lines={[{ text: "Anfrage in einer Minute." }, { text: "Produkt, Budget,", grey: true }, { text: "Plattform. Fertig.", grey: true }]}
    screen={<NewRequestScreen />}
    callout={<Toast>Anfrage veröffentlicht.</Toast>}
    at={[790, 1250]}
    rotate={-3}
    scale={1.6}
  />
);

export const Brand3: React.FC = () => (
  <PhoneSlide
    lines={[{ text: "Creator kommen zu dir." }, { text: "Reichweite und", grey: true }, { text: "Bewertungen im Blick.", grey: true }]}
    screen={<CreatorProfileScreen />}
    callout={<PushNotification name="Mia K." title="Unser neues Parfüm" width={300} />}
    at={[620, 1245]}
    rotate={-2}
    scale={1.5}
  />
);

export const Brand4: React.FC = () => (
  <PhoneSlide
    lines={[{ text: "Ein Produkt, viele Feeds." }, { text: "Jeder Creator postet", grey: true }, { text: "für seine Community.", grey: true }]}
    screen={<LivePostsScreen />}
  >
    {POSTS.map(({ x, y, rotate, ...post }) => (
      <div key={post.name} style={{ position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) rotate(${rotate}deg)` }}>
        <PostTile {...post} />
      </div>
    ))}
  </PhoneSlide>
);

export const Brand5: React.FC = () => (
  <PhoneSlide
    lines={[{ text: "Erst online, dann bezahlt." }, { text: "Du gibst jeden", grey: true }, { text: "Post frei.", grey: true }]}
    screen={<ApproveChatScreen />}
    callout={<Toast>Freigegeben. Mia K. hat 270,00 € erhalten.</Toast>}
    at={[700, 600]}
    rotate={-3}
    scale={1.45}
  />
);

const FeeCard: React.FC<{ title: string; rate: string; lines: string[] }> = ({ title, rate, lines }) => (
  <div style={{ width: 380, borderRadius: 4, backgroundColor: "#1b1b1b", border: "1px solid rgba(255,255,255,0.08)", padding: "26px 28px", textAlign: "left" }}>
    <div style={{ fontSize: 26, color: GREY, fontWeight: 700 }}>{title}</div>
    <div style={{ fontSize: 88, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05 }}>{rate}</div>
    {lines.map((line) => (
      <div key={line} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 24, color: "#d4d4d4", marginTop: 6 }}>
        <FiCheck size={22} />
        {line}
      </div>
    ))}
  </div>
);

export const Brand6: React.FC = () => (
  <CtaSlide
    lines={[{ text: "Keine Grundgebühr." }, { text: "Du zahlst pro Deal.", grey: true }]}
    note="Link in der Bio · Bald für iOS und Android"
    extra={
      <div style={{ display: "flex", gap: 24 }}>
        <FeeCard title="Standard" rate="10 %" lines={["pro Zahlung", "ohne Abo"]} />
        <FeeCard title="Pro" rate="3 %" lines={["10 € im Monat", "die ersten 50 Marken gratis"]} />
      </div>
    }
  />
);
