import { Easing } from "remotion";
import { IoChatbubble, IoHeart, IoLink, IoLockClosed, IoLogoInstagram, IoLogoTiktok, IoShareSocial } from "react-icons/io5";
import { ease, mix, path, pop, ramp, thousands } from "../anim";
import { Sfx, SfxRepeat } from "../audio";
import { Cursor, pressAt } from "../components/shared-scenes";
import { Avatar, Photo, Stage, Toast } from "../components/ui";
import { useFrame } from "../frame";
import { colors, GUTTER } from "../theme";
import { Card, Check, floatIn, focusIn, hover, Sample, Title } from "./kit";
import { Line, Phone, Push, StatusStep, Tag } from "./parts";

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

const CAPTION = "ok, dieses Serum ist ehrlich gesagt mein neues Lieblingsteil";

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
          <Photo photo="serum" style={{ position: "absolute", inset: 0 }} />
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
        <Push text="Lena interessiert sich für „Serum-Launch“" />
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

const PUSHES = [
  { name: "Lena", at: 40 },
  { name: "Mia", at: 58 },
  { name: "Jonas", at: 76 },
];

export const AB2Mech: React.FC = () => {
  const frame = useFrame();
  return (
    <Stage>
      <Title parts={["Creator", { mark: "kommen zu dir." }]} size={110} />
      <Card style={{ position: "absolute", top: 560, left: GUTTER + 20, right: GUTTER + 20, padding: 40, display: "flex", alignItems: "center", gap: 28, ...floatIn(frame, 2) }}>
        <div style={{ width: 150, height: 150, borderRadius: 16, overflow: "hidden", flexShrink: 0 }}>
          <Photo photo="flask" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <span style={{ fontSize: 36, fontWeight: 900 }}>Unser neues Parfüm</span>
          <span style={{ fontSize: 28, color: colors.graphite, display: "flex", alignItems: "center", gap: 10 }}>
            300 € · <IoLogoInstagram size={28} /> 1 Reel
          </span>
          <Tag dark style={{ alignSelf: "flex-start", ...focusIn(ease(frame, 16), 26) }}>
            Veröffentlicht
          </Tag>
        </div>
      </Card>
      <div style={{ position: "absolute", top: 900, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 24 }}>
        {PUSHES.map((p) => {
          const e = ease(frame, p.at, { damping: 16, stiffness: 140 });
          return <Push key={p.name} text={`${p.name} interessiert sich für „Unser neues Parfüm“`} style={{ opacity: Math.min(1, e * 2), transform: `translateY(${(1 - e) * -160}px) scale(${mix(e, 0.92, 1)})` }} />;
        })}
      </div>
      <Sample />
      <Sfx name="pop" at={16} volume={0.4} />
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

const APPROVE = 92;

export const AB3Mech: React.FC = () => {
  const frame = useFrame();
  const press = pressAt(frame, APPROVE);
  const approved = frame >= APPROVE;
  const cursorX = path(frame, [66, 84, APPROVE + 12], [940, 560, 760]);
  const cursorY = path(frame, [66, 84, APPROVE + 12], [1700, 1390, 1560]);
  return (
    <Stage>
      <Title parts={["Ausgezahlt wird", { mark: "nach deinem Okay." }]} />
      <Card style={{ position: "absolute", top: 640, left: GUTTER + 20, right: GUTTER + 20, padding: 56, display: "flex", flexDirection: "column", gap: 40, ...floatIn(frame, 2) }}>
        <div>
          <StatusStep label="Bezahlt · zurückgehalten" sub="300 € liegen bereit" p={pop(frame, 10)} icon={<IoLockClosed size={34} />} line={ramp(frame, 30, 44)} />
          <StatusStep label="Post ist online" sub="Link kommt im Chat" p={pop(frame, 44)} icon={<IoLink size={36} />} line={approved ? ramp(frame, APPROVE + 4, APPROVE + 14) : 0} />
          <StatusStep label={approved ? "Ausgezahlt" : "Wartet auf dich"} p={approved ? pop(frame, APPROVE + 12) : 0} current />
        </div>
        <div
          style={{
            alignSelf: "stretch",
            padding: "30px 0",
            borderRadius: 999,
            textAlign: "center",
            fontSize: 42,
            fontWeight: 900,
            backgroundColor: approved ? colors.fog : colors.ink,
            color: approved ? colors.graphite : colors.paper,
            transform: `scale(${1 - press * 0.04})`,
            ...floatIn(frame, 56, 30),
          }}
        >
          {approved ? "Freigegeben" : "Freigeben"}
        </div>
      </Card>
      <Cursor x={cursorX} y={cursorY} pressed={press} opacity={ramp(frame, 64, 70) * (1 - ramp(frame, APPROVE + 10, APPROVE + 16))} />
      <Sample />
      <Sfx name="lock" at={14} volume={0.7} />
      <Sfx name="pop" at={44} volume={0.4} />
      <Sfx name="click" at={APPROVE} volume={0.7} />
      <Sfx name="success" at={APPROVE + 12} volume={0.6} />
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// AB4 · Retainers

const RETAINER = [
  { label: "Setup-Gebühr", value: "490 €", at: 12 },
  { label: "Monatspauschale", value: "1.500 €", at: 28 },
  { label: "Mindestlaufzeit", value: "6 Monate", at: 44 },
];

export const AB4Pain: React.FC = () => {
  const frame = useFrame();
  const total = 9490 * ramp(frame, 62, 100);
  return (
    <Stage>
      <Title parts={["Monatliche Retainer?", { mark: "Für ein paar Posts?" }]} size={92} start={-6} />
      <Card style={{ position: "absolute", top: 640, left: GUTTER + 20, right: GUTTER + 20, padding: 56, display: "flex", flexDirection: "column", gap: 36, ...floatIn(frame, 0) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 42, fontWeight: 900 }}>Agentur-Angebot</span>
          <Tag>Beispielrechnung</Tag>
        </div>
        {RETAINER.map((r) => (
          <Line key={r.label} label={r.label} value={r.value} style={floatIn(frame, r.at, 30)} />
        ))}
        <div style={{ height: 3, backgroundColor: colors.ink, transformOrigin: "left", transform: `scaleX(${ramp(frame, 56, 66)})` }} />
        <div style={{ display: "flex", flexDirection: "column", ...floatIn(frame, 60, 30) }}>
          <span style={{ fontSize: 36, color: colors.graphite }}>Gesamt, bevor ein Post live ist</span>
          <span style={{ fontSize: 140, fontWeight: 900, letterSpacing: -5, lineHeight: 1.05, fontVariantNumeric: "tabular-nums" }}>{thousands(total)} €</span>
        </div>
      </Card>
      {RETAINER.map((r) => (
        <Sfx key={r.label} name="pop-low" at={r.at} volume={0.35} />
      ))}
      <SfxRepeat name="tick" from={62} to={100} every={3} volume={0.16} />
      <Sfx name="hit" at={100} volume={0.3} />
    </Stage>
  );
};

const FEES = [
  { big: "0 €", label: "Grundgebühr", at: 6 },
  { big: "10 %", label: "pro Deal", at: 34 },
  { big: "3 %", label: "mit Pro", at: 62 },
];

export const AB4Mech: React.FC = () => {
  const frame = useFrame();
  return (
    <Stage>
      <Title parts={["Keine", { mark: "Grundgebühr." }]} size={120} />
      <div style={{ position: "absolute", top: 600, left: GUTTER + 20, right: GUTTER + 20, display: "flex", flexDirection: "column", gap: 34 }}>
        {FEES.map((fee, i) => {
          const last = i === FEES.length - 1;
          return (
            <Card
              key={fee.label}
              style={{
                padding: "40px 56px",
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                backgroundColor: last ? colors.ink : colors.paper,
                color: last ? colors.paper : colors.ink,
                ...floatIn(frame, fee.at, 80),
              }}
            >
              <span style={{ fontSize: 150, fontWeight: 900, letterSpacing: -6, lineHeight: 1 }}>{fee.big}</span>
              <span style={{ fontSize: 42, fontWeight: 700, color: last ? colors.stone : colors.graphite }}>{fee.label}</span>
            </Card>
          );
        })}
      </div>
      {FEES.map((fee) => (
        <Sfx key={fee.label} name="pop" at={fee.at} volume={0.4} />
      ))}
    </Stage>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// AB5 · No content team

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

export const AB5Pain: React.FC = () => {
  const frame = useFrame();
  const cursorX = path(frame, [20, 50, 80, 110], [300, 640, 420, 760]);
  const cursorY = path(frame, [20, 50, 80, 110], [900, 1020, 1140, 1240]);
  return (
    <Stage>
      <Title parts={["Kein", { mark: "Content-Team?" }]} size={120} start={-6} />
      <Card style={{ position: "absolute", top: 600, left: GUTTER + 20, right: GUTTER + 20, padding: 48, display: "flex", flexDirection: "column", gap: 30, ...floatIn(frame, 0) }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 42, fontWeight: 900 }}>Content-Plan · Oktober</span>
          <Tag>0 Posts</Tag>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: "center", fontSize: 24, color: colors.graphite }}>
              {d}
            </div>
          ))}
          {Array.from({ length: 28 }, (_, i) => (
            <div key={i} style={{ height: 110, borderRadius: 12, border: `2px dashed ${colors.line}`, padding: 10, fontSize: 22, color: colors.stone, ...focusIn(ramp(frame, 6 + i * 1.2, 16 + i * 1.2), 20) }}>
              {i + 1}
            </div>
          ))}
        </div>
      </Card>
      <Cursor x={cursorX} y={cursorY} opacity={ramp(frame, 18, 24) * 0.9} />
    </Stage>
  );
};

const TITLE = "Unser neues Parfüm, erste Eindrücke";
const PUBLISH = 100;

export const AB5Mech: React.FC = () => {
  const frame = useFrame();
  const typed = Math.floor(TITLE.length * ramp(frame, 12, 44, Easing.linear));
  const budget = frame >= 54;
  const platform = frame >= 70;
  const press = pressAt(frame, PUBLISH);
  const cursorX = path(frame, [76, 94, PUBLISH + 12], [940, 560, 760]);
  const cursorY = path(frame, [76, 94, PUBLISH + 12], [1700, 1420, 1560]);
  const field = (label: string, content: React.ReactNode, active: boolean) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <span style={{ fontSize: 26, fontWeight: 700, color: colors.graphite }}>{label}</span>
      <div style={{ padding: "20px 26px", borderRadius: 14, border: `2px solid ${active ? colors.ink : colors.line}`, fontSize: 34, minHeight: 44 }}>{content}</div>
    </div>
  );
  return (
    <Stage>
      <Title parts={["Anfrage in", { mark: "einer Minute." }]} size={110} />
      <Card style={{ position: "absolute", top: 560, left: GUTTER + 20, right: GUTTER + 20, padding: 48, display: "flex", flexDirection: "column", gap: 30, ...floatIn(frame, 2) }}>
        <span style={{ fontSize: 42, fontWeight: 900 }}>Neue Anfrage</span>
        {field("Titel", <>{TITLE.slice(0, typed)}<span style={{ opacity: frame < 50 && Math.floor(frame / 8) % 2 === 0 ? 1 : 0 }}>|</span></>, frame >= 10 && frame < 50)}
        {field("Budget", budget ? "300 €" : "", frame >= 50 && frame < 66)}
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Instagram", icon: <IoLogoInstagram size={30} /> },
            { label: "TikTok", icon: <IoLogoTiktok size={30} /> },
          ].map((p, i) => {
            const on = platform && i === 0;
            return (
              <span key={p.label} style={{ display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 28px", borderRadius: 999, fontSize: 30, fontWeight: 700, backgroundColor: on ? colors.ink : colors.fog, color: on ? colors.paper : colors.ink }}>
                {p.icon} {p.label}
              </span>
            );
          })}
        </div>
        <div style={{ padding: "28px 0", borderRadius: 999, textAlign: "center", fontSize: 40, fontWeight: 900, backgroundColor: colors.ink, color: colors.paper, transform: `scale(${1 - press * 0.04})` }}>Veröffentlichen</div>
      </Card>
      <div style={{ position: "absolute", top: 1560, left: 0, right: 0, display: "flex", justifyContent: "center", ...focusIn(ease(frame, PUBLISH + 6), 30) }}>
        <Toast>
          <Check p={1} size={40} dark /> Anfrage veröffentlicht
        </Toast>
      </div>
      <Cursor x={cursorX} y={cursorY} pressed={press} opacity={ramp(frame, 74, 80) * (1 - ramp(frame, PUBLISH + 10, PUBLISH + 16))} />
      <Sample />
      <SfxRepeat name="click" from={12} to={44} every={3} volume={0.18} />
      <Sfx name="pop" at={54} volume={0.35} />
      <Sfx name="pop" at={70} volume={0.35} />
      <Sfx name="click" at={PUBLISH} volume={0.7} />
      <Sfx name="success" at={PUBLISH + 6} volume={0.6} />
    </Stage>
  );
};

