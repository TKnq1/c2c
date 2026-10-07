import { Img, staticFile } from "remotion";
import { SiInstagram } from "react-icons/si";
import { PHOTOS } from "../theme";
import { AppHeader, AppTabBar, BudgetPill, CreatorRow, DeckButtons, FeedCard, Floating, GreyGroup, Phone, POST_WIDTH, PushNotification, type FeedDeal } from "../posts/kit";
import { Night, SampleNote, TwoTone, Wordmark } from "./kit";

// The app's screen in full, dock included: 320 x 650 app pixels at 1.4.
const SCREEN = { width: 320, height: 650, scale: 1.4, top: 448 };
const screenLeft = (POST_WIDTH - SCREEN.width * SCREEN.scale) / 2;

const ODD_BLOOM: FeedDeal = {
  photo: "serum",
  budget: "250 €",
  company: "Odd Bloom",
  title: "Serum-Launch, erste Eindrücke",
  rating: [4.8, 23],
  platform: "TikTok",
  deliverables: "1 Video",
};

// The creators' pinned post, slide 1: who it's for and what they get, over the Feed.
export const PinCreatorCover: React.FC = () => (
  <Night>
    <Wordmark />
    <TwoTone top={150} size={86} lines={[{ text: "Für Creator." }, { text: "Bezahlte Deals,", grey: true }, { text: "Budget vorab.", grey: true }]} />
    <Phone frameless left={screenLeft} top={SCREEN.top} scale={SCREEN.scale} width={SCREEN.width} height={SCREEN.height}>
      <AppHeader title="Feed" />
      <FeedCard deal={ODD_BLOOM} height={420} />
      <DeckButtons />
      <AppTabBar />
    </Phone>
    <Floating cx={790} cy={640} scale={1.6} rotate={4}>
      <BudgetPill amount={"250 €"} />
    </Floating>
    <SampleNote />
  </Night>
);

// The brands' pinned post, slide 1: creators coming to them.
export const PinBrandCover: React.FC = () => (
  <Night>
    <Wordmark />
    <TwoTone top={150} size={86} lines={[{ text: "Für Marken." }, { text: "Creator melden", grey: true }, { text: "sich bei dir.", grey: true }]} />
    <Phone frameless left={screenLeft} top={SCREEN.top} scale={SCREEN.scale} width={SCREEN.width} height={SCREEN.height}>
      <AppHeader title="Anfragen" />
      <div style={{ padding: 12 }}>
        <GreyGroup style={{ display: "flex", alignItems: "center", gap: 10, padding: 10 }}>
          <Img src={staticFile(PHOTOS.flask)} style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 4, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 14, lineHeight: "20px", fontWeight: 700 }}>Unser neues Parfüm, erste Eindrücke</div>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, lineHeight: "16px", color: "#737373" }}>
              300 € ·
              <SiInstagram size={12} color="#E4405F" />1 Reel
            </div>
          </div>
        </GreyGroup>
        <p style={{ margin: "14px 0 0", padding: "0 4px", fontSize: 13, lineHeight: "18px", color: "#737373" }}>Interessierte Creator</p>
        <GreyGroup style={{ marginTop: 6 }}>
          <CreatorRow name="Mia K." niche="Beauty" platform="TikTok" followers="58K" />
          <CreatorRow name="Jonas R." niche="Lifestyle" platform="Instagram" followers="112K" />
          <CreatorRow name="Aria N." niche="Beauty" platform="YouTube" followers="34K" />
          <CreatorRow name="Lea S." niche="Fashion" platform="Instagram" followers="76K" />
          <CreatorRow name="Tom B." niche="Fitness" platform="TikTok" followers="41K" last />
        </GreyGroup>
      </div>
      <AppTabBar />
    </Phone>
    <Floating cx={660} cy={1190} scale={1.5} rotate={-3}>
      <PushNotification name="Mia K." title="Unser neues Parfüm" width={300} />
    </Floating>
    <SampleNote />
  </Night>
);
