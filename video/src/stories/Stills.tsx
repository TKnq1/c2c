import { FiArrowDown } from "react-icons/fi";
import { IoLockClosed } from "react-icons/io5";
import { BudgetPill, FeedCard, Toast, type FeedDeal } from "../posts/kit";
import { FeeCard } from "../pinned/Slides";
import { pillStyle } from "../pinned/layout";
import { ApproveChatScreen, CreatorChatScreen, NewRequestScreen } from "../pinned/screens";
import { GREY } from "../pinned/kit";
import { Img, staticFile } from "remotion";
import { AddressPill, Eyebrow, StoryExample, StoryNight, StoryPaper, StoryPhone, TopMark, Type } from "./kit";

// The still stories: one frame each, rendered to PNG by scripts/render-stories.mjs. The ones with a sticker (poll,
// quiz, question) leave the middle free for it, since Instagram's stickers are added in the app.

const ODD_BLOOM: FeedDeal = {
  photo: "serum",
  budget: "250 €",
  company: "Odd Bloom",
  title: "Serum-Launch, erste Eindrücke",
  rating: [4.8, 23],
  platform: "TikTok",
  deliverables: "1 Video",
};

// Creators ------------------------------------------------------------------------------------------------------

export const Myth: React.FC = () => (
  <StoryPaper photo="serum" focus={[0.5, 0.35]}>
    <TopMark />
    <Eyebrow top={400}>Mythos</Eyebrow>
    <Type top={520} size={92} lines={[{ text: "Preise handelst du", soft: true, strike: true }, { text: "in DMs aus.", soft: true, strike: true }]} />
    <Eyebrow top={830} solid>
      Fakt
    </Eyebrow>
    <Type top={940} size={112} lines={[{ text: "Das Budget steht" }, { text: "vorab auf der" }, { text: "Deal-Karte." }]} />
    <div style={{ position: "absolute", left: 540, top: 1440, transform: "translate(-50%, -50%) rotate(-3deg) scale(2.2)" }}>
      <BudgetPill amount="250 €" />
    </div>
    <StoryExample />
  </StoryPaper>
);

export const Deal: React.FC = () => (
  <StoryPaper photo="serum" focus={[0.5, 0.4]}>
    <TopMark />
    <Type top={360} size={104} lines={[{ text: "So sieht ein" }, { text: "Deal aus.", soft: true }]} />
    <div
      style={{
        position: "absolute",
        left: 540,
        top: 1085,
        width: 296,
        height: 430,
        transform: "translate(-50%, -50%) rotate(-3deg) scale(2.2)",
        borderRadius: 28,
        overflow: "hidden",
        boxShadow: "0 40px 70px -20px rgba(0,0,0,0.35)",
      }}
    >
      <FeedCard deal={ODD_BLOOM} height={430} marginTop={0} />
    </div>
    <StoryExample />
  </StoryPaper>
);

export const Pays: React.FC = () => (
  <StoryPhone
    lines={[{ text: "Die Marke zahlt zuerst." }, { text: "Das Geld wartet,", soft: true }, { text: "bis du postest.", soft: true }]}
    screen={<CreatorChatScreen paid />}
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

// Brands --------------------------------------------------------------------------------------------------------

export const BrandRequest: React.FC = () => (
  <StoryPhone
    lines={[{ text: "Anfrage in einer Minute." }, { text: "Produkt, Budget,", soft: true }, { text: "Plattform. Fertig.", soft: true }]}
    screen={<NewRequestScreen />}
    callout={<Toast>Anfrage veröffentlicht.</Toast>}
    at={[850, 835]}
    rotate={-3}
    scale={2}
  />
);

export const BrandApprove: React.FC = () => (
  <StoryPhone
    lines={[{ text: "Erst online, dann bezahlt." }, { text: "Du gibst jeden", soft: true }, { text: "Post frei.", soft: true }]}
    screen={<ApproveChatScreen />}
    callout={<Toast>Freigegeben. Mia K. hat 270,00 € erhalten.</Toast>}
    at={[700, 960]}
    rotate={-3}
    scale={1.85}
  />
);

export const BrandFees: React.FC = () => (
  <StoryNight>
    <TopMark dark />
    <Type dark top={380} size={84} lines={[{ text: "Keine Grundgebühr." }, { text: "Du zahlst pro Deal.", soft: true }]} />
    <div style={{ position: "absolute", left: 540, top: 700, transform: "translateX(-50%) scale(1.2)", transformOrigin: "50% 0", display: "flex", gap: 24 }}>
      <FeeCard title="Standard" rate="10 %" lines={["pro Zahlung", "ohne Abo"]} />
      <FeeCard title="Pro" rate="3 %" lines={["10 € im Monat", "die ersten 50 Marken gratis"]} />
    </div>
    <div style={{ position: "absolute", top: 1230, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <AddressPill dark />
    </div>
    <div style={{ position: "absolute", top: 1360, left: 0, right: 0, textAlign: "center", fontSize: 34, color: GREY }}>Kostenlos im Web · Bald für iOS und Android</div>
  </StoryNight>
);

// With a sticker -------------------------------------------------------------------------------------------------

export const Poll: React.FC = () => (
  <StoryPaper photo="cream" focus={[0.5, 0.45]}>
    <TopMark />
    <Eyebrow top={400}>Umfrage</Eyebrow>
    <Type top={520} size={104} lines={[{ text: "Wie kommst du" }, { text: "aktuell an" }, { text: "Marken-Deals?" }]} />
  </StoryPaper>
);

export const Quiz: React.FC = () => (
  <StoryNight>
    <TopMark dark />
    <Eyebrow dark top={400}>
      Quiz
    </Eyebrow>
    <Type dark top={520} size={100} lines={[{ text: "Wie viel behält" }, { text: "ein Creator pro" }, { text: "Deal bei comtor?", soft: true }]} />
  </StoryNight>
);

export const Question: React.FC = () => (
  <StoryPaper photo="glasses" focus={[0.5, 0.45]}>
    <TopMark />
    <Eyebrow top={400}>Frage an dich</Eyebrow>
    <Type top={520} size={100} lines={[{ text: "Was nervt dich" }, { text: "bei Marken-" }, { text: "Kooperationen" }, { text: "am meisten?", soft: true }]} />
  </StoryPaper>
);

// Founding and the call to act ---------------------------------------------------------------------------------

// `left`: the places still free, when the story should say it (the admin's Heute page has the number).
export const Founding: React.FC<{ left?: number }> = ({ left }) => (
  <StoryNight>
    <TopMark dark />
    <Type dark top={500} size={124} lines={[{ text: "Die ersten", soft: true }, { text: "100 Creator" }, { text: "bekommen Pro" }, { text: "gratis.", soft: true }]} />
    <div style={{ position: "absolute", top: 1100, left: 0, right: 0, textAlign: "center", fontSize: 40, color: GREY }}>Solange ihr Konto besteht.</div>
    {left !== undefined && (
      <div style={{ position: "absolute", top: 1200, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <span style={{ padding: "14px 36px", borderRadius: 999, border: "3px solid #fff", fontSize: 44, fontWeight: 900 }}>
          {left === 1 ? "Noch 1 Platz frei" : `Noch ${left} Plätze frei`}
        </span>
      </div>
    )}
    <div style={{ position: "absolute", top: left === undefined ? 1230 : 1350, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <AddressPill dark />
    </div>
  </StoryNight>
);

export const Cta: React.FC = () => (
  <StoryNight>
    <TopMark dark />
    <div style={{ position: "absolute", top: 430, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <Img src={staticFile("logo.png")} style={{ width: 160, height: 160, filter: "invert(1)" }} />
    </div>
    <Type dark top={650} size={116} lines={[{ text: "Jetzt kostenlos" }, { text: "starten.", soft: true }]} />
    <div style={{ position: "absolute", top: 1010, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
      <AddressPill dark />
    </div>
    <div style={{ position: "absolute", top: 1150, left: 0, right: 0, textAlign: "center", fontSize: 34, color: GREY }}>Kostenlos im Web · Bald für iOS und Android</div>
    <div style={{ position: "absolute", top: 1290, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, fontSize: 40, fontWeight: 700 }}>
      Tipp auf den Link
      <FiArrowDown size={72} />
    </div>
  </StoryNight>
);
