import { IoClose, IoHeart, IoLockClosed, IoRefresh, IoChatbubblesOutline } from "react-icons/io5";
import { ease, mix, pop, ramp } from "../anim";
import { Sfx, SfxRepeat } from "../audio";
import { type Deal, DealCard, Stage, Toast, Avatar } from "../components/ui";
import { useFrame } from "../frame";
import { colors, GUTTER } from "../theme";
import { NOKAR_HOODIE, RAW_HOODIE, RAW_PANTS, VINTAGE_DROP, VS_AVATAR } from "./brands";
import { Card, Check, ClickCursor, floatIn, focusIn, hover, Sample, Title, useClicks } from "./kit";
import { Line, Message, Pressable, StatusStep, Tag } from "./parts";

const CARD_W = 560;
const CARD_H = 784;
const CARD_LEFT = (1080 - CARD_W) / 2;
const CARD_TOP = 560;

// Swipe buttons under the deck: centres on the frame, the cursor's targets.
const BTN_Y = 1450;
const PASS_X = 450;
const LIKE_X = 630;
const BTN = 120;

const SwipeButtons: React.FC<{ passPress?: number; likePress?: number; like?: boolean }> = ({ passPress = 0, likePress = 0, like = false }) => (
  <>
    <Pressable cx={PASS_X} cy={BTN_Y} w={BTN} h={BTN} press={passPress} style={{ borderRadius: 999, backgroundColor: colors.paper, color: colors.ink, boxShadow: "0 20px 40px rgba(7,7,7,0.15)" }}>
      <IoClose size={56} />
    </Pressable>
    <Pressable cx={LIKE_X} cy={BTN_Y} w={BTN} h={BTN} press={likePress} style={{ borderRadius: 999, backgroundColor: like ? colors.ink : colors.ink, color: colors.paper, boxShadow: "0 20px 40px rgba(7,7,7,0.25)" }}>
      <IoHeart size={52} />
    </Pressable>
  </>
);

// ---------------------------------------------------------------------------------------------------------------
// AC1 · Rate DMs

const DMS = [
  { name: "Nora", text: "Hey! Was nimmst du für einen Post?", at: 4 },
  { name: "Ben", text: "Schick mal deine Mediadaten", at: 22 },
  { name: "Lisa", text: "Geht's auch etwas günstiger?", at: 40 },
  { name: "Tom", text: "Machst du's gegen Produkt?", at: 58 },
  { name: "Eva", text: "Und was kostet eine Story?", at: 76 },
];

export const AC1Pain: React.FC = () => {
  const frame = useFrame();
  return (
    <Stage>
      <Title parts={["Was nimmst du", { mark: "für einen Post?" }]} sub="Jede Woche. Die gleiche Frage." start={-6} />
      <div style={{ position: "absolute", top: 660, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 26 }}>
        {DMS.map((dm, i) => (
          <Message key={dm.name} name={dm.name} text={dm.text} style={{ ...floatIn(frame, dm.at, 60), marginLeft: (i % 2) * 40 }} />
        ))}
      </div>
      {DMS.map((dm) => (
        <Sfx key={dm.name} name="ding" at={dm.at} volume={0.3} />
      ))}
    </Stage>
  );
};

// The cursor points at the budget on the card, then clicks "Interessiert"; the card swipes off to the right.
const AC1_LIKE = 86;

export const AC1Mech: React.FC = () => {
  const frame = useFrame();
  const ring = pop(frame, 34);
  const route = useClicks(frame, {
    from: [900, 1180],
    start: 26,
    clicks: [{ at: AC1_LIKE, target: [LIKE_X, BTN_Y], arrive: 80, via: [[52, 392, 630]] }],
    away: [900, 1620],
  });
  const out = ease(frame, AC1_LIKE + 1, { stiffness: 60 });
  const s = CARD_W / 600;
  return (
    <Stage>
      <Title parts={["Das Budget steht", { mark: "auf der Karte." }]} />
      <div style={{ position: "absolute", top: CARD_TOP, left: CARD_LEFT, width: CARD_W, height: CARD_H, ...floatIn(frame, 6) }}>
        <DealCard deal={RAW_PANTS} width={CARD_W} height={CARD_H} style={{ position: "absolute", transform: `scale(${mix(out, 0.94, 1)}) translateY(${mix(out, 24, 0)}px)` }} />
        <div style={{ position: "absolute", inset: 0, transform: `translate(${out * 900}px, ${hover(frame) - out * 60}px) rotate(${out * 16}deg)`, transformOrigin: "50% 120%" }}>
          <DealCard deal={RAW_HOODIE} width={CARD_W} height={CARD_H} />
          <div
            style={{
              position: "absolute",
              left: 14 * s,
              top: 22 * s,
              width: 244 * s,
              height: 88 * s,
              borderRadius: 999,
              border: `5px solid ${colors.paper}`,
              boxShadow: `0 0 0 ${6 + 6 * Math.sin(frame / 5)}px rgba(255,255,255,0.35)`,
              opacity: ring * (1 - ramp(frame, AC1_LIKE - 22, AC1_LIKE - 16)),
              transform: `scale(${mix(ring, 1.4, 1)})`,
            }}
          />
        </div>
      </div>
      <SwipeButtons likePress={route.press[0]} />
      <div style={{ position: "absolute", top: 1520, left: 0, right: 0, display: "flex", justifyContent: "center", ...focusIn(ease(frame, AC1_LIKE + 8), 30) }}>
        <Toast>
          <IoHeart size={30} /> Interesse an Raw Supplies gesendet
        </Toast>
      </div>
      <ClickCursor route={route} />
      <Sample />
      <Sfx name="pop" at={34} volume={0.4} />
      <Sfx name="click" at={AC1_LIKE} volume={0.7} />
      <Sfx name="swipe" at={AC1_LIKE + 2} volume={0.6} />
      <Sfx name="like" at={AC1_LIKE + 10} volume={0.5} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// AC2 · The invoice nobody pays

export const AC2Pain: React.FC = () => {
  const frame = useFrame();
  const days = Math.max(1, Math.round(47 * ramp(frame, 30, 110)));
  const overdue = frame >= 96;
  return (
    <Stage>
      <Title parts={["Post ist online.", { mark: "Das Geld nicht." }]} start={-6} />
      <Card style={{ position: "absolute", top: 640, left: GUTTER + 20, right: GUTTER + 20, padding: 56, display: "flex", flexDirection: "column", gap: 38, ...floatIn(frame, 4) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 44, fontWeight: 900 }}>Rechnung 0042</span>
          <Tag dark={overdue} style={{ transform: `scale(${1 + 0.15 * Math.max(0, 1 - Math.abs(frame - 98) / 6)})` }}>
            {overdue ? "Überfällig" : "Offen"}
          </Tag>
        </div>
        <Line label="1 Reel · Instagram" value="400,00 €" />
        <div style={{ height: 2, backgroundColor: colors.line }} />
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36 }}>
          <Check p={pop(frame, 16)} size={52} />
          Post ist online
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, fontSize: 36, color: colors.graphite }}>
          <span style={{ width: 52, height: 52, borderRadius: 999, border: `3px dashed ${colors.stone}`, flexShrink: 0 }} />
          Zahlung offen seit
        </div>
        <div style={{ fontSize: 210, fontWeight: 900, letterSpacing: -8, lineHeight: 0.9, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
          {days} <span style={{ fontSize: 80, letterSpacing: -2, color: colors.graphite }}>{days === 1 ? "Tag" : "Tage"}</span>
        </div>
      </Card>
      <Sfx name="pop" at={16} volume={0.4} />
      <SfxRepeat name="tick" from={30} to={110} every={3} volume={0.16} />
      <Sfx name="stamp" at={96} volume={0.5} />
    </Stage>
  );
};

export const AC2Mech: React.FC = () => {
  const frame = useFrame();
  const lock = pop(frame, 44);
  return (
    <Stage>
      <Title parts={["Die Marke", { mark: "zahlt zuerst." }]} sub="Das Geld wird zurückgehalten, bis dein Post online ist." />
      <Card style={{ position: "absolute", top: 760, left: GUTTER + 20, right: GUTTER + 20, padding: 56, display: "flex", flexDirection: "column", gap: 40, ...floatIn(frame, 4) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <Avatar name="vintagesteals.de" image={VS_AVATAR} size={84} />
          <div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>vintagesteals.de</div>
            <div style={{ fontSize: 26, color: colors.graphite }}>Instagram · 1 Reel</div>
          </div>
          <span style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontSize: 64, fontWeight: 900 }}>
            <span style={{ display: "flex", transform: `scale(${lock}) rotate(${(1 - lock) * -30}deg)`, opacity: Math.min(1, lock * 2) }}>
              <IoLockClosed size={50} />
            </span>
            400 €
          </span>
        </div>
        <div>
          <StatusStep label="Angebot angenommen" p={pop(frame, 14)} line={ramp(frame, 20, 34)} />
          <StatusStep label="Bezahlt · zurückgehalten" p={pop(frame, 34)} icon={<IoLockClosed size={34} />} line={ramp(frame, 70, 84)} current={frame < 84} />
          <StatusStep label="Post online" p={pop(frame, 84)} line={ramp(frame, 92, 104)} />
          <StatusStep label="Ausgezahlt" p={pop(frame, 104)} current />
        </div>
      </Card>
      <Sample />
      <Sfx name="pop" at={14} volume={0.4} />
      <Sfx name="lock" at={44} volume={0.75} />
      <Sfx name="pop" at={84} volume={0.4} />
      <Sfx name="success" at={104} volume={0.6} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// AC4 · Waiting for brands to write

const REFRESHES = [24, 58, 92];

export const AC4Pain: React.FC = () => {
  const frame = useFrame();
  const spin = REFRESHES.reduce((turns, at) => turns + ease(frame, at, { stiffness: 80 }), 0);
  const day = Math.max(1, Math.round(30 * ramp(frame, 10, 120)));
  return (
    <Stage>
      <Title parts={["Noch keine Marke", { mark: "hat geschrieben?" }]} start={-6} />
      <Card style={{ position: "absolute", top: 620, left: GUTTER + 20, right: GUTTER + 20, height: 820, padding: 56, display: "flex", flexDirection: "column", ...floatIn(frame, 2) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 48, fontWeight: 900 }}>Nachrichten</span>
          <span style={{ display: "flex", color: colors.graphite, transform: `rotate(${spin * 360}deg)` }}>
            <IoRefresh size={52} />
          </span>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 26, color: colors.stone }}>
          <IoChatbubblesOutline size={150} />
          <span style={{ fontSize: 40 }}>Keine neuen Nachrichten</span>
        </div>
        <div style={{ textAlign: "center", fontSize: 34, color: colors.graphite, fontVariantNumeric: "tabular-nums" }}>Tag {day}</div>
      </Card>
      {REFRESHES.map((at) => (
        <Sfx key={at} name="tick" at={at} volume={0.35} />
      ))}
    </Stage>
  );
};

// Three brands in the deck; the cursor shows interest in the first two, one click each.
const STACK: Deal[] = [VINTAGE_DROP, RAW_HOODIE, NOKAR_HOODIE];
const LIKES = [48, 100];

export const AC4Mech: React.FC = () => {
  const frame = useFrame();
  const route = useClicks(frame, {
    from: [900, 1200],
    start: 20,
    clicks: [
      { at: LIKES[0], target: [LIKE_X, BTN_Y], arrive: 42 },
      { at: LIKES[1], target: [LIKE_X, BTN_Y], arrive: 94, via: [[70, 800, 1560]] },
    ],
    away: [900, 1620],
  });
  const toast = frame < LIKES[1] + 1 ? "Interesse an vintagesteals.de gesendet" : "Interesse an Raw Supplies gesendet";
  return (
    <Stage>
      <Title parts={["Bezahlte Deals.", { mark: "Du wählst." }]} />
      <div style={{ position: "absolute", top: CARD_TOP, left: CARD_LEFT, width: CARD_W, height: CARD_H, ...floatIn(frame, 4) }}>
        {[...STACK].reverse().map((deal, ri) => {
          const i = STACK.length - 1 - ri;
          const out = LIKES[i] === undefined ? 0 : ease(frame, LIKES[i] + 1, { stiffness: 60 });
          // Cards behind move up a place each time the one in front leaves.
          const ahead = LIKES.slice(0, i).reduce((n, at) => n + ease(frame, at + 1, { stiffness: 80 }), 0);
          const depth = i - ahead;
          return (
            <div
              key={`${deal.company}-${i}`}
              style={{
                position: "absolute",
                inset: 0,
                transform: `translate(${out * 900}px, ${depth * 26 - out * 60}px) rotate(${out * 16}deg) scale(${1 - depth * 0.05})`,
                transformOrigin: "50% 120%",
                opacity: depth > 1.5 ? 0 : 1,
              }}
            >
              <DealCard deal={deal} width={CARD_W} height={CARD_H} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", inset: 0, ...floatIn(frame, 12, 40) }}>
        <SwipeButtons passPress={0} likePress={Math.max(...route.press)} />
      </div>
      <div style={{ position: "absolute", top: 1520, left: 0, right: 0, display: "flex", justifyContent: "center", ...focusIn(ease(frame, LIKES[0] + 8), 30) }}>
        <Toast>
          <IoHeart size={30} /> {toast}
        </Toast>
      </div>
      <ClickCursor route={route} />
      <Sample />
      {LIKES.map((at) => (
        <Sfx key={at} name="click" at={at} volume={0.7} />
      ))}
      {LIKES.map((at) => (
        <Sfx key={`s${at}`} name="swipe" at={at + 2} volume={0.55} />
      ))}
      {LIKES.map((at) => (
        <Sfx key={`l${at}`} name="like" at={at + 10} volume={0.45} />
      ))}
    </Stage>
  );
};
