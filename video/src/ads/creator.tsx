import { IoChatbubblesOutline, IoClose, IoHeart, IoLockClosed, IoRefresh } from "react-icons/io5";
import { ease, euro, mix, path, pop, ramp } from "../anim";
import { Sfx, SfxRepeat } from "../audio";
import { Cursor, pressAt } from "../components/shared-scenes";
import { type Deal, DealCard, KIEZ_GOODS, ODD_BLOOM, Stage, Toast } from "../components/ui";
import { useFrame } from "../frame";
import { colors, GUTTER } from "../theme";
import { Card, Check, floatIn, focusIn, hover, Sample, Title } from "./kit";
import { Line, Message, StatusStep, Tag } from "./parts";

const LUMO_AUDIO: Deal = {
  company: "Lumo Audio",
  title: "Kopfhörer im Alltag",
  photo: "headphones",
  budget: "320 €",
  platform: "Instagram",
  deliverables: "1 Reel",
  productIncluded: true,
  rating: ["4,7", 18],
};

const CARD_W = 560;
const CARD_H = 784;
const CARD_LEFT = (1080 - CARD_W) / 2;

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

const SWIPE_AT = 84;

export const AC1Mech: React.FC = () => {
  const frame = useFrame();
  const ring = pop(frame, 34);
  const out = ease(frame, SWIPE_AT, { stiffness: 60 });
  const cursorX = path(frame, [60, 76, SWIPE_AT + 14], [900, 620, 1000]);
  const cursorY = path(frame, [60, 76, SWIPE_AT + 14], [1500, 1150, 1100]);
  const s = CARD_W / 600;
  return (
    <Stage>
      <Title parts={["Das Budget steht", { mark: "auf der Karte." }]} />
      <div style={{ position: "absolute", top: 660, left: CARD_LEFT, ...floatIn(frame, 6) }}>
        <DealCard deal={KIEZ_GOODS} width={CARD_W} height={CARD_H} style={{ position: "absolute", transform: `scale(${mix(out, 0.94, 1)}) translateY(${mix(out, 24, 0)}px)` }} />
        <div style={{ position: "relative", transform: `translate(${out * 900}px, ${hover(frame) - out * 60}px) rotate(${out * 16}deg)`, transformOrigin: "50% 120%" }}>
          <DealCard deal={ODD_BLOOM} width={CARD_W} height={CARD_H} />
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
              opacity: ring * (1 - ramp(frame, SWIPE_AT - 6, SWIPE_AT)),
              transform: `scale(${mix(ring, 1.4, 1)})`,
            }}
          />
        </div>
      </div>
      <Cursor x={cursorX} y={cursorY} pressed={frame > 76 && frame < SWIPE_AT + 10 ? 1 : 0} opacity={ramp(frame, 58, 64) * (1 - ramp(frame, SWIPE_AT + 10, SWIPE_AT + 16))} />
      <div style={{ position: "absolute", top: 1500, left: 0, right: 0, display: "flex", justifyContent: "center", ...focusIn(ease(frame, SWIPE_AT + 10), 30) }}>
        <Toast>
          <IoHeart size={30} /> Interesse an Odd Bloom gesendet
        </Toast>
      </div>
      <Sample />
      <Sfx name="pop" at={34} volume={0.4} />
      <Sfx name="swipe" at={SWIPE_AT} volume={0.6} />
      <Sfx name="like" at={SWIPE_AT + 10} volume={0.5} />
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 34, color: colors.graphite }}>Odd Bloom · TikTok</span>
          <span style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 64, fontWeight: 900 }}>
            <span style={{ display: "flex", transform: `scale(${lock}) rotate(${(1 - lock) * -30}deg)`, opacity: Math.min(1, lock * 2) }}>
              <IoLockClosed size={50} />
            </span>
            250 €
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
// AC3 · Paid in product

const BOX_LAND = 12;

export const AC3Pain: React.FC = () => {
  const frame = useFrame();
  const fall = ease(frame, 0, { damping: 18, stiffness: 160 });
  const squash = Math.max(0, 1 - Math.abs(frame - BOX_LAND) / 5) * 0.06;
  return (
    <Stage>
      <Title parts={["„Wir zahlen dich", { mark: "mit dem Produkt.“" }]} sub="Und dein Konto bleibt leer." start={-6} />
      <div style={{ position: "absolute", top: 700, left: 0, right: 0, display: "flex", justifyContent: "center" }}>
        <div style={{ transform: `translateY(${(1 - fall) * -900}px) scale(${1 + squash}, ${1 - squash})`, transformOrigin: "bottom" }}>
          <div style={{ width: 380, height: 300, borderRadius: 18, backgroundColor: "#e9e4dc", boxShadow: "0 50px 90px rgba(7,7,7,0.18)", position: "relative" }}>
            <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 70, transform: "translateX(-50%)", backgroundColor: "#d8d0c3" }} />
            <div style={{ position: "absolute", left: 40, bottom: 36, fontSize: 24, fontWeight: 700, color: "#9a8f80" }}>GRATIS-PRODUKT</div>
          </div>
        </div>
      </div>
      <Card style={{ position: "absolute", top: 1110, left: GUTTER + 60, right: GUTTER + 60, padding: "44px 56px", ...floatIn(frame, 40, 80) }}>
        <div style={{ fontSize: 32, color: colors.graphite }}>Kontostand</div>
        <div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -6, lineHeight: 1 }}>0,00 €</div>
      </Card>
      <Sfx name="hit" at={BOX_LAND} volume={0.45} />
      <Sfx name="pop-low" at={40} volume={0.4} />
    </Stage>
  );
};

export const AC3Mech: React.FC = () => {
  const frame = useFrame();
  const callout = (at: number) => ({ ...floatIn(frame, at, 40) });
  return (
    <Stage>
      <Title parts={["Geld.", { mark: "Und das Produkt." }]} />
      <div style={{ position: "absolute", top: 560, left: CARD_LEFT, transform: `translateY(${hover(frame)}px)`, ...floatIn(frame, 4) }}>
        <DealCard deal={KIEZ_GOODS} width={CARD_W} height={CARD_H} />
      </div>
      <Card style={{ position: "absolute", top: 640, left: GUTTER - 20, padding: "26px 36px", display: "flex", alignItems: "center", gap: 18, ...callout(36) }}>
        <Check p={pop(frame, 40)} size={48} />
        <span style={{ fontSize: 44, fontWeight: 900 }}>400 €</span>
        <span style={{ fontSize: 30, color: colors.graphite }}>Budget</span>
      </Card>
      <div style={{ position: "absolute", top: 1180, left: 0, right: 0, display: "flex", justifyContent: "center", fontSize: 90, fontWeight: 900, ...focusIn(ease(frame, 58), 90) }}>+</div>
      <Card style={{ position: "absolute", top: 1300, right: GUTTER - 20, padding: "26px 36px", display: "flex", alignItems: "center", gap: 18, ...callout(66) }}>
        <Check p={pop(frame, 70)} size={48} />
        <span style={{ fontSize: 40, fontWeight: 900 }}>Produkt inklusive</span>
      </Card>
      <Sample />
      <Sfx name="coin" at={40} volume={0.35} />
      <Sfx name="pop" at={70} volume={0.45} />
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

const STACK = [LUMO_AUDIO, ODD_BLOOM, KIEZ_GOODS];
const SWIPES = [
  { at: 26, dir: -1 },
  { at: 66, dir: 1 },
];

export const AC4Mech: React.FC = () => {
  const frame = useFrame();
  const passPress = pressAt(frame, SWIPES[0].at - 2);
  const likePress = pressAt(frame, SWIPES[1].at - 2);
  return (
    <Stage>
      <Title parts={["Bezahlte Deals.", { mark: "Du wählst." }]} />
      <div style={{ position: "absolute", top: 560, left: CARD_LEFT, width: CARD_W, height: CARD_H, ...floatIn(frame, 4) }}>
        {[...STACK].reverse().map((deal, ri) => {
          const i = STACK.length - 1 - ri;
          const swipe = SWIPES[i];
          const out = swipe ? ease(frame, swipe.at, { stiffness: 60 }) : 0;
          // Cards behind move up a place each time the one in front leaves.
          const ahead = SWIPES.slice(0, i).reduce((n, s) => n + ease(frame, s.at, { stiffness: 80 }), 0);
          const depth = i - ahead;
          return (
            <div
              key={deal.company}
              style={{
                position: "absolute",
                inset: 0,
                transform: `translate(${(swipe?.dir ?? 0) * out * 900}px, ${depth * 26 - out * 60}px) rotate(${(swipe?.dir ?? 0) * out * 16}deg) scale(${1 - depth * 0.05})`,
                transformOrigin: "50% 120%",
                opacity: depth > 1.5 ? 0 : 1,
              }}
            >
              <DealCard deal={deal} width={CARD_W} height={CARD_H} />
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 1420, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60, ...floatIn(frame, 12, 40) }}>
        {[
          { icon: <IoClose size={56} />, press: passPress, filled: false },
          { icon: <IoHeart size={52} />, press: likePress, filled: true },
        ].map(({ icon, press, filled }, i) => (
          <div
            key={i}
            style={{
              width: 120,
              height: 120,
              borderRadius: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: filled ? colors.ink : colors.paper,
              color: filled ? colors.paper : colors.ink,
              boxShadow: "0 20px 40px rgba(7,7,7,0.15)",
              transform: `scale(${1 - press * 0.12})`,
            }}
          >
            {icon}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", top: 1580, left: 0, right: 0, display: "flex", justifyContent: "center", ...focusIn(ease(frame, SWIPES[1].at + 10), 30) }}>
        <Toast>
          <IoHeart size={30} /> Interesse an Odd Bloom gesendet
        </Toast>
      </div>
      <Sample />
      <Sfx name="swipe" at={SWIPES[0].at} volume={0.5} />
      <Sfx name="swipe" at={SWIPES[1].at} volume={0.6} />
      <Sfx name="like" at={SWIPES[1].at + 10} volume={0.5} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// AC5 · What's left of a deal

const CUTS = [
  { label: "Vermittlung", at: 30 },
  { label: "Plattform", at: 46 },
  { label: "Versteckte Gebühren", at: 62 },
];

export const AC5Pain: React.FC = () => {
  const frame = useFrame();
  const wobble = Math.sin(frame / 3) * 6 * ramp(frame, 84, 92);
  return (
    <Stage>
      <Title parts={["250 € Deal.", { mark: "Was bleibt davon?" }]} start={-6} />
      <Card style={{ position: "absolute", top: 660, left: GUTTER + 20, right: GUTTER + 20, padding: 56, display: "flex", flexDirection: "column", gap: 34, ...floatIn(frame, 2) }}>
        <Line label="Deal" value="250,00 €" style={{ fontSize: 44 }} />
        {CUTS.map((cut) => (
          <Line key={cut.label} label={cut.label} value="− ? €" muted style={floatIn(frame, cut.at, 40)} />
        ))}
        <div style={{ height: 3, backgroundColor: colors.ink, transformOrigin: "left", transform: `scaleX(${ramp(frame, 74, 84)})` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", ...floatIn(frame, 80, 30) }}>
          <span style={{ fontSize: 42, fontWeight: 700 }}>Für dich</span>
          <span style={{ fontSize: 150, fontWeight: 900, display: "inline-block", transform: `rotate(${wobble}deg)` }}>?</span>
        </div>
      </Card>
      {CUTS.map((cut) => (
        <Sfx key={cut.label} name="pop-low" at={cut.at} volume={0.35} />
      ))}
      <Sfx name="hit" at={84} volume={0.3} />
    </Stage>
  );
};

const PAYOUT_AT = 78;

export const AC5Mech: React.FC = () => {
  const frame = useFrame();
  const amount = 225 * ramp(frame, 48, PAYOUT_AT);
  const bump = 1 + 0.06 * Math.max(0, 1 - Math.abs(frame - PAYOUT_AT - 3) / 6);
  return (
    <Stage>
      <Title parts={["Du behältst", { mark: "90 %." }]} size={120} />
      <Card style={{ position: "absolute", top: 700, left: GUTTER + 20, right: GUTTER + 20, padding: 56, display: "flex", flexDirection: "column", gap: 34, ...floatIn(frame, 4) }}>
        <Line label="Odd Bloom hat gezahlt" value="250,00 €" style={floatIn(frame, 16, 30)} />
        <Line label="comtor-Gebühr (10 %)" value="−25,00 €" muted style={floatIn(frame, 26, 30)} />
        <div style={{ height: 3, backgroundColor: colors.ink, transformOrigin: "left", transform: `scaleX(${ramp(frame, 36, 46)})` }} />
        <div style={{ display: "flex", flexDirection: "column", ...floatIn(frame, 42, 30) }}>
          <span style={{ fontSize: 40, fontWeight: 700 }}>Du bekommst</span>
          <span style={{ fontSize: 150, fontWeight: 900, letterSpacing: -5, lineHeight: 1.05, transform: `scale(${bump})`, transformOrigin: "left", fontVariantNumeric: "tabular-nums" }}>{euro(amount)}</span>
        </div>
      </Card>
      <Sample />
      <SfxRepeat name="tick" from={48} to={PAYOUT_AT} every={3} volume={0.16} />
      <Sfx name="success" at={PAYOUT_AT} volume={0.7} />
      <Sfx name="coin" at={PAYOUT_AT} volume={0.3} />
    </Stage>
  );
};
