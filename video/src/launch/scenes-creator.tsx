import type { ReactNode } from "react";
import { AbsoluteFill, Easing, interpolate } from "remotion";
import { RAW_AVATAR, RAW_HOODIE } from "../ads/brands";
import { focusIn } from "../ads/kit";
import { mix, pop, ramp } from "../anim";
import { Sfx } from "../audio";
import { Cursor, pressAt } from "../components/shared-scenes";
import { Avatar, DealCard } from "../components/ui";
import { useFrame } from "../frame";
import { colors } from "../theme";
import { ChatPage, DealTrail, NameCursor, type OfferState } from "./app-screens";
import {
  AppIcon,
  AppPanel,
  Backdrop,
  Caret,
  Center,
  DesktopApp,
  drift,
  fitScale,
  flyIn,
  flyOut,
  Ghost,
  glide,
  Haze,
  LAUNCH_HEIGHT,
  LAUNCH_WIDTH,
  LightSweep,
  type Part,
  pointer,
  SampleTag,
  slam,
  slamStyle,
  SmearFilter,
  SOFT_SHADOW,
  spr,
  typedCount,
  typingTimes,
} from "./kit";
import { caretOn, FocusWords, Keys, last, SlamWords, Typed } from "./parts";
import { IPhone, PHONE, PhoneFeed } from "./phone";
import { CreatorFeed, DmThread, InvoiceSnippet, MailRow, MatchChecklist, SheetSnippet, type SwipeState, VINTAGE_JACKET } from "./screens";

// The creator's half of the launch video (LAUNCH.md): the problem, the reveal, the Feed, the match, the swipe, the
// deal and the payout. Each scene runs on its own clock from 0.

// ---------------------------------------------------------------------------------------------------------------
// 1 · Opening: a line typed, selected, deleted, the next one typed. The camera pulls back as each line grows. Around it
// the UI of cold outreach flies in from the edges, crisp, with a creator's pointer working through it; when the line
// is erased it all flies off and the UI of chasing money flies in.

const A = "40 Marken angeschrieben.";
const B = " Eine Antwort.";
const C = "Und wann kommt das Geld?";
const A_TIMES = typingTimes(A, 8, 2);
const B_TIMES = typingTimes(B, last(A_TIMES) + 6, 2);
const SELECT = [last(B_TIMES) + 10, last(B_TIMES) + 22] as const;
const CUT = SELECT[1] + 10;
const ERASE = CUT + 6;
const ERASE_END = ERASE + A.length;
const C_TIMES = typingTimes(C, ERASE_END + 8, 2);
const SELECT_C = [last(C_TIMES) + 10, last(C_TIMES) + 18] as const;

function openingLine(frame: number): { text: string; select?: [number, number] } {
  if (frame < last(A_TIMES) + 1) return { text: A.slice(0, typedCount(frame, A_TIMES)) };
  if (frame < SELECT[0]) return { text: A + B.slice(0, typedCount(frame, B_TIMES)) };
  if (frame < CUT) {
    const len = Math.round((B.length - 1) * ramp(frame, SELECT[0], SELECT[1]));
    return { text: A + B, select: [A.length + B.length - len, A.length + B.length] };
  }
  if (frame < C_TIMES[0]) return { text: A.slice(0, Math.max(0, A.length - Math.max(0, frame - ERASE))) };
  const text = C.slice(0, typedCount(frame, C_TIMES));
  if (frame < SELECT_C[0]) return { text };
  const len = Math.round(5 * ramp(frame, SELECT_C[0], SELECT_C[1]));
  return { text, select: [C.length - len, C.length] };
}

// The spreadsheet a creator keeps of who they wrote to: the counters run up while the line is typed.
const OutreachSheet: React.FC<{ sent: number; replies: number; shown: number }> = ({ sent, replies, shown }) => (
  <div style={{ width: 470, borderRadius: 12, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, overflow: "hidden", fontSize: 16 }}>
    <div style={{ display: "flex", gap: 24, padding: "14px 16px", borderBottom: "1px solid rgba(7,7,7,0.1)" }}>
      <div>
        <div style={{ fontSize: 12, color: colors.graphite }}>Angeschrieben</div>
        <div style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{sent}</div>
      </div>
      <div>
        <div style={{ fontSize: 12, color: colors.graphite }}>Antworten</div>
        <div style={{ fontSize: 26, fontWeight: 900, fontVariantNumeric: "tabular-nums" }}>{replies}</div>
      </div>
    </div>
    {[
      ["Glow Lab", "keine Antwort"],
      ["Nordwerk", "keine Antwort"],
      ["Kiez Goods", "keine Antwort"],
      ["Lumo Audio", "Absage"],
    ].map(([a, b], i) => (
      <div key={a} style={{ display: "flex", borderTop: i ? "1px solid rgba(7,7,7,0.08)" : undefined, opacity: Math.max(0, Math.min(1, shown - i)) }}>
        <span style={{ flex: 1, padding: "9px 16px", fontWeight: 700 }}>{a}</span>
        <span style={{ width: 170, padding: "9px 16px", color: colors.graphite }}>{b}</span>
      </div>
    ))}
  </div>
);

// Reminders about one unpaid invoice, the count going up.
const Reminders: React.FC<{ count: number }> = ({ count }) => (
  <div style={{ width: 460, borderRadius: 12, backgroundColor: colors.paper, boxShadow: SOFT_SHADOW, padding: "16px 20px", display: "flex", alignItems: "center", gap: 14, fontSize: 17 }}>
    <span style={{ width: 10, height: 10, borderRadius: 999, backgroundColor: colors.ink }} />
    <span style={{ fontWeight: 700, flex: 1 }}>Zahlungserinnerung</span>
    <span style={{ minWidth: 30, height: 30, borderRadius: 999, backgroundColor: colors.ink, color: colors.paper, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, transform: `scale(${1 + 0.0 * count})` }}>
      {count}
    </span>
  </div>
);

// A module flying in from an edge after `at` with its own spring, flying off again from `out`. Like a camera's focus
// it arrives soft and sharpens as it lands, and blurs again leaving; `depth` (0..1) keeps one further back soft and
// a little faded for good.
const Module: React.FC<{
  x: number;
  y: number;
  at: number;
  kind: "snap" | "swing" | "glide";
  from: { x?: number; y?: number; r?: number };
  out?: number;
  to?: { x?: number; y?: number; r?: number };
  scale?: number;
  depth?: number;
  children: ReactNode;
}> = ({ x, y, at, kind, from, out, to, scale = 1, depth = 0, children }) => {
  const frame = useFrame();
  const p = spr(frame, at, kind);
  if (frame < at) return null;
  const leaving = out !== undefined ? ramp(frame, out, out + 22) : 0;
  const blur = Math.max(depth * 7, (1 - Math.min(1, Math.max(0, p))) * 16) + leaving * 14;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `scale(${scale})`, transformOrigin: "0 0", filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined, opacity: 1 - depth * 0.35 }}>
      <div style={out !== undefined ? flyOut(frame, out, 22, to ?? {}) : undefined}>
        <div style={flyIn(p, from)}>{children}</div>
      </div>
    </div>
  );
};

const Opening: React.FC = () => {
  const frame = useFrame();
  const line = openingLine(frame);
  let chars = 0;
  for (let i = 0; i < 12; i++) chars += openingLine(Math.max(0, frame - i)).text.length / 12;
  const camera = fitScale(chars, 72, 1400, 2.4) * drift(frame, 283, 1.04, 0.9);
  const idle = frame >= last(A_TIMES) && frame < B_TIMES[0] ? last(A_TIMES) : frame >= last(C_TIMES) ? last(C_TIMES) : 9999;
  const sent = Math.round(mix(ramp(frame, A_TIMES[0], last(A_TIMES)), 12, 40));
  const replies = frame >= last(B_TIMES) ? 1 : 0;
  const reminders = 1 + (frame > C_TIMES[8] ? 1 : 0) + (frame > C_TIMES[18] ? 1 : 0);
  // Mia's pointer working through the outreach, then through the invoice.
  const route: [number, { x: number; y: number }][] = [
    [6, { x: 430, y: 236 }],
    [48, { x: 1560, y: 790 }],
    [92, { x: 470, y: 860 }],
    [ERASE + 30, { x: 360, y: 300 }],
    [ERASE + 80, { x: 1520, y: 330 }],
  ];
  let at = { x: 820, y: 1180 };
  let pos = at;
  for (const [t, target] of route) {
    if (frame < t) break;
    pos = pointer(frame, t, at, target, 0.9);
    at = target;
  }
  const away = (to: { x?: number; y?: number; r?: number }) => ({ out: ERASE - 4, to });
  return (
    <Backdrop light="paper">
      <Keys times={A_TIMES} />
      <Keys times={B_TIMES.slice(1)} />
      <Sfx name="select" at={SELECT[0]} volume={0.25} />
      <Sfx name="key-del" at={CUT} volume={0.18} />
      <Keys times={Array.from({ length: 12 }, (_, k) => ERASE + 1 + k * 2)} del volume={0.45} />
      <Keys times={C_TIMES} />
      <Sfx name="select" at={SELECT_C[0]} volume={0.25} />
      {/* Far back: UI out of focus, drifting a little more than the modules in front of it. */}
      <AbsoluteFill style={{ transform: `scale(${1 + (camera - 1) * 0.03}) translate(${10 * Math.sin(frame / 120)}px, ${6 * Math.cos(frame / 140)}px)` }}>
        <Ghost x={640} y={-60} blur={10} opacity={0.45}>
          <SheetSnippet rows={[["Marke", "Status"], ["Kiez Goods", "keine Antwort"], ["Glow Lab", "keine Antwort"]]} />
        </Ghost>
        <Ghost x={-170} y={430} blur={12} opacity={0.4} rotate={-3}>
          <MailRow from="Glow Lab" subject="Automatische Antwort: Abwesend" />
        </Ghost>
        <Ghost x={1530} y={980} blur={9} opacity={0.45}>
          <MailRow from="Kiez Goods" subject="Re: Anfrage" />
        </Ghost>
        <Ghost x={560} y={930} blur={13} opacity={0.35} rotate={2}>
          <InvoiceSnippet days={31} />
        </Ghost>
        <Ghost x={1660} y={430} blur={11} opacity={0.4}>
          <DmThread name="Kiez Goods" text="Danke, wir melden uns." bubble={1} />
        </Ghost>
      </AbsoluteFill>
      <AbsoluteFill style={{ transform: `scale(${1 + (camera - 1) * 0.06})` }}>
        <Module x={110} y={80} at={4} kind="swing" from={{ x: -520, y: -260, r: -14 }} {...away({ x: -900, y: -200, r: -10 })}>
          <DmThread name="Glow Lab" text="Hey! Ich liebe eure Produkte. Habt ihr Lust auf eine Kooperation? 🙂" bubble={pop(frame, 16)} seenAt={ramp(frame, 54, 62)} />
        </Module>
        <Module x={1310} y={150} at={18} kind="glide" from={{ x: 760, r: 6 }} {...away({ x: 900, y: -120 })} scale={0.95} depth={0.4}>
          <MailRow from="Nordwerk" subject="Re: Re: Kooperation?" />
        </Module>
        <Module x={1290} y={640} at={10} kind="snap" from={{ x: 520, y: 420, r: 12 }} {...away({ x: 900, y: 400, r: 8 })}>
          <OutreachSheet sent={sent} replies={replies} shown={1 + (frame - 24) / 10} />
        </Module>
        <Module x={150} y={700} at={30} kind="swing" from={{ y: 560, r: 9 }} {...away({ x: -500, y: 600, r: 12 })} scale={0.92} depth={0.3}>
          <DmThread name="Lumo Audio" text="Hallo, ich wollte nochmal nachfragen …" seen="Gesendet vor 9 Tagen" bubble={pop(frame, 42)} seenAt={ramp(frame, 76, 84)} />
        </Module>
        <Module x={170} y={120} at={ERASE + 10} kind="swing" from={{ y: -520, r: -9 }}>
          <InvoiceSnippet days={Math.round(mix(ramp(frame, ERASE + 20, last(C_TIMES)), 40, 47))} />
        </Module>
        <Module x={1300} y={150} at={ERASE + 18} kind="snap" from={{ x: 700, r: 8 }}>
          <DmThread name="Nordwerk" text="Kannst du mir deine IBAN nochmal schicken?" seen="Gelesen" bubble={pop(frame, ERASE + 28)} seenAt={ramp(frame, ERASE + 60, ERASE + 68)} />
        </Module>
        <Module x={1240} y={760} at={ERASE + 26} kind="glide" from={{ x: 500, y: 300 }} depth={0.35}>
          <Reminders count={reminders} />
        </Module>
        <Module x={190} y={780} at={ERASE + 36} kind="swing" from={{ x: -600, r: -6 }} scale={0.95} depth={0.45}>
          <MailRow from="Nordwerk" subject="Re: Rechnung 017, wir prüfen das intern" />
        </Module>
      </AbsoluteFill>
      <Haze />
      <AbsoluteFill style={{ transform: `scale(${1 + (camera - 1) * 0.06})` }}>
        {frame >= 6 && <NameCursor x={pos.x} y={pos.y} name="Mia" press={pressAt(frame, 40) + pressAt(frame, 84)} />}
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
  const spread = glide(frame, 64, 100);
  return (
    <Backdrop light="mist">
      <Sfx name="boom" at={2} volume={0.3} />
      <Sfx name="slam" at={2} volume={0.55} />
      <Sfx name="slam" at={12} volume={0.55} />
      <Sfx name="whoosh" at={62} volume={0.25} />
      <Center>
        <div style={{ transform: `scale(${drift(frame, 110, 1.1, 0.9)}) rotate(${mix(spr(frame, 0, "swing"), -2, 0)}deg)` }}>
          <SlamWords
            size={112}
            start={2}
            stagger={10}
            accel={0.5}
            gap={mix(spread, 0.25, 1.1)}
            parts={[{ text: "Schluss mit" }, { text: "Hinterherschreiben." }]}
            fade={(i) => 1 - ramp(frame, 72 + i * 5, 84 + i * 5)}
          />
        </div>
      </Center>
    </Backdrop>
  );
};

// 3 · Reveal: "Das ist" fills the frame, steps back with a swing, the app icon pops in beside it and the name types out.
const ICON_AT = 60;
const NAME_TIMES = typingTimes("comtor", 74, 2.6);

const Reveal: React.FC = () => {
  const frame = useFrame();
  const enter = slam(frame, 0);
  const back = spr(frame, 44, "swing");
  const icon = spr(frame, ICON_AT, "swing");
  const letters = typedCount(frame, NAME_TIMES);
  const size = mix(back, 400, 150);
  return (
    <Backdrop light="mist" lines={3}>
      <Sfx name="boom" at={0} volume={0.35} />
      <Sfx name="slam" at={0} volume={0.6} />
      <Sfx name="whoosh" at={42} volume={0.2} />
      <Keys times={NAME_TIMES} />
      <Center>
        <div style={{ display: "flex", alignItems: "center", transform: `scale(${drift(frame, 125, 1.06, 0.8)})` }}>
          <span style={{ fontSize: size, fontWeight: 900, letterSpacing: -size * 0.04, lineHeight: 1, whiteSpace: "nowrap", ...slamStyle(enter, 1.7, 40) }}>Das ist</span>
          <span style={{ width: mix(Math.min(1, icon), 0, 150 * 0.32), flexShrink: 0 }} />
          <div style={{ width: mix(Math.min(1, icon), 0, 150 * 0.92), display: "flex", justifyContent: "center", flexShrink: 0 }}>
            <AppIcon size={150 * 0.92} style={{ transform: `scale(${icon}) rotate(${mix(Math.min(icon, 1), -25, 0)}deg)`, opacity: Math.min(1, icon * 2) }} />
          </div>
          <span style={{ width: letters > 0 ? 150 * 0.22 : 0, flexShrink: 0 }} />
          <span style={{ fontSize: 150, fontWeight: 900, letterSpacing: -4.5, lineHeight: 1, whiteSpace: "pre", transform: "translateY(-9px)" }}>
            {"comtor".slice(0, letters)}
            {letters > 0 && letters < 6 && <Caret size={150} />}
          </span>
        </div>
      </Center>
    </Backdrop>
  );
};

// 4 · Claim, then the product: the claim comes in big and the camera pulls back as it grows; it recedes while the app
// rises from below in 3D, overshoots a touch and keeps turning.
const CLAIM: Part[] = [{ text: "Der Marktplatz für", soft: true, bold: false }, { text: "Marken" }, { text: "und", soft: true, bold: false }, { text: "Creator." }];
const CLAIM_WORDS = CLAIM.flatMap((p) => p.text.split(" "));

const ClaimProduct: React.FC = () => {
  const frame = useFrame();
  let chars = 0;
  for (let i = 0; i < 10; i++) {
    const shown = Math.max(1, Math.min(CLAIM_WORDS.length, Math.floor((frame - i - 4) / 7) + 1));
    chars += CLAIM_WORDS.slice(0, shown).join(" ").length / 10;
  }
  const away = glide(frame, 88, 124);
  const rise = spr(frame, 96, "glide");
  const turn = glide(frame, 96, 236);
  const tilt = { x: mix(turn, 46, 8) + (1 - Math.min(rise, 1)) * 18, y: mix(turn, -30, 4), z: mix(turn, 11, 0) };
  return (
    <Backdrop light="mist">
      {CLAIM_WORDS.map((_, i) => (
        <Sfx key={i} name="tick" at={4 + i * 7} volume={0.25} />
      ))}
      <Sfx name="whoosh" at={90} volume={0.45} />
      <Center>
        <div
          style={{
            transform: `translateY(${-away * 340}px) scale(${fitScale(chars, 100, 1500, 2.2, 0.6) * drift(frame, 88, 1, 0.84) * mix(away, 1, 0.42)})`,
            opacity: 1 - away,
            filter: away > 0 ? `blur(${away * 8}px)` : undefined,
          }}
        >
          <FocusWords size={100} start={4} stagger={7} parts={CLAIM} limit />
        </div>
      </Center>
      {frame >= 92 && (
        <>
          <div style={{ position: "absolute", right: 110, top: 96, fontSize: 44, fontWeight: 900, letterSpacing: -1.2, color: colors.graphite, ...focusIn(spr(frame, 136, "land"), 44) }}>Für Creator</div>
          <DesktopApp
            side="creator"
            active="Feed"
            title="Feed"
            scale={mix(turn, 0.92, 1.26)}
            tilt={tilt}
            style={{ position: "absolute", left: mix(turn, 380, 40), top: mix(rise, 1200, 210) - turn * 70, opacity: Math.min(1, rise * 2) }}
          >
            <CreatorFeed />
          </DesktopApp>
          <LightSweep from={150} to={206} />
          <SampleTag />
        </>
      )}
    </Backdrop>
  );
};

// 5 · Matching: the card swings in with a scan line running over it, the reasons it lands in the Feed fly in beside it,
// drawn like the app's checklist: each ring fills, the circle turns ink with its tick, the count goes up.
const CHECKS: [string, string][] = [
  ["Nische passt", "Fashion"],
  ["Reichweite passt", "50.000 Follower"],
  ["Plattform passt", "TikTok"],
  ["Budget passt", "250 €"],
];
const CHECK_START = 34;
const CHECK_STEPS = [0, 22, 40, 56];
const CHECKED = CHECK_START + 56 + 22;

const Matching: React.FC = () => {
  const frame = useFrame();
  const card = spr(frame, 0, "swing");
  const list = spr(frame, 8, "snap");
  const result = spr(frame, CHECKED + 2, "swing");
  const scanning = frame < CHECKED;
  const scan = 0.5 - 0.5 * Math.cos(frame / 11);
  const turn = glide(frame, 0, 200);
  const rows = CHECKS.map(([label, value], i) => {
    const start = CHECK_START + CHECK_STEPS[i];
    const ring = interpolate(frame, [start, start + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
    return { label, value, ring, done: frame >= start + 16 ? spr(frame, start + 16, "swing") : 0 };
  });
  return (
    <Backdrop light="mist" lines={5}>
      <Sfx name="swipe" at={6} volume={0.3} />
      {CHECK_STEPS.map((step, i) => (
        <Sfx key={i} name="tick" at={CHECK_START + step + 16} volume={0.55} />
      ))}
      <Sfx name="ding" at={CHECKED + 2} volume={0.3} />
      <AbsoluteFill style={{ transform: `scale(${drift(frame, 200, 1, 1.08)})`, transformOrigin: "60% 50%" }}>
        <div style={{ position: "absolute", left: 230, top: 150, perspective: 1600, ...flyIn(card, { x: -700, r: -14 }) }}>
          <div style={{ transform: `rotateY(${mix(turn, 18, -6)}deg) rotateX(6deg)`, position: "relative" }}>
            <DealCard deal={RAW_HOODIE} width={520} height={760} />
            {scanning && (
              <div style={{ position: "absolute", left: -30, right: -30, top: `${scan * 100}%`, height: 4, backgroundColor: colors.paper, boxShadow: "0 0 30px 12px rgba(255,255,255,0.75)", opacity: ramp(frame, 18, 26) }} />
            )}
            <div style={{ position: "absolute", inset: 0, borderRadius: 14, boxShadow: `inset 0 0 0 ${mix(Math.min(1, result), 0, 6)}px ${colors.ink}` }} />
          </div>
        </div>
        <div style={{ position: "absolute", left: 800, top: 538, width: 190, height: 2, backgroundColor: "rgba(7,7,7,0.18)", opacity: ramp(frame, 20, 30) }}>
          {scanning && <div style={{ position: "absolute", top: -5, left: `${((frame * 2.2) % 100).toFixed(1)}%`, width: 12, height: 12, borderRadius: 99, backgroundColor: colors.ink }} />}
        </div>
        <div style={{ position: "absolute", left: 1010, top: 210, perspective: 1800, ...flyIn(list, { x: 520, y: 60, r: 8 }) }}>
          <div style={{ transform: `rotateY(${mix(turn, -14, 4)}deg) rotateX(4deg)` }}>
            <MatchChecklist rows={rows} k={2} result={result} />
          </div>
        </div>
      </AbsoluteFill>
      <LightSweep from={CHECKED} to={CHECKED + 50} opacity={0.35} />
      <SampleTag />
    </Backdrop>
  );
};

// 6 · One swipe: the line slams in, the first half spreads and leaves, the braces snap shut on "Interessiert" and
// the camera zooms into it (into the swipe itself, the next scene).
const SwipeLine: React.FC = () => {
  const frame = useFrame();
  const leave = glide(frame, 56, 82);
  const close = spr(frame, 30, "swing");
  const grow = glide(frame, 60, 100);
  return (
    <Backdrop light="paper">
      {[2, 9, 14, 18].map((at) => (
        <Sfx key={at} name="slam" at={at} volume={0.35} />
      ))}
      <Sfx name="lock" at={40} volume={0.45} />
      <Center style={{ gap: 30 }}>
        <div style={{ transform: `translateY(${-leave * 120}px) scale(${drift(frame, 110, 1.06, 0.94)})`, opacity: 1 - leave }}>
          <SlamWords size={88} start={2} stagger={8} accel={0.6} gap={mix(leave, 0.25, 1)} parts={[{ text: "Ein Swipe nach rechts:" }]} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: mix(close, 280, 26), fontSize: 104, letterSpacing: -3, transform: `translateY(${-leave * 70}px) scale(${mix(grow, 1, 1.35)})` }}>
          <span style={{ color: colors.stone, fontWeight: 400, opacity: ramp(frame, 24, 32) }}>{"{"}</span>
          <span style={{ fontWeight: 900, ...focusIn(spr(frame, 34, "land"), 104) }}>Interessiert</span>
          <span style={{ color: colors.stone, fontWeight: 400, opacity: ramp(frame, 24, 32) }}>{"}"}</span>
        </div>
      </Center>
    </Backdrop>
  );
};

// 7 · The swipe on the phone: an iPhone with the Feed as the app draws it there, a finger takes the card and drags it
// right with a hand's pull (slow start, quick, easing near the edge), the card lifted and turning by x / 18 with the
// green wash past the threshold (swipe-card.tsx); let go it is flung off and the next card comes up. Then the camera
// pulls back and the phone turns, a reflection passing over the glass.
const GRAB = 56;
const LET_GO = 104;
// Where the finger takes the card, in screen points.
const GRAB_AT = { x: 236, y: 500 };

const Swipe: React.FC = () => {
  const frame = useFrame();
  const enter = spr(frame, 0, "glide");
  const back = spr(frame, 136, "glide");
  const s = mix(back, mix(glide(frame, 0, 136), 1.12, 1.05), 0.9);
  const turn = { x: mix(back, 3, 12), y: mix(back, -8, -32) + (1 - Math.min(enter, 1)) * 14, z: mix(back, 0, 3) };

  const held = spr(frame, GRAB, "snap");
  const pull = interpolate(frame, [GRAB + 4, LET_GO], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.5, 0, 0.3, 1) });
  const fling = interpolate(frame, [LET_GO, LET_GO + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.in(Easing.quad) });
  const x = 240 * pull;
  const swipe: SwipeState = {
    x,
    y: -22 * pull + 8 * Math.sin(Math.PI * pull),
    held: frame < LET_GO ? held : 1,
    like: Math.max(0, Math.min(1, (x - 100) / 40)),
    out: fling,
  };
  const next = spr(frame, LET_GO + 6, "swing");
  const heart = 1 + 0.25 * (frame >= LET_GO && frame < LET_GO + 12 ? Math.sin((Math.PI * (frame - LET_GO)) / 12) : 0);
  const after = spr(frame, LET_GO, "glide");
  const touch = {
    x: GRAB_AT.x + (frame < LET_GO ? x : 240 + 70 * after),
    y: GRAB_AT.y + (frame < LET_GO ? swipe.y : -22 - 30 * after),
    pressed: frame < GRAB ? 0 : frame < LET_GO ? held : 1 - after,
    opacity: ramp(frame, 38, 48) * (1 - ramp(frame, LET_GO + 6, LET_GO + 16)),
  };
  return (
    <Backdrop light="mist">
      <Sfx name="tick" at={GRAB} volume={0.5} />
      <Sfx name="swipe" at={LET_GO - 2} volume={0.65} />
      <Sfx name="whoosh" at={136} volume={0.2} />
      <AbsoluteFill style={{ perspective: 2600 }}>
        <div
          style={{
            position: "absolute",
            left: (LAUNCH_WIDTH - PHONE.w) / 2 + mix(back, 0, 40),
            top: (LAUNCH_HEIGHT - PHONE.h) / 2 + mix(Math.min(enter, 1), 160, 0) + mix(back, 12, 20),
            transform: `scale(${s}) rotateX(${turn.x}deg) rotateY(${turn.y}deg) rotateZ(${turn.z}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          <IPhone glare={interpolate(frame, [138, 185], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
            <PhoneFeed top={RAW_HOODIE} under={VINTAGE_JACKET} swipe={swipe} next={next} heart={heart} touch={touch} />
          </IPhone>
        </div>
      </AbsoluteFill>
      <SampleTag />
    </Backdrop>
  );
};

// 8 · The deal, in the live payment flow of the chat (chat-offer.tsx, its own words): the offer comes in, Mia accepts,
// Raw Supplies pays and the money is held, she posts and submits the link, it is released. The trail on the left
// lights up step by step.
const MSG_AT = [12, 26, 40];
const OFFER_AT = 56;
const ACCEPT = 90;
const PAID = 126;
const LINK_AT = 150;
const SUBMIT = 172;
const RELEASED = 214;
// The chat alone in its window, large: 760 x 620 app pixels at 1.45.
const WIN = { left: 760, top: 70, s: 1.45, w: 760, h: 620 };
// The offer card's left edge and the bottom of the messages in the window (ChatPage), for the pointer.
const CARD_X = WIN.left + 24 * WIN.s;
const CARD_BOTTOM = WIN.top + (44 + WIN.h - 65 - 16) * WIN.s;
const BUTTON = { y: CARD_BOTTOM - 32 * WIN.s, accept: CARD_X + 95 * WIN.s, wide: CARD_X + 180 * WIN.s };

function offerAt(frame: number): OfferState {
  if (frame >= RELEASED) return "released";
  if (frame >= SUBMIT + 2) return "submitted";
  if (frame >= PAID) return "paid";
  if (frame >= ACCEPT + 2) return "accepted";
  return "offer";
}

const DealFlow: React.FC = () => {
  const frame = useFrame();
  const win = spr(frame, 0, "glide");
  const state = offerAt(frame);
  const flipAt = { offer: OFFER_AT, accepted: ACCEPT + 2, paid: PAID, submitted: SUBMIT + 2, released: RELEASED }[state];
  const flip = ramp(frame, flipAt, flipAt + 10);
  const steps = [OFFER_AT, ACCEPT + 2, PAID, SUBMIT + 2, RELEASED];
  // -1 before the offer, then one more step lit at each change.
  const lit = steps.reduce((n, at) => n + ramp(frame, at - 8, at), -1);
  const pulse = steps.map((at) => ramp(frame, at, at + 14));
  const push = glide(frame, RELEASED, 297);
  const route: [number, { x: number; y: number }][] = [
    [ACCEPT - 22, { x: BUTTON.accept, y: BUTTON.y }],
    [SUBMIT - 22, { x: BUTTON.wide, y: BUTTON.y }],
    [SUBMIT + 18, { x: 1700, y: 600 }],
  ];
  let from = { x: 1760, y: 1120 };
  let cursor = from;
  for (const [t, target] of route) {
    if (frame < t) break;
    cursor = pointer(frame, t, from, target, 1.3);
    from = target;
  }
  const press = pressAt(frame, ACCEPT) + pressAt(frame, SUBMIT);
  return (
    <Backdrop light="mist">
      <Sfx name="ding" at={OFFER_AT} volume={0.25} />
      <Sfx name="click" at={ACCEPT} volume={0.6} />
      <Sfx name="lock" at={PAID} volume={0.55} />
      <Sfx name="click" at={SUBMIT} volume={0.6} />
      <Sfx name="coin" at={RELEASED} volume={0.55} />
      <AbsoluteFill style={{ transform: `scale(${mix(push, 1, 1.22)})`, transformOrigin: `${((CARD_X + 120) / 19.2).toFixed(1)}% ${((CARD_BOTTOM - 70) / 10.8).toFixed(1)}%` }}>
        <div style={{ position: "absolute", left: 110, top: 270, ...flyIn(spr(frame, 6, "snap"), { x: -300 }) }}>
          <div style={{ fontSize: 20, color: colors.graphite, marginBottom: 22 }}>Ein Deal, sicher abgewickelt</div>
          <DealTrail lit={lit} pulse={pulse} />
        </div>
        <div style={{ position: "absolute", left: WIN.left, top: WIN.top, ...flyIn(win, { x: 700, r: 4 }) }}>
          <AppPanel width={WIN.w} height={WIN.h} scale={WIN.s}>
            <ChatPage
              list={false}
              messages={[
                { text: "Hey Mia, dein Profil passt perfekt zu unserem Hoodie!", p: spr(frame, MSG_AT[0], "snap") },
                { mine: true, text: "Danke! Was habt ihr geplant?", p: spr(frame, MSG_AT[1], "snap") },
                { text: "Ein TikTok für 250 €?", p: spr(frame, MSG_AT[2], "snap") },
                { mine: true, text: "Mein TikTok ist online: tiktok.com/@miasummers/video/7431", p: spr(frame, LINK_AT, "snap") },
              ]}
              offer={{ state, flip, press, p: spr(frame, OFFER_AT, "swing") }}
            />
          </AppPanel>
        </div>
        <div style={{ opacity: ramp(frame, ACCEPT - 24, ACCEPT - 16) * (1 - ramp(frame, SUBMIT + 26, SUBMIT + 38)) }}>
          <Cursor x={cursor.x} y={cursor.y} pressed={press} />
        </div>
        <LightSweep from={RELEASED} to={RELEASED + 50} opacity={0.4} />
      </AbsoluteFill>
      <SampleTag />
    </Backdrop>
  );
};

// 9 · Paid out: the word whips in smeared sideways and snaps to its normal shape, the amount counts up, then everything
// drifts out of focus.
const Paid: React.FC = () => {
  const frame = useFrame();
  const whip = slam(frame, 2);
  const pill = spr(frame, 24, "swing");
  const amount = 225 * interpolate(frame, [28, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const out = glide(frame, 72, 92);
  return (
    <Backdrop light="night">
      <Sfx name="boom" at={0} volume={0.25} />
      <Sfx name="whoosh" at={0} volume={0.5} />
      <Sfx name="coin" at={60} volume={0.55} />
      <SmearFilter id="paid-smear" amount={mix(Math.min(whip, 1), 70, 0)} />
      <Center style={{ gap: 60, opacity: 1 - out, filter: out > 0 ? `blur(${out * 20}px)` : undefined }}>
        <div style={{ transform: `scale(${drift(frame, 95, 1.06, 0.84)})` }}>
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
            ...flyIn(pill, { y: 60 }),
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

export const CREATOR_SCENES = { Opening, Turn, Reveal, ClaimProduct, Matching, SwipeLine, Swipe, DealFlow, Paid };
