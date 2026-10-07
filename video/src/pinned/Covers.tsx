import { AppHeader, BudgetPill, CreatorRow, ExampleNote, FeedCard, Floating, GreyGroup, Phone, POST_HEIGHT, POST_WIDTH, PushNotification, type FeedDeal } from "../posts/kit";
import { Black, TwoTone, Wordmark } from "./kit";

const SCREEN = { width: 320, scale: 2, top: 660 };
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
  <Black>
    <Wordmark />
    <TwoTone
      top={176}
      size={136}
      lines={[{ text: "Für Creator." }, { text: "Bezahlte Deals,", grey: true }, { text: "Budget vorab.", grey: true }]}
    />
    <Phone frameless left={screenLeft} top={SCREEN.top} scale={SCREEN.scale} width={SCREEN.width} height={720}>
      <AppHeader title="Feed" />
      <FeedCard deal={ODD_BLOOM} height={(POST_HEIGHT - SCREEN.top) / SCREEN.scale - 90} />
    </Phone>
    <Floating cx={872} cy={960} scale={1.9} rotate={4}>
      <BudgetPill amount={"250 €"} />
    </Floating>
    <ExampleNote dark />
  </Black>
);

// The brands' pinned post, slide 1: creators coming to them.
export const PinBrandCover: React.FC = () => (
  <Black>
    <Wordmark />
    <TwoTone
      top={176}
      size={136}
      lines={[{ text: "Für Marken." }, { text: "Creator melden", grey: true }, { text: "sich bei dir.", grey: true }]}
    />
    <Phone frameless left={screenLeft} top={SCREEN.top} scale={SCREEN.scale} width={SCREEN.width} height={720}>
      <AppHeader title="Anfragen" />
      <div style={{ padding: 12 }}>
        <p style={{ margin: 0, padding: "0 4px", fontSize: 13, lineHeight: "18px", color: "#737373" }}>Interessierte Creator</p>
        <GreyGroup style={{ marginTop: 6 }}>
          <CreatorRow name="Mia K." niche="Beauty" platform="TikTok" followers="58K" />
          <CreatorRow name="Jonas R." niche="Lifestyle" platform="Instagram" followers="112K" />
          <CreatorRow name="Aria N." niche="Beauty" platform="YouTube" followers="34K" last />
        </GreyGroup>
      </div>
    </Phone>
    <Floating cx={POST_WIDTH / 2} cy={SCREEN.top + 154} scale={2.1}>
      <PushNotification name="Mia K." title="Unser neues Parfüm" width={290} />
    </Floating>
    <ExampleNote dark />
  </Black>
);
