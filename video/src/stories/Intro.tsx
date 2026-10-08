import { AppHeader, AppTabBar, BudgetPill, DeckButtons, FeedCard } from "../posts/kit";
import { StoryPhone } from "./kit";
import { ODD_BLOOM } from "./Stills";

// The highlight "Was ist comtor?": a short introduction in seven cards. Some are the stories of the daily set
// (pays, brand-request, cta); these are the ones made for it.

// Height of the deck between the header and the buttons, in app pixels (as in the pinned cover).
const DECK = 451;

// The creator's Feed at rest: the header, one deal card, the buttons and the tab bar.
const FeedScreen: React.FC = () => (
  <>
    <AppHeader title="Feed" />
    <div style={{ position: "relative", height: DECK, flexShrink: 0 }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <FeedCard deal={ODD_BLOOM} height={DECK - 12} />
      </div>
    </div>
    <DeckButtons />
    <AppTabBar />
  </>
);

export const IntroCreator: React.FC = () => (
  <StoryPhone
    lines={[{ text: "Wisch bezahlte" }, { text: "Marken-Deals." }, { text: "Das Budget steht", soft: true }, { text: "auf der Karte.", soft: true }]}
    size={72}
    top={330}
    phoneTop={650}
    phoneScale={1.45}
    fade={460}
    screen={<FeedScreen />}
    callout={<BudgetPill amount="250 €" />}
    at={[815, 883]}
    rotate={4}
    scale={1.64}
  />
);
