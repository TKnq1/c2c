import type { CSSProperties, ReactNode } from "react";
import { Easing } from "remotion";
import { useFrame } from "../frame";
import { IoCheckmark, IoLink, IoLockClosed, IoLogoInstagram, IoLogoTiktok, IoPaperPlane, IoStar } from "react-icons/io5";
import { browserIn, ease, enterUp, mix, path, pop, popIn, ramp } from "../anim";
import { Sfx, SfxRepeat } from "../audio";
import { Cursor, pressAt } from "../components/shared-scenes";
import { Avatar, BrowserWindow, DealCard, Logo, Photo, SampleNote, SceneHeader, Stage, Toast } from "../components/ui";
import { colors, GUTTER, type PhotoKey } from "../theme";

// Text typed in between two frames, with a blinking caret while the field is active.
function typed(text: string, frame: number, from: number, to: number) {
  return text.slice(0, Math.floor(text.length * ramp(frame, from, to, Easing.linear)));
}

const Field: React.FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
    <div style={{ fontSize: 24, fontWeight: 700, color: colors.graphite }}>{label}</div>
    {children}
  </div>
);

const Input: React.FC<{ children: ReactNode; active?: boolean; caret?: boolean }> = ({ children, active, caret }) => (
  <div
    style={{
      padding: "18px 24px",
      minHeight: 76,
      borderRadius: 8,
      border: `${active ? 3 : 2}px solid ${active ? colors.ink : colors.line}`,
      fontSize: 30,
      display: "flex",
      alignItems: "center",
    }}
  >
    <span>
      {children}
      {caret && <span style={{ display: "inline-block", width: 3, height: 34, marginLeft: 2, verticalAlign: "middle", backgroundColor: colors.ink }} />}
    </span>
  </div>
);

const Pill: React.FC<{ on?: boolean; press?: number; children: ReactNode }> = ({ on, press = 0, children }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      padding: "14px 24px",
      borderRadius: 999,
      fontSize: 26,
      fontWeight: 700,
      backgroundColor: on ? colors.ink : colors.paper,
      color: on ? colors.paper : colors.ink,
      border: `2px solid ${on ? colors.ink : colors.line}`,
      transform: `scale(${1 - press * 0.08})`,
    }}
  >
    {children}
  </span>
);

const TITLE = "Unser neues Parfüm, erste Eindrücke";
const PHOTO_PICK = 56;
const PLATFORM_PICK = 78;
const PUBLISHED = 124;

// Field typing windows: [from, to].
const TYPE_TITLE = [18, 50] as const;
const TYPE_BUDGET = [62, 70] as const;
const TYPE_CONTENT = [86, 98] as const;

export const B05Request: React.FC = () => {
  const frame = useFrame();
  const blink = Math.floor(frame / 8) % 2 === 0;
  const between = (range: readonly [number, number]) => frame >= range[0] - 2 && frame <= range[1] + 2;
  const title = typed(TITLE, frame, ...TYPE_TITLE);
  const budget = typed("300", frame, ...TYPE_BUDGET);
  const content = typed("1 Reel", frame, ...TYPE_CONTENT);
  const preview = ease(frame, PHOTO_PICK, { stiffness: 110 });
  const toast = pop(frame, PUBLISHED);

  return (
    <Stage>
      <SceneHeader parts={["Anfrage in", { mark: "einer Minute." }]} size={110} start={0} />
      <BrowserWindow height={1180} style={browserIn(frame, 520)}>
        <div style={{ padding: "40px 44px", display: "flex", flexDirection: "column", gap: 26, width: 500 }}>
          <div style={{ fontSize: 40, fontWeight: 900 }}>Neue Anfrage</div>
          <Field label="Titel">
            <Input active={between(TYPE_TITLE)} caret={between(TYPE_TITLE) && blink}>
              {title}
            </Input>
          </Field>
          <Field label="Foto">
            <div style={{ display: "flex", gap: 12 }}>
              {(["flask", "lotion", "cream"] as PhotoKey[]).map((p, i) => (
                <div
                  key={p}
                  style={{
                    width: 110,
                    height: 140,
                    borderRadius: 8,
                    overflow: "hidden",
                    outline: i === 0 && frame >= PHOTO_PICK ? `4px solid ${colors.ink}` : undefined,
                    outlineOffset: 3,
                    transform: `scale(${1 - (i === 0 ? pressAt(frame, PHOTO_PICK) : 0) * 0.08})`,
                  }}
                >
                  <Photo photo={p} />
                </div>
              ))}
            </div>
          </Field>
          <Field label="Budget">
            <Input active={between(TYPE_BUDGET)} caret={between(TYPE_BUDGET) && blink}>
              <b>{budget ? `${budget} €` : ""}</b>
            </Input>
          </Field>
          <Field label="Plattform">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <Pill on={frame >= PLATFORM_PICK} press={pressAt(frame, PLATFORM_PICK)}>
                <IoLogoInstagram size={28} /> Instagram
              </Pill>
              <Pill>
                <IoLogoTiktok size={26} /> TikTok
              </Pill>
            </div>
          </Field>
          <Field label="Inhalt">
            <Input active={between(TYPE_CONTENT)} caret={between(TYPE_CONTENT) && blink}>
              {content}
            </Input>
          </Field>
        </div>
        <div style={{ position: "absolute", top: 200, right: 30, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, ...enterUp(preview, 80) }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: colors.graphite, textTransform: "uppercase", letterSpacing: 2 }}>Das sehen Creator</div>
          <DealCard
            deal={{
              company: "Deine Marke",
              title,
              photo: "flask",
              budget: `${budget || "0"} €`,
              platform: "Instagram",
              deliverables: content || "…",
              productIncluded: true,
              rating: ["5,0", 1],
            }}
            width={340}
            height={500}
            style={{ transform: `rotate(${4 + Math.sin(frame / 20) * 0.6}deg)` }}
          />
        </div>
        <Toast
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: `translateX(-50%) scale(${mix(toast, 0.6, 1)})`,
            opacity: Math.min(1, toast * 2),
            whiteSpace: "nowrap",
          }}
        >
          <IoCheckmark size={32} /> Anfrage veröffentlicht.
        </Toast>
      </BrowserWindow>
      <SampleNote />
      <SfxRepeat name="tick" from={TYPE_TITLE[0]} to={TYPE_TITLE[1]} every={2} volume={0.26} />
      <Sfx name="click" at={PHOTO_PICK} volume={0.65} />
      <SfxRepeat name="tick" from={TYPE_BUDGET[0]} to={TYPE_BUDGET[1]} every={3} volume={0.26} />
      <Sfx name="click" at={PLATFORM_PICK} volume={0.65} />
      <SfxRepeat name="tick" from={TYPE_CONTENT[0]} to={TYPE_CONTENT[1]} every={2} volume={0.26} />
      <Sfx name="like" at={PUBLISHED} volume={0.7} />
    </Stage>
  );
};

const Push: React.FC<{ name: string; style?: CSSProperties }> = ({ name, style }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 22,
      padding: "24px 28px",
      borderRadius: 28,
      backgroundColor: "rgba(255,255,255,0.96)",
      boxShadow: "0 24px 60px rgba(7,7,7,0.18), 0 0 0 2px rgba(7,7,7,0.05)",
      ...style,
    }}
  >
    <div style={{ width: 84, height: 84, borderRadius: 20, backgroundColor: colors.paper, border: `2px solid ${colors.line}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Logo size={44} wordmark={false} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: colors.graphite }}>
        <span style={{ fontWeight: 700, color: colors.ink }}>comtor</span>
        <span>jetzt</span>
      </div>
      <div style={{ fontSize: 28, lineHeight: 1.3 }}>{name} interessiert sich für „Unser neues Parfüm“</div>
    </div>
  </div>
);

const CREATORS = [
  { name: "Lena", niche: "Beauty", reach: "48.000", rating: "4,9", push: 14, row: 70 },
  { name: "Mia", niche: "Beauty · Fitness", reach: "62.000", rating: "4,8", push: 28, row: 78 },
  { name: "Jonas", niche: "Lifestyle", reach: "21.000", rating: "5,0", push: 42, row: 86 },
];

export const B06Creators: React.FC = () => {
  const frame = useFrame();
  return (
    <Stage>
      <SceneHeader parts={["Passende Creator", { mark: "kommen zu dir." }]} size={100} start={0} />
      <BrowserWindow height={720} style={browserIn(frame, 1060, 54)}>
        <div style={{ padding: "36px 44px", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 16 }}>Interessierte Creator</div>
          {CREATORS.map((c) => (
            <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 24, padding: "22px 0", borderBottom: `2px solid ${colors.fog}`, ...enterUp(ease(frame, c.row), 40) }}>
              <Avatar name={c.name} size={88} />
              <div>
                <div style={{ fontSize: 34, fontWeight: 700 }}>{c.name}</div>
                <div style={{ fontSize: 26, color: colors.graphite }}>
                  {c.niche} · {c.reach} Follower
                </div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, fontSize: 28, fontWeight: 700, ...popIn(pop(frame, c.row + 8), 0.4) }}>
                <IoStar size={28} color="#fbbf24" /> {c.rating}
              </div>
            </div>
          ))}
        </div>
      </BrowserWindow>
      <div style={{ position: "absolute", top: 440, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", gap: 20 }}>
        {CREATORS.map((c, i) => {
          const p = ease(frame, c.push, { damping: 16, stiffness: 140 });
          return <Push key={c.name} name={c.name} style={{ opacity: Math.min(1, p * 2) * [1, 0.75, 0.5][i], transform: `translateY(${(1 - p) * -260}px) scale(${mix(p, 0.9, 1)})` }} />;
        })}
      </div>
      <SampleNote />
      {CREATORS.map((c) => (
        <Sfx key={c.name} name="ding" at={c.push} volume={0.5} />
      ))}
      {CREATORS.map((c) => (
        <Sfx key={`${c.name}-row`} name="pop-low" at={c.row} volume={0.3} />
      ))}
    </Stage>
  );
};

const FLOW = [
  { icon: <IoPaperPlane size={40} />, title: "Angebot senden", sub: "300 € · 1 Reel", at: 10 },
  { icon: <IoLockClosed size={40} />, title: "Zahlen", sub: "Das Geld wird zurückgehalten", at: 26 },
  { icon: <IoLink size={42} />, title: "Post ist online", sub: "Link kommt im Chat", at: 42 },
  { icon: <IoCheckmark size={46} />, title: "Freigeben", sub: "Erst dann wird ausgezahlt", at: 58 },
];
const APPROVE = 78;

export const B07Safe: React.FC = () => {
  const frame = useFrame();
  // Pointer onto the last card (about 1390 px down the frame), click, away.
  const cursorX = path(frame, [62, 74, 84, 96], [900, 600, 600, 760]);
  const cursorY = path(frame, [62, 74, 84, 96], [1700, 1400, 1400, 1560]);

  return (
    <Stage>
      <SceneHeader parts={["Ausgezahlt wird erst,", { mark: "wenn der Post online ist." }]} size={88} start={0} />
      <div style={{ position: "absolute", top: 680, left: GUTTER, right: GUTTER, display: "flex", flexDirection: "column", alignItems: "stretch" }}>
        {FLOW.map((step, i) => {
          const last = i === FLOW.length - 1;
          const final = last && frame >= APPROVE;
          const press = last ? pressAt(frame, APPROVE) : 0;
          // The check bounces once more when the post gets approved.
          const bounce = last ? Math.max(0, 1 - Math.abs(frame - APPROVE - 4) / 6) : 0;
          const enter = enterUp(ease(frame, step.at), 60);
          return (
            <div key={step.title} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 30,
                  padding: "34px 40px",
                  borderRadius: 16,
                  backgroundColor: final ? colors.ink : colors.paper,
                  color: final ? colors.paper : colors.ink,
                  boxShadow: final ? "0 30px 70px rgba(7,7,7,0.3)" : "0 0 0 2px rgba(7,7,7,0.1)",
                  opacity: enter.opacity,
                  transform: `${enter.transform} scale(${1 - press * 0.04})`,
                }}
              >
                <div
                  style={{
                    width: 96,
                    height: 96,
                    borderRadius: 999,
                    flexShrink: 0,
                    backgroundColor: final ? colors.paper : colors.ink,
                    color: final ? colors.ink : colors.paper,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ display: "flex", transform: `scale(${pop(frame, step.at + 4) * (1 + 0.3 * bounce)})` }}>{step.icon}</span>
                </div>
                <div>
                  <div style={{ fontSize: 44, fontWeight: 900 }}>{step.title}</div>
                  <div style={{ fontSize: 30, color: final ? colors.stone : colors.graphite }}>{step.sub}</div>
                </div>
              </div>
              {i < FLOW.length - 1 && (
                <div style={{ width: 4, height: 44, backgroundColor: colors.stone, transformOrigin: "top", transform: `scaleY(${ramp(frame, step.at + 8, FLOW[i + 1].at)})` }} />
              )}
            </div>
          );
        })}
      </div>
      <Cursor x={cursorX} y={cursorY} pressed={pressAt(frame, APPROVE)} opacity={ramp(frame, 60, 66) * (1 - ramp(frame, 92, 100))} />
      <SampleNote />
      <Sfx name="pop" at={FLOW[0].at} volume={0.45} />
      <Sfx name="lock" at={FLOW[1].at + 4} volume={0.75} />
      <Sfx name="pop" at={FLOW[2].at} volume={0.45} />
      <Sfx name="pop" at={FLOW[3].at} volume={0.45} />
      <Sfx name="click" at={APPROVE} volume={0.7} />
      <Sfx name="like" at={APPROVE + 2} volume={0.65} />
    </Stage>
  );
};
