import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill } from "remotion";
import { RAW_AVATAR, RAW_HOODIE } from "../ads/brands";
import { focusIn } from "../ads/kit";
import { ease, mix, path, pop, ramp } from "../anim";
import { Cursor, pressAt } from "../components/shared-scenes";
import { Avatar, DealCard } from "../components/ui";
import { useFrame } from "../frame";
import { colors } from "../theme";
import {
  AppIcon,
  Backdrop,
  Caret,
  Center,
  DesktopApp,
  drift,
  fitScale,
  Ghost,
  glide,
  LightSweep,
  Mark,
  type Part,
  SampleTag,
  slam,
  slamStyle,
  SmearFilter,
  Tick,
} from "./kit";
import { CreatorFeed, DmThread, InvoiceSnippet, MailRow, MONO, NEW_REQUEST_TITLE, NewRequest, SheetSnippet, type SwipeState } from "./screens";

// The scenes of the launch video (LAUNCH.md), cut after the reference: nothing ever stands still. Type slams in and
// keeps drifting back, the camera pulls away as a line is typed, words spread apart before they leave, the app keeps
// turning in 3D, and some scenes leave by zooming into a word (the `exit` LaunchVideo plays). Each scene runs on its
// own clock from 0; `keyframe` is the frame its still shows.

// ---------------------------------------------------------------------------------------------------------------
// Helpers

// The caret is solid while typing and blinks while the line stands.
function caretOn(frame: number, idleFrom: number) {
  return frame < idleFrom || Math.floor((frame - idleFrom) / 14) % 2 === 0;
}

// Words that slam in one after another from `start`.
const SlamWords: React.FC<{ parts: Part[]; size: number; start: number; stagger?: number; from?: number; dark?: boolean; gap?: number; fade?: (i: number) => number }> = ({
  parts,
  size,
  start,
  stagger = 6,
  from = 1.8,
  dark,
  gap = 0.25,
  fade,
}) => {
  const frame = useFrame();
  const words = parts.flatMap((part) => part.text.split(" ").filter(Boolean).map((text) => ({ ...part, text })));
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * gap, fontSize: size, lineHeight: 1.08, letterSpacing: -size * 0.03 }}>
      {words.map((w, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            fontWeight: w.bold === false ? 400 : 900,
            color: w.soft ? (dark ? colors.graphite : colors.stone) : undefined,
            ...slamStyle(slam(frame, start + i * stagger), from, 26),
            ...(fade ? { opacity: Math.min(1, slam(frame, start + i * stagger) * 3) * fade(i) } : {}),
          }}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
};

// Words coming into focus one after another from `start`; `count` of them so far drives the camera fit.
// With `limit`, only the words that have started coming in take up room, so the line grows as it is written.
const FocusWords: React.FC<{ parts: Part[]; size: number; start: number; stagger?: number; dark?: boolean; spacing?: number; limit?: boolean; style?: CSSProperties }> = ({
  parts,
  size,
  start,
  stagger = 4,
  dark,
  spacing = 0,
  limit,
  style,
}) => {
  const frame = useFrame();
  const all = parts.flatMap((part) => part.text.split(" ").filter(Boolean).map((text) => ({ ...part, text })));
  const words = limit ? all.slice(0, Math.max(1, Math.floor((frame - start) / stagger) + 1)) : all;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * (0.25 + spacing), fontSize: size, lineHeight: 1.1, letterSpacing: -size * 0.03 + spacing * size * 0.1, ...style }}>
      {words.map((w, i) => (
        <span key={i} style={{ display: "inline-block", fontWeight: w.bold === false ? 400 : 900, color: w.soft ? (dark ? colors.graphite : colors.stone) : undefined, ...focusIn(ease(frame, start + i * stagger, { stiffness: 90 }), size) }}>
          {w.text}
        </span>
      ))}
    </div>
  );
};

// A ghost fading in after `delay`, out after `until`, drifting along (dx, dy) and scaling a little with the camera.
const Floating: React.FC<{ delay: number; until?: number; dx: number; dy: number; children: ReactNode }> = ({ delay, until = 9999, dx, dy, children }) => {
  const frame = useFrame();
  const opacity = ramp(frame, delay, delay + 20) * (1 - ramp(frame, until, until + 24));
  return <AbsoluteFill style={{ opacity, transform: `translate(${dx * frame * 0.35}px, ${dy * frame * 0.35}px)` }}>{children}</AbsoluteFill>;
};

// A line with a selected range [from, to), the selection drawn like the reference's highlighted word.
const Typed: React.FC<{ text: string; size: number; select?: [number, number]; caret: boolean; dark?: boolean }> = ({ text, size, select, caret, dark }) => {
  const [a, b] = select ?? [text.length, text.length];
  return (
    <div style={{ fontSize: size, letterSpacing: -size * 0.015, whiteSpace: "pre", display: "flex", alignItems: "center", lineHeight: 1.2 }}>
      <span>{text.slice(0, a)}</span>
      {b > a && <span style={{ backgroundColor: dark ? colors.paper : colors.ink, color: dark ? colors.ink : colors.paper, borderRadius: size * 0.06 }}>{text.slice(a, b)}</span>}
      <span>{text.slice(b)}</span>
      {b <= a && <Caret size={size} on={caret} />}
    </div>
  );
};

// ---------------------------------------------------------------------------------------------------------------
// 1 · Opening: a line typed, selected, deleted, the next one typed. The camera pulls back as each line grows, the UI
// floating behind it changes from DMs nobody answers to an invoice nobody pays.

const A = "40 Marken angeschrieben.";
const B = " Eine Antwort.";
const C = "Und wann kommt das Geld?";
const OPEN = { a: 8, b: 64, select: [104, 116], cut: 128, erase: 134, c: 166, selectC: [228, 236] } as const;

// What the line shows at a frame, and a selection on it.
function openingLine(frame: number): { text: string; select?: [number, number] } {
  if (frame < OPEN.b) return { text: A.slice(0, Math.max(0, Math.floor((frame - OPEN.a) / 2))) };
  if (frame < OPEN.select[0]) return { text: A + B.slice(0, Math.max(0, Math.floor((frame - OPEN.b) / 2))) };
  if (frame < OPEN.cut) {
    const len = Math.round((B.length - 1) * ramp(frame, OPEN.select[0], OPEN.select[1]));
    return { text: A + B, select: [A.length + B.length - len, A.length + B.length] };
  }
  if (frame < OPEN.c) return { text: A.slice(0, Math.max(0, A.length - Math.max(0, frame - OPEN.erase))) };
  const text = C.slice(0, Math.max(0, Math.floor((frame - OPEN.c) / 2)));
  if (frame < OPEN.selectC[0]) return { text };
  const len = Math.round(5 * ramp(frame, OPEN.selectC[0], OPEN.selectC[1]));
  return { text, select: [C.length - len, C.length] };
}

const Opening: React.FC = () => {
  const frame = useFrame();
  const line = openingLine(frame);
  // The camera fits the line's length over the last few frames, so it glides instead of jumping per letter.
  let chars = 0;
  for (let i = 0; i < 12; i++) chars += openingLine(Math.max(0, frame - i)).text.length / 12;
  const camera = fitScale(chars, 72, 1400, 2.4) * drift(frame, 276, 1.04, 0.9);
  const idle = frame >= OPEN.a + A.length * 2 && frame < OPEN.b ? OPEN.a + A.length * 2 : frame >= OPEN.c + C.length * 2 ? OPEN.c + C.length * 2 : 9999;
  const ghosts = 1 + (camera - 1) * 0.25;
  return (
    <Backdrop light="paper">
      <AbsoluteFill style={{ transform: `scale(${ghosts})` }}>
        <Floating delay={0} until={150} dx={1} dy={0.4}>
          <Ghost x={110} y={90} blur={3} opacity={0.85} rotate={-3}>
            <DmThread name="Glow Lab" text="Hey! Ich liebe eure Produkte. Habt ihr Lust auf eine Kooperation? 🙂" bubble={pop(frame, 8)} seenAt={ramp(frame, 46, 54)} />
          </Ghost>
        </Floating>
        <Floating delay={16} until={150} dx={-0.8} dy={0.5}>
          <Ghost x={1290} y={150} blur={5} opacity={0.65} rotate={2}>
            <MailRow from="Nordwerk" subject="Re: Re: Kooperation?" />
          </Ghost>
        </Floating>
        <Floating delay={24} until={150} dx={-0.6} dy={-0.5}>
          <Ghost x={1270} y={680} blur={3} opacity={0.85} rotate={-2}>
            <SheetSnippet
              rows={[["Marke", "Status"], ["Glow Lab", "keine Antwort"], ["Nordwerk", "keine Antwort"], ["Kiez Goods", "keine Antwort"], ["Lumo Audio", "Absage"]]}
              shown={1 + (frame - 30) / 14}
            />
          </Ghost>
        </Floating>
        <Floating delay={44} until={150} dx={0.7} dy={-0.6}>
          <Ghost x={160} y={720} blur={6} opacity={0.6} rotate={3}>
            <DmThread name="Lumo Audio" text="Hallo, ich wollte nochmal nachfragen …" seen="Gesendet vor 9 Tagen" bubble={pop(frame, 52)} seenAt={ramp(frame, 84, 92)} />
          </Ghost>
        </Floating>
        <Floating delay={160} dx={0.8} dy={0.5}>
          <Ghost x={140} y={120} blur={3} opacity={0.85} rotate={-2}>
            <InvoiceSnippet days={Math.round(mix(ramp(frame, 176, 250), 40, 47))} />
          </Ghost>
        </Floating>
        <Floating delay={176} dx={-0.9} dy={0.3}>
          <Ghost x={1300} y={160} blur={4} opacity={0.75} rotate={3}>
            <DmThread name="Nordwerk" text="Kannst du mir deine IBAN nochmal schicken?" seen="Gelesen" bubble={pop(frame, 182)} seenAt={ramp(frame, 214, 222)} />
          </Ghost>
        </Floating>
        <Floating delay={196} dx={-0.5} dy={-0.6}>
          <Ghost x={1240} y={740} blur={6} opacity={0.6} rotate={-3}>
            <MailRow from="Buchhaltung" subject="Zahlungsziel: 60 Tage nach Rechnung" />
          </Ghost>
        </Floating>
        <Floating delay={206} dx={0.6} dy={-0.4}>
          <Ghost x={200} y={760} blur={7} opacity={0.5} rotate={2}>
            <MailRow from="Nordwerk" subject="Re: Rechnung 017, wir prüfen das intern" />
          </Ghost>
        </Floating>
      </AbsoluteFill>
      <Center>
        <div style={{ transform: `scale(${camera})` }}>
          <Typed text={line.text} size={72} select={line.select} caret={caretOn(frame, idle)} />
        </div>
      </Center>
    </Backdrop>
  );
};

// 2 · Turn: three words slam in, then spread apart and leave one by one.
const Turn: React.FC = () => {
  const frame = useFrame();
  const spread = glide(frame, 66, 100);
  return (
    <Backdrop light="mist">
      <Center>
        <div style={{ transform: `scale(${drift(frame, 110, 1.08, 0.92)})` }}>
          <SlamWords
            size={112}
            start={2}
            stagger={8}
            gap={mix(spread, 0.25, 1.1)}
            parts={[{ text: "Schluss mit" }, { text: "Hinterherschreiben." }]}
            fade={(i) => 1 - ramp(frame, 74 + i * 6, 86 + i * 6)}
          />
        </div>
      </Center>
    </Backdrop>
  );
};

// 3 · Reveal: "Das ist" fills the frame, shrinks, the app icon pops in beside it and the name types out after it.
const ICON_AT = 62;
const NAME_AT = 76;

const Reveal: React.FC = () => {
  const frame = useFrame();
  const enter = slam(frame, 0);
  const back = ease(frame, 46, { stiffness: 70 });
  const icon = pop(frame, ICON_AT);
  const letters = Math.max(0, Math.min(6, (frame - NAME_AT) / 3));
  const size = mix(back, 400, 150);
  return (
    <Backdrop light="mist">
      <Center>
        <div style={{ display: "flex", alignItems: "center", transform: `scale(${drift(frame, 165, 1.06, 0.8)})` }}>
          <span style={{ fontSize: size, fontWeight: 900, letterSpacing: -size * 0.04, lineHeight: 1, whiteSpace: "nowrap", ...slamStyle(enter, 1.7, 40) }}>Das ist</span>
          <span style={{ width: mix(Math.min(1, icon), 0, 150 * 0.32), flexShrink: 0 }} />
          <div style={{ width: mix(Math.min(1, icon), 0, 150 * 0.92), display: "flex", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon size={150 * 0.92} style={{ transform: `scale(${icon})`, opacity: Math.min(1, icon * 2) }} />
          </div>
          <span style={{ width: letters > 0 ? 150 * 0.22 : 0, flexShrink: 0 }} />
          <span style={{ fontSize: 150, fontWeight: 900, letterSpacing: -4.5, lineHeight: 1, whiteSpace: "pre", transform: "translateY(-9px)" }}>
            {"comtor".slice(0, Math.ceil(letters))}
            {letters > 0 && letters < 6 && <Caret size={150} />}
          </span>
        </div>
      </Center>
    </Backdrop>
  );
};

// 4 · Claim, then the product: the claim types itself in big and the camera pulls back as it grows, then it recedes
// into the distance while the app rises from below in 3D and keeps turning.
const CLAIM: Part[] = [{ text: "Der Marktplatz für", soft: true, bold: false }, { text: "Marken" }, { text: "und", soft: true, bold: false }, { text: "Creator." }];
const CLAIM_WORDS = CLAIM.flatMap((p) => p.text.split(" "));

const ClaimProduct: React.FC = () => {
  const frame = useFrame();
  let chars = 0;
  for (let i = 0; i < 10; i++) {
    const shown = Math.max(1, Math.min(CLAIM_WORDS.length, Math.floor((frame - i - 4) / 7) + 1));
    chars += CLAIM_WORDS.slice(0, shown).join(" ").length / 10;
  }
  const away = glide(frame, 92, 132);
  const rise = ease(frame, 100, { stiffness: 38 });
  const turn = glide(frame, 100, 330);
  const tilt = { x: mix(turn, 46, 8), y: mix(turn, -30, 4), z: mix(turn, 11, 0) };
  return (
    <Backdrop light="mist">
      <Center>
        <div
          style={{
            transform: `translateY(${-away * 320}px) scale(${fitScale(chars, 100, 1500, 2.2, 0.6) * drift(frame, 92, 1, 0.84) * mix(away, 1, 0.45)})`,
            opacity: 1 - away,
            filter: away > 0 ? `blur(${away * 8}px)` : undefined,
          }}
        >
          <FocusWords size={100} start={4} stagger={7} parts={CLAIM} limit />
        </div>
      </Center>
      {frame >= 96 && (
        <>
          <div style={{ position: "absolute", right: 110, top: 96, fontSize: 44, fontWeight: 900, letterSpacing: -1.2, color: colors.graphite, ...focusIn(ease(frame, 160), 44) }}>Für Creator</div>
          <DesktopApp
            side="creator"
            active="Feed"
            title="Feed"
            scale={mix(turn, 0.92, 1.26)}
            tilt={tilt}
            style={{ position: "absolute", left: mix(turn, 380, 40), top: mix(rise, 1150, 210) - turn * 70, opacity: Math.min(1, rise * 2) }}
          >
            <CreatorFeed />
          </DesktopApp>
          <LightSweep from={190} to={262} />
          <SampleTag />
        </>
      )}
    </Backdrop>
  );
};

// 5 · Matching: the card on the left with a scan line running over it, the check typing itself out in the dark panel
// on the right, each line with its own progress bar.
const CHECKS: [string, string][] = [
  ["Nische passt", "Fashion"],
  ["Reichweite passt", "50.000 Follower"],
  ["Plattform passt", "TikTok"],
  ["Budget", "250 €"],
];
const CHECK_START = 30;
const CHECK_EVERY = 26;
const CHECKED = CHECK_START + CHECKS.length * CHECK_EVERY + 4;

const Matching: React.FC = () => {
  const frame = useFrame();
  const panel = ease(frame, 0, { stiffness: 70 });
  const result = pop(frame, CHECKED);
  const scanning = frame < CHECKED;
  const scan = 0.5 - 0.5 * Math.cos(frame / 13);
  const turnY = mix(glide(frame, 0, 200), 16, -14);
  return (
    <Backdrop light="mist">
      <AbsoluteFill style={{ transform: `scale(${drift(frame, 200, 1, 1.1)})`, transformOrigin: "70% 50%" }}>
        <div style={{ position: "absolute", left: 260, top: 150, perspective: 1600, transform: `translateX(${(1 - panel) * 180}px)` }}>
          <div style={{ transform: `rotateY(${turnY}deg) rotateX(6deg)`, position: "relative" }}>
            <DealCard deal={RAW_HOODIE} width={520} height={760} />
            {scanning && (
              <div style={{ position: "absolute", left: -30, right: -30, top: `${scan * 100}%`, height: 4, backgroundColor: colors.paper, boxShadow: "0 0 30px 12px rgba(255,255,255,0.75)", opacity: ramp(frame, 18, 26) }} />
            )}
            <div style={{ position: "absolute", inset: 0, borderRadius: 14, boxShadow: `inset 0 0 0 ${mix(result, 0, 6)}px ${colors.paper}` }} />
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 840,
            transform: `translateX(${(1 - panel) * 840}px)`,
            background: "linear-gradient(180deg, #0b0b0b 0%, #070707 60%, #1b1b1d 100%)",
            color: colors.paper,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 30,
            padding: "0 90px",
            fontFamily: MONO,
            fontSize: 28,
          }}
        >
          <div style={{ fontSize: 20, color: colors.graphite, marginBottom: 6, opacity: ramp(frame, 14, 24) }}>Anfrage · Raw Supplies</div>
          {CHECKS.map(([label, value], i) => {
            const start = CHECK_START + i * CHECK_EVERY;
            const chars = Math.max(0, Math.min(label.length, frame - start));
            const bar = ramp(frame, start + 4, start + 20);
            return (
              <div key={label} style={{ display: "flex", flexDirection: "column", gap: 12, opacity: frame >= start ? 1 : 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
                  <span style={{ transform: `scale(${pop(frame, start + 20)})`, display: "inline-flex" }}>
                    <Tick size={30} dark />
                  </span>
                  <span style={{ flex: 1, whiteSpace: "pre" }}>{label.slice(0, chars)}</span>
                  <span style={{ color: colors.stone, opacity: ramp(frame, start + 20, start + 28) }}>{value}</span>
                </div>
                <div style={{ height: 3, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 2 }}>
                  <div style={{ height: 3, width: `${bar * 100}%`, backgroundColor: bar >= 1 ? colors.graphite : colors.paper, borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              backgroundColor: colors.paper,
              color: colors.ink,
              borderRadius: 6,
              padding: "18px 22px",
              fontWeight: 700,
              opacity: Math.min(1, result * 1.5),
              transform: `scale(${mix(Math.min(result, 1.2), 0.9, 1)})`,
            }}
          >
            <Tick size={30} />
            <span style={{ flex: 1 }}>Passt zu dir</span>
            <span>Für dich</span>
          </div>
        </div>
        {/* The connector between the card and the panel, a dot running along it while the check runs. */}
        <div style={{ position: "absolute", left: 830, top: 538, width: 250, height: 2, backgroundColor: "rgba(7,7,7,0.18)", opacity: ramp(frame, 20, 30) }}>
          {scanning && <div style={{ position: "absolute", top: -5, left: `${((frame * 2.2) % 100).toFixed(1)}%`, width: 12, height: 12, borderRadius: 99, backgroundColor: colors.ink }} />}
        </div>
      </AbsoluteFill>
      <SampleTag dark />
    </Backdrop>
  );
};

// 6 · One swipe: the line slams in, the first half spreads and leaves, the braces close on "Interessiert" and the
// camera zooms into it (into the swipe itself, the next scene).
const SwipeLine: React.FC = () => {
  const frame = useFrame();
  const leave = glide(frame, 58, 84);
  const close = ease(frame, 30, { stiffness: 70 });
  const grow = glide(frame, 62, 100);
  return (
    <Backdrop light="paper">
      <Center style={{ gap: 30 }}>
        <div style={{ transform: `translateY(${-leave * 120}px) scale(${drift(frame, 110, 1.04, 0.94)})`, opacity: 1 - leave }}>
          <SlamWords size={88} start={2} stagger={6} gap={mix(leave, 0.25, 1)} parts={[{ text: "Ein Swipe nach rechts:" }]} />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: mix(close, 260, 26),
            fontSize: 104,
            letterSpacing: -3,
            transform: `translateY(${-leave * 70}px) scale(${mix(grow, 1, 1.35)})`,
          }}
        >
          <span style={{ color: colors.stone, fontWeight: 400, opacity: ramp(frame, 26, 34) }}>{"{"}</span>
          <span style={{ fontWeight: 900, ...focusIn(ease(frame, 34, { stiffness: 90 }), 104) }}>Interessiert</span>
          <span style={{ color: colors.stone, fontWeight: 400, opacity: ramp(frame, 26, 34) }}>{"}"}</span>
        </div>
      </Center>
    </Backdrop>
  );
};

// 7 · The swipe, close up in the app: the pointer takes the Raw Supplies card, drags it right (lifted, turning, the
// green wash past the threshold, as swipe-card.tsx draws it), lets go, the card flies off and the next one moves
// up. Then the camera pulls back over the Feed.
const GRAB = 56;
const LET_GO = 112;
// Where the top card's centre sits in the app window (sidebar 248, content padding, the stack's offset).
const CARD_CENTER = { x: 540, y: 344 };

const Swipe: React.FC = () => {
  const frame = useFrame();
  const back = glide(frame, 140, 220);
  const s = mix(back, mix(glide(frame, 0, 140), 1.62, 1.5), 1.2);
  const anchor = { x: mix(back, 760, 640), y: mix(back, 520, 470) };
  const left = anchor.x - CARD_CENTER.x * s;
  const top = anchor.y - CARD_CENTER.y * s;

  const held = ease(frame, GRAB, { stiffness: 220 });
  const drag = glide(frame, GRAB + 4, LET_GO);
  const x = 300 * drag;
  const swipe: SwipeState = {
    x,
    y: -24 * drag,
    held: frame < LET_GO ? held : 1,
    like: Math.max(0, Math.min(1, (x - 100) / 40)),
    out: ease(frame, LET_GO, { stiffness: 60 }),
  };
  const next = ease(frame, LET_GO + 6, { stiffness: 90 });
  const heart = 1 + 0.22 * (frame >= LET_GO && frame < LET_GO + 12 ? Math.sin((Math.PI * (frame - LET_GO)) / 12) : 0);

  // The pointer: in from the lower right, onto the card, along with it while dragging, then away.
  const grabAt = { x: left + (CARD_CENTER.x + 30) * s, y: top + (CARD_CENTER.y + 60) * s };
  const cursor =
    frame < GRAB
      ? { x: path(frame, [16, GRAB - 4], [1820, grabAt.x]), y: path(frame, [16, GRAB - 4], [1100, grabAt.y]) }
      : { x: grabAt.x + Math.min(x, 300) * s, y: grabAt.y - 24 * drag * s };
  return (
    <Backdrop light="mist">
      <DesktopApp side="creator" active="Feed" title="Feed" scale={s} tilt={{ x: back * 10, y: -back * 8, z: back * 1.5 }} style={{ position: "absolute", left, top }}>
        <CreatorFeed swipe={swipe} next={next} heart={heart} />
      </DesktopApp>
      <div style={{ opacity: ramp(frame, 16, 24) * (1 - ramp(frame, LET_GO + 14, LET_GO + 26)) }}>
        <Cursor x={cursor.x} y={cursor.y} pressed={frame >= GRAB && frame < LET_GO ? 0.5 : pressAt(frame, GRAB)} />
      </div>
      <LightSweep from={150} to={215} opacity={0.4} />
      <SampleTag />
    </Backdrop>
  );
};

// 8 · Money held: the first line slams in big and steps back, then the brackets close in on "zurückgehalten",
// squeeze it shut and the camera zooms in.
const Held: React.FC = () => {
  const frame = useFrame();
  const up = ease(frame, 30, { stiffness: 60 });
  const close = ease(frame, 60, { stiffness: 55 });
  const squeeze = glide(frame, 150, 172);
  return (
    <Backdrop light="night">
      <Center>
        <div style={{ transform: `scale(${drift(frame, 185, 1.1, 0.86)})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ transform: `translateY(${mix(up, 120, -40)}px) scale(${mix(up, 1, 0.45)})`, color: up > 0.5 ? colors.stone : colors.paper, opacity: 1 - squeeze }}>
            <SlamWords size={116} start={0} stagger={5} from={2} dark parts={[{ text: "Die Marke zahlt zuerst." }]} />
          </div>
          <div style={{ fontSize: 48, color: colors.stone, marginTop: 6, opacity: 1 - squeeze, ...focusIn(ease(frame, 48), 48) }}>Das Geld wird</div>
          <div style={{ display: "flex", alignItems: "center", gap: mix(squeeze, mix(close, 620, 36), 0), fontSize: 130, fontWeight: 900, letterSpacing: -4, margin: "14px 0" }}>
            <span style={{ fontWeight: 400, color: colors.graphite, fontSize: 162, lineHeight: 1, opacity: ramp(frame, 56, 66) }}>[</span>
            <span style={{ display: "inline-block", transform: `scaleX(${1 - squeeze})`, ...focusIn(ease(frame, 66, { stiffness: 80 }), 130) }}>zurückgehalten</span>
            <span style={{ fontWeight: 400, color: colors.graphite, fontSize: 162, lineHeight: 1, opacity: ramp(frame, 56, 66) }}>]</span>
          </div>
          <div style={{ fontSize: 48, color: colors.stone, opacity: 1 - squeeze, ...focusIn(ease(frame, 100), 48) }}>bis dein Post online ist.</div>
        </div>
      </Center>
    </Backdrop>
  );
};

// 9 · Paid out: the word whips in smeared sideways and snaps to its normal shape, the amount counts up, then
// everything drifts out of focus.
const Paid: React.FC = () => {
  const frame = useFrame();
  const whip = slam(frame, 2);
  const pill = ease(frame, 26, { stiffness: 90 });
  const amount = 225 * ramp(frame, 30, 62);
  const out = glide(frame, 98, 125);
  return (
    <Backdrop light="night">
      <SmearFilter id="paid-smear" amount={mix(whip, 70, 0)} />
      <Center style={{ gap: 60, opacity: 1 - out, filter: out > 0 ? `blur(${out * 20}px)` : undefined }}>
        <div style={{ transform: `scale(${drift(frame, 125, 1.06, 0.84)})` }}>
          <div
            style={{
              fontSize: 200,
              fontWeight: 900,
              letterSpacing: -6,
              lineHeight: 1,
              whiteSpace: "nowrap",
              opacity: Math.min(1, whip * 2.5),
              transform: `translateX(${mix(whip, -700, 0)}px) scaleX(${mix(whip, 3.4, 1)})`,
              filter: whip < 0.99 ? "url(#paid-smear)" : undefined,
            }}
          >
            Ausgezahlt.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 22,
            borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.14)",
            padding: "20px 30px",
            fontSize: 30,
            opacity: pill,
            transform: `translateY(${(1 - pill) * 40}px)`,
          }}
        >
          <Avatar name="Raw Supplies" image={RAW_AVATAR} size={48} />
          <span style={{ color: colors.stone }}>Raw Supplies</span>
          <span style={{ fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>+ {amount.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
        </div>
      </Center>
      <SampleTag dark />
    </Backdrop>
  );
};

// 10 · Switch to brands: "Und" slams in, steps up, and the line after it comes in with its letters drawing together.
const ForBrands: React.FC = () => {
  const frame = useFrame();
  const up = ease(frame, 40, { stiffness: 60 });
  const tighten = glide(frame, 50, 100);
  return (
    <Backdrop light="night">
      <Center>
        <div style={{ transform: `scale(${drift(frame, 125, 1.1, 0.86)})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ fontSize: 240, fontWeight: 900, letterSpacing: -9, lineHeight: 1, transform: `translateY(${mix(up, 60, -30)}px) scale(${mix(up, 1, 0.6)})`, ...slamStyle(slam(frame, 0), 2.2, 40) }}>Und</div>
          {frame >= 46 && (
            <FocusWords
              size={64}
              start={50}
              stagger={4}
              dark
              spacing={mix(tighten, 0.8, 0)}
              parts={[{ text: "für Marken:", soft: true, bold: false }, { text: "ein Briefing, alle passenden Creator." }]}
            />
          )}
        </div>
      </Center>
    </Backdrop>
  );
};

// 11 · Briefing, one camera move: right on the title field while it is typed, following the text, then pulling back
// to the whole New request laid back in 3D, the pointer on Publish, the toast.
const TITLE_AT = 14;
const TITLE_EVERY = 3;
const PULL = [104, 178] as const;
const PUBLISH = 238;
// The start of the title's text and the field's middle in the app window, and the page's middle.
const TITLE_POINT = { x: 297, y: 114 };
const PAGE_POINT = { x: 640, y: 422 };
const CLOSE = 5.2;
const WIDE = 1.16;

const Briefing: React.FC = () => {
  const frame = useFrame();
  const typed = Math.max(0, Math.min(NEW_REQUEST_TITLE.length, (frame - TITLE_AT) / TITLE_EVERY));
  const title = NEW_REQUEST_TITLE.slice(0, Math.floor(typed));
  const pull = glide(frame, PULL[0], PULL[1]);
  const s = Math.exp(mix(pull, Math.log(CLOSE * mix(glide(frame, 0, PULL[0]), 0.9, 1.04)), Math.log(WIDE)));
  // While typing, the camera keeps the caret in view: the text grows about 7.3 px per letter in the app.
  const follow = Math.max(0, 200 + typed * 7.3 * CLOSE - 1500);
  const focus = { x: mix(pull, TITLE_POINT.x, PAGE_POINT.x), y: mix(pull, TITLE_POINT.y, PAGE_POINT.y) };
  const anchor = { x: mix(pull, 200 - follow - frame * 0.8, 932), y: mix(pull, 500 - frame * 0.4, 539) };
  const tilt = { x: 10 * pull, y: 10 * pull, z: -2 * pull };
  const pressed = pressAt(frame, PUBLISH);
  const cursor = { x: path(frame, [192, PUBLISH - 4], [1840, 1500]), y: path(frame, [192, PUBLISH - 4], [1100, 722]) };
  const toast = ease(frame, PUBLISH + 8, { stiffness: 90 });
  return (
    <Backdrop light="mist">
      <AbsoluteFill style={{ transform: `scale(${mix(glide(frame, PULL[1], 310), 1, 1.12)})`, transformOrigin: "72% 52%" }}>
        <DesktopApp side="brand" active="Anfragen" title="Neue Anfrage" scale={s} tilt={tilt} style={{ position: "absolute", left: anchor.x - focus.x * s, top: anchor.y - focus.y * s }}>
          <NewRequest title={title} caret={frame < PULL[0] + 10 && caretOn(frame, TITLE_AT + NEW_REQUEST_TITLE.length * TITLE_EVERY)} published={frame >= PUBLISH + 2} press={pressed} />
        </DesktopApp>
        <div style={{ opacity: ramp(frame, 192, 200) * (1 - ramp(frame, PUBLISH + 30, PUBLISH + 44)) }}>
          <Cursor x={cursor.x} y={cursor.y} pressed={pressed} />
        </div>
        <div
          style={{
            position: "absolute",
            right: 90,
            top: 80,
            display: "flex",
            alignItems: "center",
            gap: 16,
            backgroundColor: colors.ink,
            color: colors.paper,
            borderRadius: 14,
            padding: "18px 26px",
            fontSize: 26,
            fontWeight: 700,
            boxShadow: "0 30px 60px rgba(7,7,7,0.25)",
            opacity: toast,
            transform: `translateY(${(1 - toast) * -40}px)`,
          }}
        >
          <Tick size={30} dark />
          Anfrage veröffentlicht
        </div>
        <LightSweep from={246} to={300} opacity={0.4} />
      </AbsoluteFill>
      <SampleTag />
    </Backdrop>
  );
};

// 12 · The difference: the first line slams in and fades back out of focus, the second slams in over it.
const Difference: React.FC = () => {
  const frame = useFrame();
  const back = glide(frame, 66, 92);
  return (
    <Backdrop light="mist">
      <Center>
        <div style={{ position: "absolute", transform: `translateY(${-back * 150}px) scale(${drift(frame, 92, 1.04, 0.92) * mix(back, 1, 0.62)})`, opacity: mix(back, 1, 0.35), filter: back > 0 ? `blur(${back * 3}px)` : undefined }}>
          <SlamWords size={110} start={2} stagger={5} parts={[{ text: "Agenturen vermitteln Kontakte." }]} />
        </div>
        {frame >= 80 && (
          <div style={{ position: "absolute", transform: `translateY(40px) scale(${drift(Math.max(0, frame - 80), 110, 1.04, 0.9)})` }}>
            <SlamWords size={124} start={82} stagger={5} from={2.2} parts={[{ text: "comtor" }, { text: "wickelt den Deal ab." }]} />
          </div>
        )}
      </Center>
    </Backdrop>
  );
};

// 13 · End card: the app icon alone, then the name types out next to it and pushes it aside.
const EndCard: React.FC = () => {
  const frame = useFrame();
  const icon = pop(frame, 4);
  const letters = Math.max(0, Math.min(6, (frame - 34) / 4));
  return (
    <Backdrop light="mist">
      <Center>
        <div style={{ display: "flex", alignItems: "center", gap: letters > 0 ? 44 : 0, transform: `scale(${drift(frame, 145, 1.12, 0.76)})` }}>
          <AppIcon size={184} style={{ transform: `scale(${icon})`, opacity: Math.min(1, icon * 2), filter: icon < 0.95 ? `blur(${(1 - Math.min(icon, 1)) * 12}px)` : undefined }} />
          {letters > 0 && (
            <span style={{ fontSize: 200, fontWeight: 900, letterSpacing: -6, lineHeight: 1, whiteSpace: "pre", transform: "translateY(-12px)" }}>{"comtor".slice(0, Math.ceil(letters))}</span>
          )}
        </div>
      </Center>
    </Backdrop>
  );
};

// 14 · Call to action on black: the claim typed, erased, the call to action typed, the founding line and the
// address under it.
const CLAIM_LINE = "Der Marktplatz für Marken und Creator.";
const CTA_LINE = "Jetzt kostenlos starten.";

function ctaLine(frame: number) {
  if (frame < 96) return CLAIM_LINE.slice(0, Math.max(0, Math.floor((frame - 10) / 1.5)));
  if (frame < 140) return CLAIM_LINE.slice(0, Math.max(0, CLAIM_LINE.length - Math.floor((frame - 96) * 1.2)));
  return CTA_LINE.slice(0, Math.max(0, Math.floor((frame - 140) / 2)));
}

const Cta: React.FC = () => {
  const frame = useFrame();
  const line = ctaLine(frame);
  let chars = 0;
  for (let i = 0; i < 10; i++) chars += ctaLine(Math.max(0, frame - i)).length / 10;
  const idle = frame >= 67 && frame < 96 ? 67 : frame >= 188 ? 188 : 9999;
  return (
    <Backdrop light="night">
      <Center style={{ gap: 46 }}>
        <div style={{ transform: `scale(${fitScale(chars, 64, 1300, 1.9)})` }}>
          <Typed text={line} size={64} caret={caretOn(frame, idle)} dark />
        </div>
        <div style={{ fontSize: 34, color: colors.stone, textAlign: "center", lineHeight: 1.45, ...focusIn(ease(frame, 196), 34) }}>
          Die ersten 50 Marken und 100 Creator
          <br />
          bekommen Pro kostenlos, solange ihr Konto besteht.
        </div>
      </Center>
      <div style={{ position: "absolute", bottom: 64, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, fontSize: 28, fontWeight: 700, opacity: ramp(frame, 212, 226) }}>
        <Mark width={34} white />
        comtor.app
      </div>
    </Backdrop>
  );
};

// ---------------------------------------------------------------------------------------------------------------

export type Enter = "fade" | "zoom";

export type LaunchScene = {
  id: string;
  label: string;
  component: React.FC;
  duration: number;
  keyframe: number;
  enter?: Enter;
  // Leaves by zooming into this point of the frame (CSS transform-origin).
  exit?: string;
};

export const LAUNCH_SCENES: LaunchScene[] = [
  { id: "L01", label: "1 · Kaltakquise und Geld", component: Opening, duration: 276, keyframe: 232, exit: "66% 50%" },
  { id: "L02", label: "2 · Wendung", component: Turn, duration: 110, keyframe: 50, enter: "zoom" },
  { id: "L03", label: "3 · Reveal comtor", component: Reveal, duration: 165, keyframe: 120 },
  { id: "L04", label: "4 · Claim und Produkt", component: ClaimProduct, duration: 330, keyframe: 240, exit: "37% 57%" },
  { id: "L05", label: "5 · Matching", component: Matching, duration: 200, keyframe: 180, enter: "zoom" },
  { id: "L06", label: "6 · Ein Swipe", component: SwipeLine, duration: 110, keyframe: 50, exit: "50% 56%" },
  { id: "L07", label: "7 · Swipe in der App", component: Swipe, duration: 220, keyframe: 98, enter: "zoom" },
  { id: "L08", label: "8 · Geld zurückgehalten", component: Held, duration: 185, keyframe: 130, exit: "50% 52%" },
  { id: "L09", label: "9 · Ausgezahlt", component: Paid, duration: 125, keyframe: 80, enter: "zoom" },
  { id: "L10", label: "10 · Und für Marken", component: ForBrands, duration: 125, keyframe: 110 },
  { id: "L11", label: "11 · Briefing", component: Briefing, duration: 310, keyframe: 70 },
  { id: "L12", label: "12 · Abgrenzung", component: Difference, duration: 190, keyframe: 150 },
  { id: "L13", label: "13 · Logo", component: EndCard, duration: 145, keyframe: 90 },
  { id: "L14", label: "14 · CTA", component: Cta, duration: 250, keyframe: 230 },
];
