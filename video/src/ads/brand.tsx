import { Easing } from "remotion";
import { IoChatbubble, IoHeart, IoLink, IoLockClosed, IoLogoInstagram, IoShareSocial } from "react-icons/io5";
import { ease, mix, path, pop, ramp, thousands } from "../anim";
import { Sfx, SfxRepeat } from "../audio";
import { Avatar, Photo, Stage } from "../components/ui";
import { useFrame } from "../frame";
import { colors, GUTTER } from "../theme";
import { NOKAR_AVATAR, VS_AVATAR } from "./brands";
import { Card, ClickCursor, floatIn, focusIn, hover, Sample, Title, useClicks } from "./kit";
import { Phone, Pressable, Push, StatusStep, Tag } from "./parts";
import { Cursor } from "../components/shared-scenes";

// ---------------------------------------------------------------------------------------------------------------
// AB1 · Ads get scrolled past

const PHONE_W = 600;
const PHONE_H = 1200;
const SCREEN_H = PHONE_H - PHONE_W * 0.07;

const ADS = [
  { big: "SALE", small: "−20 %", button: "Jetzt kaufen" },
  { big: "NEU", small: "Kollektion", button: "Jetzt shoppen" },
  { big: "GRATIS", small: "Versand", button: "Zum Angebot" },
  { big: "LETZTE", small: "Chance", button: "Sichern" },
  { big: "DEAL", small: "des Tages", button: "Ansehen" },
];
const FLICKS = [10, 36, 62, 88, 114];

const AdTile: React.FC<{ big: string; small: string; button: string }> = ({ big, small, button }) => (
  <div style={{ height: SCREEN_H, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 18, backgroundColor: colors.fog, position: "relative" }}>
    <span style={{ position: "absolute", top: 110, left: 30, fontSize: 22, fontWeight: 700, padding: "6px 14px", borderRadius: 6, backgroundColor: colors.stone, color: colors.paper }}>Anzeige</span>
    <span style={{ fontSize: 110, fontWeight: 900, color: colors.stone, letterSpacing: -3 }}>{big}</span>
    <span style={{ fontSize: 52, fontWeight: 900, color: colors.stone }}>{small}</span>
    <span style={{ marginTop: 20, padding: "16px 40px", borderRadius: 8, backgroundColor: colors.stone, color: colors.paper, fontSize: 28, fontWeight: 700 }}>{button}</span>
  </div>
);

export const AB1Pain: React.FC = () => {
  const frame = useFrame();
  const scrolled = FLICKS.reduce((n, at) => n + ramp(frame, at, at + 12, Easing.inOut(Easing.cubic)), 0);
  const flick = FLICKS.find((at) => frame >= at - 4 && frame <= at + 12);
  const thumbY = flick === undefined ? 1500 : path(frame, [flick - 4, flick + 10], [1500, 1000]);
  return (
    <Stage>
      <Title parts={["Deine Anzeige?", { mark: "Weggewischt." }]} start={-6} />
      <div style={{ position: "absolute", top: 560, left: (1080 - PHONE_W) / 2, ...floatIn(frame, -10) }}>
        <Phone width={PHONE_W} height={PHONE_H}>
          <div style={{ transform: `translateY(${-scrolled * SCREEN_H}px)` }}>
            {[...ADS, ADS[0]].map((ad, i) => (
              <AdTile key={i} {...ad} />
            ))}
          </div>
        </Phone>
      </div>
      <Cursor x={560} y={thumbY} pressed={flick === undefined ? 0 : 1} opacity={flick === undefined ? 0.5 : 1} />
      {FLICKS.map((at, i) => (
        <Sfx key={at} name="swipe" at={at} volume={0.4 + i * 0.05} />
      ))}
    </Stage>
  );
};

export const AB1_PAIN_BLUR: [number, number][] = FLICKS.map((at) => [at, at + 12]);

const CAPTION = "ok, dieser Hoodie ist ehrlich gesagt mein neues Lieblingsteil";

export const AB1Mech: React.FC = () => {
  const frame = useFrame();
  const words = Math.floor(ramp(frame, 10, 70, Easing.linear) * CAPTION.split(" ").length);
  const push = ease(frame, 82, { damping: 16, stiffness: 140 });
  const likes = 1200 + 3600 * ramp(frame, 10, 110);
  return (
    <Stage>
      <Title parts={["Creator,", { mark: "denen man zuhört." }]} />
      <div style={{ position: "absolute", top: 560, left: (1080 - PHONE_W) / 2, transform: `translateY(${hover(frame)}px)`, ...floatIn(frame, 0) }}>
        <Phone width={PHONE_W} height={PHONE_H}>
          <Photo photo="rawHoodie" style={{ position: "absolute", inset: 0 }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent 45%)" }} />
          <div style={{ position: "absolute", top: 110, left: 30, display: "flex", alignItems: "center", gap: 14, color: colors.paper }}>
            <Avatar name="Lena" size={64} style={{ border: `3px solid ${colors.paper}` }} />
            <span style={{ fontSize: 28, fontWeight: 900 }}>Lena</span>
          </div>
          <div style={{ position: "absolute", right: 24, bottom: 220, display: "flex", flexDirection: "column", gap: 30, alignItems: "center", color: colors.paper, fontSize: 22, fontWeight: 700 }}>
            <IoHeart size={56} />
            {thousands(likes)}
            <IoChatbubble size={50} />
            <IoShareSocial size={50} />
          </div>
          <div style={{ position: "absolute", left: 30, right: 120, bottom: 80 }}>
            {words > 0 && (
              <span style={{ backgroundColor: colors.paper, color: colors.ink, fontSize: 32, fontWeight: 900, lineHeight: 1.45, padding: "4px 12px", boxDecorationBreak: "clone", WebkitBoxDecorationBreak: "clone" }}>
                {CAPTION.split(" ").slice(0, words).join(" ")}
              </span>
            )}
          </div>
        </Phone>
      </div>
      <div style={{ position: "absolute", top: 600, left: GUTTER, right: GUTTER, opacity: Math.min(1, push * 2), transform: `translateY(${(1 - push) * -200}px) scale(${mix(push, 0.9, 1)})` }}>
        <Push text="Lena interessiert sich für „RAW Hoodie V2“" />
      </div>
      <Sample />
      <Sfx name="ding" at={82} volume={0.5} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// AB2 · Cold DMs

const SENT = [
  { handle: "@lena.beauty", status: "Gesehen" },
  { handle: "@mia.moves", status: "Gesehen" },
  { handle: "@jonas.daily", status: "Zugestellt" },
  { handle: "@sara.eats", status: "Gesehen" },
  { handle: "@tim.tech", status: "Gesehen" },
];

export const AB2Pain: React.FC = () => {
  const frame = useFrame();
  const sent = Math.round(47 * ramp(frame, 8, 90));
  return (
    <Stage>
      <Title parts={["47 DMs.", { mark: "2 Antworten." }]} size={120} start={-6} />
      <Card style={{ position: "absolute", top: 600, left: GUTTER + 20, right: GUTTER + 20, padding: "48px 56px", display: "flex", flexDirection: "column", gap: 8, ...floatIn(frame, 2) }}>
        <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
          {[
            ["Gesendet", String(sent)],
            ["Antworten", "2"],
          ].map(([label, value]) => (
            <div key={label} style={{ flex: 1, padding: "24px 30px", borderRadius: 20, backgroundColor: colors.fog }}>
              <div style={{ fontSize: 28, color: colors.graphite }}>{label}</div>
              <div style={{ fontSize: 88, fontWeight: 900, fontVariantNumeric: "tabular-nums", lineHeight: 1.05 }}>{value}</div>
            </div>
          ))}
        </div>
        {SENT.map((row, i) => (
          <div key={row.handle} style={{ display: "flex", alignItems: "center", gap: 22, padding: "18px 0", borderBottom: i < SENT.length - 1 ? `2px solid ${colors.fog}` : undefined, ...floatIn(frame, 16 + i * 12, 30) }}>
            <Avatar name={row.handle.slice(1)} size={70} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 34, fontWeight: 700 }}>{row.handle}</div>
              <div style={{ fontSize: 26, color: colors.graphite }}>Du: Hi! Hättest du Lust auf eine Kooperation?</div>
            </div>
            <span style={{ fontSize: 24, color: colors.stone }}>{row.status}</span>
          </div>
        ))}
      </Card>
      <SfxRepeat name="tick" from={8} to={90} every={3} volume={0.14} />
    </Stage>
  );
};

// The brand posts its request: cursor clicks "Veröffentlichen", the request goes live and creators answer.
const PUBLISH = { cx: 540, cy: 925, w: 760, h: 110 };
const AB2_CLICK = 50;
const PUSHES = [
  { name: "Lena", at: 70 },
  { name: "Mia", at: 88 },
  { name: "Jonas", at: 106 },
];

export const AB2Mech: React.FC = () => {
  const frame = useFrame();
  const route = useClicks(frame, {
    from: [900, 1500],
    start: 20,
    clicks: [{ at: AB2_CLICK, target: [PUBLISH.cx, PUBLISH.cy], arrive: 44 }],
    away: [940, 1160],
    gone: AB2_CLICK + 22,
  });
  const live = route.done[0];
  return (
    <Stage>
      <Title parts={["Creator", { mark: "kommen zu dir." }]} size={110} start={-2} top={230} />
      <Card style={{ position: "absolute", top: 520, left: GUTTER + 20, right: GUTTER + 20, height: 540, padding: 40, ...floatIn(frame, 2) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div style={{ width: 170, height: 170, borderRadius: 16, overflow: "hidden", flexShrink: 0 }}>
            <Photo photo="vsCatalog1" style={{ objectPosition: "left center" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <Avatar name="vintagesteals.de" image={VS_AVATAR} size={44} />
              <span style={{ fontSize: 28, color: colors.graphite }}>vintagesteals.de</span>
            </div>
            <span style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.15 }}>Catalogue Drop 2026, Haul-Video</span>
            <span style={{ fontSize: 28, color: colors.graphite, display: "flex", alignItems: "center", gap: 10 }}>
              400 € · <IoLogoInstagram size={28} /> 1 Reel
            </span>
          </div>
        </div>
        <Tag dark={live} style={{ marginTop: 26 }}>
          {live ? "Veröffentlicht" : "Entwurf"}
        </Tag>
      </Card>
      <Pressable
        {...PUBLISH}
        press={route.press[0]}
        style={{
          borderRadius: 999,
          fontSize: 40,
          fontWeight: 900,
          backgroundColor: live ? colors.fog : colors.ink,
          color: live ? colors.graphite : colors.paper,
          ...floatIn(frame, 2, 0),
        }}
      >
        {live ? "Veröffentlicht" : "Veröffentlichen"}
      </Pressable>
      <div style={{ position: "absolute", top: 1130, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 22 }}>
        {PUSHES.map((p) => {
          const e = ease(frame, p.at, { damping: 16, stiffness: 140 });
          return <Push key={p.name} text={`${p.name} interessiert sich für „Catalogue Drop 2026“`} style={{ opacity: Math.min(1, e * 2), transform: `translateY(${(1 - e) * -160}px) scale(${mix(e, 0.92, 1)})` }} />;
        })}
      </div>
      <ClickCursor route={route} />
      <Sample />
      <Sfx name="click" at={AB2_CLICK} volume={0.7} />
      <Sfx name="success" at={AB2_CLICK + 4} volume={0.5} />
      {PUSHES.map((p) => (
        <Sfx key={p.name} name="ding" at={p.at} volume={0.45} />
      ))}
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// AB3 · Paid, never posted

const OUTGOING = [
  { text: "Überweisung ist raus: 300 €", at: 4 },
  { text: "Wann kommt der Post?", at: 34 },
  { text: "Hallo?", at: 64 },
];

const Outgoing: React.FC<{ text: string; seen: number; style?: React.CSSProperties }> = ({ text, seen, style }) => (
  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8, ...style }}>
    <div style={{ padding: "22px 32px", borderRadius: 34, borderBottomRightRadius: 10, backgroundColor: colors.ink, color: colors.paper, fontSize: 36 }}>{text}</div>
    <span style={{ fontSize: 22, color: colors.stone, opacity: seen }}>Gesehen</span>
  </div>
);

export const AB3Pain: React.FC = () => {
  const frame = useFrame();
  // Someone starts typing… and stops.
  const typing = ramp(frame, 96, 100) * (1 - ramp(frame, 122, 126));
  return (
    <Stage>
      <Title parts={["Bezahlt.", { mark: "Gepostet hat niemand." }]} start={-6} />
      <Card style={{ position: "absolute", top: 620, left: GUTTER + 20, right: GUTTER + 20, height: 820, padding: 48, display: "flex", flexDirection: "column", gap: 30, ...floatIn(frame, 0) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, paddingBottom: 24, borderBottom: `2px solid ${colors.fog}` }}>
          <Avatar name="Creator" size={64} color={colors.stone} />
          <span style={{ fontSize: 34, fontWeight: 700 }}>@creator</span>
        </div>
        {OUTGOING.map((m) => (
          <Outgoing key={m.text} text={m.text} seen={ramp(frame, m.at + 12, m.at + 16)} style={floatIn(frame, m.at, 40)} />
        ))}
        <div style={{ alignSelf: "flex-start", display: "flex", gap: 10, padding: "24px 30px", borderRadius: 34, backgroundColor: colors.fog, opacity: typing }}>
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: colors.graphite, opacity: 0.4 + 0.6 * Math.max(0, Math.sin(frame / 3 - i)) }} />
          ))}
        </div>
      </Card>
      {OUTGOING.map((m) => (
        <Sfx key={m.text} name="pop" at={m.at} volume={0.35} />
      ))}
    </Stage>
  );
};

// A brand pays, the creator posts, the brand approves: cursor clicks "Freigeben" and the payout is released.
const APPROVE = { cx: 540, cy: 1330, w: 760, h: 120 };
const AB3_CLICK = 98;

export const AB3Mech: React.FC = () => {
  const frame = useFrame();
  const route = useClicks(frame, {
    from: [940, 1640],
    start: 64,
    clicks: [{ at: AB3_CLICK, target: [APPROVE.cx, APPROVE.cy], arrive: 90 }],
    away: [940, 1480],
    gone: AB3_CLICK + 20,
  });
  const approved = route.done[0];
  return (
    <Stage>
      <Title parts={["Ausgezahlt wird", { mark: "nach deinem Okay." }]} />
      <Card style={{ position: "absolute", top: 600, left: GUTTER + 20, right: GUTTER + 20, height: 860, padding: 48, ...floatIn(frame, 2) }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 36 }}>
          <Avatar name="Nokar" image={NOKAR_AVATAR} size={84} />
          <div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>Nokar</div>
            <div style={{ fontSize: 26, color: colors.graphite }}>Instagram · 1 Reel</div>
          </div>
          <span style={{ marginLeft: "auto", fontSize: 60, fontWeight: 900 }}>300 €</span>
        </div>
        <div>
          <StatusStep label="Bezahlt · zurückgehalten" sub="300 € liegen bereit" p={pop(frame, 10)} icon={<IoLockClosed size={34} />} line={ramp(frame, 30, 44)} />
          <StatusStep label="Post ist online" sub="Link kommt im Chat" p={pop(frame, 44)} icon={<IoLink size={36} />} line={approved ? ramp(frame, AB3_CLICK + 4, AB3_CLICK + 14) : 0} />
          <StatusStep label={approved ? "Ausgezahlt" : "Wartet auf dich"} p={approved ? pop(frame, AB3_CLICK + 12) : 0} current />
        </div>
      </Card>
      <Pressable
        {...APPROVE}
        press={route.press[0]}
        style={{
          borderRadius: 999,
          fontSize: 44,
          fontWeight: 900,
          backgroundColor: approved ? colors.fog : colors.ink,
          color: approved ? colors.graphite : colors.paper,
          ...floatIn(frame, 56, 30),
        }}
      >
        {approved ? "Freigegeben" : "Freigeben"}
      </Pressable>
      <ClickCursor route={route} />
      <Sample />
      <Sfx name="lock" at={14} volume={0.7} />
      <Sfx name="pop" at={44} volume={0.4} />
      <Sfx name="click" at={AB3_CLICK} volume={0.7} />
      <Sfx name="success" at={AB3_CLICK + 12} volume={0.6} />
    </Stage>
  );
};
