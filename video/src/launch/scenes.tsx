import type { CSSProperties, ReactNode } from "react";
import { FiHeart } from "react-icons/fi";
import { IoCheckmark } from "react-icons/io5";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { RAW_AVATAR } from "../ads/brands";
import { focusIn } from "../ads/kit";
import { ease, mix, path, pop, ramp } from "../anim";
import { Cursor, pressAt } from "../components/shared-scenes";
import { Avatar } from "../components/ui";
import { useFrame } from "../frame";
import { colors } from "../theme";
import { Backdrop, Center, DesktopApp, Field, Ghost, LogoMark, type Part, SampleTag, SOFT_SHADOW, Tick, TypeLine, WideWord, Wordmark } from "./kit";
import { CreatorFeed, DmThread, InvoiceSnippet, MailRow, MONO, NewRequest, SheetSnippet } from "./screens";

// The scenes of the launch video (LAUNCH.md). Each one is drawn on its own clock from 0 and lasts `duration`
// frames; LaunchVideo lays them end to end with a short blurred cross-fade. `keyframe` is the frame its still shows.

// Characters of a line typed from `start`, one every `every` frames.
function typed(frame: number, start: number, text: string, every = 2) {
  return Math.max(0, Math.min(text.length, Math.floor((frame - start) / every)));
}

// The caret is solid while typing and blinks once the line stands.
function caretOn(frame: number, doneAt: number) {
  return frame < doneAt || Math.floor((frame - doneAt) / 14) % 2 === 0;
}

// A slow push-in over the whole scene, around `origin`.
const Push: React.FC<{ duration: number; zoom?: [number, number]; origin?: string; children: ReactNode }> = ({ duration, zoom = [1, 1.05], origin = "50% 50%", children }) => {
  const frame = useFrame();
  const p = interpolate(frame, [0, duration], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.sin) });
  return <AbsoluteFill style={{ transform: `scale(${mix(p, zoom[0], zoom[1])})`, transformOrigin: origin }}>{children}</AbsoluteFill>;
};

// A statement whose words come into focus one after another, from `start`.
const FocusWords: React.FC<{ parts: Part[]; size: number; start: number; stagger?: number; dark?: boolean; style?: CSSProperties }> = ({
  parts,
  size,
  start,
  stagger = 4,
  dark,
  style,
}) => {
  const frame = useFrame();
  let word = 0;
  return (
    <div style={{ fontSize: size, lineHeight: 1.08, letterSpacing: -size * 0.03, textAlign: "center", ...style }}>
      {parts.map((part, i) =>
        part.text.split(/(?<= )/).map((w, j) => {
          const p = ease(frame, start + word++ * stagger, { stiffness: 90 });
          return (
            <span
              key={`${i}-${j}`}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                fontWeight: part.bold === false ? 400 : 900,
                color: part.soft ? (dark ? colors.graphite : colors.stone) : undefined,
                ...focusIn(p, size),
              }}
            >
              {w}
            </span>
          );
        }),
      )}
    </div>
  );
};

// Something drifting slowly across the frame, `speed` px per frame along (dx, dy).
function drift(frame: number, dx: number, dy: number, speed = 0.25): CSSProperties {
  return { transform: `translate(${dx * frame * speed}px, ${dy * frame * speed}px)` };
}

// A ghost that fades in after `delay` and drifts.
const Floating: React.FC<{ delay: number; dx: number; dy: number; children: ReactNode }> = ({ delay, dx, dy, children }) => {
  const frame = useFrame();
  return <AbsoluteFill style={{ opacity: ramp(frame, delay, delay + 24), ...drift(frame, dx, dy) }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------------------------------------------
// 1 · Problem: typed over DMs that never got an answer.

const LINE_1 = "40 Marken angeschrieben. Eine Antwort.";

const Problem: React.FC = () => {
  const frame = useFrame();
  const shown = typed(frame, 12, LINE_1);
  return (
    <Backdrop light="paper">
      <Push duration={150}>
        <Floating delay={0} dx={1} dy={0.4}>
          <Ghost x={110} y={90} blur={3} opacity={0.8} rotate={-3}>
            <DmThread name="Glow Lab" text="Hey! Ich liebe eure Produkte. Habt ihr Lust auf eine Kooperation? 🙂" />
          </Ghost>
        </Floating>
        <Floating delay={10} dx={-0.8} dy={0.5}>
          <Ghost x={1290} y={150} blur={5} opacity={0.65} rotate={2}>
            <MailRow from="Nordwerk" subject="Re: Re: Kooperation?" />
          </Ghost>
        </Floating>
        <Floating delay={20} dx={-0.6} dy={-0.5}>
          <Ghost x={1270} y={680} blur={3} opacity={0.8} rotate={-2}>
            <SheetSnippet rows={[["Marke", "Status"], ["Glow Lab", "keine Antwort"], ["Nordwerk", "keine Antwort"], ["Kiez Goods", "keine Antwort"], ["Lumo Audio", "Absage"]]} />
          </Ghost>
        </Floating>
        <Floating delay={30} dx={0.7} dy={-0.6}>
          <Ghost x={160} y={720} blur={6} opacity={0.6} rotate={3}>
            <DmThread name="Lumo Audio" text="Hallo, ich wollte nochmal nachfragen …" seen="Gesendet vor 9 Tagen" />
          </Ghost>
        </Floating>
        <Center>
          <TypeLine text={LINE_1} shown={shown} caret={caretOn(frame, 12 + LINE_1.length * 2)} size={72} />
        </Center>
      </Push>
    </Backdrop>
  );
};

// 2 · Problem: and then the money. The last word gets selected, like the reference's "Different".
const LINE_2 = "Und wann kommt das Geld?";

const Money: React.FC = () => {
  const frame = useFrame();
  const shown = typed(frame, 6, LINE_2);
  const select = ramp(frame, 74, 84);
  const head = LINE_2.slice(0, Math.min(shown, 19));
  const tail = shown > 19 ? LINE_2.slice(19, shown) : "";
  return (
    <Backdrop light="paper">
      <Push duration={120}>
        <Floating delay={0} dx={0.8} dy={0.5}>
          <Ghost x={140} y={120} blur={3} opacity={0.8} rotate={-2}>
            <InvoiceSnippet />
          </Ghost>
        </Floating>
        <Floating delay={8} dx={-0.9} dy={0.3}>
          <Ghost x={1300} y={160} blur={4} opacity={0.75} rotate={3}>
            <DmThread name="Nordwerk" text="Kannst du mir deine IBAN nochmal schicken?" seen="Gelesen" />
          </Ghost>
        </Floating>
        <Floating delay={16} dx={-0.5} dy={-0.6}>
          <Ghost x={1240} y={740} blur={6} opacity={0.6} rotate={-3}>
            <MailRow from="Buchhaltung" subject="Zahlungsziel: 60 Tage nach Rechnung" />
          </Ghost>
        </Floating>
        <Center>
          <div style={{ fontSize: 72, letterSpacing: -1, whiteSpace: "pre", display: "flex", alignItems: "center" }}>
            {head}
            <span
              style={{
                backgroundColor: `rgba(7,7,7,${select})`,
                color: select > 0.5 ? colors.paper : colors.ink,
                padding: "0 6px",
                margin: "0 -6px",
                borderRadius: 4,
              }}
            >
              {tail}
            </span>
            {select === 0 && caretOn(frame, 6 + LINE_2.length * 2) && (
              <span style={{ display: "inline-block", width: 4, height: 68, backgroundColor: colors.ink, marginLeft: 3 }} />
            )}
          </div>
        </Center>
      </Push>
    </Backdrop>
  );
};

// 3 · Turn.
const Turn: React.FC = () => (
  <Backdrop light="mist">
    <Push duration={90} zoom={[1.04, 1]}>
      <Center>
        <FocusWords size={104} start={4} stagger={7} parts={[{ text: "Schluss mit " }, { text: "Hinterherschreiben." }]} />
      </Center>
    </Push>
  </Backdrop>
);

// 4 · Reveal: "Das ist" fills the frame, then steps back and the name lands next to it.
const NAME_WIDTH = 640;

const Reveal: React.FC = () => {
  const frame = useFrame();
  const enter = ease(frame, 0, { stiffness: 60 });
  const back = ease(frame, 46, { stiffness: 70 });
  const name = ease(frame, 58, { stiffness: 80 });
  const size = mix(back, 400, 150);
  return (
    <Backdrop light="mist">
      <Push duration={150} zoom={[1, 1.04]}>
        <Center>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span
              style={{
                fontSize: size,
                fontWeight: 900,
                letterSpacing: -size * 0.04,
                lineHeight: 1,
                color: back > 0.5 ? colors.graphite : colors.ink,
                opacity: enter,
                transform: `scale(${mix(enter, 1.25, 1)})`,
                filter: enter > 0.99 ? undefined : `blur(${(1 - enter) * 24}px)`,
                whiteSpace: "nowrap",
              }}
            >
              Das ist
            </span>
            <div style={{ width: mix(back, 0, NAME_WIDTH + 40), display: "flex", justifyContent: "flex-end", overflow: "visible" }}>
              <div style={{ flexShrink: 0, ...focusIn(name, 150) }}>
                <Wordmark size={150} />
              </div>
            </div>
          </div>
        </Center>
      </Push>
    </Backdrop>
  );
};

// 5 · Claim.
const Claim: React.FC = () => (
  <Backdrop light="mist">
    <Push duration={120} zoom={[1, 1.04]}>
      <Center>
        <FocusWords
          size={92}
          start={4}
          parts={[{ text: "Der Marktplatz für ", soft: true, bold: false }, { text: "Marken " }, { text: "und ", soft: true, bold: false }, { text: "Creator." }]}
        />
      </Center>
    </Push>
  </Backdrop>
);

// 6 · Product: the creator's Feed rising in, laid back in 3D, the camera gliding over it.
const Product: React.FC = () => {
  const frame = useFrame();
  const rise = ease(frame, 0, { stiffness: 45 });
  const settle = ramp(frame, 0, 180, Easing.inOut(Easing.sin));
  const tilt = { x: mix(settle, 30, 16), y: mix(settle, -20, -9), z: mix(settle, 6, 2) };
  return (
    <Backdrop light="mist">
      <div style={{ position: "absolute", right: 110, top: 96, fontSize: 44, fontWeight: 900, letterSpacing: -1.2, color: colors.graphite, ...focusIn(ease(frame, 20), 44) }}>
        Für Creator
      </div>
      <DesktopApp
        side="creator"
        active="Feed"
        scale={mix(settle, 1.02, 1.14)}
        tilt={tilt}
        style={{ position: "absolute", left: mix(settle, 260, 140), top: 210 + (1 - rise) * 900, opacity: Math.min(1, rise * 2) }}
      >
        <CreatorFeed />
      </DesktopApp>
      <SampleTag />
    </Backdrop>
  );
};

// 7 · Matching: the app slides aside, the check runs line by line in the dark panel.
const CHECKS: [string, string][] = [
  ["Nische passt", "Fashion"],
  ["Reichweite passt", "50.000 Follower"],
  ["Plattform passt", "TikTok"],
  ["Budget", "250 €"],
];
const CHECK_START = 28;
const CHECK_EVERY = 20;

const Matching: React.FC = () => {
  const frame = useFrame();
  const panel = ease(frame, 0, { stiffness: 70 });
  const result = pop(frame, CHECK_START + CHECKS.length * CHECK_EVERY + 6);
  return (
    <Backdrop light="mist">
      <div style={{ position: "absolute", left: mix(panel, -160, -380), top: 60, filter: "blur(1.5px)" }}>
        <DesktopApp side="creator" active="Feed" scale={1.12}>
          <CreatorFeed />
        </DesktopApp>
      </div>
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 860,
          transform: `translateX(${(1 - panel) * 860}px)`,
          background: "linear-gradient(180deg, #0b0b0b 0%, #070707 60%, #1b1b1d 100%)",
          color: colors.paper,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 26,
          padding: "0 90px",
          fontFamily: MONO,
          fontSize: 28,
        }}
      >
        <div style={{ fontSize: 20, color: colors.graphite, marginBottom: 6, opacity: ramp(frame, 14, 24) }}>Anfrage · Raw Supplies</div>
        {CHECKS.map(([label, value], i) => {
          const start = CHECK_START + i * CHECK_EVERY;
          const chars = typed(frame, start, label, 1);
          const done = chars === label.length;
          return (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 22, paddingBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.1)", opacity: frame >= start ? 1 : 0 }}>
              <span style={{ transform: `scale(${done ? pop(frame, start + label.length) : 0})`, display: "inline-flex" }}>
                <Tick size={30} dark />
              </span>
              <span style={{ flex: 1, whiteSpace: "pre" }}>{label.slice(0, chars)}</span>
              <span style={{ color: colors.stone, opacity: ramp(frame, start + label.length, start + label.length + 8) }}>{value}</span>
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
            transform: `scale(${mix(result, 0.9, 1)})`,
          }}
        >
          <Tick size={30} />
          <span style={{ flex: 1 }}>Passt zu dir</span>
          <span>Für dich</span>
        </div>
      </div>
      <SampleTag dark />
    </Backdrop>
  );
};

// 8 · One swipe: the button the creator presses.
const PRESS = 66;

const Swipe: React.FC = () => {
  const frame = useFrame();
  const button = ease(frame, 26, { stiffness: 90 });
  const pressed = pressAt(frame, PRESS);
  const done = frame >= PRESS + 2;
  const bounce = done ? pop(frame, PRESS + 2) : 1;
  const cursor = { x: path(frame, [30, PRESS - 4], [1500, 1060]), y: path(frame, [30, PRESS - 4], [1000, 690]) };
  return (
    <Backdrop light="paper">
      <Push duration={120} zoom={[1, 1.04]}>
        <Center style={{ gap: 90 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 28, fontSize: 92, letterSpacing: -2.5 }}>
            <span style={{ fontWeight: 900, ...focusIn(ease(frame, 2), 92) }}>Ein Swipe:</span>
            <span style={{ color: colors.stone, fontWeight: 400, opacity: ramp(frame, 12, 20) }}>{"{"}</span>
            <span style={{ fontWeight: 900, ...focusIn(ease(frame, 16), 92) }}>Interessiert</span>
            <span style={{ color: colors.stone, fontWeight: 400, opacity: ramp(frame, 12, 20) }}>{"}"}</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              borderRadius: 999,
              backgroundColor: done ? colors.paper : colors.ink,
              color: done ? colors.ink : colors.paper,
              border: `2px solid ${colors.ink}`,
              padding: "26px 52px",
              fontSize: 34,
              fontWeight: 700,
              boxShadow: SOFT_SHADOW,
              opacity: button,
              transform: `translateY(${(1 - button) * 60}px) scale(${(1 - pressed * 0.06) * mix(bounce, 0.92, 1)})`,
            }}
          >
            {done ? <IoCheckmark size={34} /> : <FiHeart size={34} />}
            Interessiert
          </div>
        </Center>
      </Push>
      <div style={{ opacity: ramp(frame, 30, 38) }}>
        <Cursor x={cursor.x} y={cursor.y} pressed={pressed} />
      </div>
    </Backdrop>
  );
};

// 9 · Money held: the brackets close in on the word that matters.
const Held: React.FC = () => {
  const frame = useFrame();
  const close = ease(frame, 18, { stiffness: 60 });
  return (
    <Backdrop light="night">
      <Push duration={150} zoom={[1, 1.05]}>
        <Center style={{ gap: 36 }}>
          <div style={{ fontSize: 48, color: colors.stone, ...focusIn(ease(frame, 2), 48) }}>Die Marke zahlt zuerst. Das Geld wird</div>
          <div style={{ display: "flex", alignItems: "center", gap: mix(close, 420, 36), fontSize: 130, fontWeight: 900, letterSpacing: -4 }}>
            <span style={{ fontWeight: 400, color: colors.graphite, fontSize: 162, lineHeight: 1, opacity: ramp(frame, 10, 20) }}>[</span>
            <span style={focusIn(ease(frame, 24, { stiffness: 80 }), 130)}>zurückgehalten</span>
            <span style={{ fontWeight: 400, color: colors.graphite, fontSize: 162, lineHeight: 1, opacity: ramp(frame, 10, 20) }}>]</span>
          </div>
          <div style={{ fontSize: 48, color: colors.stone, ...focusIn(ease(frame, 64), 48) }}>bis dein Post online ist.</div>
        </Center>
      </Push>
    </Backdrop>
  );
};

// 10 · Paid out: the word lands like a stamp, the amount counts up.
const Paid: React.FC = () => {
  const frame = useFrame();
  const stamp = ease(frame, 0, { stiffness: 140, damping: 22 });
  const pill = ease(frame, 26, { stiffness: 90 });
  const amount = 225 * ramp(frame, 30, 60);
  return (
    <Backdrop light="night">
      <Push duration={120} zoom={[1, 1.04]}>
        <Center style={{ gap: 60 }}>
          <WideWord
            size={190}
            stretch={mix(stamp, 2.2, 1.45)}
            style={{ opacity: Math.min(1, stamp * 1.6), filter: stamp > 0.99 ? undefined : `blur(${(1 - stamp) * 20}px)` }}
          >
            Ausgezahlt.
          </WideWord>
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
      </Push>
      <SampleTag dark />
    </Backdrop>
  );
};

// 11 · Switch to brands.
const ForBrands: React.FC = () => {
  const frame = useFrame();
  const und = ease(frame, 0, { stiffness: 110 });
  return (
    <Backdrop light="night">
      <Push duration={120} zoom={[1, 1.04]}>
        <Center style={{ gap: 26 }}>
          <div
            style={{
              fontSize: 180,
              fontWeight: 900,
              letterSpacing: -7,
              opacity: und,
              transform: `scale(${mix(und, 1.4, 1)})`,
              filter: und > 0.99 ? undefined : `blur(${(1 - und) * 18}px)`,
            }}
          >
            Und
          </div>
          <FocusWords size={64} start={22} dark parts={[{ text: "für Marken: ", soft: true, bold: false }, { text: "ein Briefing, alle passenden Creator." }]} />
        </Center>
      </Push>
    </Backdrop>
  );
};

// 12 · Briefing, close up: the title typed into the field, the camera following the text.
const TITLE = "Nokar Hoodie, Drop-Teaser";

const BriefingClose: React.FC = () => {
  const frame = useFrame();
  const shown = typed(frame, 10, TITLE, 3);
  // A slow drift along the line as it fills, never far enough to lose the label.
  const follow = -frame * 0.6;
  const enter = ease(frame, 0, { stiffness: 60 });
  return (
    <Backdrop light="mist">
      <div
        style={{
          position: "absolute",
          left: 150 + follow,
          top: 170,
          display: "flex",
          flexDirection: "column",
          gap: 90,
          transform: `scale(${mix(enter, 1.15, 1)})`,
          transformOrigin: "0 0",
          filter: enter > 0.99 ? undefined : `blur(${(1 - enter) * 10}px)`,
        }}
      >
        <Field label="Titel" value={TITLE.slice(0, shown)} placeholder="" caret={caretOn(frame, 10 + TITLE.length * 3)} focused size={84} width={2100} />
        <div style={{ display: "flex", gap: 60, filter: "blur(7px)", opacity: 0.6 * ramp(frame, 20, 40) }}>
          <Field label="Inhalt" value="1 Reel" size={84} width={620} />
          <Field label="Budget" value="300 €" size={84} width={520} />
        </div>
      </div>
      <SampleTag />
    </Backdrop>
  );
};

// 13 · Briefing, the whole page: the card as creators will see it, a click on Publish.
const PUBLISH = 118;

const BriefingPage: React.FC = () => {
  const frame = useFrame();
  const settle = ease(frame, 0, { stiffness: 40 });
  const tilt = { x: mix(settle, 26, 10), y: mix(settle, 22, 10), z: mix(settle, -6, -2) };
  const pressed = pressAt(frame, PUBLISH);
  const cursor = { x: path(frame, [70, PUBLISH - 4], [1760, 1500]), y: path(frame, [70, PUBLISH - 4], [1040, 722]) };
  return (
    <Backdrop light="mist">
      <Push duration={180} zoom={[1, 1.04]} origin="70% 60%">
        <DesktopApp
          side="brand"
          active="Anfragen"
          scale={mix(settle, 1.3, 1.16)}
          tilt={tilt}
          style={{ position: "absolute", left: mix(settle, 60, 190), top: mix(settle, 160, 50), opacity: Math.min(1, settle * 2) }}
        >
          <NewRequest published={frame >= PUBLISH + 2} />
        </DesktopApp>
        <div style={{ opacity: ramp(frame, 70, 78) }}>
          <Cursor x={cursor.x} y={cursor.y} pressed={pressed} />
        </div>
      </Push>
      <SampleTag />
    </Backdrop>
  );
};

// 14 · The difference: the soft line goes out of focus, the sharp one comes in.
const Difference: React.FC = () => {
  const frame = useFrame();
  const away = ramp(frame, 56, 76);
  return (
    <Backdrop light="mist">
      <Push duration={150} zoom={[1, 1.04]}>
        <Center style={{ gap: 34 }}>
          <div style={{ opacity: mix(away, 1, 0.55), filter: away > 0 ? `blur(${away * 2.5}px)` : undefined }}>
            <FocusWords size={mix(away, 96, 78)} start={4} parts={[{ text: "Agenturen vermitteln Kontakte.", bold: away < 0.5 }]} style={{ color: away > 0.5 ? colors.graphite : undefined }} />
          </div>
          <FocusWords size={110} start={66} parts={[{ text: "comtor " }, { text: "wickelt " }, { text: "den " }, { text: "Deal " }, { text: "ab." }]} />
        </Center>
      </Push>
    </Backdrop>
  );
};

// 15 · End card.
const EndCard: React.FC = () => {
  const frame = useFrame();
  const p = ease(frame, 2, { stiffness: 60 });
  return (
    <Backdrop light="mist">
      <Center>
        <div style={{ ...focusIn(p, 140), transform: `scale(${mix(p, 0.9, 1)})` }}>
          <Wordmark size={140} />
        </div>
      </Center>
    </Backdrop>
  );
};

// 16 · Call to action, typed on black.
const CTA_LINE = "Jetzt kostenlos starten.";

const Cta: React.FC = () => {
  const frame = useFrame();
  const shown = typed(frame, 10, CTA_LINE);
  return (
    <Backdrop light="night">
      <Center style={{ gap: 40 }}>
        <TypeLine text={CTA_LINE} shown={shown} caret={caretOn(frame, 10 + CTA_LINE.length * 2)} size={76} />
        <div style={{ fontSize: 36, color: colors.stone, textAlign: "center", lineHeight: 1.45, ...focusIn(ease(frame, 66), 36) }}>
          Die ersten 50 Marken und 100 Creator
          <br />
          bekommen Pro kostenlos, solange ihr Konto besteht.
        </div>
      </Center>
      <div
        style={{
          position: "absolute",
          bottom: 64,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          fontSize: 28,
          fontWeight: 700,
          opacity: ramp(frame, 86, 100),
        }}
      >
        <LogoMark size={30} dark />
        comtor.app
      </div>
    </Backdrop>
  );
};

// ---------------------------------------------------------------------------------------------------------------

export type LaunchScene = { id: string; label: string; component: React.FC; duration: number; keyframe: number };

export const LAUNCH_SCENES: LaunchScene[] = [
  { id: "L01", label: "1 · Problem: Kaltakquise", component: Problem, duration: 150, keyframe: 120 },
  { id: "L02", label: "2 · Problem: Geld", component: Money, duration: 120, keyframe: 100 },
  { id: "L03", label: "3 · Wendung", component: Turn, duration: 90, keyframe: 60 },
  { id: "L04", label: "4 · Reveal comtor", component: Reveal, duration: 150, keyframe: 120 },
  { id: "L05", label: "5 · Claim", component: Claim, duration: 120, keyframe: 90 },
  { id: "L06", label: "6 · Produkt (Creator-Feed)", component: Product, duration: 180, keyframe: 150 },
  { id: "L07", label: "7 · Matching", component: Matching, duration: 180, keyframe: 150 },
  { id: "L08", label: "8 · Ein Swipe", component: Swipe, duration: 120, keyframe: 100 },
  { id: "L09", label: "9 · Geld zurückgehalten", component: Held, duration: 150, keyframe: 120 },
  { id: "L10", label: "10 · Ausgezahlt", component: Paid, duration: 120, keyframe: 100 },
  { id: "L11", label: "11 · Und für Marken", component: ForBrands, duration: 120, keyframe: 100 },
  { id: "L12", label: "12 · Briefing (Zoom)", component: BriefingClose, duration: 150, keyframe: 70 },
  { id: "L13", label: "13 · Briefing (Ganze Seite)", component: BriefingPage, duration: 180, keyframe: 150 },
  { id: "L14", label: "14 · Abgrenzung", component: Difference, duration: 150, keyframe: 130 },
  { id: "L15", label: "15 · Logo", component: EndCard, duration: 90, keyframe: 60 },
  { id: "L16", label: "16 · CTA", component: Cta, duration: 180, keyframe: 150 },
];
