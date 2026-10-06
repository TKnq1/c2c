import type { CSSProperties, ReactNode } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import {
  IoAirplane,
  IoArrowForward,
  IoBarbell,
  IoCheckmark,
  IoCheckmarkCircle,
  IoClose,
  IoHardwareChip,
  IoHeart,
  IoLink,
  IoLockClosed,
  IoLogoInstagram,
  IoLogoTiktok,
  IoRestaurant,
  IoShirt,
  IoSparkles,
} from "react-icons/io5";
import { ease, enterUp, mix, pop, popIn, ramp, thousands } from "../anim";
import { Cursor, pressAt } from "../components/shared-scenes";
import { Avatar, BrowserWindow, Bubble, type Deal, DealCard, KIEZ_GOODS, ODD_BLOOM, Photo, SampleNote, SceneHeader, Stage, Toast } from "../components/ui";
import { colors, GUTTER } from "../theme";

// The browser window rising into place from below the frame.
function browserIn(frame: number, top: number, delay = 8): CSSProperties {
  return { position: "absolute", top, left: GUTTER, transform: `translateY(${(1 - ease(frame, delay, { stiffness: 80 })) * 1300}px)` };
}

// Interpolate with clamping and a soft in-out curve, for pointer paths.
function path(frame: number, frames: number[], values: number[]) {
  return interpolate(frame, frames, values, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
}

const NICHES = [
  { label: "Beauty", icon: IoSparkles, click: 48 },
  { label: "Fitness", icon: IoBarbell, click: 64 },
  { label: "Food", icon: IoRestaurant },
  { label: "Fashion", icon: IoShirt },
  { label: "Tech", icon: IoHardwareChip },
  { label: "Reisen", icon: IoAirplane },
];

const PLATFORMS = [
  { icon: IoLogoInstagram, name: "Instagram", count: 50000, delay: 80 },
  { icon: IoLogoTiktok, name: "TikTok", count: 12000, delay: 90 },
];

export const C05Profile: React.FC = () => {
  const frame = useCurrentFrame();
  const cursorX = path(frame, [34, 46, 58, 82], [700, 182, 468, 760]);
  const cursorY = path(frame, [34, 46, 58, 82], [760, 235, 235, 660]);
  const cursorOpacity = ramp(frame, 32, 38) * (1 - ramp(frame, 80, 90));

  return (
    <Stage>
      <SceneHeader step={{ n: 1, label: "Profil anlegen" }} parts={["Nische wählen,", { mark: "Plattformen" }, "verbinden."]} start={0} />
      <BrowserWindow height={1080} style={browserIn(frame, 700)}>
        <div style={{ padding: "44px 48px", display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ display: "flex", gap: 10 }}>
            {[1, ramp(frame, 40, 56), 0, 0].map((fill, i) => (
              <div key={i} style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.fog, overflow: "hidden" }}>
                <div style={{ width: `${fill * 100}%`, height: "100%", backgroundColor: colors.ink }} />
              </div>
            ))}
          </div>
          <div style={{ fontSize: 44, fontWeight: 900 }}>Was ist deine Nische?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {NICHES.map(({ label, icon: Icon, click }) => {
              const on = click !== undefined && frame >= click;
              const press = click === undefined ? 0 : pressAt(frame, click);
              return (
                <div
                  key={label}
                  style={{
                    height: 140,
                    borderRadius: 8,
                    border: `2px solid ${on ? colors.ink : colors.line}`,
                    backgroundColor: on ? colors.ink : colors.paper,
                    color: on ? colors.paper : colors.ink,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    fontSize: 30,
                    fontWeight: 700,
                    transform: `scale(${1 - press * 0.06})`,
                  }}
                >
                  <Icon size={44} />
                  {label}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 44, fontWeight: 900, marginTop: 10, ...enterUp(ease(frame, 74), 30) }}>Deine Plattformen</div>
          {PLATFORMS.map(({ icon: Icon, name, count, delay }) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "22px 26px",
                borderRadius: 8,
                border: `2px solid ${colors.line}`,
                fontSize: 32,
                ...enterUp(ease(frame, delay), 40),
              }}
            >
              <Icon size={44} />
              <span style={{ fontWeight: 700 }}>{name}</span>
              <span style={{ marginLeft: "auto", color: colors.graphite }}>
                <b style={{ color: colors.ink }}>{thousands(count * ramp(frame, delay + 2, delay + 32))}</b> Follower
              </span>
            </div>
          ))}
        </div>
        <Cursor x={cursorX} y={cursorY} pressed={pressAt(frame, 48) + pressAt(frame, 64)} opacity={cursorOpacity} />
      </BrowserWindow>
      <SampleNote />
    </Stage>
  );
};

const LUMO_AUDIO: Deal = {
  company: "Lumo Audio",
  title: "Kopfhörer für unterwegs",
  photo: "headphones",
  budget: "300 €",
  platform: "Instagram",
  deliverables: "1 Reel",
  productIncluded: true,
  rating: ["4,7", 18],
};

const RoundButton: React.FC<{ children: ReactNode; filled?: boolean; press?: number }> = ({ children, filled, press = 0 }) => (
  <div
    style={{
      width: 120,
      height: 120,
      borderRadius: 999,
      backgroundColor: filled ? colors.ink : colors.paper,
      color: filled ? colors.paper : colors.ink,
      boxShadow: "0 16px 40px rgba(7,7,7,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transform: `scale(${1 - press * 0.12})`,
    }}
  >
    {children}
  </div>
);

// Card geometry inside the browser: the top card's resting place, and the one behind it.
const CARD = { left: 218, top: 140, width: 500, height: 700 };
const BEHIND = { dx: -28, dy: 10, rotate: -3, scale: 0.95 };

type CardPose = { dx: number; dy: number; rotate: number; scale: number; opacity?: number };

function poseStyle({ dx, dy, rotate, scale, opacity = 1 }: CardPose): CSSProperties {
  return { position: "absolute", left: CARD.left + dx, top: CARD.top + dy, transform: `rotate(${rotate}deg) scale(${scale})`, opacity };
}

function blend(p: number, a: CardPose, b: CardPose): CardPose {
  return { dx: mix(p, a.dx, b.dx), dy: mix(p, a.dy, b.dy), rotate: mix(p, a.rotate, b.rotate), scale: mix(p, a.scale, b.scale), opacity: mix(p, a.opacity ?? 1, b.opacity ?? 1) };
}

const TOP: CardPose = { dx: 0, dy: 0, rotate: 0, scale: 1 };
const HIDDEN: CardPose = { ...BEHIND, scale: 0.9, opacity: 0 };

export const C06Swipe: React.FC = () => {
  const frame = useCurrentFrame();

  // Lumo Audio: dragged left, then thrown out.
  const lumoDrag = ramp(frame, 40, 58, Easing.inOut(Easing.quad));
  const lumoThrow = ramp(frame, 58, 72, Easing.in(Easing.quad));
  const lumo: CardPose = { dx: -120 * lumoDrag - 1000 * lumoThrow, dy: 0, rotate: -6 * lumoDrag - 20 * lumoThrow, scale: 1 };

  // Odd Bloom: moves up to the top, gets dragged right and held, then thrown out.
  const bloomUp = ease(frame, 58);
  const bloomDrag = ramp(frame, 100, 140, Easing.inOut(Easing.quad));
  const bloomThrow = ramp(frame, 178, 194, Easing.in(Easing.quad));
  const bloomBase = blend(bloomUp, BEHIND, TOP);
  const bloom: CardPose = { ...bloomBase, dx: bloomBase.dx + 82 * bloomDrag + 1000 * bloomThrow, rotate: bloomBase.rotate + 10 * bloomDrag + 18 * bloomThrow };

  // Kiez Goods: hidden, then behind, then on top.
  const kiez = blend(ease(frame, 180), blend(ease(frame, 60), HIDDEN, BEHIND), TOP);

  const toast = pop(frame, 146);
  const cardCenterX = CARD.left + CARD.width / 2;
  const cursorX = path(frame, [30, 38, 40, 58, 66, 90, 98, 100, 140, 160], [760, cardCenterX, cardCenterX, cardCenterX - 120, cardCenterX - 80, cardCenterX, cardCenterX, cardCenterX, cardCenterX + 82, cardCenterX + 200]);
  const cursorY = path(frame, [30, 38, 140, 160], [880, 520, 520, 600]);
  const grabbing = (frame >= 38 && frame < 58) || (frame >= 98 && frame < 142) ? 1 : 0;

  return (
    <Stage>
      <SceneHeader step={{ n: 2, label: "Deals wischen" }} parts={["Das Budget steht", { mark: "auf der Karte." }]} start={0} />
      <BrowserWindow height={1100} style={browserIn(frame, 680)}>
        {(["headphones", "serum", "matcha"] as const).map((photo, i) => {
          const opacity = i === 0 ? 1 - ramp(frame, 56, 72) : i === 1 ? ramp(frame, 56, 72) * (1 - ramp(frame, 180, 196)) : ramp(frame, 180, 196);
          return (
            <Photo
              key={photo}
              photo={photo}
              style={{ position: "absolute", inset: -80, width: "calc(100% + 160px)", height: "calc(100% + 160px)", filter: "blur(70px) saturate(1.2)", opacity: opacity * 0.55 }}
            />
          );
        })}
        <DealCard deal={KIEZ_GOODS} width={CARD.width} height={CARD.height} style={poseStyle(kiez)} />
        <DealCard deal={ODD_BLOOM} width={CARD.width} height={CARD.height} style={poseStyle(bloom)} />
        <DealCard deal={LUMO_AUDIO} width={CARD.width} height={CARD.height} style={poseStyle(lumo)} />
        <Toast style={{ position: "absolute", top: 34, left: "50%", transform: `translateX(-50%) scale(${mix(toast, 0.6, 1)})`, opacity: Math.min(1, toast * 2), whiteSpace: "nowrap", zIndex: 10 }}>
          <IoHeart size={30} /> Interesse an Odd Bloom gesendet.
        </Toast>
        <div style={{ position: "absolute", bottom: 40, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 60 }}>
          <RoundButton press={pressAt(frame, 56)}>
            <IoClose size={60} />
          </RoundButton>
          <RoundButton filled press={pressAt(frame, 140)}>
            <IoHeart size={56} />
          </RoundButton>
        </div>
        <div style={{ position: "absolute", top: 480, right: 30, opacity: 0.8 * ramp(frame, 100, 120) * (1 - ramp(frame, 176, 184)), transform: `translateX(${Math.sin(frame / 5) * 8}px)` }}>
          <IoArrowForward size={90} />
        </div>
        <Cursor x={cursorX} y={cursorY} pressed={grabbing} opacity={ramp(frame, 28, 34) * (1 - ramp(frame, 156, 166))} />
      </BrowserWindow>
      <SampleNote />
    </Stage>
  );
};

const TypingDots: React.FC<{ frame: number }> = ({ frame }) => (
  <Bubble mine style={{ display: "flex", gap: 10, padding: "28px 30px" }}>
    {[0, 1, 2].map((i) => (
      <span key={i} style={{ width: 14, height: 14, borderRadius: 999, backgroundColor: colors.paper, opacity: 0.4 + 0.6 * Math.max(0, Math.sin((frame - i * 4) / 4)) }} />
    ))}
  </Bubble>
);

export const C07Chat: React.FC = () => {
  const frame = useCurrentFrame();
  const bubble = (delay: number): CSSProperties => ({ alignSelf: "flex-start", maxWidth: "78%", transformOrigin: "left bottom", ...popIn(pop(frame, delay), 0.7) });
  const stamp = pop(frame, 118);

  return (
    <Stage>
      <SceneHeader step={{ n: 3, label: "Angebot annehmen" }} parts={["Absprache", { mark: "direkt im Chat." }]} start={0} />
      <BrowserWindow height={1100} style={browserIn(frame, 680)}>
        <div style={{ display: "flex", alignItems: "center", gap: 20, padding: "26px 40px", borderBottom: `2px solid ${colors.line}` }}>
          <Avatar name="Odd Bloom" size={72} />
          <div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>Odd Bloom</div>
            <div style={{ fontSize: 24, color: colors.graphite }}>Serum-Launch, erste Eindrücke</div>
          </div>
        </div>
        <div style={{ padding: "36px 40px", display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={bubble(28)}>
            <Bubble style={{ maxWidth: "none" }}>Hey Mia, wir lieben deinen Content!</Bubble>
          </div>
          <div style={bubble(46)}>
            <Bubble style={{ maxWidth: "none" }}>Ein TikTok für 250 €?</Bubble>
          </div>
          <div style={{ alignSelf: "flex-end", transformOrigin: "right bottom", ...popIn(pop(frame, frame < 80 ? 60 : 80), 0.7) }}>
            {frame < 80 ? <TypingDots frame={frame} /> : <Bubble mine style={{ maxWidth: "none", whiteSpace: "nowrap" }}>Deal! 🙌</Bubble>}
          </div>
          <div
            style={{
              alignSelf: "center",
              width: "88%",
              marginTop: 50,
              borderRadius: 12,
              border: `2px solid ${colors.line}`,
              padding: "34px 40px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              position: "relative",
              boxShadow: "0 20px 50px rgba(7,7,7,0.1)",
              ...enterUp(ease(frame, 98), 80),
            }}
          >
            <div style={{ fontSize: 26, color: colors.graphite, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>Angebot</div>
            <div style={{ fontSize: 76, fontWeight: 900 }}>250,00 €</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 30, color: colors.graphite }}>
              <IoLogoTiktok size={30} /> TikTok · 1 Video
            </div>
            <Toast style={{ position: "absolute", right: -26, top: -30, fontSize: 30, opacity: Math.min(1, stamp * 3), transform: `rotate(6deg) scale(${mix(stamp, 1.8, 1)})` }}>
              <IoCheckmarkCircle size={36} /> Angebot angenommen
            </Toast>
          </div>
        </div>
      </BrowserWindow>
      <SampleNote />
    </Stage>
  );
};

// One step of the payment timeline. `done` and `active` are 0..1 so the dot can fill in.
const StatusRow: React.FC<{ label: string; done?: number; active?: number; icon?: ReactNode; line?: number; frame: number }> = ({
  label,
  done = 0,
  active = 0,
  icon,
  line,
  frame,
}) => {
  const lit = Math.max(done, active);
  return (
    <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            backgroundColor: lit > 0.5 ? colors.ink : colors.paper,
            border: `3px solid ${lit > 0.5 ? colors.ink : colors.stone}`,
            color: colors.paper,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: active > 0.5 ? `0 0 0 ${10 + Math.sin(frame / 6) * 4}px rgba(7,7,7,0.08)` : undefined,
          }}
        >
          <span style={{ transform: `scale(${lit})`, display: "flex" }}>{done > 0 ? <IoCheckmark size={38} /> : active > 0 ? icon : null}</span>
        </div>
        {line !== undefined && (
          <div style={{ width: 4, height: 70, backgroundColor: colors.fog, position: "relative" }}>
            <div style={{ position: "absolute", inset: 0, backgroundColor: colors.ink, transformOrigin: "top", transform: `scaleY(${line})` }} />
          </div>
        )}
      </div>
      <div style={{ fontSize: 38, fontWeight: active > 0.5 ? 900 : 400, color: lit > 0.5 ? colors.ink : colors.stone, paddingTop: 10 }}>{label}</div>
    </div>
  );
};

export const C08Paid: React.FC = () => {
  const frame = useCurrentFrame();
  const lock = pop(frame, 50);

  return (
    <Stage>
      <SceneHeader step={{ n: 4, label: "Bezahlt, bevor du postest" }} parts={["Die Marke", { mark: "zahlt zuerst." }]} sub="Das Geld wird zurückgehalten, bis dein Post online ist." start={0} />
      <BrowserWindow height={960} style={browserIn(frame, 820)}>
        <div style={{ padding: "40px 48px", display: "flex", flexDirection: "column", gap: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Avatar name="Odd Bloom" size={80} />
            <div>
              <div style={{ fontSize: 34, fontWeight: 700 }}>Odd Bloom</div>
              <div style={{ fontSize: 26, color: colors.graphite }}>TikTok · 1 Video</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontSize: 56, fontWeight: 900 }}>
              <span style={{ display: "flex", transform: `scale(${lock}) rotate(${(1 - lock) * -30}deg)`, opacity: Math.min(1, lock * 2) }}>
                <IoLockClosed size={44} />
              </span>
              250 €
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <StatusRow frame={frame} label="Angebot angenommen" done={pop(frame, 26)} line={ramp(frame, 32, 44)} />
            <StatusRow frame={frame} label="Bezahlt · zurückgehalten" active={pop(frame, 44)} icon={<IoLockClosed size={32} />} line={0} />
            <StatusRow frame={frame} label="Post online" line={0} />
            <StatusRow frame={frame} label="Ausgezahlt" />
          </div>
        </div>
      </BrowserWindow>
      <SampleNote />
    </Stage>
  );
};

const POST_LINK = "tiktok.com/@mia/video/7342…";

export const C09Post: React.FC = () => {
  const frame = useCurrentFrame();
  const typed = Math.floor(POST_LINK.length * ramp(frame, 26, 58, Easing.linear));
  const caret = frame < 62 && Math.floor(frame / 8) % 2 === 0;
  const submitted = frame >= 68;
  const check = pop(frame, 88);

  return (
    <Stage>
      <SceneHeader
        step={{ n: 5, label: "Posten & Link einreichen" }}
        parts={["Post online,", { mark: "Link rein." }]}
        sub="Die Marke hat 3 Tage zum Freigeben. Sonst geht die Zahlung trotzdem an dich."
        start={0}
      />
      <BrowserWindow height={900} style={browserIn(frame, 880)}>
        <div style={{ padding: "44px 48px", display: "flex", flexDirection: "column", gap: 30 }}>
          <div style={{ fontSize: 40, fontWeight: 900 }}>Link zu deinem Post</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "26px 28px", borderRadius: 8, border: `3px solid ${colors.ink}`, fontSize: 32, height: 96 }}>
            <IoLink size={38} />
            <span>{POST_LINK.slice(0, typed)}</span>
            {caret && <span style={{ width: 3, height: 40, backgroundColor: colors.ink, marginLeft: -14 }} />}
          </div>
          <div
            style={{
              padding: "26px 0",
              borderRadius: 999,
              backgroundColor: colors.ink,
              color: colors.paper,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              fontSize: 34,
              fontWeight: 700,
              transform: `scale(${1 - pressAt(frame, 66) * 0.05})`,
            }}
          >
            {submitted && <IoCheckmark size={38} />}
            {submitted ? "Post eingereicht" : "Link einreichen"}
          </div>
          <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 30, padding: "34px 36px", borderRadius: 12, backgroundColor: colors.fog, ...enterUp(ease(frame, 82), 60) }}>
            <span style={{ display: "flex", transform: `scale(${check})` }}>
              <IoCheckmarkCircle size={110} />
            </span>
            <div>
              <div style={{ fontSize: 46, fontWeight: 900 }}>Freigegeben</div>
              <div style={{ fontSize: 28, color: colors.graphite }}>Odd Bloom hat deinen Post geprüft.</div>
            </div>
          </div>
        </div>
      </BrowserWindow>
      <SampleNote />
    </Stage>
  );
};
