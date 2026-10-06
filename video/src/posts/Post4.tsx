import { Bubble, Canvas, ChatHeader, ExampleNote, Floating, Headline, Lead, NavPill, OfferCard, Phone, POST_WIDTH } from "./kit";

const PHONE = { width: 320, scale: 2, top: 700 };

// Trust: the brand pays first, the money waits until the post is online.
export const Post4: React.FC = () => (
  <Canvas photo="lotion" zoom={2.4} focus={[0.78, 0.55]} veil={0.42}>
    <NavPill />
    <Headline lines={["Die Marke", "zahlt zuerst."]} size={164} top={176} />
    <Lead top={528}>Das Geld wird zurückgehalten, bis dein Post online ist.</Lead>
    <Phone left={(POST_WIDTH - PHONE.width * PHONE.scale) / 2} top={PHONE.top} scale={PHONE.scale} width={PHONE.width} height={700}>
      <ChatHeader name="Odd Bloom" />
      <div style={{ display: "flex", flexDirection: "column", gap: 4, padding: "12px 12px 0" }}>
        <Bubble>Ein TikTok für 250 €?</Bubble>
        <Bubble mine>Deal!</Bubble>
      </div>
    </Phone>
    <Floating cx={POST_WIDTH / 2} cy={1196} scale={2}>
      <OfferCard
        eyebrow="Bezahlt · zurückgehalten"
        amount="250,00 €"
        detail="Poste den Inhalt und reiche dann den Link ein. Du bekommst 225,00 €, sobald Odd Bloom den Post freigibt."
        width={300}
      />
    </Floating>
    <ExampleNote />
  </Canvas>
);
