import { AppHeader, Canvas, CreatorRow, ExampleNote, Floating, GreyGroup, Headline, Lead, NavPill, Phone, POST_WIDTH, PushNotification } from "./kit";

const PHONE = { width: 320, scale: 2, top: 700 };

// Hook for brands: everyone scrolls past ads, creators are listened to, and here they come to you.
export const Post2: React.FC = () => (
  <Canvas photo="flask" zoom={2} focus={[0.5, 0.26]}>
    <NavPill />
    <Headline lines={["Jeder scrollt an", "Werbung vorbei."]} size={124} top={186} />
    <Lead top={470} width={900}>
      Echten Creatorn hören die Leute zu.
      <br />
      Poste einen Deal, Creator melden sich bei dir.
    </Lead>
    <Phone left={(POST_WIDTH - PHONE.width * PHONE.scale) / 2} top={PHONE.top} scale={PHONE.scale} width={PHONE.width} height={700}>
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
    <Floating cx={POST_WIDTH / 2} cy={PHONE.top + 172} scale={2.1}>
      <PushNotification name="Mia K." title="Unser neues Parfüm" width={290} />
    </Floating>
    <ExampleNote />
  </Canvas>
);
