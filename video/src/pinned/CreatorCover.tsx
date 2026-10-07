import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FiCheck } from "react-icons/fi";
import { pop, ramp } from "../anim";
import { Sfx } from "../audio";
import { colors } from "../theme";
import { AppHeader, AppTabBar, BudgetPill, DeckButtons, FeedCard, POST_WIDTH, type FeedDeal } from "../posts/kit";
import { IPhone, IPHONE_WIDTH } from "./iphone";
import { Bed, Night, SampleNote, TwoTone } from "./kit";

export const CREATOR_COVER_DURATION = 150;

const SCALE = 1.38;
const PHONE_LEFT = (POST_WIDTH - IPHONE_WIDTH * SCALE) / 2;
const PHONE_TOP = 372;
// Height of the deck between the header and the buttons, in app pixels.
const DECK = 451;

const ODD_BLOOM: FeedDeal = {
  photo: "serum",
  budget: "250 €",
  company: "Odd Bloom",
  title: "Serum-Launch, erste Eindrücke",
  rating: [4.8, 23],
  platform: "TikTok",
  deliverables: "1 Video",
};

const KIEZ_GOODS: FeedDeal = {
  photo: "matcha",
  budget: "400 €",
  company: "Kiez Goods",
  title: "Iced Matcha für die Sommerkarte",
  rating: [4.9, 41],
  platform: "Instagram",
  deliverables: "1 Reel + 2 Stories",
};

// Timing, in frames.
const DRAG = [18, 34];
const FLING = [34, 48];
const TOAST = 46;
const NEXT_PILL = 64;

// The creators' pinned post, slide 1: the Feed, the top card swiped right, the next deal coming up.
export const CreatorCover: React.FC = () => {
  const frame = useCurrentFrame();
  const drag = interpolate(frame, DRAG, [0, 56], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const fling = interpolate(frame, FLING, [0, 470], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.cubic) });
  const dx = drag + fling;
  const rotate = dx * 0.06;
  const forward = ramp(frame, 38, 54);
  const heart = 1 + 0.16 * Math.sin(Math.PI * ramp(frame, 36, 46, Easing.linear));
  const toastIn = pop(frame, TOAST);
  const toastOut = ramp(frame, 128, 140);
  const touch = ramp(frame, 13, 18) * (1 - ramp(frame, 34, 39));
  const firstPill = pop(frame, 8);
  const nextPill = pop(frame, NEXT_PILL);

  return (
    <Night>
      <Bed file="music/creator-bed.mp3" duration={CREATOR_COVER_DURATION} />
      <Sfx name="pop" at={8} volume={0.5} />
      <Sfx name="swipe" at={FLING[0]} volume={0.7} />
      <Sfx name="like" at={TOAST} volume={0.55} />
      <Sfx name="pop" at={NEXT_PILL} volume={0.5} />

      <TwoTone top={96} size={80} lines={[{ text: "Für Creator." }, { text: "Bezahlte Deals,", grey: true }, { text: "Budget vorab.", grey: true }]} />

      <IPhone left={PHONE_LEFT} top={PHONE_TOP} scale={SCALE}>
        <AppHeader title="Feed" />
        <div style={{ position: "relative", height: DECK, flexShrink: 0 }}>
          <div style={{ position: "absolute", inset: 0, transform: `translateY(${(1 - forward) * 10}px) scale(${0.95 + 0.05 * forward})`, transformOrigin: "50% 100%" }}>
            <FeedCard deal={KIEZ_GOODS} height={DECK - 12} />
          </div>
          <div style={{ position: "absolute", inset: 0, transform: `translateX(${dx}px) rotate(${rotate}deg)`, transformOrigin: "50% 120%" }}>
            <FeedCard deal={ODD_BLOOM} height={DECK - 12} />
          </div>
          {/* A finger on the card while it's dragged. */}
          <div
            style={{
              position: "absolute",
              left: 170 + dx,
              top: 250,
              width: 46,
              height: 46,
              marginLeft: -23,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.55)",
              boxShadow: "0 0 0 2px rgba(255,255,255,0.8), 0 6px 18px rgba(0,0,0,0.25)",
              opacity: touch,
            }}
          />
          {/* The app's own toast, just above the buttons. */}
          <div
            style={{
              position: "absolute",
              left: 12,
              right: 12,
              bottom: 12,
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderRadius: 4,
              border: "1px solid rgba(7,7,7,0.1)",
              backgroundColor: colors.paper,
              padding: "12px 14px",
              fontSize: 14,
              lineHeight: "20px",
              boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)",
              opacity: Math.min(1, toastIn * 2) * (1 - toastOut),
              transform: `translateY(${(1 - toastIn) * 14}px)`,
            }}
          >
            <FiCheck size={16} />
            Interesse an Odd Bloom gesendet.
          </div>
        </div>
        <DeckButtons heartScale={heart} />
        <AppTabBar />
      </IPhone>

      {/* The budget, lifted out of the card: it leaves with the swiped card, the next card's comes in. */}
      <div
        style={{
          position: "absolute",
          left: 828 + dx * SCALE,
          top: 600,
          transform: `translate(-50%, -50%) rotate(${4 + rotate}deg) scale(${1.55 * firstPill})`,
          opacity: 1 - ramp(frame, 40, 48),
        }}
      >
        <BudgetPill amount={"250 €"} />
      </div>
      <div style={{ position: "absolute", left: 828, top: 600, transform: `translate(-50%, -50%) rotate(4deg) scale(${1.55 * nextPill})` }}>
        <BudgetPill amount={"400 €"} />
      </div>

      <SampleNote />
    </Night>
  );
};
