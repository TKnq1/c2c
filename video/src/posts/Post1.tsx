import { AppHeader, BudgetPill, Canvas, ExampleNote, FeedCard, Floating, Headline, Lead, NavPill, Phone, POST_HEIGHT, POST_WIDTH, Toast, type FeedDeal } from "./kit";

const ODD_BLOOM: FeedDeal = {
  photo: "serum",
  budget: "250\u00A0€",
  company: "Odd Bloom",
  title: "Serum-Launch, erste Eindrücke",
  rating: [4.8, 23],
  platform: "TikTok",
  deliverables: "1 Video",
};

const PHONE = { width: 320, scale: 2, top: 690 };

// Hook for creators: the price in the question, the card that answers it.
export const Post1: React.FC = () => (
  <Canvas photo="serum">
    <NavPill />
    <Headline
      lines={[
        "250\u00A0€ für",
        // "k" and "T" don't kern in Lato, which leaves a gap in the middle of the word.
        <>
          ein Tik<span style={{ marginLeft: "-0.06em" }}>Tok?</span>
        </>,
      ]}
      size={164}
      top={176}
    />
    <Lead top={528}>Auf comtor steht das Budget schon auf der Karte.</Lead>
    <Phone left={(POST_WIDTH - PHONE.width * PHONE.scale) / 2} top={PHONE.top} scale={PHONE.scale} width={PHONE.width} height={640}>
      <AppHeader title="Feed" />
      <FeedCard deal={ODD_BLOOM} height={(POST_HEIGHT - PHONE.top) / PHONE.scale - 99} />
    </Phone>
    <Floating cx={176} cy={920} scale={1.9} rotate={-5}>
      <BudgetPill amount={"250\u00A0€"} />
    </Floating>
    <Floating cx={860} cy={958} scale={1.9} rotate={-3}>
      <Toast>Interesse gesendet.</Toast>
    </Floating>
    <ExampleNote />
  </Canvas>
);
